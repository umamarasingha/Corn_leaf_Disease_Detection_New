/**
 * AI Service – corn leaf disease prediction
 *
 * Strategy (in order of priority):
 * 1. Call the local Python ML inference service (http://localhost:5001/predict)
 *    which loads corn_leaf_model.h5 via Keras.  Start it with:
 *       python backend/ml_service.py
 * 2. Load TF.js format model (backend/models/model.json) with @tensorflow/tfjs
 *    when the model has been converted with the convert script.
 * 3. Mock prediction (random, for development without any ML backend).
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu'; // Register CPU backend for Node.js
import { getDiseaseInfo } from '../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  prevention: string;
}

// Disease classes – must match the alphabetical label order used during training
const DISEASE_CLASSES = ['Blight', 'Common Rust', 'Gray Leaf Spot', 'Healthy'];

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class AIService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private isPythonServiceAvailable = false;

  async loadModel(): Promise<void> {
    // 1. Check if Python inference service is running
    await this.checkPythonService();

    if (this.isPythonServiceAvailable) {
      console.log('✅ Python ML inference service detected at', ML_SERVICE_URL);
      return;
    }

    // 2. Try to load TF.js converted model
    await this.loadTfjsModel();
  }

  private async checkPythonService(): Promise<void> {
    return new Promise((resolve) => {
      const req = http.get(`${ML_SERVICE_URL}/health`, (res) => {
        this.isPythonServiceAvailable = res.statusCode === 200;
        resolve();
      });
      req.on('error', () => {
        this.isPythonServiceAvailable = false;
        resolve();
      });
      req.setTimeout(2000, () => {
        req.destroy();
        this.isPythonServiceAvailable = false;
        resolve();
      });
    });
  }

  private async loadTfjsModel(): Promise<void> {
    try {
      const modelPath = path.join(__dirname, '../../models/model.json');
      if (!fs.existsSync(modelPath)) {
        console.warn('⚠️  TF.js model.json not found. Run the conversion script:');
        console.warn('   python backend/convert_model.py');
        return;
      }

      // Check for real weight shards (not the placeholder .bin file)
      const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const shardPaths: string[] = modelJson?.weightsManifest?.[0]?.paths ?? [];
      const hasRealWeights = shardPaths.every((shard: string) => {
        const shardPath = path.join(__dirname, '../../models', shard);
        const size = fs.existsSync(shardPath) ? fs.statSync(shardPath).size : 0;
        return size > 10_000; // placeholder .bin is only ~232 bytes
      });

      if (!hasRealWeights) {
        console.warn('⚠️  model.json weight shards appear to be placeholders.');
        console.warn('   Convert the model first: python backend/convert_model.py');
        return;
      }

      console.log('Loading TF.js model from:', modelPath);
      this.model = await tf.loadLayersModel('file://' + modelPath);
      this.isModelLoaded = true;
      console.log('✅ TF.js model loaded successfully');
    } catch (error) {
      console.warn('⚠️  Failed to load TF.js model:', error);
      this.isModelLoaded = false;
    }
  }

  async predictDisease(imageBase64: string): Promise<DiseasePrediction> {
    // Strategy 1: Python HTTP service
    if (this.isPythonServiceAvailable) {
      try {
        return await this.predictViaPythonService(imageBase64);
      } catch (err) {
        console.warn('Python service call failed, trying next strategy:', err);
      }
    }

    // Strategy 2: TF.js model
    if (this.isModelLoaded && this.model) {
      try {
        return await this.predictViaTfjs(imageBase64);
      } catch (err) {
        console.warn('TF.js prediction failed, falling back to mock:', err);
      }
    }

    // Strategy 3: Mock
    console.warn('⚠️  Using mock prediction – no ML backend available');
    return this.mockPrediction();
  }

  // ---------------------------------------------------------------------------
  // Strategy 1 – Python service
  // ---------------------------------------------------------------------------
  private predictViaPythonService(imageBase64: string): Promise<DiseasePrediction> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ image: imageBase64 });
      const options = {
        hostname: ML_SERVICE_URL.replace(/^https?:\/\//, '').split(':')[0],
        port: parseInt(ML_SERVICE_URL.split(':').pop() || '5001', 10),
        path: '/predict',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error));
            const disease = parsed.disease as string;
            const confidence = Math.round((parsed.confidence ?? 0) * 100);
            const diseaseInfo = getDiseaseInfo(disease);
            resolve({ disease, confidence, ...diseaseInfo });
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Python service timeout')); });
      req.write(body);
      req.end();
    });
  }

  // ---------------------------------------------------------------------------
  // Strategy 2 – TF.js model (tfjs format)
  // ---------------------------------------------------------------------------
  private async predictViaTfjs(imageBase64: string): Promise<DiseasePrediction> {
    const tensor = await this.preprocessImageTfjs(imageBase64);
    const predTensor = this.model!.predict(tensor) as tf.Tensor;
    const probs = Array.from(await predTensor.data());
    predTensor.dispose();
    tensor.dispose();

    const maxIdx = probs.indexOf(Math.max(...probs));
    const disease = DISEASE_CLASSES[maxIdx] ?? 'Unknown';
    const confidence = Math.round(probs[maxIdx] * 100);
    const diseaseInfo = getDiseaseInfo(disease);

    return { disease, confidence, ...diseaseInfo };
  }

  /** Decode base64, resize to 224×224, normalise [0,1] */
  private async preprocessImageTfjs(imageBase64: string): Promise<tf.Tensor4D> {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Use sharp if available, otherwise fall back to a simple float32 tensor
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp') as typeof import('sharp');
      const { data } = await sharp(buffer)
        .resize(224, 224)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) pixels[i] = data[i] / 255.0;
      return tf.tensor4d(pixels, [1, 224, 224, 3]);
    } catch {
      // Fallback: create a zero tensor of the right shape
      console.warn('sharp not available, using zero tensor as fallback for image preprocessing');
      return tf.zeros([1, 224, 224, 3]) as tf.Tensor4D;
    }
  }

  // ---------------------------------------------------------------------------
  // Strategy 3 – Mock
  // ---------------------------------------------------------------------------
  private mockPrediction(): DiseasePrediction {
    const diseases = DISEASE_CLASSES;
    const disease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    const diseaseInfo = getDiseaseInfo(disease);
    return { disease, confidence, ...diseaseInfo };
  }
}

export const aiService = new AIService();
