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
  // 420 Special colors
  EMERALD_GREEN: {
    name: 'Emerald Green',
    rgb: [46, 130, 24],
  },
  OLIVE_GREEN: {
    name: 'Olive Green',
    rgb: [113, 146, 26],
  },
  // Other color pairs
  NAVY_BLUE: {
    name: 'Navy Blue',
    rgb: [26, 55, 102],
  },
  PERIWINKLE: {
    name: 'Periwinkle',
    rgb: [129, 118, 183],
  },
  AMBER: {
    name: 'Amber',
    rgb: [190, 145, 59],
  },
  SUNSET_ORANGE: {
    name: 'Sunset Orange',
    rgb: [224, 154, 100],
  },
  BRICK_RED: {
    name: 'Brick Red',
    rgb: [158, 30, 30],
  },
  BURGUNDY: {
    name: 'Burgundy',
    rgb: [78, 0, 0],
  },
  RASPBERRY: {
    name: 'Raspberry',
    rgb: [152, 48, 107],
  },
  ORCHID: {
    name: 'Orchid',
    rgb: [180, 81, 137],
  },
  PALE_YELLOW: {
    name: 'Pale Yellow',
    rgb: [255, 241, 158],
  },
  MOSS_GREEN: {
    name: 'Moss Green',
    rgb: [176, 158, 54],
  },
  CARAMEL: {
    name: 'Caramel',
    rgb: [216, 153, 100],
  },
  PALE_PINK: {
    name: 'Pale Pink',
    rgb: [255, 197, 197],
  },
  SLATE_BLUE: {
    name: 'Slate Blue',
    rgb: [113, 131, 171],
  },
  TEAL: {
    name: 'Teal',
    rgb: [60, 130, 130],
  },
  MIDNIGHT_BLUE: {
    name: 'Midnight Blue',
    rgb: [4, 5, 60],
  },
  COBALT: {
    name: 'Cobalt',
    rgb: [22, 69, 102],
  },
  LAVENDER: {
    name: 'Lavender',
    rgb: [173, 139, 220],
  },
  ROYAL_BLUE: {
    name: 'Royal Blue',
    rgb: [56, 59, 187],
  },
  CORAL_PINK: {
    name: 'Coral Pink',
    rgb: [212, 74, 113],
  },
  PEACH: {
    name: 'Peach',
    rgb: [255, 189, 135],
  },
  LIME_GREEN: {
    name: 'Lime Green',
    rgb: [115, 195, 28],
  },
  FOREST_GREEN: {
    name: 'Forest Green',
    rgb: [7, 119, 59],
  },
  COPPER: {
    name: 'Copper',
    rgb: [177, 125, 77],
  },
  BROWN: {
    name: 'Brown',
    rgb: [91, 44, 1],
  },
  DARK_NAVY: {
    name: 'Dark Navy',
    rgb: [32, 54, 94],
  },
  STEEL_BLUE: {
    name: 'Steel Blue',
    rgb: [58, 79, 118],
  },
  PLUM: {
    name: 'Plum',
    rgb: [124, 56, 118],
  },
  MAUVE: {
    name: 'Mauve',
    rgb: [151, 96, 146],
  },
};

