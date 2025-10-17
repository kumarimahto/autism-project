import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import './Results.css';

export default function Results({ data }) {
  const [fileName, setFileName] = useState('AI_Recommendations.pdf');
  const [showPopup, setShowPopup] = useState(false);

  if (!data) {
    return (
      <div className="results-card">
        <h2 className="results-title">AI Recommendations</h2>
        <p className="results-placeholder">No analysis yet. Fill the form and click Analyze.</p>
      </div>
    );
  }

  async function downloadPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Add title with bold styling and centered alignment
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(74, 144, 226);
    doc.text('AI Recommendations', 105, 20, { align: 'center' });

    let y = 30;

    // Add Input Data with bold section title
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text('Input Data', 10, y);
    doc.setDrawColor(74, 144, 226);
    doc.line(10, y + 2, 200, y + 2); // Decorative line
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(102, 102, 102);
    const inputData = [
      `Age: ${data._input.age}`,
      `Eye Contact: ${data._input.eye_contact}`,
      `Speech Level: ${data._input.speech_level}`,
      `Social Response: ${data._input.social_response}`,
      `Sensory Reactions: ${data._input.sensory_reactions}`,
    ];
    inputData.forEach((line) => {
      doc.text(line, 15, y);
      y += 10;
    });

    y += 10;

    // Add Focus Areas with bold section title
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text('Focus Areas', 10, y);
    doc.setDrawColor(74, 144, 226);
    doc.line(10, y + 2, 200, y + 2); // Decorative line
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(102, 102, 102);
    data.focus_areas.forEach((item) => {
      const lines = doc.splitTextToSize(item, 180);
      lines.forEach((line) => {
        doc.text(`- ${line}`, 15, y);
        y += 10;
      });
    });

    y += 10;

    // Add Therapy Goals with numbering and bold section title
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text('Therapy Goals', 10, y);
    doc.setDrawColor(74, 144, 226);
    doc.line(10, y + 2, 200, y + 2); // Decorative line
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(102, 102, 102);
    data.therapy_goals.forEach((item, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${item}`, 180);
      lines.forEach((line) => {
        doc.text(line, 15, y);
        y += 10;
      });
    });

    y += 10;

    // Add Activities with bullet points and bold section title
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text('Activities', 10, y);
    doc.setDrawColor(74, 144, 226);
    doc.line(10, y + 2, 200, y + 2); // Decorative line
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(102, 102, 102);
    data.activities.forEach((item) => {
      const lines = doc.splitTextToSize(`- ${item}`, 180);
      lines.forEach((line) => {
        doc.text(line, 15, y);
        y += 10;
      });
    });

    y += 10;

    // Add Notes with bold section title
    if (data.notes) {
      doc.setFontSize(20);
      doc.setTextColor(51, 51, 51);
      doc.text('Notes / Recommendations', 10, y);
      doc.setDrawColor(74, 144, 226);
      doc.line(10, y + 2, 200, y + 2); // Decorative line
      y += 10;

      doc.setFontSize(14);
      doc.setTextColor(102, 102, 102);
      const lines = doc.splitTextToSize(data.notes, 180);
      lines.forEach((line) => {
        doc.text(line, 15, y);
        y += 10;
      });
    }

    // Save the PDF
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PDF Files',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      const pdfBlob = doc.output('blob');
      await writable.write(pdfBlob);
      await writable.close();
      setShowPopup(true); // Show popup on successful download
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
    } catch (error) {
      console.error('File save canceled or failed:', error);
    }
  }

  return (
    <div className="results-card">
      <h2 className="results-title">AI Recommendations</h2>
      <div className="results-section">
        <h3 className="results-subtitle">Focus Areas</h3>
        <ul className="results-list">
          {data.focus_areas.map((item, index) => (
            <li key={index} className="results-item">{item}</li>
          ))}
        </ul>
      </div>
      <div className="results-section">
        <h3 className="results-subtitle">Therapy Goals</h3>
        <ol className="results-list">
          {data.therapy_goals.map((item, index) => (
            <li key={index} className="results-item">{item}</li>
          ))}
        </ol>
      </div>
      <div className="results-section">
        <h3 className="results-subtitle">Activities</h3>
        <ul className="results-list">
          {data.activities.map((item, index) => (
            <li key={index} className="results-item">{item}</li>
          ))}
        </ul>
      </div>
      {data.notes && (
        <div className="results-section">
          <h3 className="results-subtitle">Notes / Recommendations</h3>
          <p className="results-notes">{data.notes}</p>
        </div>
      )}
      <div className="results-actions">
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
          className="file-name-input"
        />
        <button className="results-button" onClick={downloadPDF}>Download PDF</button>
      </div>
      {showPopup && (
        <div className="popup-success">
          <span className="popup-icon">✔️</span> Download Complete
        </div>
      )}
    </div>
  );
}
