#!/bin/bash

# Download face-api.js models for local emotion detection

echo "📦 Downloading face-api.js models for secure emotion detection..."

MODELS_DIR="/home/navgurukul/Documents/Autism/frontend/public/models"

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# Base URL for face-api.js models
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Download required model files
echo "🔽 Downloading TinyFaceDetector models..."
curl -L "$BASE_URL/tiny_face_detector_model-weights_manifest.json" -o "$MODELS_DIR/tiny_face_detector_model-weights_manifest.json"
curl -L "$BASE_URL/tiny_face_detector_model-shard1" -o "$MODELS_DIR/tiny_face_detector_model-shard1"

echo "🔽 Downloading Face Landmark models..."
curl -L "$BASE_URL/face_landmark_68_model-weights_manifest.json" -o "$MODELS_DIR/face_landmark_68_model-weights_manifest.json"
curl -L "$BASE_URL/face_landmark_68_model-shard1" -o "$MODELS_DIR/face_landmark_68_model-shard1"

echo "🔽 Downloading Face Expression models..."
curl -L "$BASE_URL/face_expression_model-weights_manifest.json" -o "$MODELS_DIR/face_expression_model-weights_manifest.json"
curl -L "$BASE_URL/face_expression_model-shard1" -o "$MODELS_DIR/face_expression_model-shard1"

echo "✅ All models downloaded successfully!"
echo "🔒 Models are stored locally for complete privacy"
echo ""
echo "📍 Models location: $MODELS_DIR"
echo "🎯 Ready for secure, local emotion detection!"