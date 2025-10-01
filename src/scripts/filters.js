import { STATE } from './state.js';

export function computeFilteredLaptops() {
  const { price, platform, brand, sort } = STATE.ui.app;
  if (!Array.isArray(STATE.data.sortedByRank) || STATE.data.sortedByRank.length === 0) {
    return [];
  }

  const filtered = STATE.data.sortedByRank.filter(entry =>
    entry.price <= price &&
    (platform === 'All' || entry.platform === platform) &&
    (brand === 'All' || entry.brand === brand)
  );

  const sorter = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    score_desc: (a, b) => b.score - a.score,
    value_desc: (a, b) => b.value_rating - a.value_rating
  };

  return filtered.sort(sorter[sort] || sorter.score_desc);
}
