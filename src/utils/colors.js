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
  NAVY: {
    name: 'Navy Blue',
    rgb: [28, 69, 113],
  },
  LAVENDER: {
    name: 'Lavender',
    rgb: [101, 93, 143],
  },
  CRIMSON: {
    name: 'Crimson',
    rgb: [235, 23, 25],
  },
  FOREST_GREEN: {
    name: 'Forest Green',
    rgb: [34, 139, 34],
  },
  GOLDENROD: {
    name: 'Goldenrod',
    rgb: [218, 165, 32],
  },
  TEAL: {
    name: 'Teal',
    rgb: [0, 128, 128],
  },
  CORAL: {
    name: 'Coral',
    rgb: [255, 127, 80],
  },
  PURPLE: {
    name: 'Purple',
    rgb: [128, 0, 128],
  },
  AMBER: {
    name: 'Amber',
    rgb: [255, 191, 0],
  },
  SLATE: {
    name: 'Slate',
    rgb: [112, 128, 144],
  },
  MAROON: {
    name: 'Maroon',
    rgb: [128, 0, 0],
  },
  OLIVE: {
    name: 'Olive',
    rgb: [128, 128, 0],
  },
  INDIGO: {
    name: 'Indigo',
    rgb: [75, 0, 130],
  },
  TURQUOISE: {
    name: 'Turquoise',
    rgb: [64, 224, 208],
  },
  ROSE: {
    name: 'Rose',
    rgb: [255, 0, 127],
  },
  MINT: {
    name: 'Mint',
    rgb: [152, 255, 152],
  },
  SAPPHIRE: {
    name: 'Sapphire',
    rgb: [15, 82, 186],
  },
  RUST: {
    name: 'Rust',
    rgb: [183, 65, 14],
  },
};

// Define 10 distinct color pairs with clear names
const COLOR_PAIRS = [
  {
    name: 'Ocean Deep',
    primary: COLORS.NAVY,
    secondary: COLORS.TEAL,
  },
  {
    name: 'Twilight Sky',
    primary: COLORS.LAVENDER,
    secondary: COLORS.INDIGO,
  },
  {
    name: 'Fire & Ice',
    primary: COLORS.CRIMSON,
    secondary: COLORS.SLATE,
  },
  {
    name: 'Forest Dawn',
    primary: COLORS.FOREST_GREEN,
    secondary: COLORS.AMBER,
  },
  {
    name: 'Golden Sunset',
    primary: COLORS.GOLDENROD,
    secondary: COLORS.RUST,
  },
  {
    name: 'Royal Court',
    primary: COLORS.PURPLE,
    secondary: COLORS.GOLDENROD,
  },
  {
    name: 'Coral Reef',
    primary: COLORS.TEAL,
    secondary: COLORS.CORAL,
  },
  {
    name: 'Vintage Wine',
    primary: COLORS.MAROON,
    secondary: COLORS.OLIVE,
  },
  {
    name: 'Spring Bloom',
    primary: COLORS.MINT,
    secondary: COLORS.ROSE,
  },
  {
    name: 'Jewel Box',
    primary: COLORS.SAPPHIRE,
    secondary: COLORS.AMBER,
  },
  // Keep 420 Special as a bonus 11th pair
  {
    name: '420 Special',
    primary: COLORS.FOREST_GREEN,
    secondary: COLORS.GOLDENROD,
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
  // Special case: 420 address gets its own special scheme
  if (ethFeatures.address && ethFeatures.address.includes('420')) {
    return COLOR_PAIRS[10]; // The 420 Special pair
  }

  // Use the seed to deterministically select a color pair
  // We'll use modulo 10 to get a number between 0-9
  const pairIndex = ethFeatures.seed % 10;
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
