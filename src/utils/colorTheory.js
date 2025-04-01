/**
 * Converts HSL color to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @return {number[]} RGB values as [r, g, b] (0-255)
 */
function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Converts RGB color to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @return {Object} HSL values as {hue, saturation, lightness}
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    hue: Math.round(h * 360),
    saturation: s,
    lightness: l,
  };
}

/**
 * Helper to adjust a value within specified range
 * @param {number} value - Original value
 * @param {number} adjustment - Adjustment amount
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @return {number} Adjusted value within range
 */
function adjustInRange(value, adjustment, min, max) {
  return Math.max(min, Math.min(max, value + adjustment));
}

/**
 * Generates a primary color from address segments
 * @param {string} address - Normalized Ethereum address
 * @return {Object} HSL color values
 */
function generatePrimaryColor(address) {
  // Remove '0x' prefix if present
  const cleanAddress = address.startsWith('0x')
    ? address.substring(2).toLowerCase()
    : address.toLowerCase();

  // Use different segments of the address for different HSL components

  // Use first 3 chars for hue (0-360)
  const hueSegment = cleanAddress.substring(0, 3);
  const hue = parseInt(hueSegment, 16) % 360;

  // Use next 2 chars for saturation (40-100%)
  const satSegment = cleanAddress.substring(3, 5);
  const saturation = 0.4 + (parseInt(satSegment, 16) % 60) / 100;

  // Use next 2 chars for lightness (35-75%)
  const lightSegment = cleanAddress.substring(5, 7);
  const lightness = 0.35 + (parseInt(lightSegment, 16) % 40) / 100;

  return { hue, saturation, lightness };
}

/**
 * Determines color relationship type based on address patterns
 * @param {Object} ethFeatures - Features extracted from ETH address
 * @return {string} Color relationship type
 */
function determineColorRelationship(ethFeatures) {
  const address = ethFeatures.address;

  // Detect special pattern - 420 reference
  if (address.toLowerCase().includes('420')) {
    return 'SPECIAL_420';
  }

  // Detect monochrome pattern (repeating zeros)
  if (ethFeatures.isLessUnique && !ethFeatures.hasNonZeroRepeat) {
    return 'MONOCHROMATIC';
  }

  // Detect sepia/vintage pattern (repeating non-zero characters)
  if (ethFeatures.isLessUnique && ethFeatures.hasNonZeroRepeat) {
    return 'SEPIA';
  }

  // Use palindrome detection for complementary colors
  if (ethFeatures.isPalindrome) {
    return 'COMPLEMENTARY';
  }

  // Use diversity score to influence relationship choice
  if (ethFeatures.diversity > 0.7) {
    return 'SPLIT_COMPLEMENTARY'; // High diversity suggests more contrast
  } else if (ethFeatures.diversity < 0.3) {
    return 'ANALOGOUS_ACCENT'; // Low diversity suggests more subtle relationship
  }

  // Use the seed for deterministic relationship selection for remaining cases
  const relationships = [
    'COMPLEMENTARY',
    'ANALOGOUS',
    'SPLIT_COMPLEMENTARY',
    'ANALOGOUS_ACCENT',
  ];

  return relationships[ethFeatures.seed % relationships.length];
}

/**
 * Generates a secondary color based on color theory relationship
 * @param {Object} primaryHsl - Primary color in HSL
 * @param {string} relationship - Color relationship type
 * @param {Object} ethFeatures - Ethereum features for variation
 * @return {Object} Secondary color in HSL
 */
