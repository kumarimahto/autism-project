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

    // Add title with exact same styling as the webpage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(74, 144, 226); // Blue color matching the web design
    doc.text('AI Recommendations', 105, 20, { align: 'center' });

    // Add current date and time
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128); // Gray color
    doc.text(`Generated on: ${formattedDate} at ${formattedTime}`, 105, 30, { align: 'center' });

    let y = 45;

    // Input Data Section
    // Input Data Section (only if _input exists)
    if (data._input) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51); // Dark gray
      doc.text('Input Data', 20, y);
      
      // Add underline
      doc.setDrawColor(74, 144, 226);
      doc.setLineWidth(0.5);
      doc.line(20, y + 2, 190, y + 2);
      y += 15;

      // Input data items with same styling as webpage
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(102, 102, 102); // Gray text
      
      const inputItems = [
        `Child's Name: ${data._input.child_name}`,
        `Father's Name: ${data._input.father_name}`,
        `Mother's Name: ${data._input.mother_name}`,
        `Age: ${data._input.age}`,
        `Eye Contact: ${data._input.eye_contact}`,
        `Speech Level: ${data._input.speech_level}`,
        `Social Response: ${data._input.social_response}`,
        `Sensory Reactions: ${data._input.sensory_reactions}`
      ];
      
      inputItems.forEach(item => {
        doc.text(item, 25, y);
        y += 8;
      });

      y += 10;
    }

    // Focus Areas Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Focus Areas', 20, y);
    
    // Add underline
    doc.setDrawColor(74, 144, 226);
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    data.focus_areas.forEach((item) => {
      doc.text(`- ${item}`, 25, y);
      y += 8;
    });

    y += 10;

    // Therapy Goals Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Therapy Goals', 20, y);
    
    // Add underline
    doc.setDrawColor(74, 144, 226);
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    data.therapy_goals.forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, 25, y);
      y += 8;
    });

    y += 10;

    // Activities Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Activities', 20, y);
    
    // Add underline
    doc.setDrawColor(74, 144, 226);
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    data.activities.forEach((item) => {
      doc.text(`- ${item}`, 25, y);
      y += 8;
    });

    y += 10;

    // Notes / Recommendations Section
    if (data.notes) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('Notes / Recommendations', 20, y);
      
      // Add underline
      doc.setDrawColor(74, 144, 226);
      doc.line(20, y + 2, 190, y + 2);
      y += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(102, 102, 102);
      const noteLines = doc.splitTextToSize(data.notes, 170);
      noteLines.forEach(line => {
        doc.text(line, 25, y);
        y += 8;
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
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error('File save canceled or failed:', error);
    }
  }

  return (
    <div className="results-card">
      <h2 className="results-title">AI Recommendations</h2>
      
      {/* Input Data section removed from display - only shown in PDF */}

      <div className="results-section">
        <h3 className="results-subtitle">Focus Areas</h3>
        <ul className="results-list">
          {data.focus_areas.map((item, index) => (
            <li key={index} className="results-item">- {item}</li>
          ))}
        </ul>
      </div>

      <div className="results-section">
        <h3 className="results-subtitle">Therapy Goals</h3>
        <ol className="results-list">
          {data.therapy_goals.map((item, index) => (
            <li key={index} className="results-item">{index + 1}. {item}</li>
          ))}
        </ol>
      </div>

      <div className="results-section">
        <h3 className="results-subtitle">Activities</h3>
        <ul className="results-list">
          {data.activities.map((item, index) => (
            <li key={index} className="results-item">- {item}</li>
          ))}
        </ul>
      </div>

      {data.notes && (
        <div className="results-section">
          <h3 className="results-subtitle">Notes / Recommendations</h3>
          <p className="results-notes">{data.notes}</p>
        </div>
      )}

      <div className="download-section">
        <input
          type="text"
          placeholder="Enter filename"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="filename-input"
        />
        <button className="download-btn" onClick={downloadPDF}>
          Download PDF
        </button>
      </div>

      {showPopup && (
        <div className="popup">
          <p>PDF downloaded successfully!</p>
        </div>
      )}
    </div>
  );
}
