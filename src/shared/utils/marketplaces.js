/**
 * MY marketplace search URL builders
 */

const knownDomains = {
  'dell.com.my': 'https://dell.com.my/search?q=',
  'lenovo.com.my': 'https://www.lenovo.com/my/en/search?text=',
  'hp.com.my': 'https://www.hp.com/my-en/shop/search?q=',
  'acer.com.my': 'https://store.acer.com/en-my/catalogsearch/result/?q=',
  'asus.com.my': 'https://www.asus.com/my/searchresult?searchText='
};

export const shopeeSearch = (query) => 
  `https://shopee.com.my/search?keyword=${encodeURIComponent(query)}`;

export const lazadaSearch = (query) =>
  `https://www.lazada.com.my/catalog/?q=${encodeURIComponent(query)}`;

export const tmtSearch = (query) =>
  `https://www.techmadetown.com/search?q=${encodeURIComponent(query)}`;

export const harveyNormanSearch = (query) =>
  `https://www.harveynorman.com.my/catalogsearch/result/?q=${encodeURIComponent(query)}`;

export const tiktokShopSearch = (query) =>
  `https://www.tiktok.com/search?q=${encodeURIComponent(query)}&shopTab=true`;

export const officialSiteGuess = (brand, query) => {
  const domain = Object.keys(knownDomains).find(d => d.includes(brand.toLowerCase()));
  if (domain) {
    return knownDomains[domain] + encodeURIComponent(query);
  }
  // Fallback to Google search
  return `https://www.google.com/search?q=site:*.com.my+${encodeURIComponent(brand)}+${encodeURIComponent(query)}`;
};