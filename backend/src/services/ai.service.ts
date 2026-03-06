/**
 * AI Service – corn leaf disease prediction
 *
 * Strategy:
 * 1. Python ML service (ML_SERVICE_URL) – primary production path
 * 2. Mock prediction – fallback for dev/CI
 */

import { getDiseaseInfo } from '../utils/helpers';
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

const DISEASE_CLASSES = ['Blight', 'Common Rust', 'Gray Leaf Spot', 'Healthy'];

const rawMlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_URL = rawMlUrl.startsWith('http') ? rawMlUrl : `http://${rawMlUrl}`;

class AIService {
  private isPythonServiceAvailable = false;
  private lastPythonCheck = 0;

  async loadModel(): Promise<void> {
    await this.checkPythonService();
    if (this.isPythonServiceAvailable) {
      console.log('ML service detected at', ML_SERVICE_URL);
    } else {
      console.warn('ML service not available - will use mock predictions. Set ML_SERVICE_URL.');
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
    if (!this.isPythonServiceAvailable && Date.now() - this.lastPythonCheck > 30_000) {
      await this.checkPythonService();
    }

    if (this.isPythonServiceAvailable) {
      try { return await this.predictViaPython(imageBase64); }
      catch (e) {
        console.warn('Python ML service call failed:', e instanceof Error ? e.message : e);
        this.isPythonServiceAvailable = false;
      }
    }

    console.warn('No ML backend available - returning mock prediction');
    return this.mockPrediction();
  }

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

  private mockPrediction(): DiseasePrediction {
    const disease = DISEASE_CLASSES[Math.floor(Math.random() * DISEASE_CLASSES.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    return { disease, confidence, ...getDiseaseInfo(disease) };
  }
}

export const aiService = new AIService();
