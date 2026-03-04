import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Upload, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  RefreshCw,
  FileText,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { diseaseModel, ModelMetrics as AIModelMetrics } from '../../utils/aiModel';

interface TrainingSession {
  id: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  accuracy: number;
  loss: number;
  epochs: number;
  totalEpochs: number;
  startTime: string;
  duration?: string;
  datasetSize: number;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix?: number[][];
}

const ModelTraining: React.FC = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState('cnn');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [modelStatus, setModelStatus] = useState<{ loaded: boolean; loading: boolean }>({ 
    loaded: false, 
    loading: true 
  });
  const [trainingMetrics, setTrainingMetrics] = useState<AIModelMetrics | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Initialize AI model on component mount
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setModelStatus({ loaded: false, loading: true });
        await diseaseModel.loadModel();
        setModelStatus({ loaded: true, loading: false });
        console.log('AI model loaded successfully');
      } catch (error) {
        console.error('Failed to load AI model:', error);
        setModelStatus({ loaded: false, loading: false });
      }
    };

    initializeModel();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startTraining = async () => {
    if (!modelStatus.loaded) {
      alert('AI model is not loaded. Please wait for the model to initialize.');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload training data first.');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);

    try {
      // Create mock image data from uploaded files
      const imageData = uploadedFiles.map(file => URL.createObjectURL(file));
      const mockLabels = uploadedFiles.map((_, index) => 
        ['Healthy', 'Northern Leaf Blight', 'Gray Leaf Spot', 'Common Rust'][index % 4]
      );

      // Train the model with progress updates
      await diseaseModel.trainModel(
        imageData,
        mockLabels,
        (metrics) => {
          setTrainingMetrics(metrics);
          setCurrentEpoch(metrics.epoch);
          setTrainingProgress((metrics.epoch / 50) * 100);
        }
      );

      // Save the trained model
      await diseaseModel.saveModel();
      
      alert('Model training completed successfully!');
      
    } catch (error) {
      console.error('Training failed:', error);
      alert('Training failed. Please check the console for details.');
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
      setCurrentEpoch(0);
    }
  };

  const stopTraining = () => {
    setIsTraining(false);
    alert('Training stopped by user.');
  };

  const resetModel = async () => {
    try {
      diseaseModel.dispose();
      await diseaseModel.loadModel();
      setTrainingMetrics(null);
      setTrainingProgress(0);
      setCurrentEpoch(0);
      alert('Model reset successfully.');
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Failed to reset model.');
    }
  };

  const trainingSessions: TrainingSession[] = [
    {
      id: '1',
      status: 'completed',
      accuracy: 94.7,
      loss: 0.142,
      epochs: 50,
      totalEpochs: 50,
      startTime: '2024-01-15 10:30:00',
      duration: '2h 15m',
      datasetSize: 15420,
    },
    {
      id: '2',
      status: 'running',
      accuracy: 92.3,
      loss: 0.189,
      epochs: 25,
      totalEpochs: 50,
      startTime: '2024-01-15 14:45:00',
      datasetSize: 15200,
    },
    {
      id: '3',
      status: 'failed',
      accuracy: 0,
      loss: 0,
      epochs: 12,
      totalEpochs: 50,
      startTime: '2024-01-15 09:15:00',
      datasetSize: 14800,
    },
  ];

  const currentMetrics: ModelMetrics = {
    accuracy: 94.7,
    precision: 93.2,
    recall: 95.1,
    f1Score: 94.1,
    confusionMatrix: [
      [145, 12, 8, 3],
      [9, 167, 15, 4],
      [6, 11, 189, 7],
      [2, 5, 9, 143]
    ]
  };

  const models = [
    { id: 'resnet50', name: 'ResNet-50', description: 'Deep residual network, excellent for image classification' },
    { id: 'efficientnet', name: 'EfficientNet-B0', description: 'Lightweight and efficient model' },
    { id: 'mobilenet', name: 'MobileNet-V2', description: 'Optimized for mobile deployment' },
    { id: 'custom', name: 'Custom CNN', description: 'Custom architecture for specific requirements' },
  ];

  const trainingConfig = {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 50,
    validationSplit: 0.2,
    augmentation: true,
    earlyStopping: true,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return RefreshCw;
      case 'failed': return AlertTriangle;
      case 'pending': return Clock;
      default: return FileText;
    }
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 2;
      });
      
      setCurrentEpoch(prev => {
        if (prev < trainingConfig.epochs) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);
  };

  const handleStopTraining = () => {
    setIsTraining(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Model Training</h1>
          <p className="text-gray-600 mt-1">
            Train and improve AI models for disease detection
          </p>
        </div>
      </div>

      {/* Current Model Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-8 w-8 text-green-600" />
            <span className="text-sm text-green-600 font-medium">+2.3%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{currentMetrics.accuracy}%</h3>
          <p className="text-gray-600 text-sm">Accuracy</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">+1.8%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{currentMetrics.precision}%</h3>
          <p className="text-gray-600 text-sm">Precision</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <Brain className="h-8 w-8 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">+3.1%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{currentMetrics.recall}%</h3>
          <p className="text-gray-600 text-sm">Recall</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-6 text-orange-600" />
            <span className="text-sm text-orange-600 font-medium">+2.4%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{currentMetrics.f1Score}%</h3>
          <p className="text-gray-600 text-sm">F1 Score</p>
        </div>
      </div>

      {/* Training Controls */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Training Configuration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Architecture</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Rate</label>
                <input
                  type="number"
                  value={trainingConfig.learningRate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  step="0.001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
                <input
                  type="number"
                  value={trainingConfig.batchSize}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Epochs</label>
              <input
                type="number"
                value={trainingConfig.epochs}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={trainingConfig.augmentation}
                  className="rounded text-primary-600 focus:ring-primary-500"
                  readOnly
                />
                <span className="text-sm text-gray-700">Data Augmentation</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={trainingConfig.earlyStopping}
                  className="rounded text-primary-600 focus:ring-primary-500"
                  readOnly
                />
                <span className="text-sm text-gray-700">Early Stopping</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Dataset Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Images:</span>
                  <span className="text-sm font-medium">15,420</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Training Set:</span>
                  <span className="text-sm font-medium">12,336 (80%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Validation Set:</span>
                  <span className="text-sm font-medium">3,084 (20%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Classes:</span>
                  <span className="text-sm font-medium">4</span>
                </div>
              </div>
            </div>

            {isTraining && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Training Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Epoch {currentEpoch}/{trainingConfig.epochs}</span>
                      <span>{trainingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${trainingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Training in progress... Estimated time remaining: 45 minutes
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {!isTraining ? (
                <button
                  onClick={handleStartTraining}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Training</span>
                </button>
              ) : (
                <button
                  onClick={handleStopTraining}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Pause className="h-4 w-4" />
                  <span>Stop Training</span>
                </button>
              )}
              <button className="btn-secondary flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Training History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Training History</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All Sessions
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Session ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Accuracy</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Loss</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Epochs</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Dataset Size</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainingSessions.map((session) => {
                const StatusIcon = getStatusIcon(session.status);
                return (
                  <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{session.id}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{session.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {session.accuracy > 0 ? `${session.accuracy}%` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {session.loss > 0 ? session.loss.toFixed(3) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {session.epochs}/{session.totalEpochs}
                    </td>
                    <td className="py-3 px-4">{session.duration || '-'}</td>
                    <td className="py-3 px-4">{session.datasetSize.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button className="text-primary-600 hover:text-primary-700">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Confusion Matrix</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 px-4"></th>
                  <th className="py-2 px-4 font-medium">Healthy</th>
                  <th className="py-2 px-4 font-medium">NLB</th>
                  <th className="py-2 px-4 font-medium">GLS</th>
                  <th className="py-2 px-4 font-medium">Rust</th>
                </tr>
              </thead>
              <tbody>
                {currentMetrics.confusionMatrix?.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 px-4 font-medium">
                      {i === 0 ? 'Healthy' : i === 1 ? 'NLB' : i === 2 ? 'GLS' : 'Rust'}
                    </td>
                    {row.map((val, j) => (
                      <td key={j} className="py-2 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          i === j ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {val}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelTraining;
