/**
 * MY currency formatting utilities
 */

// Format to RM XX.XX
export const formatRM = (amount) => 
  `RM ${(Math.round(amount * 100) / 100).toFixed(2)}`;

// Parse RM XX.XX to number
export const parseRM = (rmString) => {
  const cleaned = rmString.replace(/[^0-9.]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
};

// Round to nearest 5 sen
export const roundRM = (amount) => 
  Math.round(amount * 20) / 20;