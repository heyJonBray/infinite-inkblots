/**
 * Rendering utilities for particle generation
 */

const RENDER_CONSTANTS = {
  MIN_PARTICLE_SIZE_RATIO: 0.1,
  EDGE_FALLOFF_FACTOR: 0.8,
  EDGE_NOISE_MULTIPLIER: 0.4,
  DISTANCE_CENTER_WEIGHT: 0.5,
  EDGE_NOISE_FREQUENCY: 8,
};

/**
 * Initialize the canvas with white background
 * @param {Object} canvasLib - Canvas creation library
 * @param {number} size - Canvas size
 * @returns {Object} Canvas and context
 */
function initializeCanvas(canvasLib, size) {
  const canvas = canvasLib(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  return { canvas, ctx };
}

/**
 * Applies fade-out effect on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 * @param {number} alpha - Alpha value for fade (lower = more accumulation)
 */
function fadeCanvas(ctx, size, alpha) {
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha / 255})`;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Calculate distance from center as a normalized value
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} size - Canvas size
 * @returns {number} Normalized distance from center (0-1)
 */
function calculateDistanceFromCenter(x, y, centerX, centerY, size) {
  return Math.sqrt(
    Math.pow((x - centerX) / size, 2) + Math.pow((y - centerY) / size, 2)
  );
}

/**
 * Calculate adjusted noise value based on distance from center
 * @param {number} noiseValue - Original noise value
 * @param {number} distanceFromCenter - Distance from center (0-1)
 * @returns {number} Adjusted noise value
 */
function calculateAdjustedNoiseValue(noiseValue, distanceFromCenter) {
  return (
    noiseValue *
    (1 - distanceFromCenter * RENDER_CONSTANTS.DISTANCE_CENTER_WEIGHT)
  );
}

/**
 * Calculate final particle radius with organic edge effects
 * @param {number} baseRadius - Base radius from plotter
 * @param {number} distanceFromCenter - Distance from center (0-1)
 * @param {number} maxRadius - Maximum particle radius
 * @returns {number} Final particle radius
 */
function calculateParticleRadius(baseRadius, distanceFromCenter, maxRadius) {
  // edge factor for organic particle falloff
  const edgeFactor = Math.pow(distanceFromCenter, 2);
  const sizeVariation = 1 - edgeFactor * RENDER_CONSTANTS.EDGE_FALLOFF_FACTOR;

  // add randomness to edges
  const edgeNoise = Math.pow(
    Math.sin(
      distanceFromCenter * Math.PI * RENDER_CONSTANTS.EDGE_NOISE_FREQUENCY
    ),
    2
  );

  const organicRadius =
    baseRadius *
    (sizeVariation *
      (0.6 + RENDER_CONSTANTS.EDGE_NOISE_MULTIPLIER * edgeNoise));

  // ensure minimum particle size
  // @todo revisit minimum size and consider making smaller and more frequent for better detail
  return Math.max(
    organicRadius,
    maxRadius * RENDER_CONSTANTS.MIN_PARTICLE_SIZE_RATIO
  );
}

/**
 * Draw a particle on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} radius - Particle radius
 */
function drawParticle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

/**
 * Render a symmetrical particle pair
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} particles - Particle positions (original and mirrored)
 * @param {string} color - Particle color
 * @param {number} radius - Particle radius
 */
function renderParticlePair(ctx, particles, color, radius) {
  ctx.fillStyle = color;

  // draw original particle (left side)
  drawParticle(ctx, particles.original.x, particles.original.y, radius);

  // draw mirrored particle (right side)
  drawParticle(ctx, particles.mirrored.x, particles.mirrored.y, radius);
}

/**
 * Render a frame of particles
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} params - Rendering parameters
 * @param {Object} state - Current state (frame, colors, etc.)
 * @param {Function} createParticleFunc - Function to create particles
 * @param {Function} noiseFunc - Noise function
 */
function renderFrame(ctx, params, state, createParticleFunc, noiseFunc) {
  const {
    size,
    particleCount,
    scale,
    speed,
    maxRadius,
    horizontalMargin,
    verticalMargin,
  } = params;

  const { frame, seededRandom, colors } = state;
  const centerX = size / 2;
  const centerY = size / 2;

  // fade the canvas
  fadeCanvas(ctx, size, params.fadeAlpha);

  // generate and render particles
  for (let i = 0; i < particleCount; i++) {
    // create particle pair using the provided function
    const particles = createParticleFunc(
      seededRandom,
      size,
      horizontalMargin,
      verticalMargin
    );

    // calculate noise value
    const xNoise = particles.original.x * scale;
    const yNoise = particles.original.y * scale;
    const timeNoise = frame * speed;
    const noiseValue = noiseFunc(xNoise, yNoise, timeNoise);

    // calculate distance-based values
    const distanceFromCenter = calculateDistanceFromCenter(
      particles.original.x,
      particles.original.y,
      centerX,
      centerY,
      size
    );

    // adjust noise value based on distance
    const adjustedValue = calculateAdjustedNoiseValue(
      noiseValue,
      distanceFromCenter
    );

    // get particle properties
    const { color, radius } = state.getPlotter(
      adjustedValue,
      colors,
      maxRadius
    );

    // calculate final radius with organic edge effects
    const finalRadius = calculateParticleRadius(
      radius,
      distanceFromCenter,
      maxRadius
    );

    // render the particle pair
    renderParticlePair(ctx, particles, color, finalRadius);
  }

  // output progress indicator
  if (frame % 10 === 0) {
    process.stdout.write('.');
  }
}

/**
 * Render a complete Rorschach inkblot
 * @param {Object} canvasLib - Canvas creation library
 * @param {Object} params - Rendering parameters
 * @param {Object} state - Rendering state
 * @returns {Buffer} PNG image buffer
 */
function renderRorschach(canvasLib, params, state) {
  const { canvas, ctx } = initializeCanvas(canvasLib, params.size);
  const centerX = params.size / 2;
  const centerY = params.size / 2;

  console.log(
    `Generating particle-based Rorschach with ${params.framesToRender} frames and ${params.particleCount} particles per frame...`
  );

  // select particle creation function based on pattern type
  let createParticleFunc;
  if (state.is420Address) {
    createParticleFunc = state.createStarSymmetricalParticle;
  } else {
    createParticleFunc = state.isInverted
      ? state.createInvertedSymmetricalParticle
      : state.createSymmetricalParticle;
  }

  // render all frames
  for (let frame = 0; frame < params.framesToRender; frame++) {
    renderFrame(
      ctx,
      params,
      { ...state, frame, centerX, centerY },
      createParticleFunc,
      state.noise
    );
  }

  process.stdout.write('\n');

  // return the image buffer
  return canvas.toBuffer('image/png');
}

module.exports = {
  RENDER_CONSTANTS,
  initializeCanvas,
  fadeCanvas,
  calculateDistanceFromCenter,
  calculateAdjustedNoiseValue,
  calculateParticleRadius,
  drawParticle,
  renderParticlePair,
  renderFrame,
  renderRorschach,
};
