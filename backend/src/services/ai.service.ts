/**
 * AI Service – corn leaf disease + pest prediction
 *
 * Strategy:
 * 1. Python ML service (ML_SERVICE_URL) via /predict-all – primary production path
 * 2. Mock prediction – fallback for dev/CI
 */

import { getDiseaseInfo, getPestInfo } from '../utils/helpers';
import * as http from 'http';
import * as https from 'https';

export interface PestPrediction {
  pest: string;
  pestConfidence: number;
  pestSeverity: string;
  pestDescription: string;
  pestTreatment: string;
  pestPrevention: string;
}

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  prevention: string;
  pest?: PestPrediction;
}

const DISEASE_CLASSES = ['Blight', 'Common Rust', 'Gray Leaf Spot', 'Healthy'];
const PEST_CLASSES    = ['Aphid', 'Fall Armyworm', 'Corn Borer', 'Healthy'];

const rawMlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_URL = rawMlUrl.startsWith('http') ? rawMlUrl : `http://${rawMlUrl}`;

class AIService {
  public isPythonServiceAvailable = false;
  private lastPythonCheck = 0;

  async loadModel(): Promise<void> {
    console.log('[AI] ML_SERVICE_URL env =', process.env.ML_SERVICE_URL || '(not set)');
    console.log('[AI] Resolved ML URL =', ML_SERVICE_URL);
    await this.checkPythonService();
    if (this.isPythonServiceAvailable) {
      console.log('[AI] ML service connected at', ML_SERVICE_URL);
    } else {
      console.warn('[AI] ML service NOT available at', ML_SERVICE_URL, '- using mock predictions');
    }
  }

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

  async predictDisease(imageBase64: string): Promise<DiseasePrediction> {
    // Always re-check if service was marked unavailable
    if (!this.isPythonServiceAvailable) {
      console.log('[AI] ML service marked unavailable, re-checking...');
      await this.checkPythonService();
    }

    if (this.isPythonServiceAvailable) {
      try {
        console.log('[AI] Calling ML service for prediction (image size: %d bytes)', imageBase64.length);
        const result = await this.predictViaPython(imageBase64);
        console.log('[AI] ML prediction success: disease=%s confidence=%d', result.disease, result.confidence);
        return result;
      } catch (e) {
        console.error('[AI] Python ML service call FAILED:', e instanceof Error ? e.message : e);
        // Don't permanently disable - retry on next request
        this.isPythonServiceAvailable = false;
      }
    }

    console.warn('[AI] USING MOCK PREDICTION - ML service not available');
    return this.mockPrediction();
  }

  private predictViaPython(imageBase64: string): Promise<DiseasePrediction> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ image: imageBase64 });
      // Use /predict-all to run both disease + pest models
      const url = new URL(`${ML_SERVICE_URL}/predict-all`);
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

            // Disease result
            if (p.diseaseError && !p.disease) {
              return reject(new Error(p.diseaseError));
            }
            const disease    = (p.disease as string) || 'Unknown';
            const confidence = Math.round((p.diseaseConfidence ?? 0) * 100);
            const diseaseInfo = getDiseaseInfo(disease);

            // Pest result (optional - does not fail if pest model unavailable)
            let pestResult: PestPrediction | undefined;
            if (p.pest && !p.pestError) {
              const pestName        = p.pest as string;
              const pestConfidence  = Math.round((p.pestConfidence ?? 0) * 100);
              const pestInfo        = getPestInfo(pestName);
              pestResult = {
                pest:            pestName,
                pestConfidence,
                pestSeverity:    pestInfo.severity,
                pestDescription: pestInfo.description,
                pestTreatment:   pestInfo.treatment,
                pestPrevention:  pestInfo.prevention,
              };
            }

            resolve({
              disease,
              confidence,
              ...diseaseInfo,
              pest: pestResult,
            });
          } catch (e) { reject(e); }
        });
      });
      req.on('error', (err) => { console.error('[AI] ML request error:', err.message); reject(err); });
      req.setTimeout(60000, () => { req.destroy(); reject(new Error('ML service timeout (60s)')); });
      req.write(body);
      req.end();
    });
  }

  private mockPrediction(): DiseasePrediction {
    const disease    = DISEASE_CLASSES[Math.floor(Math.random() * DISEASE_CLASSES.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    const pestName   = PEST_CLASSES[Math.floor(Math.random() * PEST_CLASSES.length)];
    const pestConf   = Math.floor(Math.random() * 20) + 65;
    const pestInfo   = getPestInfo(pestName);

    return {
      disease,
      confidence,
      ...getDiseaseInfo(disease),
      pest: {
        pest:            pestName,
        pestConfidence:  pestConf,
        pestSeverity:    pestInfo.severity,
        pestDescription: pestInfo.description,
        pestTreatment:   pestInfo.treatment,
        pestPrevention:  pestInfo.prevention,
      },
    };
  }
}

export const aiService = new AIService();
