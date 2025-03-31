const crypto = require('crypto');

const LESS_UNIQUE = {
  CONSECUTIVE_REPEAT_COUNT: 5, // no. consecutive repeating characters
};

/**
 * Check if a string is a palindrome
 * @param {string} str - String to check
 * @returns {boolean} Whether the string is a palindrome
 */
function isPalindrome(str) {
  // Convert to array, reverse, and join back to string
  return str === Array.from(str).reverse().join('');
}

/**
 * Check if the last n characters of a string form a palindrome
 * @param {string} str - String to check
 * @param {number} n - Number of characters to check from the end
 * @returns {boolean} Whether the last n characters form a palindrome
 */
function hasPalindromeEnding(str, n) {
  const lastN = str.slice(-n);
  return isPalindrome(lastN);
}

/**
 * Check if an address is less unique based on repeating characters
 * @param {string} address - Ethereum address to check
 * @returns {Object} Object containing whether address is less unique and if it has non-zero repeating characters
 */
function isLessUniqueAddress(address) {
  if (!address) return { isLessUnique: false, hasNonZeroRepeat: false };

  const cleanAddress = address.slice(2).toLowerCase();

  // Check for N+ consecutive repeating characters anywhere
  let consecutiveCount = 1;
  let currentChar = cleanAddress[0];
  let hasConsecutiveRepeat = false;
  let hasNonZeroRepeat = false;

  for (let i = 1; i < cleanAddress.length; i++) {
    if (cleanAddress[i] === currentChar) {
      consecutiveCount++;
      if (consecutiveCount >= LESS_UNIQUE.CONSECUTIVE_REPEAT_COUNT) {
        hasConsecutiveRepeat = true;
        hasNonZeroRepeat = currentChar !== '0';
        break;
      }
    } else {
      consecutiveCount = 1;
      currentChar = cleanAddress[i];
    }
  }

  return { isLessUnique: hasConsecutiveRepeat, hasNonZeroRepeat };
}

/**
 * Determine the type trait for an address
 * @param {string} address - Ethereum address
 * @param {Object} ethFeatures - Features extracted from the address
 * @returns {string} The type trait
 */
function determineTypeTrait(address, ethFeatures) {
  const is420Address = address.toLowerCase().includes('420');

  if (is420Address) {
    return '420';
  } else {
    const traits = [];
    if (ethFeatures.isLessUnique) traits.push('Repeating');
    if (ethFeatures.isPalindrome) traits.push('Palindrome');
    return traits.length > 0 ? traits.join(' ') : 'Standard';
  }
}

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
      isPalindrome: false,
      isLessUnique: false,
      hasNonZeroRepeat: false,
      type: 'None',
      seed: Math.floor(Math.random() * 100000),
      address: ethAddress || '0x0000000000000000000000000000000000000000',
    };
  }

  const cleanAddress = ethAddress.slice(2).toLowerCase();

  // count character types
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

  // calculate diversity
  const uniqueChars = new Set(cleanAddress).size;
  const diversity = uniqueChars / 16; // 16 possible hex chars

  // create deterministic seed from address
  const hash = crypto.createHash('sha256').update(cleanAddress).digest('hex');
  const seed = parseInt(hash.slice(0, 8), 16);

  // check for palindromes of length 4 to address length
  let hasPalindrome = false;
  for (let len = 4; len <= cleanAddress.length; len++) {
    if (hasPalindromeEnding(cleanAddress, len)) {
      hasPalindrome = true;
      break;
    }
  }

  // check for repeating characters
  const { isLessUnique, hasNonZeroRepeat } = isLessUniqueAddress(ethAddress);

  const features = {
    diversity: diversity,
    zeros: zeros / cleanAddress.length,
    ones: ones / cleanAddress.length,
    letters: letters / cleanAddress.length,
    highValues: highValues / cleanAddress.length,
    evenChars: evenChars / cleanAddress.length,
    isPalindrome: hasPalindrome,
    isLessUnique,
    hasNonZeroRepeat,
    seed: seed,
    address: ethAddress,
  };

  features.type = determineTypeTrait(ethAddress, features);

  return features;
}

/**
 * Apply Ethereum features to modify generation parameters
 * @param {Object} baseParams - Base parameters
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Object} Modified parameters
 */
function customizeParamsFromEthFeatures(baseParams, ethFeatures) {
  // return baseParams unchanged - no customization based on ETH features
  return { ...baseParams };
}

module.exports = {
  extractEthFeatures,
  customizeParamsFromEthFeatures,
};
