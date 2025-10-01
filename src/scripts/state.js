import { FALLBACK_LAPTOPS } from '../data/fallbackLaptops.js';

export const STATE = {
  data: {
    allLaptops: [],
    sortedByRank: [],
    fallbackLaptops: FALLBACK_LAPTOPS
  },
  ui: {
    app: {
      price: 7000,
      platform: 'All',
      brand: 'All',
      sort: 'score_desc',
      radarSelection: []
    },
    charts: {
      rankings: null,
      radar: null,
      value: null
    },
    elements: {}
  },
  config: {
    chartFont: { family: "'Share Tech Mono', monospace", size: 12 },
    platformColors: {
      CUDA: 'text-[#00F0FF]',
      NPU: 'text-[#D83F87]',
      Mac: 'text-gray-400'
    },
    platformColorMap: {
      CUDA: 'rgba(0, 240, 255, 0.7)',
      NPU: 'rgba(216, 63, 135, 0.7)',
      Mac: 'rgba(168, 178, 204, 0.7)'
    }
  },
  affiliate: {
    SHOPEE_AFFILIATE_ID: self.SHOPEE_AFFILIATE_ID || null,
    LAZADA_AFFILIATE_ID: self.LAZADA_AFFILIATE_ID || null,
    TIKTOK_AFFILIATE_ID: self.TIKTOK_AFFILIATE_ID || null,
    INVOLVE_ASIA_ID: self.INVOLVE_ASIA_ID || null
  }
};
