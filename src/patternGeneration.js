// Particle-Based Rorschach Generator
// Creates Rorschach-style inkblots using particles and noise fields
// Takes inspiration from both the original P5.js sketch and the Python implementation

const fs = require('fs');
const { createCanvas } = require('canvas');
const {
  extractEthFeatures,
  customizeParamsFromEthFeatures,
} = require('./utils/ethUtils');
const { getColorSchemeFromEthFeatures } = require('./utils/colors');

// Configuration parameters
const params = {
  size: 1024, // Canvas size
  particleCount: 90, // Particles per frame
  framesToRender: 220, // Number of frames to simulate
  speed: 0.005, // Animation speed
  scale: 0.01, // Noise scale
  maxRadius: 8, // Maximum particle radius
  fadeAlpha: 7, // Fade-out alpha value (lower = more particle accumulation)
  outputPath: './output', // Output directory
  horizontalMargin: 0.1, // 10% margin on left/right
  verticalMargin: 0.2, // 20% margin on top/bottom
};

/**
 * Initialize a seeded random number generator
 * @param {number} seed - Seed value
 * @returns {Function} Seeded random function
 */
function createSeededRandom(seed) {
  let seedValue = seed || Math.floor(Math.random() * 1000000);

  return function () {
    const x = Math.sin(seedValue++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Create a seeded noise function
 * @param {Function} seededRandom - Seeded random function
 * @returns {Function} Noise function
 */
function createNoiseFunction(seededRandom) {
  // Simple cache for noise values
  const noiseCache = {};

  // Permutation table
  const perm = Array(512);
  for (let i = 0; i < 256; i++) {
    perm[i] = perm[i + 256] = Math.floor(seededRandom() * 256);
  }

  // Fade function for smoother interpolation
  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Linear interpolation
  function lerp(t, a, b) {
    return a + t * (b - a);
  }

  // Gradient function
  function grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Return noise function
  return function (x, y, z = 0) {
    // Create a cache key
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;

    // Return cached value if available
    if (noiseCache[key] !== undefined) {
      return noiseCache[key];
    }

    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Get relative coords of point within cell
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);

    // Hash coordinates of the 8 cube corners
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;

    // Add blended results from 8 corners of cube
    const result = lerp(
      w,
      lerp(
        v,
        lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
        lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))
      ),
      lerp(
        v,
        lerp(
          u,
          grad(perm[AA + 1], x, y, z - 1),
          grad(perm[BA + 1], x - 1, y, z - 1)
        ),
        lerp(
          u,
          grad(perm[AB + 1], x, y - 1, z - 1),
          grad(perm[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );

    // Cache and return the result (normalize from -1...1 to 0...1)
    const normalized = (result + 1) / 2;
    noiseCache[key] = normalized;
    return normalized;
  };
}

/**
 * Get plotter characteristics from a value in [0, 1] interval
 * @param {number} value - Value between 0 and 1
 * @param {Array} colors - Color scheme to use
 * @param {number} maxRadius - Maximum particle radius
 * @returns {Object} Plotter with color and radius
 */
function getPlotter(value, colors, maxRadius) {
  const n = colors.length;

  // Use a non-linear mapping to better distribute colors
  // This will make middle colors more likely to appear
  const mappedValue = Math.pow(value, 1.5); // Adjust this power to control distribution

  // Size of an interval
  const size = 1 / n;
  // Corresponding color index for the current value
  const index = Math.floor(mappedValue * n);
  // Corresponding [0,1] in the current color interval
  const valueInInterval = (mappedValue * n) % 1;

  // To get the radius, with fading ones on color transition
  const center = 0.5;
  const radiusScale = 2 * (center - Math.abs(valueInInterval - center));

  return {
    color: colors[Math.min(index, colors.length - 1)],
    radius: maxRadius * radiusScale,
  };
}

/**
 * Apply fade-out effect on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 * @param {number} alpha - Alpha value for fade (lower = more accumulation)
 */
function fadeOut(ctx, size, alpha) {
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha / 255})`;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Create symmetrical particles (original and mirrored)
 * @param {Function} seededRandom - Seeded random function
 * @param {number} size - Canvas size
 * @returns {Object} Particle positions (original and mirrored)
 */
function createSymmetricalParticle(seededRandom, size) {
  // Calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * params.horizontalMargin);
  const usableHeight = size * (1 - 2 * params.verticalMargin);

  // Keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // Generate a point in the left half of the usable area, then adjust for margin
    x = seededRandom() * (usableWidth / 2) + size * params.horizontalMargin;
    y = seededRandom() * usableHeight + size * params.verticalMargin;

    // Calculate distance from center as normalized values (0 to 1)
    const centerX = size / 2;
    const centerY = size / 2;

    // Normalized distances from center (0 = center, 1 = furthest edge)
    const dx = Math.abs(x - centerX) / (size / 2);
    const dy = Math.abs(y - centerY) / (size / 2);

    // Weight the distances differently
    // Higher weight for horizontal distance (more spread out)
    // Lower weight for vertical distance (tighter distribution)
    const weightedDist = dx * 0.7 + dy * 0.3;

    // Acceptance probability: higher near center, lower near edges
    // Using a higher exponent (4) for more dramatic falloff
    const acceptanceProbability = Math.pow(1 - weightedDist, 4);

    // Accept the particle based on its weighted distance from center
    if (seededRandom() < acceptanceProbability || attempts > 10) {
      break;
    }

    attempts++;
  } while (attempts <= 10); // Give up after 10 attempts to avoid infinite loops

  // Create the mirrored point for perfect bilateral symmetry
  const mirrorX = size - x;

  return {
    original: { x, y },
    mirrored: { x: mirrorX, y },
  };
}

/**
 * Generate Rorschach inkblot using particle-based approach
 * @param {string} ethAddress - Ethereum address for seeding
 * @param {Object} customParams - Custom parameters
 * @returns {Buffer} PNG image buffer
 */
function generateParticleRorschach(ethAddress, customParams = {}) {
  // Merge custom parameters with defaults
  const currentParams = { ...params, ...customParams };

  // Extract features from Ethereum address if provided
  let ethFeatures = null;
  let seededRandom = createSeededRandom();
  let colors;

  if (ethAddress) {
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

    console.log(`Using ETH features for address ${ethAddress}:`);
    console.log(`- Diversity: ${ethFeatures.diversity.toFixed(2)}`);
    console.log(`- Scale: ${currentParams.scale.toFixed(4)}`);
    console.log(`- Particles: ${currentParams.particleCount}`);
    console.log(`- Frames: ${currentParams.framesToRender}`);
    console.log(`- Seed: ${ethFeatures.seed}`);
  } else {
    // Use default features for non-ETH case
    ethFeatures = {
      diversity: 0.5, // High diversity to trigger color variation
      zeros: 0.4, // Low zeros to avoid monochrome
      ones: 0.3, // Low ones to avoid monochrome
      letters: 0.7, // High letters to trigger blues scheme
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
      // Create symmetrical particles
      const particles = createSymmetricalParticle(
        seededRandom,
        currentParams.size
      );

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
      // Particles further from center get smaller
      const sizeVariation = 1 - distanceFromCenter * 0.7;
      const organicRadius = plotter.radius * sizeVariation;

      // Draw both particles with the same color and radius
      ctx.fillStyle = plotter.color;

      // Draw the original particle (left side)
      ctx.beginPath();
      ctx.arc(
        particles.original.x,
        particles.original.y,
        organicRadius,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw the mirrored particle (right side)
      ctx.beginPath();
      ctx.arc(
        particles.mirrored.x,
        particles.mirrored.y,
        organicRadius,
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

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    ethAddress: null,
    size: params.size,
    outputPath: params.outputPath,
    isTest: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--ethAddress' && i + 1 < args.length) {
      result.ethAddress = args[++i];
    } else if (arg === '--size' && i + 1 < args.length) {
      result.size = parseInt(args[++i], 10);
    } else if (arg === '--outputPath' && i + 1 < args.length) {
      result.outputPath = args[++i];
    } else if (arg === '--test') {
      result.isTest = true;
    }
  }

  return result;
}

/**
 * Main function
 */
function main() {
  // Parse command line arguments
  const args = parseArgs();

  // Set output path for test mode
  if (args.isTest && !args.outputPath) {
    args.outputPath = './output';
  }

  // Ensure output directories exist
  const outputDir = args.outputPath || './output';
  const metadataDir = `${outputDir}/metadata`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  // Generate output filename - always use test.png for test mode
  const outputFilename = args.isTest
    ? 'test.png'
    : args.ethAddress
    ? `particle_ror_${args.ethAddress.slice(0, 10)}.png`
    : `particle_ror_${Date.now()}.png`;
  const outputPath = `${outputDir}/${outputFilename}`;

  console.log(`Generating particle-based Rorschach inkblot...`);
  console.log(`- Size: ${args.size}x${args.size}`);
  console.log(`- Output: ${outputPath}`);
  if (args.isTest) {
    console.log('- Test mode: Using default parameters');
  }

  // Generate the inkblot
  const imageBuffer = generateParticleRorschach(args.ethAddress, {
    size: args.size,
  });

  // Save image
  fs.writeFileSync(outputPath, imageBuffer);

  console.log(`Inkblot generated successfully!`);

  // Generate metadata if ETH address was provided
  if (args.ethAddress) {
    const ethFeatures = extractEthFeatures(args.ethAddress);
    const colorScheme = getColorSchemeFromEthFeatures(ethFeatures);

    const metadata = {
      name: `Infinite Inkblot ${args.ethAddress.slice(0, 10)}`,
      description:
        'A unique Rorschach-style inkblot generated from an Ethereum address',
      image: outputFilename,
      attributes: [
        {
          trait_type: 'Address',
          value: args.ethAddress,
        },
        {
          trait_type: 'Size',
          value: `${args.size}x${args.size}`,
        },
        {
          trait_type: 'ColorScheme',
          value: colorScheme.is420Address
            ? '420 Special'
            : colorScheme.colorPairName,
        },
        {
          trait_type: 'PrimaryColor',
          value: colorScheme.primaryColor,
        },
        {
          trait_type: 'SecondaryColor',
          value: colorScheme.secondaryColor,
        },
        {
          trait_type: 'Complexity',
          value: 'Medium',
        },
      ],
    };

    const metadataPath = `${metadataDir}/metadata_${args.ethAddress.slice(
      0,
      8
    )}.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved to ${metadataPath}`);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export functions for use as a module
module.exports = {
  generateParticleRorschach,
  extractEthFeatures,
};
