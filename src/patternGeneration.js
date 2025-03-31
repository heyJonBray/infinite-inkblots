// Particle-Based Rorschach Generator
// Creates Rorschach-style inkblots using particles and noise fields
// Takes inspiration from both the original P5.js sketch and the Python implementation
const { defaultParams } = require('./config');
const {
  createSeededRandom,
  createNoiseFunction,
  getPlotter,
  fadeOut,
  createSymmetricalParticle,
  createInvertedSymmetricalParticle,
  createStarSymmetricalParticle,
} = require('./utils/particleUtils');
const { createCanvas } = require('canvas');
const {
  extractEthFeatures,
  customizeParamsFromEthFeatures,
} = require('./utils/ethUtils');
const { getColorSchemeFromEthFeatures } = require('./utils/colors');

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

  // Create canvas
  const canvas = createCanvas(currentParams.size, currentParams.size);
  const ctx = canvas.getContext('2d');

  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, currentParams.size, currentParams.size);

  // Update offsets to account for margins
  const centerX = currentParams.size / 2;
  const centerY = currentParams.size / 2;

  console.log(
    `Generating particle-based Rorschach with ${currentParams.framesToRender} frames and ${currentParams.particleCount} particles per frame...`
  );

  // Simulate multiple frames
  for (let frame = 0; frame < currentParams.framesToRender; frame++) {
    // Apply fadeout effect for particle accumulation
    fadeOut(ctx, currentParams.size, currentParams.fadeAlpha);

    // Generate particles for this frame
    for (let i = 0; i < currentParams.particleCount; i++) {
      // Create symmetrical particles using the appropriate function
      let particles;
      if (is420Address) {
        particles = createStarSymmetricalParticle(
          seededRandom,
          currentParams.size,
          currentParams.horizontalMargin,
          currentParams.verticalMargin
        );
      } else {
        particles = isInverted
          ? createInvertedSymmetricalParticle(
              seededRandom,
              currentParams.size,
              currentParams.horizontalMargin,
              currentParams.verticalMargin
            )
          : createSymmetricalParticle(
              seededRandom,
              currentParams.size,
              currentParams.horizontalMargin,
              currentParams.verticalMargin
            );
      }

      // Get plotter properties based on position and current frame - only calculate once
      // for the original particle, and use the same for the mirrored one
      const xNoise = particles.original.x * currentParams.scale;
      const yNoise = particles.original.y * currentParams.scale;
      const timeNoise = frame * currentParams.speed;

      // Calculate noise value
      const noiseValue = noise(xNoise, yNoise, timeNoise);

      // Add distance-based weighting to create more structure
      const distanceFromCenter = Math.sqrt(
        Math.pow((particles.original.x - centerX) / currentParams.size, 2) +
          Math.pow((particles.original.y - centerY) / currentParams.size, 2)
      );

      // Adjusted noise value based on distance from center
      const adjustedValue = noiseValue * (1 - distanceFromCenter * 0.5);

      // Get plotter properties - only once for both particles
      const plotter = getPlotter(
        adjustedValue,
        colors,
        currentParams.maxRadius
      );

      // Vary radius based on distance from center to create more organic edges
      // Enhanced edge variation with more small particles
      const edgeFactor = Math.pow(distanceFromCenter, 2);
      const sizeVariation = 1 - edgeFactor * 0.8; // Increased edge falloff

      // Add some randomness to edge particles
      const edgeNoise = Math.pow(Math.sin(distanceFromCenter * Math.PI * 8), 2);
      const organicRadius =
        plotter.radius * (sizeVariation * (0.6 + 0.4 * edgeNoise));

      // Ensure minimum particle size for visual interest
      const finalRadius = Math.max(
        organicRadius,
        currentParams.maxRadius * 0.1
      );

      // Draw both particles with the same color and radius
      ctx.fillStyle = plotter.color;

      // Draw the original particle (left side)
      ctx.beginPath();
      ctx.arc(
        particles.original.x,
        particles.original.y,
        finalRadius,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw the mirrored particle (right side)
      ctx.beginPath();
      ctx.arc(
        particles.mirrored.x,
        particles.mirrored.y,
        finalRadius,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Progress indicator
    if (frame % 10 === 0) {
      process.stdout.write('.');
    }
  }
  process.stdout.write('\n');

  return canvas.toBuffer('image/png');
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  generateParticleRorschach,
};
