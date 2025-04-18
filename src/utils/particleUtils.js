/**
 * Particle generation utilities that handles the various types of particle
 * patterns.
 *
 * @func generateSymmetricalParticle: Creates the standard symmetrical distribution
 * @func generateInvertedSymmetricalParticle: Creates the "inverted" symmetrical distribution
 * @func generateStarSymmetricalParticle: Creates the pattern for 420 addresses
 */

const config = require('../config');

/**
 * Initialize a seeded random number generator
 * @param {number} seed - Seed value
 * @returns {Function} Seeded random function
 */
function createSeededRandom(seed) {
  let seedValue =
    seed || Math.floor(Math.random() * config.particleParams.SEED_MULTIPLIER);

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
  for (let i = 0; i < config.particleParams.noise.PERMUTATION_SIZE; i++) {
    perm[i] = perm[i + config.particleParams.noise.PERMUTATION_SIZE] =
      Math.floor(seededRandom() * config.particleParams.noise.PERMUTATION_SIZE);
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
    const key = `${x.toFixed(
      config.particleParams.noise.CACHE_PRECISION
    )},${y.toFixed(config.particleParams.noise.CACHE_PRECISION)},${z.toFixed(
      config.particleParams.noise.CACHE_PRECISION
    )}`;

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
  const mappedValue = Math.pow(
    value,
    config.particleParams.plotter.COLOR_DISTRIBUTION_POWER
  );

  // Size of an interval
  const size = 1 / n;
  // Corresponding color index for the current value
  const index = Math.floor(mappedValue * n);
  // Corresponding [0,1] in the current color interval
  const valueInInterval = (mappedValue * n) % 1;

  // Enhanced radius calculation with more variety
  const center = config.particleParams.plotter.RADIUS_CENTER;
  const radiusScale = 2 * (center - Math.abs(valueInInterval - center));

  // Add some randomness to the radius while maintaining the overall structure
  const noiseVariation = Math.pow(
    Math.sin(
      valueInInterval *
        Math.PI *
        config.particleParams.plotter.RADIUS_NOISE_FREQUENCY
    ),
    2
  );
  const enhancedRadiusScale =
    radiusScale *
    (config.particleParams.plotter.RADIUS_BASE_SCALE +
      config.particleParams.plotter.RADIUS_VARIATION_SCALE * noiseVariation);

  return {
    color: colors[Math.min(index, colors.length - 1)],
    radius: maxRadius * enhancedRadiusScale,
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
 * Create symmetrical particles (original and mirrored) - original version
 * @param {Function} seededRandom - Seeded random function
 * @param {number} size - Canvas size
 * @returns {Object} Particle positions (original and mirrored)
 */
function createSymmetricalParticle(
  seededRandom,
  size,
  horizontalMargin,
  verticalMargin
) {
  // calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * horizontalMargin);
  const usableHeight = size * (1 - 2 * verticalMargin);

  // keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // generate a point in the left half of the usable area, then adjust for margin
    x = seededRandom() * (usableWidth / 2) + size * horizontalMargin;
    y = seededRandom() * usableHeight + size * verticalMargin;

    // calculate distance from center as normalized values (0 to 1)
    const centerX = size / 2;
    const centerY = size / 2;

    // normalized distances from center (0 = center, 1 = furthest edge)
    const dx = Math.abs(x - centerX) / (size / 2);
    const dy = Math.abs(y - centerY) / (size / 2);

    // weight the distances differently
    const weightedDist =
      dx * config.particleParams.distribution.HORIZONTAL_WEIGHT +
      dy * config.particleParams.distribution.VERTICAL_WEIGHT;

    // acceptance probability: higher near center, lower near edges
    const acceptanceProbability = Math.pow(
      1 - weightedDist,
      config.particleParams.distribution.DISTANCE_FALLOFF_POWER
    );

    // accept the particle based on its weighted distance from center
    if (
      seededRandom() < acceptanceProbability ||
      attempts > config.particleParams.MAX_ATTEMPTS
    ) {
      break;
    }

    attempts++;
  } while (attempts <= config.particleParams.MAX_ATTEMPTS);

  // create the mirrored point for perfect bilateral symmetry
  const mirrorX = size - x;

  return {
    original: { x, y },
    mirrored: { x: mirrorX, y },
  };
}

/**
 * Create symmetrical particles (original and mirrored) - inverted version
 * Uses a circular boundary with organic falloff for a more splattered look
 * @param {Function} seededRandom - Seeded random function
 * @param {number} size - Canvas size
 * @returns {Object} Particle positions (original and mirrored)
 */
function createInvertedSymmetricalParticle(
  seededRandom,
  size,
  horizontalMargin,
  verticalMargin
) {
  // calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * horizontalMargin);
  const usableHeight = size * (1 - 2 * verticalMargin);

  // calculate the maximum radius for the circular boundary
  // use the smaller of width/2 or height/2 to ensure the circle fits
  const maxRadius = Math.min(usableWidth, usableHeight) / 2;

  // keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // generate a point in the left half of the usable area
    x = seededRandom() * (usableWidth / 2) + size * horizontalMargin;
    y = seededRandom() * usableHeight + size * verticalMargin;

    // calculate distance from center as normalized values (0 to 1)
    const centerX = size / 2;
    const centerY = size / 2;

    // calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) / maxRadius;

    // create a more organic boundary by combining linear and circular falloff
    const linearFalloff = Math.pow(1 - distanceFromCenter, 4);
    const circularFalloff = Math.pow(
      1 - distanceFromCenter * distanceFromCenter,
      2
    );

    // weight the falloffs to create a natural transition
    const acceptanceProbability =
      linearFalloff * config.particleParams.inverted.LINEAR_FALLOFF_WEIGHT +
      circularFalloff * config.particleParams.inverted.CIRCULAR_FALLOFF_WEIGHT;

    // accept the particle based on its distance from center
    if (
      seededRandom() < acceptanceProbability ||
      attempts > config.particleParams.MAX_ATTEMPTS
    ) {
      break;
    }

    attempts++;
  } while (attempts <= config.particleParams.MAX_ATTEMPTS);

  // create the mirrored point for perfect bilateral symmetry
  const mirrorX = size - x;

  return {
    original: { x, y },
    mirrored: { x: mirrorX, y },
  };
}

/**
 * Create symmetrical particles (original and mirrored) - star pattern for 420 addresses
 * Uses radial distribution with angular variation for a leaf-like effect
 * @param {Function} seededRandom - Seeded random function
 * @param {number} size - Canvas size
 * @returns {Object} Particle positions (original and mirrored)
 */
function createStarSymmetricalParticle(
  seededRandom,
  size,
  horizontalMargin,
  verticalMargin
) {
  // calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * horizontalMargin);
  const usableHeight = size * (1 - 2 * verticalMargin);

  // calculate the maximum radius for the star pattern
  const maxRadius = Math.min(usableWidth, usableHeight) / 2;

  // keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // generate a point in the left half of the usable area
    x = seededRandom() * (usableWidth / 2) + size * horizontalMargin;
    y = seededRandom() * usableHeight + size * verticalMargin;

    // calculate distance from center
    const centerX = size / 2;
    const centerY = size / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) / maxRadius;

    // calculate angle from center (in radians)
    const angle = Math.atan2(dy, dx);

    // create leaf pattern by combining multiple components
    const radialFalloff = Math.pow(1 - distanceFromCenter, 3);

    // create 3.5-pointed leaf pattern (7 points total when mirrored)
    // use different frequencies to create more organic variation
    const mainPoints = Math.pow(
      Math.sin(angle * config.particleParams.star.POINTS),
      2
    );
    const subPoints =
      Math.pow(Math.sin(angle * config.particleParams.star.SUBPOINTS), 2) * 0.5;
    const leafPattern =
      mainPoints * config.particleParams.star.MAIN_POINTS_WEIGHT +
      subPoints * config.particleParams.star.SUBPOINTS_WEIGHT;

    // add some asymmetry to make it more leaf-like
    const asymmetry =
      Math.sin(angle * config.particleParams.star.ASYMMETRY_FREQUENCY) *
      config.particleParams.star.ASYMMETRY_SCALE;

    // combine patterns with weights
    const acceptanceProbability =
      radialFalloff * config.particleParams.star.RADIAL_WEIGHT +
      leafPattern * config.particleParams.star.PATTERN_WEIGHT +
      asymmetry * config.particleParams.star.ASYMMETRY_WEIGHT;

    // accept the particle based on the combined pattern
    if (
      seededRandom() < acceptanceProbability ||
      attempts > config.particleParams.MAX_ATTEMPTS
    ) {
      break;
    }

    attempts++;
  } while (attempts <= config.particleParams.MAX_ATTEMPTS);

  // create the mirrored point for bilateral symmetry
  const mirrorX = size - x;

  return {
    original: { x, y },
    mirrored: { x: mirrorX, y },
  };
}

module.exports = {
  createSeededRandom,
  createNoiseFunction,
  getPlotter,
  fadeOut,
  createSymmetricalParticle,
  createInvertedSymmetricalParticle,
  createStarSymmetricalParticle,
};
