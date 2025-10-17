import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Form.css'; // Importing a CSS file for styling

export default function Form({ onResult, setAnalyzing }) {
  const [form, setForm] = useState({ age: '', eye_contact: '', speech_level: '', social_response: '', sensory_reactions: '' });
  const [isValid, setIsValid] = useState(false);

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
      const res = await axios.post('http://localhost:4000/analyze', form);
      onResult(res.data);
    } catch (err) {
      alert('Error calling backend: ' + (err?.message || err));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="page-container">
      <div className="form-container">
        <div className="form-header">
          <h1>Child Assessment Form</h1>
          <p>Please provide accurate information for personalized AI recommendations</p>
        </div>
        <form onSubmit={submit} className="form">
          <div className="form-group">
            <label className="form-label">
              <span className="form-icon">👶</span> Child's Age
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
              <span className="form-icon">👁️</span> Eye Contact
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
              <span className="form-icon">💬</span> Speech Level
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
              <span className="form-icon">🤝</span> Social Response
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
              <span className="form-icon">🌟</span> Sensory Reactions
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
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <button type="submit" className="form-button" disabled={!isValid}>🔍 Generate AI Analysis</button>
          </div>
        </form>
      </div>
    </div>
  );
}
