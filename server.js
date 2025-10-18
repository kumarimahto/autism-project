require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
// Enable CORS for all origins
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}))

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.sendStatus(200);
});
app.use(express.json())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro'

function buildPrompt(body) {
  let prompt = `Child age: ${body.age}\nEye contact: ${body.eye_contact}\nSpeech level: ${body.speech_level}\nSocial response: ${body.social_response}\nSensory reactions: ${body.sensory_reactions}\n`;
  
  // Include emotion data if available
  if (body.emotion_data) {
    const emotion = body.emotion_data;
    prompt += `\nEmotion Analysis: Primary emotion detected is ${emotion.dominant_emotion} with ${emotion.confidence}% confidence. All emotions detected: ${Object.entries(emotion.all_emotions).map(([e, v]) => `${e}: ${v}%`).join(', ')}.\n`;
  }
  
  prompt += `\nBased on this child's responses${body.emotion_data ? ' and emotional state' : ''}, give 3 short therapy goals and 2 activities that can help improvement. ${body.emotion_data ? 'Consider the detected emotions when providing recommendations.' : ''} Return JSON with keys: focus_areas (list of strings), therapy_goals (list of 3 strings), activities (list of 2 strings).`;
  
  return prompt;
}

async function callGeminiAI(prompt) {
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`
      const body = {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }
      const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } })
      const text = resp.data.candidates[0].content.parts[0].text
      try {
        return JSON.parse(text)
      } catch (err) {
        return { raw: text }
      }
    } catch (error) {
      console.log('Gemini API error, falling back to heuristic response:', error.message)
      return heuristicResponse(prompt)
    }
  } else {
    return heuristicResponse(prompt)
  }
}

function heuristicResponse(prompt) {
  const low = prompt.toLowerCase()
  const focus = []
  const goals = []
  const activities = []

  if (low.includes('eye contact') && (low.includes('poor') || low.includes('no'))) {
    focus.push('Eye contact & social attention')
    goals.push('Practice making and holding brief eye contact during play')
  }
  if (low.includes('speech') && (low.includes('no') || low.includes('limited') )) {
    focus.push('Speech & communication')
    goals.push('Increase use of simple words or gestures to request needs')
  }
  if (low.includes('sensory')) {
    focus.push('Sensory processing')
    goals.push('Introduce gentle sensory activities to build tolerance')
  }

  // Add emotion-based recommendations
  if (low.includes('sad') || low.includes('fear')) {
    focus.push('Emotional regulation & comfort')
    goals.push('Build emotional comfort through familiar routines and calming activities')
  }
  if (low.includes('angry') || low.includes('disgust')) {
    focus.push('Emotional expression & coping')
    goals.push('Develop appropriate ways to express frustration and discomfort')
  }
  if (low.includes('happy')) {
    focus.push('Positive reinforcement')
    goals.push('Use positive emotions to reinforce social engagement and learning')
  }

  while (goals.length < 3) goals.push('Encourage social routines during daily activities')

  if (low.includes('eye contact')) activities.push('Turn-taking peek-a-boo and name games to build gaze')
  else activities.push('Structured play with short prompts for interaction')

  if (low.includes('speech')) activities.push('Labeling objects and singing simple songs to encourage vocalization')
  else if (low.includes('sad') || low.includes('fear')) activities.push('Calming sensory activities with favorite textures and gentle music')
  else activities.push('Sensory play using safe textures (rice, soft toys)')

  return { 
    focus_areas: focus.length ? focus : ['General social communication'], 
    therapy_goals: goals, 
    activities,
    notes: 'Early intervention recommended: focus on play-based routines, parent coaching, and monitoring.'
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    port: process.env.PORT || 4001,
    message: 'Autism Screening Tool Backend API'
  })
})

app.post('/analyze', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['age', 'eye_contact', 'speech_level', 'social_response', 'sensory_reactions'];
    const missingFields = [];
    
    // Check if request body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'Request body is required and must be a valid JSON object',
        required_fields: requiredFields
      });
    }
    
    // Check for missing required fields
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`,
        missing_fields: missingFields,
        required_fields: requiredFields,
        example: {
          age: "2",
          eye_contact: "Moderate",
          speech_level: "Passive", 
          social_response: "Active",
          sensory_reactions: "Sensitive"
        }
      });
    }
    
    const prompt = buildPrompt(req.body)
    const result = await callGeminiAI(prompt)
    
    // Add the input data to the result so frontend can access it
    result._input = req.body
    
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || String(err) })
  }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})
