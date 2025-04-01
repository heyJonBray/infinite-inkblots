const colorTheory = require('./colorTheory');

// Color palette definition
const COLORS = {
  WHITE: {
    name: 'White',
    rgb: [255, 255, 255],
  },
  BLACK: {
    name: 'Black',
    rgb: [0, 0, 0],
  },
  GREY: {
    name: 'Grey',
    rgb: [64, 64, 64],
  },
  // sepia color pairs
  SEPIA_DARK: {
    name: 'Sepia Dark',
    rgb: [112, 66, 20],
  },
  SEPIA_LIGHT: {
    name: 'Sepia Light',
    rgb: [176, 104, 33],
  },
  // 420 Special colors
  EMERALD: {
    name: 'Emerald',
    rgb: [0, 106, 58],
  },
  JADE: {
    name: 'Jade',
    rgb: [68, 156, 116],
  },
  // standardcolor pairs
  NAVY_BLUE: {
    name: 'Navy Blue',
    rgb: [52, 68, 121],
  },
  SLATE_BLUE: {
    name: 'Slate Blue',
    rgb: [86, 97, 134],
  },
  GOLD: {
    name: 'Gold',
    rgb: [153, 119, 0],
  },
  DEEP_BROWN: {
    name: 'Deep Brown',
    rgb: [84, 65, 0],
  },
  MAGENTA: {
    name: 'Magenta',
    rgb: [96, 0, 60],
  },
  RASPBERRY: {
    name: 'Raspberry',
    rgb: [115, 22, 80],
  },
  TEAL: {
    name: 'Teal',
    rgb: [31, 145, 90],
  },
  GOLDEN_OLIVE: {
    name: 'Golden Olive',
    rgb: [175, 138, 12],
  },
  COPPER: {
    name: 'Copper',
    rgb: [113, 68, 45],
  },
  DEEP_PURPLE: {
    name: 'Deep Purple',
    rgb: [78, 1, 78],
  },
  ORCHID: {
    name: 'Orchid',
    rgb: [128, 81, 128],
  },
  CRIMSON: {
    name: 'Crimson',
    rgb: [115, 1, 14],
  },
  BURGUNDY: {
    name: 'Burgundy',
    rgb: [58, 0, 7],
  },
  ROYAL_BLUE: {
    name: 'Royal Blue',
    rgb: [10, 36, 122],
  },
  PERIWINKLE: {
    name: 'Periwinkle',
    rgb: [59, 80, 149],
  },
  DARK_RED: {
    name: 'Dark Red',
    rgb: [62, 0, 0],
  },
  BRIGHT_RED: {
    name: 'Bright Red',
    rgb: [186, 11, 11],
  },
  AZURE: {
    name: 'Azure',
    rgb: [7, 118, 160],
  },
  TEAL_BLUE: {
    name: 'Teal Blue',
    rgb: [2, 106, 121],
  },
};

const COLOR_PAIRS = [
  // 420 Special pair (always first)
  {
    name: '420 Special',
    primary: COLORS.EMERALD,
    secondary: COLORS.JADE,
  },
  // monochrome pair (repeating zeros)
  {
    name: 'Monochrome',
    primary: COLORS.BLACK,
    secondary: COLORS.GREY,
  },
  // sepia pair (repeating non-zero characters)
  {
    name: 'Sepia',
    primary: COLORS.SEPIA_DARK,
    secondary: COLORS.SEPIA_LIGHT,
  },
  // Other pairs
  {
    name: 'Navy & Slate',
    primary: COLORS.NAVY_BLUE,
    secondary: COLORS.SLATE_BLUE,
  },
  {
    name: 'Golden Brown',
    primary: COLORS.GOLD,
    secondary: COLORS.DEEP_BROWN,
  },
  {
    name: 'Magenta Burst',
    primary: COLORS.MAGENTA,
    secondary: COLORS.RASPBERRY,
  },
  {
    name: 'Teal & Gold',
    primary: COLORS.TEAL,
    secondary: COLORS.GOLDEN_OLIVE,
  },
  {
    name: 'Copper Tone',
    primary: COLORS.COPPER,
    secondary: COLORS.DEEP_BROWN,
  },
  {
    name: 'Purple Haze',
    primary: COLORS.DEEP_PURPLE,
    secondary: COLORS.ORCHID,
  },
  {
    name: 'Deep Red',
    primary: COLORS.CRIMSON,
    secondary: COLORS.BURGUNDY,
  },
  {
    name: 'Ocean Blue',
    primary: COLORS.ROYAL_BLUE,
    secondary: COLORS.PERIWINKLE,
  },
  {
    name: 'Blood Red',
    primary: COLORS.DARK_RED,
    secondary: COLORS.BRIGHT_RED,
  },
  {
    name: 'Ocean Depths',
    primary: COLORS.AZURE,
    secondary: COLORS.TEAL_BLUE,
  },
];

/**
 * Create a color string from a color object
 * @param {Object} color - Color object from COLORS
 * @param {number} alpha - Alpha value (0-255)
 * @returns {string} RGBA color string
 */
