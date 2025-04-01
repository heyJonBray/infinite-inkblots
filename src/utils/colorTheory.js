const config = require('../config');

/**
 * Converts HSL color to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @return {number[]} RGB values as [r, g, b] (0-255)
 */
function hslToRgb(h, s, l) {
  h /= config.colorTheory.space.HUE_MAX;
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

  return [
    Math.round(r * config.colorTheory.space.RGB_MAX),
    Math.round(g * config.colorTheory.space.RGB_MAX),
    Math.round(b * config.colorTheory.space.RGB_MAX),
  ];
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
  const cleanAddress = address.startsWith('0x')
    ? address.substring(2).toLowerCase()
    : address.toLowerCase();

  const hueSegment = cleanAddress.substring(0, 3);
  const hue = parseInt(hueSegment, 16) % config.colorTheory.space.HUE_MAX;

  const satSegment = cleanAddress.substring(3, 5);
  const saturation =
    config.colorTheory.primary.SATURATION_MIN +
    (parseInt(satSegment, 16) %
      (config.colorTheory.primary.SATURATION_RANGE * 100)) /
      100;

  const lightSegment = cleanAddress.substring(5, 7);
  const lightness =
    config.colorTheory.primary.LIGHTNESS_MIN +
    (parseInt(lightSegment, 16) %
      (config.colorTheory.primary.LIGHTNESS_RANGE * 100)) /
      100;

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

  // Use the seed for deterministic relationship selection
  return 'ANALOGOUS';
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

  const variationSeed = parseInt(ethFeatures.address.substring(8, 12), 16);
  const variationFactor =
    (variationSeed % (config.colorTheory.secondary.VARIATION_RANGE * 100)) /
    100;

  switch (relationship) {
    case 'SPECIAL_420':
      return {
        hue: config.colorTheory.special['420'].HUE,
        saturation: config.colorTheory.special['420'].SAT + variationFactor,
        lightness: config.colorTheory.special['420'].LIGHT + variationFactor,
      };

    case 'MONOCHROMATIC':
      secondaryHue = hue;
      secondarySat = config.colorTheory.special.MONOCHROME.SAT;
      secondaryLight = config.colorTheory.special.MONOCHROME.LIGHT;
      break;

    case 'SEPIA':
      secondaryHue = config.colorTheory.special.SEPIA.HUE;
      secondarySat = config.colorTheory.special.SEPIA.SAT - variationFactor;
      secondaryLight = config.colorTheory.special.SEPIA.LIGHT + variationFactor;
      break;

    case 'ANALOGOUS':
      secondaryHue =
        (hue +
          config.colorTheory.secondary.ANALOGOUS_HUE_OFFSET +
          Math.floor(variationFactor * 10)) %
        config.colorTheory.space.HUE_MAX;

      if (
        saturation > config.colorTheory.secondary.VIBRANT_SATURATION_THRESHOLD
      ) {
        secondarySat = adjustInRange(
          saturation,
          -0.1 + variationFactor,
          config.colorTheory.secondary.VIBRANT.SAT_MIN,
          config.colorTheory.secondary.VIBRANT.SAT_MAX
        );
        secondaryLight = adjustInRange(
          lightness,
          -0.2 + variationFactor,
          config.colorTheory.secondary.VIBRANT.LIGHT_MIN,
          config.colorTheory.secondary.VIBRANT.LIGHT_MAX
        );
      } else {
        secondarySat = adjustInRange(
          saturation,
          0.05 + variationFactor,
          config.colorTheory.secondary.BALANCED.SAT_MIN,
          config.colorTheory.secondary.BALANCED.SAT_MAX
        );
        secondaryLight = adjustInRange(
          lightness,
          -0.1 + variationFactor,
          config.colorTheory.secondary.BALANCED.LIGHT_MIN,
          config.colorTheory.secondary.BALANCED.LIGHT_MAX
        );
      }
      break;

    default:
      secondaryHue =
        (hue + config.colorTheory.secondary.ANALOGOUS_HUE_OFFSET) %
        config.colorTheory.space.HUE_MAX;
      secondarySat = adjustInRange(
        saturation,
        0,
        config.colorTheory.secondary.BALANCED.SAT_MIN,
        config.colorTheory.secondary.BALANCED.SAT_MAX
      );
      secondaryLight = adjustInRange(
        lightness,
        0,
        config.colorTheory.secondary.BALANCED.LIGHT_MIN,
        config.colorTheory.secondary.BALANCED.LIGHT_MAX
      );
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

  let hueName = '';
  if (
    hue < config.colorTheory.hueRanges.ORANGE.min ||
    hue >= config.colorTheory.hueRanges.RED.min
  )
    hueName = 'Red';
  else if (hue < config.colorTheory.hueRanges.YELLOW.min) hueName = 'Orange';
  else if (hue < config.colorTheory.hueRanges.GREEN.min) hueName = 'Yellow';
  else if (hue < config.colorTheory.hueRanges.TEAL.min) hueName = 'Green';
  else if (hue < config.colorTheory.hueRanges.BLUE.min) hueName = 'Teal';
  else if (hue < config.colorTheory.hueRanges.INDIGO.min) hueName = 'Blue';
  else if (hue < config.colorTheory.hueRanges.PURPLE.min) hueName = 'Indigo';
  else if (hue < config.colorTheory.hueRanges.RED.min) hueName = 'Purple';

  let modifier = '';
  if (lightness < config.colorTheory.naming.DARK_LIGHTNESS) modifier = 'Dark';
  else if (lightness > config.colorTheory.naming.LIGHT_LIGHTNESS)
    modifier = 'Light';
  else if (saturation < config.colorTheory.naming.MUTED_SATURATION)
    modifier = 'Muted';
  else if (
    saturation > config.colorTheory.secondary.VIBRANT_SATURATION_THRESHOLD
  )
    modifier = 'Vibrant';

  if (lightness < config.colorTheory.naming.DEEP_LIGHTNESS)
    return 'Deep ' + hueName;
  if (lightness > config.colorTheory.naming.PALE_LIGHTNESS)
    return 'Pale ' + hueName;
  if (saturation < config.colorTheory.naming.MUTED_SATURATION)
    return `${Math.round(lightness * 100)}% Gray`;

  return modifier ? `${modifier} ${hueName}` : hueName;
}

/**
 * Generate a name for a color relationship
 * @param {string} relationship - Relationship type
 * @return {string} Readable name
 */
function generateRelationshipName(relationship) {
  const names = {
    ANALOGOUS: 'Harmony',
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
