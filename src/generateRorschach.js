/**
 * Rorschach inkblot generator
 * Generates deterministic Rorschach-style inkblots based on Ethereum addresses
 *
 * @module generateRorschach
 * @requires config
 * @requires utils/particleUtils
 * @requires utils/renderUtils
 * @requires utils/ethUtils
 * @requires utils/colors
 */

const { defaultParams } = require('./config');
const {
  createSeededRandom,
  createNoiseFunction,
  getPlotter,
  createSymmetricalParticle,
  createInvertedSymmetricalParticle,
  createStarSymmetricalParticle,
} = require('./utils/particleUtils');
const { renderRorschach } = require('./utils/renderUtils');
const {
  extractEthFeatures,
  customizeParamsFromEthFeatures,
} = require('./utils/ethUtils');
const { getColorSchemeFromEthFeatures } = require('./utils/colors');
const { createCanvas } = require('canvas');

/**
 * Generate Rorschach inkblot using particle-based approach
 * @param {string} ethAddress - Ethereum address for seeding
 * @param {Object} customParams - Custom parameters
 * @returns {Buffer} PNG image buffer
 */
function generateParticleRorschach(ethAddress, customParams = {}) {
  // Merge custom parameters with defaults
  const currentParams = { ...defaultParams, ...customParams };

  // Extract features from Ethereum address if provided
  let ethFeatures = null;
  let seededRandom = createSeededRandom();
  let colors;
  let isInverted = false;
  let is420Address = false;

  if (ethAddress) {
    // Determine pattern type based on address features FIRST
    is420Address = ethAddress.toLowerCase().includes('420');

    ethFeatures = extractEthFeatures(ethAddress);

    // Customize parameters based on ETH features
    Object.assign(
      currentParams,
      customizeParamsFromEthFeatures(currentParams, ethFeatures)
    );

    // Get color scheme based on ETH features
    const colorScheme = getColorSchemeFromEthFeatures(ethFeatures);
    colors = colorScheme.colors;

    // Initialize seeded random with ETH seed
    seededRandom = createSeededRandom(ethFeatures.seed);

    // Now set isInverted AFTER we've set is420Address
    isInverted = !is420Address && ethFeatures.zeros > 0.5;

    console.log(`Using ETH features for address ${ethAddress}:`);
    console.log(`- Scale: ${currentParams.scale.toFixed(4)}`);
    console.log(`- Particles: ${currentParams.particleCount}`);
    console.log(`- Frames: ${currentParams.framesToRender}`);
    console.log(`- Seed: ${ethFeatures.seed}`);
    console.log(
      `- Pattern: ${
        is420Address ? 'Star' : isInverted ? 'Inverted' : 'Standard'
      }`
    );
  } else {
    // Use default features for non-ETH case
    ethFeatures = {
      diversity: 0.5,
      zeros: 0.4,
      ones: 0.3,
      letters: 0.7,
      highValues: 0.5,
      evenChars: 0.5,
      seed: Math.floor(Math.random() * 100000),
      address: '0x0000000000000000000000000000000000000000',
    };
    const colorScheme = getColorSchemeFromEthFeatures(ethFeatures);
    colors = colorScheme.colors;
  }

  // Create noise function from seeded random
  const noise = createNoiseFunction(seededRandom);

  // Prepare rendering state
  const renderState = {
    seededRandom,
    colors,
    isInverted,
    is420Address,
    noise,
    getPlotter,
    createSymmetricalParticle,
    createInvertedSymmetricalParticle,
    createStarSymmetricalParticle,
  };

  // Render the Rorschach pattern
  return renderRorschach(createCanvas, currentParams, renderState);
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  generateParticleRorschach,
};
