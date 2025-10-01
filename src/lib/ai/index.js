/**
 * AI provider interface for future model swaps
 * @example
 * type AiProvider = (opts: {
 *   system: string;
 *   user: string;
 *   temperature?: number;
 * }) => Promise<string>;
 */

export async function aiChat({ system, user, temperature = 0.2 }) {
  const response = await fetch('/.netlify/functions/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, temperature })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }

  return data.text;
}