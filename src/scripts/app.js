import { STATE } from './state.js';
import { createUIController } from './ui.js';
import { computeFilteredLaptops } from './filters.js';
import { fetchMarketIntel, callAIAgent, buildAffiliateLink } from './api.js';
import { registerEventHandlers } from './events.js';

const ui = createUIController({ callAIAgent, buildAffiliateLink });

function assertDataIntegrity(laptops) {
  const requiredProperties = ['brand', 'model', 'price', 'imageUrl', 'cpu', 'gpu', 'ram', 'storage', 'display', 'score', 'platform', 'why', 'scores'];
  const requiredScores = ['ai', 'thermals', 'upgrade', 'linux', 'portability', 'value'];

  laptops.forEach((laptop, index) => {
    requiredProperties.forEach(prop => {
      if (!Object.prototype.hasOwnProperty.call(laptop, prop)) {
        throw new Error(`Laptop at index ${index} missing required property: ${prop}`);
      }
    });

    requiredScores.forEach(score => {
      if (!Object.prototype.hasOwnProperty.call(laptop.scores, score)) {
        throw new Error(`Laptop at index ${index} missing required score: ${score}`);
      }
      if (typeof laptop.scores[score] !== 'number' || laptop.scores[score] < 0 || laptop.scores[score] > 10) {
        throw new Error(`Laptop at index ${index} has invalid ${score} score: ${laptop.scores[score]}`);
      }
    });

    if (typeof laptop.price !== 'number' || laptop.price <= 0) {
      throw new Error(`Laptop at index ${index} has invalid price: ${laptop.price}`);
    }

    if (typeof laptop.score !== 'number' || laptop.score < 0 || laptop.score > 100) {
      throw new Error(`Laptop at index ${index} has invalid overall score: ${laptop.score}`);
    }
  });
}

async function initialize() {
  ui.configureCharts();
  await fetchMarketIntel();
  
  // Verify data integrity
  assertDataIntegrity(STATE.data.fallbackLaptops);

  STATE.data.allLaptops.forEach(laptop => {
    laptop.value_rating = (laptop.score * 100) / laptop.price;
  });

  STATE.data.sortedByRank = [...STATE.data.allLaptops]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  ui.populateBrandFilter();
  ui.populateLaptopSelector();

  const filtered = computeFilteredLaptops();
  ui.renderAll(filtered);
  ui.renderRadarChart();
  ui.renderToolkitConsole('deal-assassin');

  registerEventHandlers({
    ui,
    callAIAgent,
    computeFiltered: computeFilteredLaptops
  });

  callAIAgent('getFutureIntel', {}, null, {
    onIntelSuccess: ui.updateIntelUI,
    onIntelFallback: ui.updateIntelUIWithRawText
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initialize().catch(error => {
    console.error('Initialization failed:', error);
  });
});

/* v1 website: Service Worker disabled.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(error => console.error('Service worker registration failed:', error));
  });
}
*/
