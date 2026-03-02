import * as tf from '@tensorflow/tfjs';
import { getDiseaseInfo } from '../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  prevention: string;
}

class AIService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;

  async loadModel(): Promise<void> {
    try {
      // Try to load TensorFlow.js model
      const modelPath = path.join(__dirname, '../../models/model.json');
      
      if (fs.existsSync(modelPath)) {
        console.log('Loading TensorFlow.js model from:', modelPath);
        this.model = await tf.loadLayersModel('file://' + modelPath);
        this.isModelLoaded = true;
        console.log('AI model loaded successfully');
      } else {
        console.warn('TensorFlow.js model not found at:', modelPath);
        console.warn('To use your trained model:');
        console.warn('1. Convert your .h5 model to TensorFlow.js format:');
        console.warn('   python -c "import tensorflowjs as tfjs; tfjs.converters.save_keras_model(\'trained_model.h5\', \'backend/models/\')"');
        console.warn('2. Or use the web conversion tool: https://www.tensorflow.org/js/tutorials/conversion');
        console.warn('3. Place the converted model.json and weight files in backend/models/');
        console.warn('4. For now, using mock predictions as fallback');
        this.isModelLoaded = false;
      }
    } catch (error) {
      console.warn('Failed to load AI model, using fallback:', error);
      this.isModelLoaded = false;
    }
  }

  async predictDisease(imageBase64: string): Promise<DiseasePrediction> {
    if (this.isModelLoaded && this.model) {
      return this.realPrediction(imageBase64);
    } else {
      return this.mockPrediction();
    }
  }

  private async realPrediction(imageBase64: string): Promise<DiseasePrediction> {
    try {
      const imageTensor = await this.preprocessImage(imageBase64);
      const prediction = this.model!.predict(imageTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Update disease classes based on your trained model
      const diseases = ['maize fall armyworm', 'Northern Leaf Blight', 'Gray Leaf Spot', 'Common Rust', 'Healthy'];
      const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
      const disease = diseases[maxIndex] || 'Unknown';
      const confidence = Math.round(probabilities[maxIndex] * 100);
      
      const diseaseInfo = getDiseaseInfo(disease);
      
      prediction.dispose();
      imageTensor.dispose();
      
      return {
        disease,
        confidence,
        severity: diseaseInfo.severity,
        description: diseaseInfo.description,
        treatment: diseaseInfo.treatment,
        prevention: diseaseInfo.prevention,
      };
    } catch (error) {
      console.error('Prediction failed, using fallback:', error);
      return this.mockPrediction();
    }
  }

  private async preprocessImage(imageBase64: string): Promise<tf.Tensor> {
    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Decode image using sharp or jimp (for now, create a tensor from the buffer)
      // Note: In production, you'd want to use a proper image decoding library
      const imageBytes = new Uint8Array(buffer);
      
      // Create a tensor from the image bytes
      // This is a simplified version - in production use proper image preprocessing
      const tensor = tf.tensor3d(imageBytes, [224, 224, 3])
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0);
      
      return tensor;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  private mockPrediction(): DiseasePrediction {
    const diseases = ['Northern Leaf Blight', 'Gray Leaf Spot', 'Common Rust', 'Healthy'];
    const disease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    
    const diseaseInfo = getDiseaseInfo(disease);
    
    return {
      disease,
      confidence,
      severity: diseaseInfo.severity,
      description: diseaseInfo.description,
      treatment: diseaseInfo.treatment,
      prevention: diseaseInfo.prevention,
    };
  }
}

export const aiService = new AIService();
