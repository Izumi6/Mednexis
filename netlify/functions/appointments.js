const { connectToDatabase } = require('./db');
const Appointment = require('../../models/Appointment');
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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
    const path = event.path.replace('/.netlify/functions/appointments', '');

    // GET / — list appointments
    if (event.httpMethod === 'GET' && (!path || path === '/')) {
      let filter = {};
      if (user.role === 'Patient') filter.patient = user.id;
      else if (user.role === 'Doctor') filter.doctor = user.id;

      const appointments = await Appointment.find(filter)
        .populate('patient', 'name email')
        .populate('doctor', 'name email')
        .sort({ date: 1 });
      return { statusCode: 200, headers, body: JSON.stringify(appointments) };
    }

    // POST / — create appointment
    if (event.httpMethod === 'POST' && (!path || path === '/')) {
      const { doctorId, date } = JSON.parse(event.body);
      if (user.role !== 'Patient') {
        return { statusCode: 403, headers, body: JSON.stringify({ message: 'Only patients can book appointments' }) };
      }
      const newAppointment = new Appointment({ patient: user.id, doctor: doctorId, date });
      await newAppointment.save();
      return { statusCode: 201, headers, body: JSON.stringify(newAppointment) };
    }

    // PATCH /:id/status — update appointment status
    const statusMatch = path.match(/^\/([a-f0-9]+)\/status$/);
    if (event.httpMethod === 'PATCH' && statusMatch) {
      const { status } = JSON.parse(event.body);
      const appointment = await Appointment.findById(statusMatch[1]);
      if (!appointment) {
        return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) };
      }
      appointment.status = status;
      await appointment.save();
      return { statusCode: 200, headers, body: JSON.stringify(appointment) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) };
  } catch (error) {
    console.error('Appointments error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server error' }) };
  }
};