function createColorString(color, alpha = 150) {
  const [r, g, b] = color.rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
}

/**
 * Check if an address is a 420 address (starts or ends with 420)
 * @param {string} address - Ethereum address to check
 * @returns {boolean} Whether the address is a 420 address
 */
function is420Address(address) {
  if (!address) return false;
  const lowerAddress = address.toLowerCase();
  return lowerAddress.startsWith('0x420') || lowerAddress.endsWith('420');
}

/**
 * Select a color pair based on deterministic address properties
 * @param {Object} ethFeatures - Features extracted from ETH address
 * @returns {Object} Selected color pair
 */
function selectColorPair(ethFeatures) {
  // For special cases, use the existing predefined pairs
  // 420 address gets the 420 Special pair
  if (ethFeatures.address.toLowerCase().includes('420')) {
    return COLOR_PAIRS[0];
  }

  // Less unique addresses get either monochrome or sepia colors based on repeating character
  if (ethFeatures.isLessUnique) {
    return ethFeatures.hasNonZeroRepeat ? COLOR_PAIRS[2] : COLOR_PAIRS[1];
  }

  // For other addresses, generate colors based on color theory
  // Generate primary color from address
  const primaryHsl = colorTheory.generatePrimaryColor(ethFeatures.address);

  // Determine color relationship based on address features
  const relationship = colorTheory.determineColorRelationship(ethFeatures);

  // Generate secondary color based on relationship
  const secondaryHsl = colorTheory.generateSecondaryColor(
    primaryHsl,
    relationship,
    ethFeatures
  );

  // Convert to RGB
  const primaryRgb = colorTheory.hslToRgb(
    primaryHsl.hue,
    primaryHsl.saturation,
    primaryHsl.lightness
  );
  const secondaryRgb = colorTheory.hslToRgb(
    secondaryHsl.hue,
    secondaryHsl.saturation,
    secondaryHsl.lightness
  );

  // Generate color names
  const primaryName = colorTheory.generateColorName(primaryRgb, primaryHsl);
  const secondaryName = colorTheory.generateColorName(
    secondaryRgb,
    secondaryHsl
  );

  return {
    name: colorTheory.generateRelationshipName(relationship),
    primary: {
      name: primaryName,
      rgb: primaryRgb,
    },
    secondary: {
      name: secondaryName,
      rgb: secondaryRgb,
    },
  };
}

/**
 * Generate a color scheme based on primary/secondary colors from a pair
 * @param {Object} pair - Color pair to use
 * @returns {Array} Array of colors for the scheme
 */
function generateColorScheme(pair, is420Special = false, isLessUnique = false) {
  const white = createColorString(COLORS.WHITE);
  const black = createColorString(COLORS.BLACK);
  const primary = createColorString(pair.primary);
  const secondary = createColorString(pair.secondary);

  if (is420Special) {
    // color pattern for 420 addresses
    return [
      black, // 0.0-0.1 noise range - minimal usage, background/edges
      primary, // 0.1-0.2 noise range - outlines and deep shadows
      secondary, // 0.2-0.3 noise range - primary color, inner details
      primary, // 0.3-0.4 noise range - primary color, major features
      black, // 0.4-0.5 noise range - secondary color, transition areas
      secondary, // 0.5-0.6 noise range - central shadows
      primary, // 0.6-0.7 noise range - primary color, core details
      black, // 0.7-0.8 noise range - primary color, highlights
      secondary, // 0.8-0.9 noise range - secondary color, accents
      white, // 0.9-1.0 noise range - minimal usage, highest noise values
    ];
  } else if (isLessUnique) {
    // monochrome/sepia pattern for less unique addresses
    return [
      black, // minimal usage, background/edges
      secondary, // outlines and deep shadows
      primary, // inner details
      secondary, // major features
      black, // transition areas
      primary, // central shadows
      secondary, // core details
      black, // highlights
      secondary, // accents
      white, // highest noise values
    ];
  } else {
    // default pattern
    return [
      secondary, // background/edges
      black, // outlines and deep shadows
      black, // inner details
      primary, // major features
      secondary, // transition areas
      white, // central shadows
      primary, // core details
      primary, // highlights
      secondary, // accents
      white, // highest noise values
    ];
  }
}

/**
 * Get color scheme based on Ethereum features
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Object} Object containing colors array and color information
 */
function getColorSchemeFromEthFeatures(ethFeatures) {
  // Select a color pair based on the ETH address
  const colorPair = selectColorPair(ethFeatures);

  // Generate the color scheme from the selected pair
  const colors = generateColorScheme(
    colorPair,
    is420Address(ethFeatures.address),
    ethFeatures.isLessUnique
  );

  return {
    colors,
    primaryColor: colorPair.primary.name,
    secondaryColor: colorPair.secondary.name,
    colorPairName: colorPair.name,
    is420Address: is420Address(ethFeatures.address),
    isLessUnique: ethFeatures.isLessUnique,
  };
}

module.exports = {
  COLORS,
  COLOR_PAIRS,
  createColorString,
  getColorSchemeFromEthFeatures,
  selectColorPair,
};
