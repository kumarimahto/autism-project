require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] }))
app.use(express.json())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY // support either env name
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'text-bison-001'

function buildPrompt(body) {
  const age = body?.age ?? ''
  const eye = body?.eye_contact ?? ''
  const speech = body?.speech_level ?? ''
  const social = body?.social_response ?? ''
  const sensory = body?.sensory_reactions ?? ''
  // Force the model to reply with strict JSON and no extra commentary or markdown.
  return `You are a concise child development expert. Only output valid JSON (no explanatory text, no markdown fences) in this exact schema:\n{\n  "focus_areas": [string],\n  "therapy_goals": [string],\n  "activities": [string],\n  "notes": string\n}\nUse short, practical items focused on the specific child details below. Do not include additional keys.\nChild details:\n- age: ${age}\n- eye_contact: ${eye}\n- speech_level: ${speech}\n- social_response: ${social}\n- sensory_reactions: ${sensory}\nExamples: focus_areas: ["Eye contact","Social play"], therapy_goals: ["Make brief eye contact 3x/day"], activities: ["Peek-a-boo"], notes: "Short phrase advising next steps"\nRespond now with only the JSON object.`
}

function heuristicResponse(body) {
  const eye = (body?.eye_contact || '').toLowerCase()
  const speech = (body?.speech_level || '').toLowerCase()
  const social = (body?.social_response || '').toLowerCase()
  const sensory = (body?.sensory_reactions || '').toLowerCase()

  const focus = []
  const goals = []
  const activities = []
  let notes = ''

  if (/poor|limited|no/.test(eye)) {
    focus.push('Eye contact & social attention')
    goals.push('Practice brief eye contact during preferred play')
    activities.push('Turn-taking name games (peek-a-boo)')
  }
  if (/limited|no|delayed/.test(speech)) {
    focus.push('Speech & communication')
    goals.push('Increase functional communication using words/gestures')
    activities.push('Labeling objects and singing simple songs')
  }
  if (/limited|withdrawn|delayed/.test(social)) {
    focus.push('Social interaction')
    goals.push('Encourage reciprocal social play')
    activities.push('Structured turn-taking play')
  }
  if (/sensitive|seeking|aversion/.test(sensory)) {
    focus.push('Sensory processing')
    goals.push('Build tolerance through graded sensory play')
    activities.push('Safe textured play (rice, soft toys)')
  }

  // Add more specific recommendations based on age and symptom pattern
  const ageNum = Number(body?.age) || 0
  if (ageNum <= 2) {
    notes = 'Early intervention recommended: focus on play-based routines, parent coaching, and monitoring.'
    if (!goals.includes('Support joint attention during play')) goals.push('Support joint attention during play')
    activities.push('Peek-a-boo, simple turn-taking with noisy toys')
  } else if (ageNum <= 5) {
    notes = 'Consider structured play sessions and language stimulation; consult a speech therapist if concerns persist.'
    if (!goals.includes('Improve imitation and turn-taking')) goals.push('Improve imitation and turn-taking')
    activities.push('Imitation games and simple shared play tasks')
  } else {
    notes = 'Work on social routines, functional communication, and school-based supports.'
    if (!goals.includes('Increase peer interaction in structured settings')) goals.push('Increase peer interaction in structured settings')
    activities.push('Guided playgroups and brief social scripts practice')
  }

  // Fill defaults if still short
  while (goals.length < 4) goals.push('Support daily routines to promote social engagement')
  while (activities.length < 4) activities.push('Short play-based interaction tasks')

  if (!focus.length) focus.push('General social communication')

  return { focus_areas: focus.slice(0, 5), therapy_goals: goals.slice(0, 4), activities: activities.slice(0, 4), notes }
}

function tryParseJsonFromText(text) {
  if (!text) return null
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const part = text.slice(first, last + 1)
    try { return JSON.parse(part) } catch (e) { /* ignore */ }
  }
  try { return JSON.parse(text) } catch (e) { return null }
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) return null
  // Use Google Generative Language API REST endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${GEMINI_MODEL}:generateText?key=${encodeURIComponent(GEMINI_API_KEY)}`
  const body = { prompt: { text: prompt }, temperature: 0.2, maxOutputTokens: 400 }
  const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } })
  const candidates = resp.data?.candidates || []
  let text = ''
  if (Array.isArray(candidates) && candidates.length) {
    // candidates items often have 'output' or 'content' with text fields
    const c0 = candidates[0]
    if (typeof c0 === 'string') text = c0
    else if (c0.output?.length) text = c0.output.map(o => o.content?.map(p => p.text).join('') || o.text).join('')
    else if (c0.content?.length) text = c0.content.map(p => p.text).join('')
    else text = JSON.stringify(c0)
  } else {
    text = resp.data?.text || JSON.stringify(resp.data)
  }
  // Log raw response for debugging (will not be sent to client unless fallback)
  console.log('Gemini raw response snippet:', (text || '').slice(0, 800))
  const parsed = tryParseJsonFromText(text)
  if (parsed) return parsed
  // If parsing failed, attempt a looser extraction by removing surrounding text and code fences
  const cleaned = text.replace(/```json|```/gi, '').trim()
  const parsed2 = tryParseJsonFromText(cleaned)
  if (parsed2) return parsed2
  return { raw: text }
}

app.post('/analyze', async (req, res) => {
  try {
    const prompt = buildPrompt(req.body)
    // Try Gemini first
    let aiResult = null
    try {
      aiResult = await callGemini(prompt)
    } catch (e) {
      console.error('Gemini call failed:', e.response?.data || e.message || e)
      aiResult = null
    }

    if (aiResult && aiResult.focus_areas && aiResult.therapy_goals && aiResult.activities) {
      // Attach original input so frontend can display/save it
      try { aiResult._input = req.body } catch (e) { /* ignore */ }
      return res.json(aiResult)
    }

    // fallback to heuristic (also include raw AI text for debugging if available)
  const fallback = heuristicResponse(req.body)
  if (aiResult && aiResult.raw) fallback._ai_raw = aiResult.raw
  // Also include a short server hint if AI returned something unexpected
  if (aiResult && !aiResult.raw) fallback._ai_unparsed = true
  // Attach original input
  fallback._input = req.body
  return res.json(fallback)
  } catch (err) {
    console.error('Unhandled server error:', err)
    const fallback = heuristicResponse(req.body)
    fallback._server_error = String(err?.message || err)
    return res.json(fallback)
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('Backend (node) listening on', PORT))
