# 🧠 AI-Assisted Autism Screening & Therapy Recommendation Tool (Secure Edition)

An advanced web application that combines traditional autism screening questionnaires with cutting-edge **100% local emotion detection** technology. This tool provides comprehensive therapy recommendations based on both behavioral assessments and real-time emotion analysis - all while ensuring complete privacy and security.

## 🔒 Security-First Features

### 🛡️ Complete Privacy Protection
- **100% Local Processing**: Emotion detection happens entirely in your browser
- **No Server Uploads**: Images never leave your device
- **No Data Storage**: Photos are automatically deleted after analysis
- **Browser-Based AI**: Uses face-api.js for client-side emotion recognition

### 🌟 Core Features
- **Interactive Assessment Form**: Comprehensive questionnaire covering key autism indicators
- **AI-Powered Analysis**: Intelligent therapy recommendations using Google's Gemini AI
- **Data Persistence**: Secure storage using Firebase
- **Responsive Design**: Beautiful, mobile-friendly interface

### 🆕 Secure Emotion Detection
- **Real-time Face Scanning**: Uses camera to capture and analyze facial expressions
- **Local AI Processing**: Advanced emotion recognition without server dependency
- **Enhanced Recommendations**: Therapy goals adjusted based on detected emotions
- **Privacy-First Design**: Complete local processing with security indicators

## 🏗️ Architecture

```
├── frontend/           # React.js web application with face-api.js
├── backend_node/       # Node.js API server (AI analysis only)
├── setup.sh           # Automated setup script
└── download-models.sh  # Downloads AI models for local processing
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+** with npm
- **Modern web browser** with camera access
- **Internet connection** for AI services (only for therapy recommendations)

### Automated Setup
```bash
git clone <repository-url>
cd Autism
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### 1. Download Emotion Detection Models
```bash
chmod +x download-models.sh
./download-models.sh
```

#### 2. Node.js Backend (AI Analysis)
```bash
cd backend_node
npm install
npm run dev
```

#### 3. React Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in `backend_node/`:
```env
OPENAI_API_KEY=your_gemini_api_key_here
OPENAI_API_MODEL=gemini-pro
```

### API Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Web application |
| Node.js API | http://localhost:4000 | AI analysis & therapy recommendations |
| Emotion Detection | Local Browser | 100% client-side processing |

## 📱 How to Use

### 1. Fill Assessment Form
- Enter child's basic information
- Complete behavioral assessment questions
- All fields are required for analysis

### 2. Secure Face Scan (Optional)
- Click "📷 Scan Face" button
- Allow camera permissions when prompted
- Position face in camera frame
- Click "🧠 Analyze Emotion" 
- Review emotion detection results (processed locally!)

### 3. Generate Analysis
- Click "🔍 Generate AI Analysis"
- Review comprehensive therapy recommendations
- Results include focus areas, goals, and activities
- Recommendations adapt based on detected emotions

## 🧬 Secure Emotion Detection Technology

### Face-API.js Integration
- **7 Emotion Categories**: Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral
- **Confidence Scoring**: Percentage confidence for each emotion
- **Real-time Processing**: Fast analysis with immediate results
- **100% Local**: No images sent to any server, ever

### Privacy & Security Indicators
| Feature | Security Level |
|---------|----------------|
| **Image Processing** | 🔒 100% Local Browser |
| **Data Transmission** | ❌ No image uploads |
| **Storage** | ❌ No image storage |
| **Privacy** | ✅ Complete protection |

### Supported Emotions & Therapy Adaptations
| Emotion | Therapy Adaptation |
|---------|-------------------|
| **Happy** | Positive reinforcement strategies |
| **Sad/Fear** | Calming and comfort-building activities |
| **Angry/Disgust** | Emotional regulation techniques |
| **Neutral** | Standard assessment-based recommendations |

## 🎯 AI-Enhanced Recommendations

The system provides personalized therapy recommendations by combining:

1. **Traditional Assessment**: Age, eye contact, speech, social response, sensory reactions
2. **Local Emotion Analysis**: Primary emotion detection with confidence levels
3. **Adaptive AI**: Recommendations adjust based on emotional state
4. **Evidence-Based**: Grounded in autism therapy best practices

## 🛡️ Privacy & Security Details

### What Stays Local
- ✅ **All facial images**: Never uploaded anywhere
- ✅ **Emotion processing**: Happens in your browser
- ✅ **AI models**: Downloaded once, stored locally
- ✅ **Camera access**: Direct browser-to-device only

### What Goes to Server
- ✅ **Assessment responses**: For AI therapy recommendations
- ✅ **Emotion results**: Only the final emotion data (not images)
- ✅ **Therapy recommendations**: Generated responses stored in Firebase

### Security Features
- 🔒 **No image uploads**: Face detection is 100% local
- 🔒 **HTTPS endpoints**: All server communication encrypted
- 🔒 **Model caching**: AI models downloaded once and cached
- 🔒 **Clear indicators**: UI shows when processing is local vs server

## 🔍 Technical Details

### Frontend Stack
- **React 18** with Hooks
- **face-api.js** for local emotion detection
- **CSS3** with animations and responsive design
- **Axios** for API communication
- **Camera API** for real-time video capture

### Backend Technologies
- **Node.js + Express** for main API
- **Google Gemini AI** for therapy recommendations
- **Firebase** for secure data storage

### Machine Learning
- **Face-API.js Models**: TensorFlow.js-based, runs in browser
- **Local Inference**: No server dependency for emotion detection
- **Pre-trained Models**: Optimized for web deployment

## 🚨 Troubleshooting

### Common Issues

#### Camera Access Denied
```bash
# Enable camera permissions in browser settings
# For Chrome: Settings → Privacy and security → Site Settings → Camera
```

#### Models Not Loading
```bash
# Re-download emotion detection models
./download-models.sh

# Check if models exist
ls frontend/public/models/
```

#### Frontend Issues
```bash
# Clear npm cache and reinstall
cd frontend
npm cache clean --force
rm -rf node_modules
npm install
```

### Error Messages

| Error | Solution |
|-------|----------|
| "Camera access denied" | Enable camera permissions in browser |
| "Models failed to load" | Run `./download-models.sh` |
| "Backend connection failed" | Check Node.js backend on port 4000 |
| "Face detection failed" | Ensure good lighting and face visibility |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Face-API.js**: Browser-based facial emotion recognition
- **Google Gemini**: AI-powered analysis engine
- **TensorFlow.js**: Client-side machine learning
- **React Community**: Frontend framework and ecosystem
- **Autism Research Community**: Guidance on assessment methodologies

## 📞 Support

For technical support or questions:
- 💬 Issues: GitHub Issues tab
- 📚 Documentation: See project files

---

**⚠️ Important Notice**: This tool is designed to assist in autism screening and therapy planning. It should not replace professional medical diagnosis or treatment. Always consult with qualified healthcare professionals for proper assessment and care.

**🔒 Privacy Guarantee**: Your images are processed locally in your browser and never transmitted to any server. We prioritize your privacy and security above all else.

3. Install frontend deps and run:

```bash
cd frontend
npm install
npm run dev
```
