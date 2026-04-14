const jwt = require('jsonwebtoken');

function getUser(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET || 'mednexis_super_secret_key_123');
  } catch {
    return null;
  }
}

const rules = [
  { trigger: ['fever', 'hot', 'temperature'], suggestion: 'Rest, hydrate, and take paracetamol if temperature > 38.5°C' },
  { trigger: ['cough', 'sore throat'], suggestion: 'Drink warm fluids, use lozenges, and monitor for shortness of breath' },
  { trigger: ['headache', 'migraine'], suggestion: 'Rest in a dark, quiet room and maintain hydration' },
  { trigger: ['stomach', 'nausea', 'vomit'], suggestion: 'Eat easily digestible foods like bananas, rice, or toast. Sip water slowly.' },
  { trigger: ['fatigue', 'tired'], suggestion: 'Ensure 8 hours of sleep, check iron levels, and reduce stress. Incorporate mild exercise.' }
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = getUser(event);
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Not authorized, no token' }) };
  }

  if (event.httpMethod === 'POST') {
    const { symptoms } = JSON.parse(event.body);
    if (!symptoms) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Symptoms are required' }) };
    }

    const text = symptoms.toLowerCase();
    const suggestions = [];

    rules.forEach(rule => {
      if (rule.trigger.some(keyword => text.includes(keyword))) {
        suggestions.push(rule.suggestion);
      }
    });

    if (suggestions.length === 0) {
      suggestions.push('Based on these inputs, we recommend consulting a physician for an accurate diagnosis.');
    }

    return { statusCode: 200, headers, body: JSON.stringify({ suggestions }) };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) };
};
