import React, { useState } from 'react';
import Form from './components/Form';
import Results from './components/Results';
import './App.css';

export default function App() {
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  function handleResult(data) {
    setResult(data);
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
          <Form onResult={handleResult} setAnalyzing={setAnalyzing} />
        </div>
        <div className="results-container">
          <Results data={result} />
        </div>
      </div>
    </div>
  );
}
