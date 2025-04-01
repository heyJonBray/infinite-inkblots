module.exports = {
  defaultParams: {
    size: 1024, // canvas size
    particleCount: 100, // particles per frame
    framesToRender: 220, // simulate frames
    speed: 0.005, // animation speed
    scale: 0.01, // noise scale
    maxRadius: 8,
    fadeAlpha: 5, // lower = more particle accumulation
    outputPath: './output',
    horizontalMargin: 0.1,
    verticalMargin: 0.25,
  },

  particleParams: {
    // basic constants
    SEED_MULTIPLIER: 1000000,
    MAX_ATTEMPTS: 10,

    // noise function parameters
    noise: {
      CACHE_PRECISION: 4,
      PERMUTATION_SIZE: 256,
    },

    // plotter parameters
    plotter: {
      COLOR_DISTRIBUTION_POWER: 1.5,
      RADIUS_CENTER: 0.5,
      RADIUS_NOISE_FREQUENCY: 4,
      RADIUS_BASE_SCALE: 0.7,
      RADIUS_VARIATION_SCALE: 0.3,
    },

    // particle distribution parameters
    distribution: {
      HORIZONTAL_WEIGHT: 0.7,
      VERTICAL_WEIGHT: 0.3,
      DISTANCE_FALLOFF_POWER: 4,
    },

    // inverted pattern parameters
    inverted: {
      LINEAR_FALLOFF_WEIGHT: 0.7,
      CIRCULAR_FALLOFF_WEIGHT: 0.3,
    },

    // star pattern parameters
    star: {
      POINTS: 3.5,
      SUBPOINTS: 7,
      MAIN_POINTS_WEIGHT: 0.7,
      SUBPOINTS_WEIGHT: 0.3,
      ASYMMETRY_FREQUENCY: 1.75,
      ASYMMETRY_SCALE: 0.2,
      RADIAL_WEIGHT: 0.5,
      PATTERN_WEIGHT: 0.4,
      ASYMMETRY_WEIGHT: 0.1,
    },
  },
  // particle size and edge parameters
  renderParams: {
    MIN_PARTICLE_SIZE_RATIO: 0.1,
    EDGE_FALLOFF_FACTOR: 0.8,
    EDGE_NOISE_MULTIPLIER: 0.4,
    DISTANCE_CENTER_WEIGHT: 0.5,
    EDGE_NOISE_FREQUENCY: 8,
  },

  colorTheory: {
    // color space limits
    space: {
      HUE_MAX: 360,
      SATURATION_MAX: 1,
      LIGHTNESS_MAX: 1,
      RGB_MAX: 255,
    },

    // primary color generation ranges
    primary: {
      SATURATION_MIN: 0.7,
      SATURATION_RANGE: 0.2,
      LIGHTNESS_MIN: 0.4,
      LIGHTNESS_RANGE: 0.3,
    },

    // secondary color adjustments
    secondary: {
      VARIATION_RANGE: 0.2,
      ANALOGOUS_HUE_OFFSET: 20,
      VIBRANT_SATURATION_THRESHOLD: 0.8,
      VIBRANT: {
        SAT_MIN: 0.6,
        SAT_MAX: 0.8,
        LIGHT_MIN: 0.3,
        LIGHT_MAX: 0.5,
      },
      BALANCED: {
        SAT_MIN: 0.7,
        SAT_MAX: 0.9,
        LIGHT_MIN: 0.4,
        LIGHT_MAX: 0.7,
      },
    },

    // special case colors
    special: {
      420: {
        HUE: 120,
        SAT: 0.8,
        LIGHT: 0.4,
      },
      MONOCHROME: {
        SAT: 0.1,
        LIGHT: 0.25,
      },
      SEPIA: {
        HUE: 30,
        SAT: 0.6,
        LIGHT: 0.4,
      },
    },

    // thresholds for color naming
    naming: {
      DEEP_LIGHTNESS: 0.1,
      PALE_LIGHTNESS: 0.9,
      MUTED_SATURATION: 0.3,
      DARK_LIGHTNESS: 0.2,
      LIGHT_LIGHTNESS: 0.8,
    },

    // hue ranges for color naming
    hueRanges: {
      RED: { min: 345, max: 15 },
      ORANGE: { min: 15, max: 45 },
      YELLOW: { min: 45, max: 75 },
      GREEN: { min: 75, max: 165 },
      TEAL: { min: 165, max: 195 },
      BLUE: { min: 195, max: 255 },
      INDIGO: { min: 255, max: 285 },
      PURPLE: { min: 285, max: 345 },
    },
  },
};