// Define color pairs with clear names based on the provided RGB values
const COLOR_PAIRS = [
  // 420 Special pair (always first)
  {
    name: '420 Special',
    primary: COLORS.EMERALD_GREEN,
    secondary: COLORS.OLIVE_GREEN,
  },
  // Other pairs
  {
    name: 'Navy & Periwinkle',
    primary: COLORS.NAVY_BLUE,
    secondary: COLORS.PERIWINKLE,
  },
  {
    name: 'Amber Sunset',
    primary: COLORS.AMBER,
    secondary: COLORS.SUNSET_ORANGE,
  },
  {
    name: 'Rich Reds',
    primary: COLORS.BRICK_RED,
    secondary: COLORS.BURGUNDY,
  },
  {
    name: 'Berry Burst',
    primary: COLORS.RASPBERRY,
    secondary: COLORS.ORCHID,
  },
  {
    name: 'Sunlit Moss',
    primary: COLORS.PALE_YELLOW,
    secondary: COLORS.MOSS_GREEN,
  },
  {
    name: 'Warm Neutral',
    primary: COLORS.CARAMEL,
    secondary: COLORS.PALE_PINK,
  },
  {
    name: 'Ocean Depths',
    primary: COLORS.SLATE_BLUE,
    secondary: COLORS.TEAL,
  },
  {
    name: 'Deep Blue Sea',
    primary: COLORS.MIDNIGHT_BLUE,
    secondary: COLORS.COBALT,
  },
  {
    name: 'Royal Lavender',
    primary: COLORS.LAVENDER,
    secondary: COLORS.ROYAL_BLUE,
  },
  {
    name: 'Coral Sunset',
    primary: COLORS.CORAL_PINK,
    secondary: COLORS.PEACH,
  },
  {
    name: 'Forest Lime',
    primary: COLORS.LIME_GREEN,
    secondary: COLORS.FOREST_GREEN,
  },
  {
    name: 'Copper Earth',
    primary: COLORS.COPPER,
    secondary: COLORS.BROWN,
  },
  {
    name: 'Steel Navy',
    primary: COLORS.DARK_NAVY,
    secondary: COLORS.STEEL_BLUE,
  },
  {
    name: 'Plum Mauve',
    primary: COLORS.PLUM,
    secondary: COLORS.MAUVE,
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
 * Select a color pair based on deterministic address properties
 * @param {Object} ethFeatures - Features extracted from ETH address
 * @returns {Object} Selected color pair
 */
function selectColorPair(ethFeatures) {
  // Special case: 420 address gets the 420 Special pair
  if (ethFeatures.address && ethFeatures.address.includes('420')) {
    return COLOR_PAIRS[0]; // The 420 Special pair is first in the array
  }

  // Use the seed to deterministically select a color pair
  // We'll use modulo (COLOR_PAIRS.length - 1) to exclude the 420 Special pair
  // Then add 1 to skip the 420 Special pair (index 0)
  const pairIndex = (ethFeatures.seed % (COLOR_PAIRS.length - 1)) + 1;
  return COLOR_PAIRS[pairIndex];
}

/**
 * Generate a color scheme based on primary/secondary colors from a pair
 * @param {Object} pair - Color pair to use
 * @returns {Array} Array of colors for the scheme
 */
function generateColorScheme(pair, is420Special = false) {
  const white = createColorString(COLORS.WHITE);
  const black = createColorString(COLORS.BLACK);
  const primary = createColorString(pair.primary);
  const secondary = createColorString(pair.secondary);

  // Create a color scheme using the pair's colors
  if (is420Special) {
    // Special pattern for 420 addresses
    return [
      white, // 0.0-0.1 noise range - minimal usage, background/edges
      black, // 0.1-0.2 noise range - outlines and deep shadows
      primary, // 0.2-0.3 noise range - primary color, inner details
      primary, // 0.3-0.4 noise range - primary color, major features
      secondary, // 0.4-0.5 noise range - secondary color, transition areas
      black, // 0.5-0.6 noise range - central shadows
      primary, // 0.6-0.7 noise range - primary color, core details
      primary, // 0.7-0.8 noise range - primary color, highlights
      secondary, // 0.8-0.9 noise range - secondary color, accents
      white, // 0.9-1.0 noise range - minimal usage, highest noise values
    ];
  } else {
    // Default pattern for regular addresses
    return [
      white, // 0.0-0.1 noise range - minimal usage, background/edges
      primary, // 0.1-0.2 noise range - primary color, main features
      white, // 0.2-0.3 noise range - highlights
      black, // 0.3-0.4 noise range - deep shadows
      secondary, // 0.4-0.5 noise range - secondary color, major shapes
      primary, // 0.5-0.6 noise range - primary color, central features
      black, // 0.6-0.7 noise range - core shadows
      secondary, // 0.7-0.8 noise range - secondary color, highlights
      black, // 0.8-0.9 noise range - accent shadows, fine details
      white, // 0.9-1.0 noise range - minimal usage, highest noise values
    ];
  }
}

/**
 * Get color scheme based on Ethereum features
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Object} Object containing colors array and color information
 */
function getColorSchemeFromEthFeatures(ethFeatures) {
  // Check if address contains 420 anywhere
  const is420Address =
    ethFeatures.address && ethFeatures.address.includes('420');

  // Select a color pair based on the ETH address
  const colorPair = selectColorPair(ethFeatures);

  // Generate the color scheme from the selected pair
  const colors = generateColorScheme(colorPair, is420Address);

  return {
    colors,
    primaryColor: colorPair.primary.name,
    secondaryColor: colorPair.secondary.name,
    colorPairName: colorPair.name,
    is420Address,
  };
}

module.exports = {
  COLORS,
  COLOR_PAIRS,
  createColorString,
  getColorSchemeFromEthFeatures,
};
