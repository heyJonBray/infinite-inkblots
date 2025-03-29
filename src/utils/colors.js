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
};

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
 * Get color scheme based on Ethereum features
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Object} Object containing colors array and color information
 */
function getColorSchemeFromEthFeatures(ethFeatures) {
  // Check if address starts or ends with 420
  const is420Address =
    ethFeatures.address &&
    (ethFeatures.address.startsWith('0x420') ||
      ethFeatures.address.endsWith('420'));

  let primaryColor, secondaryColor, colors;
  const white = createColorString(COLORS.WHITE);
  const black = createColorString(COLORS.BLACK);

  // Special color scheme for 420 addresses
  if (is420Address) {
    primaryColor = COLORS.FOREST_GREEN;
    secondaryColor = COLORS.GOLDENROD;
    colors = [
      white,
      createColorString(secondaryColor),
      white,
      createColorString(primaryColor),
      white,
      black,
      white,
      black,
      createColorString(secondaryColor),
      white,
    ];
  } else {
    // Default colors
    primaryColor = COLORS.NAVY;
    secondaryColor = COLORS.CRIMSON;

    // Default color scheme
    colors = [
      white,
      white,
      createColorString(primaryColor),
      white,
      createColorString(primaryColor),
      white,
      black,
      white,
      black,
      white,
    ];

    // Customize colors based on ETH features
    if (ethFeatures.diversity > 0.7) {
      // High diversity - more color variation
      colors = [
        white,
        createColorString(secondaryColor),
        white,
        createColorString(primaryColor),
        white,
        black,
        white,
        black,
        createColorString(secondaryColor),
        white,
      ];
    } else if (ethFeatures.letters > 0.6) {
      // Many letters - blue dominant
      colors = [
        white,
        white,
        createColorString(primaryColor),
        white,
        createColorString(primaryColor),
        createColorString(primaryColor),
        black,
        white,
        white,
      ];
    } else if (ethFeatures.zeros > 0.3) {
      // Many zeros - high contrast
      colors = [
        white,
        createColorString(primaryColor),
        black,
        white,
        createColorString(secondaryColor),
        white,
        black,
        white,
      ];
    }
  }

  return {
    colors,
    primaryColor: primaryColor.name,
    secondaryColor: secondaryColor.name,
    is420Address,
  };
}

module.exports = {
  COLORS,
  createColorString,
  getColorSchemeFromEthFeatures,
};
