import React, { useState, useRef, useCallback } from 'react';
import './FaceScanner.css';

const FaceScanner = ({ onEmotionDetected, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [emotionResult, setEmotionResult] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    
    return imageDataUrl;
  }, []);

  const analyzeEmotion = useCallback(async (imageData) => {
    setIsScanning(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/detect_emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      });

      const result = await response.json();
      
      if (result.success) {
        setEmotionResult(result);
        if (onEmotionDetected) {
          onEmotionDetected(result);
        }
      } else {
        setError(result.error || 'Emotion detection failed');
      }
    } catch (err) {
      console.error('Error analyzing emotion:', err);
      setError('Failed to connect to emotion detection service. Make sure the Python backend is running.');
    } finally {
      setIsScanning(false);
    }
  }, [onEmotionDetected]);

  const handleScan = useCallback(async () => {
    const imageData = captureImage();
    if (imageData) {
      await analyzeEmotion(imageData);
    }
  }, [captureImage, analyzeEmotion]);

  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    setEmotionResult(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    if (onClose) {
      onClose();
    }
  }, [stopCamera, onClose]);

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="face-scanner-overlay">
      <div className="face-scanner-modal">
        <div className="face-scanner-header">
          <h3>🎭 Emotion Detection</h3>
          <button onClick={handleClose} className="close-button">×</button>
        </div>
        
        <div className="face-scanner-content">
          {!capturedImage && !emotionResult && (
            <>
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              
              <div className="instructions">
                <p>📷 Position your face in the camera frame</p>
                <p>😊 Look directly at the camera</p>
                <p>✨ Click "Capture & Analyze" when ready</p>
              </div>
              
              <div className="scanner-controls">
                <button 
                  onClick={handleScan} 
                  disabled={isScanning || !stream}
                  className="scan-button"
                >
                  {isScanning ? '🔄 Analyzing...' : '📸 Capture & Analyze'}
                </button>
              </div>
            </>
          )}

          {capturedImage && !emotionResult && !error && (
            <div className="processing-state">
              <img src={capturedImage} alt="Captured" className="captured-image" />
              <div className="processing-indicator">
                <div className="spinner"></div>
                <p>🧠 Analyzing emotions...</p>
              </div>
            </div>
          )}

          {emotionResult && (
            <div className="emotion-results">
              <img src={capturedImage} alt="Analyzed" className="captured-image" />
              
              <div className="emotion-data">
                <h4>Emotion Analysis Results</h4>
                
                <div className="dominant-emotion">
                  <span className="emotion-label">Primary Emotion:</span>
                  <span className="emotion-value">
                    {emotionResult.dominant_emotion.charAt(0).toUpperCase() + 
                     emotionResult.dominant_emotion.slice(1)} 
                    ({emotionResult.confidence}%)
                  </span>
                </div>
                
                <div className="all-emotions">
                  <h5>All Detected Emotions:</h5>
                  {Object.entries(emotionResult.all_emotions).map(([emotion, value]) => (
                    <div key={emotion} className="emotion-bar">
                      <span className="emotion-name">{emotion}</span>
                      <div className="emotion-progress">
                        <div 
                          className="emotion-fill" 
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                      <span className="emotion-percentage">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="result-actions">
                <button onClick={handleRetry} className="retry-button">
                  🔄 Scan Again
                </button>
                <button onClick={handleClose} className="use-result-button">
                  ✅ Use This Result
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
              <button onClick={handleRetry} className="retry-button">
                🔄 Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceScanner;