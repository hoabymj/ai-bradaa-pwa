import { STATE } from './state.js';
import { buildPrompts } from './prompts.js';

export function buildAffiliateLink(originalUrl, platform) {
  if (!originalUrl) return '#';
  const { SHOPEE_AFFILIATE_ID } = STATE.affiliate;
  if (platform === 'shopee' && SHOPEE_AFFILIATE_ID) {
    return `${originalUrl}&af_id=${SHOPEE_AFFILIATE_ID}`;
  }
  return originalUrl;
}

export async function fetchMarketIntel() {
  try {
    const response = await fetch('/data/laptops.json');
    if (!response.ok) throw new Error('Local JSON not found.');
    STATE.data.allLaptops = await response.json();
  } catch (error) {
    console.warn(error.message, 'Using embedded fallback data.');
    STATE.data.allLaptops = STATE.data.fallbackLaptops;
  }
}

export async function callAIAgent(task, payload, outputElement, callbacks = {}) {
  const { onIntelSuccess, onIntelFallback } = callbacks;

  if (outputElement) {
    outputElement.innerHTML = '<span class="animate-pulse">AI Bradaa is thinking...</span>';
  }

  const { systemPrompt, userPrompt, generationConfig } = buildPrompts(task, payload);
  const apiKey = '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig,
    tools: task === 'deal-assassin' || task === 'getFutureIntel' ? [{ google_search: {} }] : []
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (task === 'getFutureIntel') {
      try {
        const intelData = JSON.parse(text);
        if (!intelData.intelligence) {
          throw new Error('Formatted JSON not found in AI response for Intel.');
        }
        onIntelSuccess?.(intelData.intelligence);
      } catch (error) {
        console.error('Failed to parse Intel JSON:', error, 'Raw text:', text);
        onIntelFallback?.(text);
      }
      return;
    }

    if (outputElement) {
      outputElement.innerHTML = text || 'Sorry, AI Bradaa could not provide a clear answer. Please try again.';
    }
  } catch (error) {
    console.error('AI Agent Call Failed:', error);
    if (outputElement) {
      outputElement.textContent = 'ERROR: Could not connect to the AI. Please check your connection and try again.';
    }
  }
}
