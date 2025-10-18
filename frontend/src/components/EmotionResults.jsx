import React, { useState } from 'react';
import './EmotionResults.css';

const EmotionResults = ({ emotionData, onDownloadPDF, onClose }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');
  
  console.log('🎭 EmotionResults rendering with data:', emotionData);
  
  const showSuccessNotification = (fileName) => {
    setDownloadedFileName(fileName);
    setShowSuccessPopup(true);
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 4000);
  };
  
  if (!emotionData) {
    console.log('❌ EmotionResults: No emotion data provided');
    return null;
  }
  
  if (!emotionData.all_emotions) {
    console.log('❌ EmotionResults: No all_emotions data found in:', emotionData);
    return null;
  }
  
  console.log('✅ EmotionResults: Valid data found, rendering component');

  const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    surprise: '😲',
    disgust: '🤢',
    neutral: '😐'
  };

  const emotionColors = {
    happy: '#4CAF50',
    sad: '#2196F3',
    angry: '#F44336',
    fear: '#9C27B0',
    surprise: '#FF9800',
    disgust: '#795548',
    neutral: '#607D8B'
  };

  const getEmotionInterpretation = (emotion, percentage) => {
    if (percentage > 50) return 'High';
    if (percentage > 30) return 'Moderate';
    if (percentage > 15) return 'Low';
    return 'Minimal';
  };

  const generatePDFReport = async () => {
    // Ask user for filename
    const defaultName = `emotion-analysis-${new Date().toISOString().split('T')[0]}`;
    const userFileName = prompt('📄 Enter PDF filename (without .pdf extension):', defaultName);
    
    if (!userFileName) return; // User cancelled
    
    setIsGeneratingPDF(true);
    
    try {
      console.log('🔄 Starting PDF generation...');
      
      // Import jsPDF dynamically
      const jsPDF = (await import('jspdf')).default;
      
      const pdf = new jsPDF();
      
      // Set up colors
      const primaryColor = [102, 126, 234];
      const textColor = [33, 37, 41];
      
      // Header
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, 210, 40, 'F');
      
      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🧠 Emotion Analysis Report', 20, 25);
      
      // Timestamp
      pdf.setFontSize(12);
      const timestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${timestamp}`, 20, 35);
      
      // Reset text color
      pdf.setTextColor(...textColor);
      
      // Primary Emotion Section
      let yPosition = 60;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Primary Emotion Detected', 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(16);
      const primaryEmotion = emotionData.dominant_emotion?.charAt(0).toUpperCase() + 
                            emotionData.dominant_emotion?.slice(1) || 'Unknown';
      const confidence = emotionData.confidence?.toFixed(1) || '0';
      pdf.text(`${primaryEmotion} (${confidence}%)`, 20, yPosition);
      
      // All Emotions List
      yPosition += 30;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('All Detected Emotions', 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const emotions = Object.entries(emotionData.all_emotions || {});
      emotions.forEach(([emotion, percentage], index) => {
        const emotionName = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        const confidenceText = `${percentage.toFixed(1)}%`;
        const level = percentage > 30 ? 'High' : percentage > 15 ? 'Low' : 'Minimal';
        
        pdf.text(`${emotionName}:`, 25, yPosition);
        pdf.text(`${confidenceText} (${level})`, 80, yPosition);
        yPosition += 10;
      });
      
      // Summary Section
      yPosition += 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analysis Summary', 20, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const totalEmotions = Object.keys(emotionData.all_emotions || {}).length;
      const highestConfidence = totalEmotions > 0 
        ? Math.max(...Object.values(emotionData.all_emotions)).toFixed(1) 
        : '0';
      
      pdf.text(`Total Emotions Detected: ${totalEmotions}`, 25, yPosition);
      yPosition += 10;
      pdf.text(`Highest Confidence: ${highestConfidence}%`, 25, yPosition);
      yPosition += 10;
      pdf.text('Analysis Method: Local AI Processing', 25, yPosition);
      
      // Use user-provided filename
      const fileName = `${userFileName.trim()}.pdf`;
      
      // Create blob and trigger download with file chooser
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';
      
      // Add to document, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF generated successfully:', fileName);
      
      // Show custom success popup instead of alert
      showSuccessNotification(fileName);
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
    
    // Also call the parent callback if provided
    if (onDownloadPDF) {
      onDownloadPDF(emotionData);
    }
  };

  return (
    <div className="emotion-results-container">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <div className="success-icon">✅</div>
            <h3>PDF Downloaded Successfully!</h3>
            <p>File saved as:</p>
            <div className="file-name">{downloadedFileName}</div>
            <button 
              className="popup-close-btn"
              onClick={() => setShowSuccessPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      
      <div className="emotion-results-header">
        <div className="header-title-section">
          <h3>🧠 Emotion Analysis Results</h3>
          {onClose && (
            <button onClick={onClose} className="close-results-btn">×</button>
          )}
        </div>
        <div className="analysis-info">
          <span className="analysis-timestamp">
            📅 {new Date(emotionData.timestamp).toLocaleString()}
          </span>
          <span className="analysis-method">
            🔒 {emotionData.method === 'simple_local_analysis' ? 'Secure Local Processing' : 'AI Analysis'}
          </span>
        </div>
      </div>

      <div className="primary-emotion-card">
        <div className="primary-emotion-icon">
          {emotionEmojis[emotionData.dominant_emotion]}
        </div>
        <div className="primary-emotion-info">
          <h4>Primary Emotion</h4>
          <div className="primary-emotion-name">
            {emotionData.dominant_emotion.charAt(0).toUpperCase() + 
             emotionData.dominant_emotion.slice(1)}
          </div>
          <div className="primary-emotion-confidence">
            {emotionData.confidence.toFixed(1)}% Confidence
          </div>
        </div>
      </div>

      <div className="all-emotions-section">
        <h4>Detailed Emotion Breakdown</h4>
        <div className="emotions-grid">
          {Object.entries(emotionData.all_emotions)
            .sort(([,a], [,b]) => b - a)
            .map(([emotion, percentage], index) => (
            <div key={`${emotion}-${index}`} className="emotion-card">
              <div className="emotion-card-header">
                <span className="emotion-emoji">{emotionEmojis[emotion] || '😐'}</span>
                <span className="emotion-name">
                  {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                </span>
                <span className="emotion-level">
                  {getEmotionInterpretation(emotion, percentage)}
                </span>
              </div>
              
              <div className="emotion-progress-container">
                <div className="emotion-progress-bar">
                  <div 
                    className="emotion-progress-fill"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: emotionColors[emotion] || '#6B7280'
                    }}
                  ></div>
                </div>
                <span className="emotion-percentage">{percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="emotion-summary">
        <h4>Analysis Summary</h4>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Emotions Detected:</span>
            <span className="stat-value">{Object.keys(emotionData.all_emotions).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Highest Confidence:</span>
            <span className="stat-value">
              {emotionData.all_emotions && Object.keys(emotionData.all_emotions).length > 0 
                ? Math.max(...Object.values(emotionData.all_emotions)).toFixed(1)
                : '0'}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Analysis Method:</span>
            <span className="stat-value">
              {emotionData.firestoreData ? 'Local + Cloud Backup' : 'Local AI Processing'}
            </span>
          </div>
          {emotionData.firestoreData && (
            <div className="stat-item">
              <span className="stat-label">Cloud Backup:</span>
              <span className="stat-value">✅ Secured</span>
            </div>
          )}
        </div>
      </div>

      <div className="emotion-actions">
        <button 
          onClick={generatePDFReport}
          disabled={isGeneratingPDF}
          className={`download-pdf-btn ${isGeneratingPDF ? 'generating' : ''}`}
        >
{isGeneratingPDF ? '🔄 Generating PDF...' : '📄 Download PDF Report'}
        </button>
        <div className="privacy-note">
          <span>🔒 Your emotion data is processed locally and stays private</span>
        </div>
      </div>
    </div>
  );
};

export default EmotionResults;