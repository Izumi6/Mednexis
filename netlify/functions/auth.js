const { connectToDatabase } = require('./db');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  try {
    await connectToDatabase();
    const path = event.path.replace('/.netlify/functions/auth', '');

    // POST /register
    if (event.httpMethod === 'POST' && path === '/register') {
      const { name, email, password, role } = JSON.parse(event.body);
      let user = await User.findOne({ email });
      if (user) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'User already exists' }) };
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = new User({ name, email, password: hashedPassword, role });
      await user.save();
      return { statusCode: 201, headers, body: JSON.stringify({ message: 'User registered successfully' }) };
    }

    // POST /login
    if (event.httpMethod === 'POST' && path === '/login') {
      const { email, password } = JSON.parse(event.body);
      const user = await User.findOne({ email });
      if (!user) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid credentials' }) };
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid credentials' }) };
      }
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'mednexis_super_secret_key_123',
        { expiresIn: '1d' }
      );
      return { statusCode: 200, headers, body: JSON.stringify({ token, role: user.role, name: user.name, id: user._id }) };
    }

    // GET /users
    if (event.httpMethod === 'GET' && path.startsWith('/users')) {
      const params = event.queryStringParameters || {};
      const filter = params.role ? { role: params.role } : {};
      const users = await User.find(filter).select('-password');
      return { statusCode: 200, headers, body: JSON.stringify(users) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) };
  } catch (error) {
    console.error('Auth error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server error' }) };
  }
};