function generateSecondaryColor(primaryHsl, relationship, ethFeatures) {
  const { hue, saturation, lightness } = primaryHsl;
  let secondaryHue, secondarySat, secondaryLight;

  // Variation factor based on address to make each secondary color unique
  const variationSeed = parseInt(ethFeatures.address.substring(8, 12), 16);
  const variationFactor = (variationSeed % 20) / 100; // 0-0.2 variation

  switch (relationship) {
    case 'SPECIAL_420':
      // Create a special green pair for 420 reference
      return {
        hue: 120, // Green
        saturation: 0.6 + variationFactor,
        lightness: 0.3 + variationFactor,
      };

    case 'MONOCHROMATIC':
      // Same hue, different lightness/saturation
      secondaryHue = hue;
      secondarySat = 0.1; // Low saturation for grey tones
      secondaryLight = 0.25; // Darker for grey
      break;

    case 'SEPIA':
      // Warm earth-tone colors
      secondaryHue = 30; // Sepia/brown hue
      secondarySat = 0.6 - variationFactor;
      secondaryLight = 0.4 + variationFactor;
      break;

    case 'COMPLEMENTARY':
      // Opposite on the color wheel
      secondaryHue = (hue + 180) % 360;
      secondarySat = saturation;
      secondaryLight = adjustInRange(
        lightness,
        -0.1 + variationFactor,
        0.25,
        0.75
      );
      break;

    case 'ANALOGOUS':
      // Adjacent on the color wheel
      secondaryHue = (hue + 30 + Math.floor(variationFactor * 15)) % 360;
      secondarySat = adjustInRange(
        saturation,
        -0.05 + variationFactor,
        0.3,
        0.9
      );
      secondaryLight = adjustInRange(
        lightness,
        -0.1 + variationFactor,
        0.3,
        0.7
      );
      break;

    case 'SPLIT_COMPLEMENTARY':
      // Complementary with an offset
      secondaryHue = (hue + 150 + Math.floor(variationFactor * 30)) % 360;
      secondarySat = adjustInRange(saturation, -0.1 + variationFactor, 0.4, 1);
      secondaryLight = adjustInRange(
        lightness,
        -0.1 + variationFactor,
        0.3,
        0.7
      );
      break;

    case 'ANALOGOUS_ACCENT':
      // Analogous with more contrast
      secondaryHue = (hue + 45 + Math.floor(variationFactor * 20)) % 360;
      secondarySat = adjustInRange(saturation, 0.1 + variationFactor, 0, 1);
      secondaryLight = adjustInRange(
        lightness,
        -0.15 + variationFactor,
        0.25,
        0.75
      );
      break;

    default:
      // Fallback
      secondaryHue = (hue + 60) % 360;
      secondarySat = saturation;
      secondaryLight = lightness;
  }

  return {
    hue: secondaryHue,
    saturation: secondarySat,
    lightness: secondaryLight,
  };
}

/**
 * Generate a descriptive name for a color
 * @param {number[]} rgb - RGB values
 * @param {Object} hsl - HSL values
 * @return {string} Color name
 */
function generateColorName(rgb, hsl) {
  const { hue, saturation, lightness } = hsl;

  // Get base hue name
  let hueName = '';
  if (hue < 15 || hue >= 345) hueName = 'Red';
  else if (hue < 45) hueName = 'Orange';
  else if (hue < 75) hueName = 'Yellow';
  else if (hue < 165) hueName = 'Green';
  else if (hue < 195) hueName = 'Teal';
  else if (hue < 255) hueName = 'Blue';
  else if (hue < 285) hueName = 'Indigo';
  else if (hue < 345) hueName = 'Purple';

  // Get lightness/saturation modifier
  let modifier = '';
  if (lightness < 0.2) modifier = 'Dark';
  else if (lightness > 0.8) modifier = 'Light';
  else if (saturation < 0.3) modifier = 'Muted';
  else if (saturation > 0.8) modifier = 'Vibrant';

  // Special colors for nearly black, white, or gray
  if (lightness < 0.1) return 'Deep ' + hueName;
  if (lightness > 0.9) return 'Pale ' + hueName;
  if (saturation < 0.1) return `${Math.round(lightness * 100)}% Gray`;

  return modifier ? `${modifier} ${hueName}` : hueName;
}

/**
 * Generate a name for a color relationship
 * @param {string} relationship - Relationship type
 * @return {string} Readable name
 */
function generateRelationshipName(relationship) {
  const names = {
    COMPLEMENTARY: 'Contrast',
    ANALOGOUS: 'Harmony',
    SPLIT_COMPLEMENTARY: 'Balance',
    ANALOGOUS_ACCENT: 'Accent',
    SPECIAL_420: '420 Special',
    MONOCHROMATIC: 'Monochrome',
    SEPIA: 'Sepia',
  };

  return names[relationship] || 'Custom';
}

module.exports = {
  hslToRgb,
  rgbToHsl,
  generatePrimaryColor,
  generateSecondaryColor,
  determineColorRelationship,
  generateColorName,
  generateRelationshipName,
};
