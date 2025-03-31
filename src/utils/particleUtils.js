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

  // Enhanced radius calculation with more variety
  // Use a combination of noise-based variation and position-based scaling
  const center = 0.5;
  const radiusScale = 2 * (center - Math.abs(valueInInterval - center));

  // Add some randomness to the radius while maintaining the overall structure
  const noiseVariation = Math.pow(Math.sin(valueInInterval * Math.PI * 4), 2);
  const enhancedRadiusScale = radiusScale * (0.7 + 0.3 * noiseVariation);

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
  // Calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * horizontalMargin);
  const usableHeight = size * (1 - 2 * verticalMargin);

  // Keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // Generate a point in the left half of the usable area, then adjust for margin
    x = seededRandom() * (usableWidth / 2) + size * horizontalMargin;
    y = seededRandom() * usableHeight + size * verticalMargin;

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
  // Calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * horizontalMargin);
  const usableHeight = size * (1 - 2 * verticalMargin);

  // Calculate the maximum radius for the circular boundary
  // Use the smaller of width/2 or height/2 to ensure the circle fits
  const maxRadius = Math.min(usableWidth, usableHeight) / 2;

  // Keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // Generate a point in the left half of the usable area
    x = seededRandom() * (usableWidth / 2) + size * horizontalMargin;
    y = seededRandom() * usableHeight + size * verticalMargin;

    // Calculate distance from center as normalized values (0 to 1)
    const centerX = size / 2;
    const centerY = size / 2;

    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) / maxRadius;

    // Create a more organic boundary by combining linear and circular falloff
    const linearFalloff = Math.pow(1 - distanceFromCenter, 4);
    const circularFalloff = Math.pow(
      1 - distanceFromCenter * distanceFromCenter,
      2
    );

    // Weight the falloffs to create a natural transition
    const acceptanceProbability = linearFalloff * 0.7 + circularFalloff * 0.3;

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
  // Calculate the usable area dimensions
  const usableWidth = size * (1 - 2 * horizontalMargin);
  const usableHeight = size * (1 - 2 * verticalMargin);

  // Calculate the maximum radius for the star pattern
  const maxRadius = Math.min(usableWidth, usableHeight) / 2;

  // Keep trying until we get a valid particle
  let attempts = 0;
  let x, y;

  do {
    // Generate a point in the left half of the usable area
    x = seededRandom() * (usableWidth / 2) + size * horizontalMargin;
    y = seededRandom() * usableHeight + size * verticalMargin;

    // Calculate distance from center
    const centerX = size / 2;
    const centerY = size / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) / maxRadius;

    // Calculate angle from center (in radians)
    const angle = Math.atan2(dy, dx);

    // Create leaf pattern by combining multiple components
    const radialFalloff = Math.pow(1 - distanceFromCenter, 3);

    // Create 3.5-pointed leaf pattern (7 points total when mirrored)
    // Use different frequencies to create more organic variation
    const mainPoints = Math.pow(Math.sin(angle * 3.5), 2); // Main 3.5 points per side
    const subPoints = Math.pow(Math.sin(angle * 7), 2) * 0.5; // Sub-points for texture
    const leafPattern = mainPoints * 0.7 + subPoints * 0.3;

    // Add some asymmetry to make it more leaf-like
    const asymmetry = Math.sin(angle * 1.75) * 0.2; // Creates slight asymmetry in the lobes

    // Combine patterns with weights
    const acceptanceProbability =
      radialFalloff * 0.5 + // Base radial distribution
      leafPattern * 0.4 + // Main leaf pattern
      asymmetry * 0.1; // Asymmetry for organic feel

    // Accept the particle based on the combined pattern
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

// Export all the particle-related functions
module.exports = {
  createSeededRandom,
  createNoiseFunction,
  getPlotter,
  fadeOut,
  createSymmetricalParticle,
  createInvertedSymmetricalParticle,
  createStarSymmetricalParticle,
};
