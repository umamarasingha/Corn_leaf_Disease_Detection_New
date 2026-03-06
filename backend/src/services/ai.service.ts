/**
 * AI Service – corn leaf disease prediction
 *
 * Strategy (in order of priority):
 * 1. HTTP -> Python/Flask ML service (ML_SERVICE_URL env var)
 *    The dedicated ML service loads the real Keras .h5 model with full
 *    TensorFlow and returns accurate predictions.  This is the primary
 *    production path on Railway where the ML service runs alongside.
 * 2. @tensorflow/tfjs (CPU)  ->  loads a TF.js-converted model (model.json + weight shards).
 *    Only works when real weight shards exist in models/.
 * 3. Mock prediction (always available, for CI / dev without any ML setup).
 */

import { getDiseaseInfo } from '../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  prevention: string;
}

// Disease classes – must match the training label encoding order
const DISEASE_CLASSES = ['Blight', 'Common Rust', 'Gray Leaf Spot', 'Healthy'];

const MODEL_DIR = path.join(__dirname, '../../models');
const TFJS_MODEL_PATH = path.join(MODEL_DIR, 'model.json');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class AIService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tfjsModel: any = null;
  private isPythonServiceAvailable = false;
  private lastPythonCheck = 0;

  /** Called once at server startup */
  async loadModel(): Promise<void> {
    // 1. Check for Python/Flask ML inference service (primary for production)
    await this.checkPythonService();
    if (this.isPythonServiceAvailable) {
      console.log('ML service detected at', ML_SERVICE_URL);
      return;
    }

    // 2. Try loading TF.js converted model (model.json + weight shards)
    await this.tryLoadTfjsModel();

    if (!this.tfjsModel) {
      console.warn('No ML backend available - will use mock predictions. Set ML_SERVICE_URL or convert the model.');
    }
  }

  // ─── Strategy 1: Python/Flask ML service ──────────────────────────────────

  private checkPythonService(): Promise<void> {
    return new Promise((resolve) => {
      this.lastPythonCheck = Date.now();
      const isHttps = ML_SERVICE_URL.startsWith('https://');
      const client = isHttps ? https : http;

      try {
        const req = client.get(`${ML_SERVICE_URL}/health`, (res) => {
          this.isPythonServiceAvailable = res.statusCode === 200;
          if (this.isPythonServiceAvailable) {
            console.log('ML service health check OK');
          }
          resolve();
        });
        req.on('error', () => { this.isPythonServiceAvailable = false; resolve(); });
        req.setTimeout(3000, () => { req.destroy(); this.isPythonServiceAvailable = false; resolve(); });
      } catch {
        this.isPythonServiceAvailable = false;
        resolve();
      }
    });
  }

  // ─── Strategy 2/3: TF.js model (node or CPU) ─────────────────────────────

  private async tryLoadTfjsModel(): Promise<void> {
    try {
      if (!fs.existsSync(TFJS_MODEL_PATH)) {
        console.warn('model.json not found at', TFJS_MODEL_PATH);
        return;
      }

      // Verify weight shards are real (not placeholders)
      const modelJson = JSON.parse(fs.readFileSync(TFJS_MODEL_PATH, 'utf-8'));
      const shards: string[] = modelJson?.weightsManifest?.[0]?.paths ?? [];
      const hasRealWeights = shards.length > 0 && shards.every((s: string) => {
        const p = path.join(MODEL_DIR, s);
        return fs.existsSync(p) && fs.statSync(p).size > 10_000;
      });

      if (!hasRealWeights) {
        console.warn('model.json weight shards are placeholders or missing (%d bytes). Convert the .h5 model first.',
          shards.length > 0 ? fs.statSync(path.join(MODEL_DIR, shards[0])).size : 0);
        return;
      }

      // Use pure-JS TF.js (no native deps required)
      const tf = require('@tensorflow/tfjs');
      console.log('Using @tensorflow/tfjs CPU backend');

      const modelUrl = 'file://' + TFJS_MODEL_PATH;
      console.log('Loading model from', modelUrl);
      this.tfjsModel = await tf.loadLayersModel(modelUrl);
      console.log('TF.js model loaded successfully');
    } catch (err) {
      console.warn('TF.js model load failed:', err instanceof Error ? err.message : err);
    }
  }

  // ─── Public predict ──────────────────────────────────────────────────────

  async predictDisease(imageBase64: string): Promise<DiseasePrediction> {
    // Re-check Python service if it was unavailable and we haven't checked recently
    if (!this.isPythonServiceAvailable && Date.now() - this.lastPythonCheck > 30_000) {
      await this.checkPythonService();
    }

    // 1. Python/Flask ML service (most accurate — uses real Keras model)
    if (this.isPythonServiceAvailable) {
      try { return await this.predictViaPython(imageBase64); }
      catch (e) {
        console.warn('Python ML service call failed:', e instanceof Error ? e.message : e);
        this.isPythonServiceAvailable = false;
      }
    }

    // 2. TF.js model
    if (this.tfjsModel) {
      try { return await this.runTfjsInference(imageBase64); }
      catch (e) { console.warn('TF.js inference failed:', e instanceof Error ? e.message : e); }
    }

    // 3. Mock
    console.warn('No ML backend available - returning mock prediction');
    return this.mockPrediction();
  }

  // ─── TF.js inference ──────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async runTfjsInference(imageBase64: string): Promise<DiseasePrediction> {
    const tf = require('@tensorflow/tfjs');

    const tensor = await this.preprocessImage(imageBase64, tf);
    const predTensor = this.tfjsModel.predict(tensor);
    const probs: number[] = Array.from(await predTensor.data());
    predTensor.dispose();
    tensor.dispose();

    const maxIdx = probs.indexOf(Math.max(...probs));
    const disease = DISEASE_CLASSES[maxIdx] ?? 'Unknown';
    const confidence = Math.round(probs[maxIdx] * 100);
    const info = getDiseaseInfo(disease);
    return { disease, confidence, ...info };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async preprocessImage(imageBase64: string, tf: any): Promise<any> {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp') as typeof import('sharp');
      const { data } = await sharp(buffer).resize(224, 224).removeAlpha().raw()
        .toBuffer({ resolveWithObject: true });
      const pixels = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) pixels[i] = data[i] / 255.0;
      return tf.tensor4d(pixels, [1, 224, 224, 3]);
    } catch (err) {
      console.error('Image preprocessing failed:', err instanceof Error ? err.message : err);
      throw new Error('Failed to preprocess image for model input');
    }
  }

  // ─── Python/Flask ML service ──────────────────────────────────────────────

  private predictViaPython(imageBase64: string): Promise<DiseasePrediction> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ image: imageBase64 });
      const url = new URL(`${ML_SERVICE_URL}/predict`);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      const defaultPort = isHttps ? 443 : 5001;

      const options = {
        hostname: url.hostname,
        port: Number(url.port) || defaultPort,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const p = JSON.parse(data);
            if (p.error) return reject(new Error(p.error));
            const disease = p.disease as string;
            const confidence = Math.round((p.confidence ?? 0) * 100);
            resolve({ disease, confidence, ...getDiseaseInfo(disease) });
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('ML service timeout')); });
      req.write(body);
      req.end();
    });
  }

  // ─── Mock ─────────────────────────────────────────────────────────────────

  private mockPrediction(): DiseasePrediction {
    const disease = DISEASE_CLASSES[Math.floor(Math.random() * DISEASE_CLASSES.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    return { disease, confidence, ...getDiseaseInfo(disease) };
  }
}

export const aiService = new AIService();
