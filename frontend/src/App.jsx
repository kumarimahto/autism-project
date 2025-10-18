import React, { useState } from 'react';
import Form from './components/Form';
import Results from './components/Results';
import EmotionResults from './components/EmotionResults';
import './App.css';

export default function App() {
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotionData, setEmotionData] = useState(null);
  const [showEmotionResults, setShowEmotionResults] = useState(false);

  function handleResult(data) {
    setResult(data);
  }

  function handleEmotionDetected(emotion) {
    console.log('🎭 App received emotion data:', emotion);
    setEmotionData(emotion);
    setShowEmotionResults(true);
  }

  function handleCloseEmotionResults() {
    setShowEmotionResults(false);
    setEmotionData(null);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="main-title">AI-Assisted Autism Screening & Therapy Recommendation Tool</h1>
        <p className="subtitle">Early Screening Support for Parents and Therapists</p>
      </div>
      {analyzing && (
        <div className="overlay">
          <div className="loader">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
            <div style={{ fontSize: 15, color: '#0b1220' }}>Analyzing — generating recommendations...</div>
          </div>
        </div>
      )}
      <div className="content-container">
        <div className="form-container">
          <Form 
            onResult={handleResult} 
            setAnalyzing={setAnalyzing}
            onEmotionDetected={handleEmotionDetected}
          />
        </div>
        <div className="results-container">
          <Results data={result} />
        </div>
      </div>
      
      {/* Emotion Results - Centered and Separate */}
      {showEmotionResults && emotionData && (
        <div className="emotion-results-wrapper">
          <EmotionResults 
            emotionData={emotionData}
            onClose={handleCloseEmotionResults}
          />
        </div>
      )}
    </div>
  );
}
