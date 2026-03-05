const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

function success(body, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body)
  };
}

function error(message, statusCode = 400) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message })
  };
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };
}

module.exports = { success, error };
