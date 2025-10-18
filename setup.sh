#!/bin/bash

# Autism Assessment App - Complete Setup and Run Script (Secure Edition)

echo "🚀 Setting up Autism Assessment App with Secure Local Emotion Detection..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."

if ! command_exists node; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is required but not installed."
    exit 1
fi

echo "✅ All dependencies found!"

# Setup Node.js backend
echo "� Setting up Node.js backend..."
cd backend_node

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js packages..."
    npm install
fi

echo "✅ Node.js backend setup complete!"

# Setup frontend
echo "⚛️ Setting up React frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing React packages..."
    npm install
fi

echo "✅ Frontend setup complete!"

# Download emotion detection models
echo "🧠 Setting up secure emotion detection..."
cd ..
if [ ! -f "frontend/public/models/tiny_face_detector_model-shard1" ]; then
    echo "Downloading face-api.js models for local processing..."
    ./download-models.sh
else
    echo "Models already downloaded!"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "� SECURITY FEATURES:"
echo "✅ 100% Local emotion detection (no server calls)"
echo "✅ Images never leave your browser"
echo "✅ Complete privacy protection"
echo ""
echo "📖 To run the application:"
echo "1. Start Node.js backend (Terminal 1): cd backend_node && npm run dev"
echo "2. Start React frontend (Terminal 2): cd frontend && npm run dev"
echo ""
echo "🌐 The app will be available at: http://localhost:5173"
echo "🔗 Node.js API at: http://localhost:4001"
echo "� Emotion detection: 100% local processing"