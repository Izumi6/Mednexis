const { connectToDatabase } = require('./db');
const MedicalRecord = require('../../models/MedicalRecord');
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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = getUser(event);
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Not authorized, no token' }) };
  }

  try {
    await connectToDatabase();

    // GET / — list records
    if (event.httpMethod === 'GET') {
      let query = {};
      if (user.role === 'Patient') {
        query.patient = user.id;
      } else if (event.queryStringParameters && event.queryStringParameters.patientId) {
        query.patient = event.queryStringParameters.patientId;
      }
      const records = await MedicalRecord.find(query).populate('patient', 'name email');
      return { statusCode: 200, headers, body: JSON.stringify(records) };
    }

    // POST / — create record
    if (event.httpMethod === 'POST') {
      if (user.role !== 'Doctor') {
        return { statusCode: 403, headers, body: JSON.stringify({ message: 'Only doctors can add records' }) };
      }
      const { patientId, history, diagnosis, medicines } = JSON.parse(event.body);
      const record = new MedicalRecord({ patient: patientId, history, diagnosis, medicines });
      await record.save();
      return { statusCode: 201, headers, body: JSON.stringify(record) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) };
  } catch (error) {
    console.error('Records error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server error' }) };
  }
};
