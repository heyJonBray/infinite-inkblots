// Particle-Based Rorschach Generator
// Creates Rorschach-style inkblots using particles and noise fields
// Takes inspiration from both the original P5.js sketch and the Python implementation

const fs = require('fs');
const { createCanvas } = require('canvas');
const crypto = require('crypto');

// Configuration parameters
const params = {
  size: 800, // Canvas size
  particleCount: 30, // Particles per frame
  framesToRender: 200, // Number of frames to simulate
  speed: 0.005, // Animation speed
  scale: 0.008, // Noise scale
  maxRadius: 8, // Maximum particle radius
  fadeAlpha: 5, // Fade-out alpha value (lower = more particle accumulation)
  outputPath: './output', // Output directory
  horizontalMargin: 0.1, // 10% margin on left/right edges
  verticalMargin: 0.15, // 15% margin on top/bottom edges
};

// Offsets for proper placement
const offsets = {
  x: params.size / 2, // Center horizontally
  y: params.size / 2, // Center vertically
};

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
      seed: Math.floor(Math.random() * 100000),
    };
  }

  // Strip the '0x' prefix
  const cleanAddress = ethAddress.slice(2).toLowerCase();

  // Count character types
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

  // Calculate diversity by counting unique characters
  const uniqueChars = new Set(cleanAddress).size;
  const diversity = uniqueChars / 16; // 16 possible hex characters

  // Create a deterministic seed from the address
  const hash = crypto.createHash('sha256').update(cleanAddress).digest('hex');
  const seed = parseInt(hash.slice(0, 8), 16);

  return {
    diversity: diversity,
    zeros: zeros / cleanAddress.length,
    ones: ones / cleanAddress.length,
    letters: letters / cleanAddress.length,
    highValues: highValues / cleanAddress.length,
    evenChars: evenChars / cleanAddress.length,
    seed: seed,
  };
}

/**
 * Apply Ethereum features to modify generation parameters
 * @param {Object} baseParams - Base parameters
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Object} Modified parameters
 */
function customizeParamsFromEthFeatures(baseParams, ethFeatures) {
  const modifiedParams = { ...baseParams };

  // Adjust scale based on diversity - more diverse addresses get more detailed patterns
  modifiedParams.scale = 0.005 + ethFeatures.diversity * 0.01;

  // Adjust speed based on zeros
  modifiedParams.speed = 0.003 + ethFeatures.zeros * 0.004;

  // Adjust max particle radius based on high values
  modifiedParams.maxRadius = 5 + ethFeatures.highValues * 10;

  // Adjust particle count based on ones - constrained between 50-100
  modifiedParams.particleCount = Math.floor(50 + ethFeatures.ones * 50);

  // Adjust frames based on letters - constrained between 50-200
  modifiedParams.framesToRender = Math.floor(50 + ethFeatures.letters * 150);

  return modifiedParams;
}

/**
 * Get color scheme based on Ethereum features
 * @param {Object} ethFeatures - Ethereum features
 * @returns {Array} Array of colors to use for the plotter
 */
