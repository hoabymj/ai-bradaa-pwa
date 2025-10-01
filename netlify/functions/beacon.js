const ALLOWED_ORIGINS = [
  process.env.URL,
  process.env.DEPLOY_URL,
  'http://localhost:8888'
].filter(Boolean);

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (!event.headers.origin || !ALLOWED_ORIGINS.includes(event.headers.origin)) {
    return { statusCode: 403, headers: corsHeaders };
  }
  corsHeaders['Access-Control-Allow-Origin'] = event.headers.origin;

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders };
  }

  try {
    const events = JSON.parse(event.body);
    if (!Array.isArray(events) || events.length > 100) {
      return { statusCode: 204, headers: corsHeaders };
    }

    console.log({
      type: 'analytics_batch',
      count: events.length,
      ts: new Date().toISOString()
    });

    return { statusCode: 204, headers: corsHeaders };
  } catch {
    return { statusCode: 204, headers: corsHeaders };
  }
};