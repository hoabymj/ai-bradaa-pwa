/**
 * Gemini AI proxy with strict CORS, retry, and PDPA-safe logging
 */
const ALLOWED_ORIGINS = [
  process.env.URL,
  process.env.DEPLOY_URL,
  'http://localhost:8888'
].filter(Boolean);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJitter = () => Math.floor(Math.random() * 200) + 200; // 200-400ms

exports.handler = async (event) => {
  // Environment check
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY');
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'config_error',
        status: 500,
        ts: new Date().toISOString()
      })
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Strict CORS check
  if (!event.headers.origin || !ALLOWED_ORIGINS.includes(event.headers.origin)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'origin_forbidden',
        status: 403,
        ts: new Date().toISOString()
      })
    };
  }
  corsHeaders['Access-Control-Allow-Origin'] = event.headers.origin;

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders };
  }

  try {
    const { system, user, temperature = 0.2 } = JSON.parse(event.body);
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature }
        })
      });

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          statusCode: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'no_content',
            status: 502,
            ts: new Date().toISOString()
          })
        };
      }

      if (response.ok) {
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.candidates[0].content.parts[0].text })
        };
      }

      if (attempt < 1 && (response.status === 429 || response.status >= 500)) {
        await sleep(getJitter());
        continue;
      }

      // PDPA-safe error log
      console.error({
        type: 'ai_error',
        status: response.status,
        ts: new Date().toISOString()
      });

      return {
        statusCode: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'ai_service_error',
          status: response.status,
          ts: new Date().toISOString()
        })
      };
    }
  } catch (error) {
    // PDPA-safe error log
    console.error({
      type: 'ai_error',
      status: 500,
      ts: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'internal_error',
        status: 500,
        ts: new Date().toISOString()
      })
    };
  }
};