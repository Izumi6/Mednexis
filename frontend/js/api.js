const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Map old /api routes to Netlify Functions paths
function resolveURL(endpoint) {
  if (isLocal) {
    return 'http://localhost:5000/api' + endpoint;
  }
  // Map: /auth/login -> /.netlify/functions/auth/login
  // Map: /appointments -> /.netlify/functions/appointments
  // Map: /records -> /.netlify/functions/records
  // Map: /ai/suggest -> /.netlify/functions/ai
  const parts = endpoint.split('/').filter(Boolean); // e.g. ['auth','login']
  const functionName = parts[0]; // e.g. 'auth'
  const rest = parts.slice(1).join('/'); // e.g. 'login'
  return '/.netlify/functions/' + functionName + (rest ? '/' + rest : '');
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('mednexis_token');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const url = resolveURL(endpoint);
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

function showAlert(message, isError = true) {
  const alertEl = document.getElementById('alert');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.className = isError ? 'alert-error' : 'alert-success';
    alertEl.style.display = 'block';
    setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
  } else {
    alert(message);
  }
}

function checkAuthAndRedirect() {
  const token = localStorage.getItem('mednexis_token');
  const role = localStorage.getItem('mednexis_role');
  
  const isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('register.html') || window.location.pathname === '/' || window.location.pathname === '';
  
  if (!token && !isAuthPage) {
    window.location.href = 'index.html';
  } else if (token && isAuthPage) {
    if (role === 'Doctor') window.location.href = 'doctor-dashboard.html';
    else window.location.href = 'patient-dashboard.html';
  }
}

function logout() {
  localStorage.removeItem('mednexis_token');
  localStorage.removeItem('mednexis_role');
  localStorage.removeItem('mednexis_name');
  window.location.href = 'index.html';
}

