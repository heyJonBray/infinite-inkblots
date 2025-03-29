const crypto = require('crypto');

/**
 * Extract features from an Ethereum address
 * @param {string} ethAddress - Ethereum address
 * @returns {Object} Features extracted from the address
 */
function extractEthFeatures(ethAddress) {
  if (!ethAddress || !ethAddress.startsWith('0x')) {
    return {
      diversity: 0.5,
      zeros: 0.5,
      ones: 0.5,
      letters: 0.5,
      highValues: 0.5,
      evenChars: 0.5,
      seed: Math.floor(Math.random() * 100000),
      address: ethAddress || '0x0000000000000000000000000000000000000000',
    };
  }

  // Strip the '0x' prefix
  const cleanAddress = ethAddress.slice(2).toLowerCase();

  // Count character types
  let zeros = 0;
  let ones = 0;
  let letters = 0;
  let highValues = 0;
  let evenChars = 0;

  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress[i];
    if (char === '0') zeros++;
    if (char === '1') ones++;
    if (/[a-f]/.test(char)) letters++;
    if (/[8-9a-f]/.test(char)) highValues++;
    if (parseInt(char, 16) % 2 === 0) evenChars++;
  }

  // Calculate diversity by counting unique characters
  const uniqueChars = new Set(cleanAddress).size;
  const diversity = uniqueChars / 16; // 16 possible hex characters

  // Create a deterministic seed from the address
  const hash = crypto.createHash('sha256').update(cleanAddress).digest('hex');
  const seed = parseInt(hash.slice(0, 8), 16);

  return {
    diversity: diversity,
    zeros: zeros / cleanAddress.length,
    ones: ones / cleanAddress.length,
    letters: letters / cleanAddress.length,
    highValues: highValues / cleanAddress.length,
    evenChars: evenChars / cleanAddress.length,
    seed: seed,
    address: ethAddress,
  };
}

/**
 * Apply Ethereum features to modify generation parameters
 * @param {Object} baseParams - Base parameters
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Object} Modified parameters
 */
function customizeParamsFromEthFeatures(baseParams, ethFeatures) {
  // Return baseParams unchanged - no customization based on ETH features
  return { ...baseParams };
}

module.exports = {
  extractEthFeatures,
  customizeParamsFromEthFeatures,
};
