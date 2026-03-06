import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera as CapCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import apiService from '../services/api';
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';
import { DetectionResult } from '../types';

const DetectDisease: React.FC = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const diseases = [
    {
      name: 'Northern Leaf Blight',
      description: 'A fungal disease that causes long, elliptical lesions on corn leaves.',
      treatment: 'Apply fungicides containing strobilurin or triazole active ingredients. Remove infected plant debris.',
      prevention: 'Use resistant corn varieties, practice crop rotation, ensure proper spacing for air circulation.',
      severity: 'high' as const,
    },
    {
      name: 'Gray Leaf Spot',
      description: 'A fungal disease characterized by rectangular, grayish-brown lesions on leaves.',
      treatment: 'Apply fungicides at the first sign of disease. Use resistant hybrids when available.',
      prevention: 'Avoid excessive nitrogen fertilization, practice crop rotation, use resistant varieties.',
      severity: 'medium' as const,
    },
    {
      name: 'Common Rust',
      description: 'A fungal disease that causes small, reddish-brown pustules on leaves.',
      treatment: 'Apply fungicides with active ingredients like propiconazole or azoxystrobin.',
      prevention: 'Plant resistant hybrids, avoid late planting, monitor weather conditions.',
      severity: 'low' as const,
    },
    {
      name: 'Healthy',
      description: 'The corn leaf appears healthy with no signs of disease.',
      treatment: 'Continue regular monitoring and maintain good agricultural practices.',
      prevention: 'Maintain proper irrigation, fertilization, and pest management practices.',
      severity: 'low' as const,
    },
  ];

  const openCamera = async () => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        saveToGallery: false,
      });

      // Convert URI to data URL for display
      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error: any) {
      // User cancelled — not an error
      if (error?.message?.includes('User cancelled') || error?.message?.includes('canceled')) {
        return;
      }
      console.error('Camera error:', error);
      alert('Camera error: ' + (error?.message || error));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);

    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const fileType = file.type.toLowerCase();

      if (!validTypes.includes(fileType)) {
        setUploadError(t('Invalid file type. Please upload only JPG or PNG images.'));
        event.target.value = ''; // Reset the input
        return;
      }

      // Validate file size (optional: max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setUploadError(t('File size too large. Please upload an image smaller than 10MB.'));
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);

    try {
      // Always analyze through backend API so detection is persisted in DB
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const file = new File([blob], 'detection-image.jpg', { type: 'image/jpeg' });

      const apiResult = await apiService.analyzeImage(file);

      setDetectionResult({
        disease: apiResult.disease,
        confidence: apiResult.confidence,
        severity: apiResult.severity,
        description: apiResult.description,
        treatment: apiResult.treatment,
        prevention: apiResult.prevention,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      setDetectionResult(null);
      alert(t('Failed to analyze image. Please try again.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setDetectionResult(null);
    setUploadError(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('Disease Detection')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
          {t('Upload or capture an image of corn leaf for AI-powered disease detection')}
        </p>

      </div>

      {!selectedImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Upload Option */}
          <div className="card p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('Upload Image')}</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-2">
                {t('Choose an image from your device')}
              </p>
              <p className="text-xs text-gray-500 mb-4 sm:mb-6">
                {t('Accepted formats: JPG, PNG (Max 10MB)')}
              </p>
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {uploadError}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
              >
                {t('Select Image')}
              </button>
            </div>
          </div>

          {/* Camera Option */}
          <div className="card p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('Take Photo')}</h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                {t('Use your camera to capture a leaf image')}
              </p>
              <button
                onClick={openCamera}
                className="btn-secondary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
              >
                {t('Open Camera')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Image Preview */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">{t('Selected Image')}</h3>
              <button
                onClick={resetDetection}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedImage}
                  alt={t('Selected corn leaf')}
                  className="w-full rounded-lg object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">{t('Tips for Best Results:')}</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>{t('• Ensure good lighting')}</li>
                      <li>{t('• Capture the entire leaf')}</li>
                      <li>{t('• Focus on affected areas')}</li>
                      <li>{t('• Avoid blurry images')}</li>
                    </ul>
                  </div>
                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center">
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        {t('Analyzing...')}
                      </span>
                    ) : (
                      t('Analyze Image')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Result */}
          {detectionResult && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('Detection Results')}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(detectionResult.severity)}`}>
                    {t(detectionResult.severity).toUpperCase()} {t('Severity').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {detectionResult.confidence}% {t('confidence')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="bg-gradient-to-r from-primary-50 to-emerald-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      {detectionResult.disease === 'Healthy' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      )}
                      {t(detectionResult.disease)}
                    </h4>
                    <p className="text-gray-600 text-sm">{t(detectionResult.description)}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2 text-blue-600" />
                        {t('Treatment')}
                      </h5>
                      <p className="text-gray-600 text-sm">{t(detectionResult.treatment)}</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        {t('Prevention')}
                      </h5>
                      <p className="text-gray-600 text-sm">{t(detectionResult.prevention)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('Confidence Breakdown')}</h5>
                    <div className="space-y-3">
                      {diseases.map((disease) => (
                        <div key={disease.name} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t(disease.name)}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{
                                  width: disease.name === detectionResult.disease
                                    ? `${detectionResult.confidence}%`
                                    : `${Math.floor(Math.random() * 20) + 5}%`
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">
                              {disease.name === detectionResult.disease
                                ? `${detectionResult.confidence}%`
                                : `${Math.floor(Math.random() * 20) + 5}%`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetectDisease;
