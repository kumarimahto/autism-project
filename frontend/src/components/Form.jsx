import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Form.css'; // Importing a CSS file for styling
import { saveResult } from '../firebase';
import SimpleFaceScanner from './SimpleFaceScanner_Fixed';

export default function Form({ onResult, setAnalyzing, onEmotionDetected }) {
  const [form, setForm] = useState({ 
    child_name: '', 
    father_name: '', 
    mother_name: '', 
    age: '', 
    eye_contact: '', 
    speech_level: '', 
    social_response: '', 
    sensory_reactions: '' 
  });
  const [isValid, setIsValid] = useState(false);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [emotionData, setEmotionData] = useState(null);

  useEffect(() => {
    // Check if all fields are filled
    const allFilled = Object.values(form).every((v) => v !== '' && v !== null && v !== undefined);
    setIsValid(allFilled);
  }, [form]);

  function update(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setAnalyzing(true);
    try {
      // Include emotion data in the form submission if available
      const formWithEmotion = {
        ...form,
        emotion_data: emotionData
      };
      
      const res = await axios.post('https://autism-backend-lv72.onrender.com/analyze', formWithEmotion);
      console.log('Backend response:', res.data); // Debugging log
      onResult(res.data);

      // Save input and output to Firebase
      const saveResponse = await saveResult({ input: formWithEmotion, output: res.data });
      if (saveResponse.error) {
        console.error('Error saving to Firebase:', saveResponse.error);
      } else {
        console.log('Saved to Firebase with ID:', saveResponse.id);
      }
    } catch (err) {
      console.error('Error calling backend:', err); // Debugging log
      alert('Error calling backend: ' + (err?.message || err));
    } finally {
      setAnalyzing(false);
    }
  }

  function handleEmotionDetected(emotion) {
    console.log('🎭 Form received emotion data, passing to App:', emotion);
    
    setEmotionData(emotion);
    setShowFaceScanner(false);
    
    // Pass to App component
    if (onEmotionDetected) {
      onEmotionDetected(emotion);
    }
  }

  function handleScanFace() {
    setShowFaceScanner(true);
  }



  return (
    <>
      <div className="form-container">
        <div className="form-header">
          <h1>Child Assessment Form</h1>
          <p>Please provide accurate information for personalized AI recommendations</p>
        </div>
        <form onSubmit={submit} className="form">
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Child's Name
            </label>
            <input
              type="text"
              name="child_name"
              value={form.child_name}
              onChange={update}
              className="form-input"
              placeholder="Enter child's name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Father's Name
            </label>
            <input
              type="text"
              name="father_name"
              value={form.father_name}
              onChange={update}
              className="form-input"
              placeholder="Enter father's name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Mother's Name
            </label>
            <input
              type="text"
              name="mother_name"
              value={form.mother_name}
              onChange={update}
              className="form-input"
              placeholder="Enter mother's name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Child's Age
            </label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={update}
              className="form-input"
              placeholder="Enter age"
              min="0"
              max="18"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Eye Contact
            </label>
            <select
              name="eye_contact"
              value={form.eye_contact}
              onChange={update}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="Poor">Poor</option>
              <option value="Moderate">Moderate</option>
              <option value="Good">Good</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Speech Level
            </label>
            <select
              name="speech_level"
              value={form.speech_level}
              onChange={update}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="Limited">Limited</option>
              <option value="Moderate">Moderate</option>
              <option value="Fluent">Fluent</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Social Response
            </label>
            <select
              name="social_response"
              value={form.social_response}
              onChange={update}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="Passive">Passive</option>
              <option value="Active">Active</option>
              <option value="Engaged">Engaged</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">*</span> Sensory Reactions
            </label>
            <select
              name="sensory_reactions"
              value={form.sensory_reactions}
              onChange={update}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="Sensitive">Sensitive</option>
              <option value="Neutral">Neutral</option>
              <option value="Resilient">Resilient</option>
            </select>
          </div>
          {emotionData && (
            <div className="emotion-summary">
              <h4>🎭 Emotion Detected</h4>
              <div className="emotion-info">
                <span className="emotion-primary">
                  {emotionData.dominant_emotion.charAt(0).toUpperCase() + 
                   emotionData.dominant_emotion.slice(1)} ({emotionData.confidence?.toFixed(1) || 'N/A'}%)
                </span>
                <button 
                  type="button" 
                  onClick={handleScanFace}
                  className="rescan-button"
                >
                  🔄 Rescan
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <button type="submit" className="form-button" disabled={!isValid}>Generate AI Analysis</button>
            <button 
              type="button" 
              onClick={handleScanFace}
              className="scan-face-button"
            >
              📷 Scan Face
            </button>
          </div>
        </form>
        
        {showFaceScanner && (
          <SimpleFaceScanner 
            onEmotionDetected={handleEmotionDetected}
            onClose={() => setShowFaceScanner(false)}
          />
        )}
      </div>

      

    </>
  );
}
