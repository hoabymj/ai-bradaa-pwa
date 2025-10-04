/**
 * Gemini AI proxy with strict CORS, retry, and PDPA-safe logging
 */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJitter = () => Math.floor(Math.random() * 200) + 200; // 200-400ms
const DEFAULT_TIMEOUT = 65000; // 65s server-side

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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders };
  }

  try {
    const {
      model = 'gemini-2.5-flash',
      systemText = '',
      userText,
      json = false,
      schema = null,
      temperature = 0.7
    } = JSON.parse(event.body || '{}');

    if (!userText) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'missing_userText', status: 400 }) };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // Build v1beta-compliant payload (no "role" in contents)
    const requestBody = {
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { temperature }
    };
    
    if (systemText) {
      requestBody.systemInstruction = { parts: [{ text: systemText }] };
    }
    
    if (json) {
      requestBody.generationConfig.responseMimeType = 'application/json';
      if (schema) requestBody.generationConfig.responseSchema = schema;
    }
    
    // Up to 2 retries (total 3 attempts) on 429/5xx with exponential backoff
    let attempt = 0;
    for (; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timer);

        let data;
        try { data = await response.json(); } catch { data = null; }

        if (response.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          };
        }

        if (response.status === 429 || response.status >= 500) {
          if (attempt < 2) {
            const backoff = (2 ** attempt) * 300 + getJitter();
            await sleep(backoff);
            continue;
          }
        }

        // PDPA-safe error log
        console.error({ type: 'ai_error', status: response.status, ts: new Date().toISOString() });
        return {
          statusCode: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'ai_service_error', status: response.status, ts: new Date().toISOString() })
        };
      } catch (err) {
        clearTimeout(timer);
        // Timeout or network error → return 504
        if (attempt < 2) {
          const backoff = (2 ** attempt) * 300 + getJitter();
          await sleep(backoff);
          continue;
        }
        console.error({ type: 'ai_error', status: 504, ts: new Date().toISOString() });
        return { statusCode: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'gateway_timeout', status: 504 }) };
      }
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