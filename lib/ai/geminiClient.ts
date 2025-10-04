/*
  Gemini Client (TypeScript) — central adapter for AI calls
  Why: Single execution path, retries/backoff, multi-endpoint failover, header auth.
  Usage example:
    const { ok, text, status } = await generate({ systemPrompt, userPrompt, generationConfig });
    if (!ok) console.error('AI Error', status);
*/

export type GenerationConfig = {
  responseMimeType?: string;
  [k: string]: any;
};

export type GenerateArgs = {
  systemPrompt: string;
  userPrompt: string;
  generationConfig?: GenerationConfig;
  apiKey?: string;
};

export type GenerateResult =
  | { ok: true; status: number; text: string; raw: any }
  | { ok: false; status: number; statusText?: string; bodyText: string };

const ENDPOINTS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
];

const DELAYS_MS = [200, 400, 800];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function buildBody(systemPrompt: string, userPrompt: string, generationConfig?: GenerationConfig) {
  return {
    contents: [{ role: 'user', parts: [{ text: userPrompt }]}],
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: 'text/markdown', ...(generationConfig||{}) }
  };
}

async function tryEndpoint(url: string, apiKey: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
    mode: 'cors',
    credentials: 'omit'
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, statusText: res.statusText, bodyText: text };
}

export async function generate({ systemPrompt, userPrompt, generationConfig, apiKey }: GenerateArgs): Promise<GenerateResult> {
  if (!apiKey && typeof window !== 'undefined') {
    try { apiKey = (window as any).GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || ''; } catch { apiKey = ''; }
  }
  if (!apiKey) return { ok: false, status: 0, bodyText: 'NO_API_KEY' };

  const body = buildBody(systemPrompt, userPrompt, generationConfig);
  let last: any = { ok: false, status: 0, statusText: 'INIT', bodyText: '' };

  for (let attempt = 0; attempt < 4; attempt++) {
    const endpoint = ENDPOINTS[Math.min(attempt, ENDPOINTS.length - 1)];
    try {
      const res = await tryEndpoint(endpoint, apiKey!, body);
      last = res;
      if (res.ok) {
        let data: any; try { data = JSON.parse(res.bodyText); } catch {}
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { ok: true, status: res.status, text, raw: data };
      }
      if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
        await sleep(DELAYS_MS[Math.min(attempt, DELAYS_MS.length - 1)]);
        continue;
      }
    } catch (err: any) {
      last = { ok: false, status: -1, statusText: 'NETWORK', bodyText: String(err?.message || err) };
      if (attempt < 3) await sleep(DELAYS_MS[Math.min(attempt, DELAYS_MS.length - 1)]);
      continue;
    }
  }

  return last;
}

// Browser global for the single-file app (no bundler)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof window !== 'undefined') (window as any).GeminiClient = { generate };