function getColorSchemeFromEthFeatures(ethFeatures) {
  const alpha = 150; // Semi-transparent

  // Helper function to create color strings
  function createColor(r, g, b, a = alpha) {
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  }

  const white = createColor(255, 255, 255);
  const black = createColor(0, 0, 0, alpha);
  const primaryColor = createColor(28, 69, 113, alpha);
  const secondaryColor = createColor(235, 23, 25, alpha);

  // Default color scheme - added one more black entry
  let colors = [
    white,
    white,
    primaryColor,
    white,
    primaryColor,
    white,
    black,
    white,
    black,
    white,
  ];

  // Customize colors based on ETH features
  if (ethFeatures.diversity > 0.7) {
    // High diversity - more color variation - added one more black entry
    colors = [
      white,
      secondaryColor,
      white,
      primaryColor,
      white,
      black,
      white,
      black,
      secondaryColor,
      white,
    ];
  } else if (ethFeatures.letters > 0.6) {
    // Many letters - blue dominant - added a black entry
    colors = [
      white,
      white,
      primaryColor,
      white,
      primaryColor,
      primaryColor,
      black,
      white,
      white,
    ];
  } else if (ethFeatures.zeros > 0.3) {
    // Many zeros - high contrast - added more black entries
    colors = [
      white,
      primaryColor,
      black,
      white,
      secondaryColor,
      white,
      black,
      white,
    ];
  }

  return colors;
}

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
  // Size of an interval
  const size = 1 / n;
  // Corresponding color index for the current value
  const index = Math.floor(value / size);
  // Corresponding [0,1] in the current color interval
  const valueInInterval = (value - index * size) / size;

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

    // Calculate distance from center as a normalized value (0 to 1)
    const centerX = size / 2;
    const centerY = size / 2;

    // Normalized distance from center (0 = center, 1 = furthest corner)
    const dx = (x - centerX) / (size / 2);
    const dy = (y - centerY) / (size / 2);

    // Distance from center (0 to 1)
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);

    // Acceptance probability: higher near center, lower near edges
    // Adjust the exponent (3) to control how quickly probability drops off
    const acceptanceProbability = Math.pow(1 - distFromCenter, 3);

    // Accept the particle based on its distance from center
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
  let colors = [
    `rgba(255, 255, 255, 1)`,
    `rgba(28, 69, 113, 0.6)`,
    `rgba(235, 23, 25, 0.6)`,
    `rgba(0, 0, 0, 0.6)`,
  ];

  if (ethAddress) {
    ethFeatures = extractEthFeatures(ethAddress);

    // Customize parameters based on ETH features
    Object.assign(
      currentParams,
      customizeParamsFromEthFeatures(currentParams, ethFeatures)
    );

    // Get color scheme based on ETH features
    colors = getColorSchemeFromEthFeatures(ethFeatures);

    // Initialize seeded random with ETH seed
    seededRandom = createSeededRandom(ethFeatures.seed);

    console.log(`Using ETH features for address ${ethAddress}:`);
    console.log(`- Diversity: ${ethFeatures.diversity.toFixed(2)}`);
    console.log(`- Scale: ${currentParams.scale.toFixed(4)}`);
    console.log(`- Particles: ${currentParams.particleCount}`);
    console.log(`- Frames: ${currentParams.framesToRender}`);
    console.log(`- Seed: ${ethFeatures.seed}`);
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
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--ethAddress' && i + 1 < args.length) {
      result.ethAddress = args[++i];
    } else if (arg === '--size' && i + 1 < args.length) {
      result.size = parseInt(args[++i], 10);
    } else if (arg === '--outputPath' && i + 1 < args.length) {
      result.outputPath = args[++i];
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

  // Ensure output directory exists
  if (!fs.existsSync(args.outputPath)) {
    fs.mkdirSync(args.outputPath, { recursive: true });
  }

  // Generate output filename
  // const outputFilename = args.ethAddress
  //   ? `particle_ror_${args.ethAddress.slice(0, 10)}.png`
  //   : `particle_ror_${Date.now()}.png`;
  const outputFilename = `test.png`;
  const outputPath = `${args.outputPath}/${outputFilename}`;

  console.log(`Generating particle-based Rorschach inkblot...`);
  console.log(`- Size: ${args.size}x${args.size}`);
  console.log(`- Output: ${outputPath}`);

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
    const metadata = {
      name: `Infinite Inkblot ${args.ethAddress.slice(0, 10)}`,
      description:
        'A unique Rorschach-style inkblot generated from an Ethereum address',
      image: outputFilename,
      attributes: [
        {
          trait_type: 'ColorScheme',
          value:
            ethFeatures.diversity > 0.7
              ? 'Vibrant'
              : ethFeatures.letters > 0.6
              ? 'Blues'
              : ethFeatures.zeros > 0.3
              ? 'Monochrome'
              : 'Classic',
        },
        {
          trait_type: 'Complexity',
          value:
            ethFeatures.diversity > 0.6
              ? 'High'
              : ethFeatures.diversity > 0.4
              ? 'Medium'
              : 'Low',
        },
        {
          trait_type: 'ParticleCount',
          value: params.particleCount * params.framesToRender,
        },
        {
          trait_type: 'Size',
          value: `${args.size}x${args.size}`,
        },
      ],
    };

    const metadataPath = `${args.outputPath}/metadata_${args.ethAddress.slice(
      0,
      10
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
