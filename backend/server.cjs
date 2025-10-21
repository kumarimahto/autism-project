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

app.use(express.json())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro'

function buildPrompt(body) {
  let prompt = `AUTISM SPECTRUM DISORDER ASSESSMENT - CLINICAL EVALUATION

PATIENT INFORMATION:
- Age: ${body.age} years
- Eye Contact Pattern: ${body.eye_contact}
- Communication Level: ${body.speech_level}
- Social Interaction: ${body.social_response}
- Sensory Processing: ${body.sensory_reactions}`;
  
  // Include emotion data if available
  if (body.emotion_data) {
    const emotion = body.emotion_data;
    prompt += `

BEHAVIORAL EMOTION ANALYSIS:
- Primary Emotional State: ${emotion.dominant_emotion.toUpperCase()} (${emotion.confidence}% confidence)
- Emotional Profile: ${Object.entries(emotion.all_emotions).map(([e, v]) => `${e.charAt(0).toUpperCase() + e.slice(1)}: ${v}%`).join(', ')}`;
  }
  
  prompt += `

CLINICAL REQUEST:
As a pediatric developmental specialist, provide evidence-based intervention recommendations for this ${body.age}-year-old child presenting with autism spectrum characteristics. ${body.emotion_data ? 'Consider the emotional behavioral patterns observed.' : ''}

REQUIRED OUTPUT FORMAT (JSON):
{
  "focus_areas": ["3-4 primary intervention areas based on clinical assessment"],
  "therapy_goals": ["3 SMART therapeutic objectives with measurable outcomes"],
  "activities": ["2 evidence-based intervention strategies suitable for age ${body.age}"],
  "clinical_notes": "Brief assessment summary and priority recommendations"
}

Focus on:
1. Evidence-based therapeutic interventions
2. Age-appropriate developmental milestones
3. Family-centered care approaches
4. Measurable therapeutic outcomes
5. Early intervention best practices`;
  
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
  
  // Extract age for age-appropriate recommendations
  const ageMatch = prompt.match(/age[:\s]+(\d+)/i);
  const age = ageMatch ? parseInt(ageMatch[1]) : 3;

  // Extract emotion data for personalized recommendations
  const emotionMatch = prompt.match(/Primary Emotional State: (\w+)/i);
  const primaryEmotion = emotionMatch ? emotionMatch[1].toLowerCase() : null;

  // Clinical assessment based on behavioral patterns with unique goal generation
  const goalCategories = {
    eye_contact: {
      condition: low.includes('eye contact') && (low.includes('poor') || low.includes('no') || low.includes('limited')),
      focus: 'Social Communication & Eye Contact Development',
      goal: `Establish consistent eye contact for ${age < 3 ? '2-3' : '3-5'} seconds during preferred activities by ${age < 3 ? '6 months' : '3 months'}`
    },
    communication: {
      condition: low.includes('speech') && (low.includes('no') || low.includes('limited') || low.includes('delayed')),
      focus: 'Expressive Communication & Language Development', 
      goal: `Increase functional communication using ${age < 3 ? 'gestures and simple words' : age < 6 ? 'multi-word phrases' : 'complex sentences'} to express needs within 4-6 weeks`
    },
    sensory: {
      condition: low.includes('sensory') && (low.includes('sensitive') || low.includes('over') || low.includes('under')),
      focus: 'Sensory Processing & Regulation',
      goal: `Demonstrate improved sensory tolerance and self-regulation strategies during ${age < 3 ? 'play routines' : 'daily activities'} within 8 weeks`
    },
    social: {
      condition: low.includes('social') && (low.includes('poor') || low.includes('limited') || low.includes('passive')),
      focus: 'Social Interaction & Peer Engagement',
      goal: `Initiate and maintain appropriate social interactions with ${age < 3 ? 'caregivers' : 'peers'} for ${age < 3 ? '3-5' : '5-10'} minutes during structured activities`
    },
    emotional: {
      condition: low.includes('sad') || low.includes('fear') || low.includes('anxious') || (primaryEmotion && ['sad', 'fear', 'angry'].includes(primaryEmotion)),
      focus: 'Emotional Regulation & Anxiety Management',
      goal: `Implement ${age < 3 ? 'basic' : 'advanced'} calming strategies and reduce anxiety-related behaviors through structured comfort routines within 6 weeks`
    },
    behavioral: {
      condition: low.includes('angry') || low.includes('irritable') || low.includes('tantrum') || (primaryEmotion === 'angry'),
      focus: 'Behavioral Management & Emotional Expression',
      goal: `Develop appropriate emotional expression and reduce challenging behaviors using positive behavior supports within ${age < 6 ? '8' : '6'} weeks`
    }
  };

  // Process each category and add unique goals
  Object.values(goalCategories).forEach(category => {
    if (category.condition) {
      if (!focus.includes(category.focus)) {
        focus.push(category.focus);
      }
      if (!goals.find(goal => goal.includes(category.goal.split(' ')[2]))) {
        goals.push(category.goal);
      }
    }
  });

  // Age and emotion-specific additional goals
  const additionalGoalPool = [
    {
      category: 'self_help',
      goal: `Develop age-appropriate self-help skills including ${age < 3 ? 'basic feeding and dressing assistance' : age < 6 ? 'independent dressing and feeding' : 'complex daily living tasks'} within 12 weeks`,
      priority: age < 6 ? 'high' : 'medium'
    },
    {
      category: 'attention',
      goal: `Improve attention span to ${age < 3 ? '5-8' : age < 6 ? '10-15' : '15-20'} minutes for structured learning activities using visual supports and reinforcement`,
      priority: 'high'
    },
    {
      category: 'joint_attention',
      goal: `Enhance joint attention skills through ${age < 3 ? 'simple pointing games' : age < 6 ? 'shared book reading' : 'collaborative problem-solving'} and interactive play sessions`,
      priority: age < 6 ? 'high' : 'medium'
    },
    {
      category: 'emotional_vocab',
      goal: `Build emotional vocabulary and expression through ${age < 3 ? 'basic emotion cards' : age < 6 ? 'picture cards and social stories' : 'complex emotional scenarios'} within 10 weeks`,
      priority: primaryEmotion && ['sad', 'angry', 'fear'].includes(primaryEmotion) ? 'high' : 'medium'
    },
    {
      category: 'motor_skills',
      goal: `Strengthen ${age < 3 ? 'gross motor skills through play' : age < 6 ? 'fine motor skills for writing preparation' : 'advanced motor coordination'} to support daily living tasks`,
      priority: 'medium'
    },
    {
      category: 'coping',
      goal: `Develop coping strategies for ${age < 3 ? 'overstimulation' : 'sensory overload'} and emotional regulation during daily transitions within 8 weeks`,
      priority: primaryEmotion && ['fear', 'angry'].includes(primaryEmotion) ? 'high' : 'low'
    }
  ];

  // Add additional goals based on priority and uniqueness
  const sortedGoals = additionalGoalPool
    .filter(item => !goals.find(existing => existing.includes(item.category)))
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  sortedGoals.forEach(item => {
    if (goals.length < 6) {
      goals.push(item.goal);
    }
  });

  // Ensure minimum 6 goals with final unique goal if needed
  if (goals.length < 6) {
    goals.push(`Demonstrate measurable progress in adaptive behavioral skills appropriate for ${age}-year developmental stage within 12 weeks`);
  }

  // Evidence-based therapeutic activities tailored to age and emotional state
  const activityCategories = {
    social_comm: {
      condition: focus.some(f => f.includes('Social Communication') || f.includes('Eye Contact')),
      activities: age < 3 ? [
        'Turn-taking games with preferred toys during 10-15 minute sessions',
        'Peek-a-boo and simple social games to encourage eye contact',
        'Simple cause-and-effect toys with guided interaction'
      ] : age < 6 ? [
        'Structured peer play sessions with visual supports and prompting',
        'Social stories about eye contact and appropriate greetings',
        'Role-playing activities for common social situations'
      ] : [
        'Collaborative group projects with peer interaction goals',
        'Video modeling for complex social situations',
        'Structured conversation practice with topic maintenance'
      ]
    },
    language: {
      condition: focus.some(f => f.includes('Communication') || f.includes('Language')),
      activities: age < 3 ? [
        'Picture exchange systems (PECS) for basic needs communication',
        'Simple sign language for daily routines',
        'Narrative play with favored characters and toys'
      ] : age < 6 ? [
        'Augmentative and Alternative Communication (AAC) device training',
        'Speech therapy with articulation and phonological games',
        'Storytelling activities with visual sequence cards'
      ] : [
        'Advanced language therapy focusing on pragmatic skills',
        'Written expression activities with structured templates',
        'Public speaking practice in safe, supportive environments'
      ]
    },
    sensory: {
      condition: focus.some(f => f.includes('Sensory')),
      activities: [
        'Sensory diet activities including brushing, swinging, and proprioceptive input',
        'Gradual exposure therapy for sensory sensitivities',
        'Self-regulation techniques including deep breathing and mindfulness exercises',
        'Environmental modifications with noise-reducing headphones and fidget tools'
      ]
    },
    emotional: {
      condition: focus.some(f => f.includes('Emotional')) || primaryEmotion,
      activities: age < 3 ? [
        'Emotion identification games using pictures and mirrors',
        'Comfort routines with preferred sensory activities',
        'Simple breathing exercises with bubbles or pinwheels'
      ] : age < 6 ? [
        'Feelings thermometer and emotional check-ins',
        'Cognitive behavioral therapy techniques adapted for children',
        'Art therapy and creative expression activities'
      ] : [
        'Mindfulness and meditation practices',
        'Journaling and reflective writing exercises',
        'Advanced coping strategy development and practice'
      ]
    },
    behavioral: {
      condition: focus.some(f => f.includes('Behavioral')) || primaryEmotion === 'angry',
      activities: [
        'Positive behavior support plans with visual schedules',
        'Replacement behavior teaching with functional communication',
        'Token economy systems for motivation and behavior tracking',
        'Crisis prevention and de-escalation strategy practice'
      ]
    }
  };

  // Generate activities based on focus areas and emotional state
  Object.values(activityCategories).forEach(category => {
    if (category.condition) {
      category.activities.forEach(activity => {
        if (!activities.find(existing => existing.toLowerCase().includes(activity.split(' ')[0].toLowerCase()))) {
          activities.push(activity);
        }
      });
    }
  });

  // Add universal foundational activities if list is short
  if (activities.length < 8) {
    const universalActivities = [
      `${age < 3 ? 'Structured play routines' : age < 6 ? 'Educational games' : 'Academic support activities'} targeting specific developmental goals`,
      'Family training and support sessions for home-based intervention strategies',
      'Regular progress monitoring with data collection and analysis',
      'Collaboration with educational team for consistent approaches'
    ];
    
    universalActivities.forEach(activity => {
      if (activities.length < 10 && !activities.find(existing => existing.includes(activity.split(' ')[0]))) {
        activities.push(activity);
      }
    });
  // Age and input-specific therapy recommendations
  const therapyRecommendations = [];
  
  // Core age-appropriate interventions
  if (age <= 3) {
    therapyRecommendations.push(
      'Early Intensive Behavioral Intervention (EIBI): 15-25 hours per week of structured ABA therapy with certified BCBA supervision',
      'Speech-Language Pathology: Weekly sessions focusing on functional communication and augmentative communication as needed',
      'Developmental-Individual Differences-Relationship-based (DIR/Floortime): Parent-implemented intervention for emotional and social development',
      'Occupational Therapy: Sensory integration therapy and fine motor skill development for daily living independence'
    );
  } else if (age <= 6) {
    therapyRecommendations.push(
      'School-based Special Education Services: Individualized Education Program (IEP) with autism-specific accommodations',
      'Social Skills Group Therapy: Structured weekly sessions with typically developing peers for social communication practice',
      'Behavioral Intervention Support: Positive Behavior Support Plan with functional behavior assessment',
      'Family Training and Support: Parent education programs on autism spectrum management and home-based strategies'
    );
  } else {
    therapyRecommendations.push(
      'Cognitive Behavioral Therapy (CBT): Modified for autism spectrum to address anxiety, depression, and executive functioning',
      'Vocational Rehabilitation Services: Job coaching, workplace accommodations, and career exploration',
      'Independent Living Skills Training: Community-based instruction for transportation, self-care, and social navigation',
      'Transition Planning Services: Coordination between educational, vocational, and adult services'
    );
  }

  // Emotion-informed specialized recommendations
  if (primaryEmotion === 'fear' || primaryEmotion === 'sad' || low.includes('anxious')) {
    therapyRecommendations.push('Anxiety Management Therapy: Specialized treatment for autism-related anxiety using evidence-based CBT approaches');
  }
  
  if (primaryEmotion === 'angry' || low.includes('irritable') || low.includes('tantrum')) {
    therapyRecommendations.push('Behavioral Crisis Management: Specialized intervention for emotional dysregulation and challenging behaviors');
  }

  if (primaryEmotion === 'happy' && (low.includes('social') || low.includes('communication'))) {
    therapyRecommendations.push('Strength-based Intervention: Capitalize on positive emotional state to enhance social and communication skills');
  }

  // Ensure comprehensive clinical notes based on inputs
  const clinicalNotes = `Clinical Assessment: ${age}-year-old child presents with autism spectrum characteristics requiring evidence-based intervention. ${
    primaryEmotion ? `Primary emotional presentation: ${primaryEmotion}. ` : ''
  }${
    focus.length > 0 ? `Primary focus areas identified: ${focus.join(', ')}. ` : ''
  }Recommend multidisciplinary team approach with regular progress monitoring every 4-6 weeks using standardized assessment tools. Family education and environmental modifications essential for optimal outcomes.`;

  return { 
    focus_areas: focus.length ? focus : ['Comprehensive Developmental Assessment', 'Family-Centered Early Intervention'], 
    therapy_goals: goals.slice(0, 6), // Ensure exactly 6 unique goals
    activities: activities.slice(0, 8), // Limit to 8 activities
    therapy_recommendations: therapyRecommendations.slice(0, 6), // Limit to 6 recommendations
    clinical_notes: clinicalNotes
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
