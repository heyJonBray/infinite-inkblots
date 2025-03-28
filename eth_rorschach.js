// Ethereum Rorschach Generator
// Based on Nicolas Decoster's code, adapted for ETH address-based generation

const { createCanvas } = require('canvas');
const fs = require('fs');
const crypto = require('crypto');

class EthereumRorschachGenerator {
  constructor(options = {}) {
    // Core parameters
    this.size = options.size || 800;
    this.ethAddress = options.ethAddress || null;
    this.outputPath = options.outputPath || 'out/eth_rorschach.png';
    this.frameCount = 0;
    this.particleCount = options.particleCount || 2000;
    this.runDuration = options.runDuration || 1000; // Number of frames to run

    // Visual parameters
    this.params = {
      size: this.size,
      speed: options.speed || 0.005,
      scale: options.scale || 0.008,
      maxRadius: options.maxRadius || 8,
    };

    this.offsets = {
      x: this.params.size / 2,
      y: this.params.size / 2,
    };

    // Set up canvas and context
    this.canvas = createCanvas(this.size, this.size);
    this.ctx = this.canvas.getContext('2d');

    // Initialize with white background
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.size, this.size);

    // Generate seed from ETH address if provided
    this.seed = this.generateSeedFromAddress();

    // Cache for noise values
    this.noiseCache = {};

    // Customize parameters based on ETH address features
    if (this.ethAddress) {
      this.customizeParamsFromAddress();
    }
  }

  // Generate a deterministic seed from Ethereum address
  generateSeedFromAddress() {
    if (!this.ethAddress || typeof this.ethAddress !== 'string') {
      return Math.floor(Math.random() * 10000);
    }

    // Normalize the address
    const normalizedAddress = this.ethAddress.toLowerCase().replace('0x', '');

    // Create a hash of the address
    const hash = crypto
      .createHash('sha256')
      .update(normalizedAddress)
      .digest('hex');

    // Convert first 8 characters to a number
    return parseInt(hash.substring(0, 8), 16);
  }

  // Extract features from Ethereum address
  extractEthFeatures() {
    if (!this.ethAddress || typeof this.ethAddress !== 'string') {
      return Math.floor(Math.random() * 10000);
    }

    const normalizedAddress = this.ethAddress.toLowerCase().replace('0x', '');

    // Count various character types
    const zeroCount = (normalizedAddress.match(/0/g) || []).length;
    const oneCount = (normalizedAddress.match(/1/g) || []).length;
    const letterCount = normalizedAddress.replace(/[0-9]/g, '').length;
    const charSet = new Set(normalizedAddress.split(''));

    // Calculate ratios
    const charDiversity = charSet.size / normalizedAddress.length;
    const highCharCount = normalizedAddress.replace(/[0-7]/g, '').length;
    const highCharRatio = highCharCount / normalizedAddress.length;
    const evenCharCount = normalizedAddress
      .split('')
      .filter((c) => parseInt(c, 16) % 2 === 0).length;
    const evenCharRatio = evenCharCount / normalizedAddress.length;

    return {
      seed: this.seed,
      zeroCount,
      oneCount,
      letterCount,
      charDiversity,
      highCharRatio,
      evenCharRatio,
    };
  }

  // Customize visual parameters based on address features
  customizeParamsFromAddress() {
    const features = this.extractEthFeatures();
    if (!features) return;

    // Map features to visual parameters
    this.params.scale = 0.005 + features.charDiversity * 0.01;
    this.params.maxRadius = 5 + features.oneCount * 0.2;
    this.params.speed = 0.004 + features.highCharRatio * 0.005;
    this.particleCount = 1500 + features.zeroCount * 50;

    // Choose color scheme based on ETH address characteristics
    this.colorScheme = this.selectColorScheme(features);
  }

  // Select a color scheme based on ETH features
  selectColorScheme(features) {
    if (features.highCharRatio > 0.6) {
      return 'blues';
    } else if (features.evenCharRatio > 0.6) {
      return 'reds';
    } else if (features.charDiversity < 0.3) {
      return 'grayscale';
    } else {
      return 'default';
    }
  }

  // Noise function (simplified Perlin noise)
  noise(x, y, z = 0) {
    // Apply seed to coordinates
    const seedFactor = this.seed % 1000;
    x = x + seedFactor;
    y = y + seedFactor;

    // Cache key for memoization
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (this.noiseCache[key]) return this.noiseCache[key];

    // Simple implementation of noise
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Use seed to generate consistent but random-looking values
    const A = (this.perm[X & 255] + Y) & 255;
    const B = (this.perm[(X + 1) & 255] + Y) & 255;
    const C = (this.perm[A & 255] + Z) & 255;
    const D = (this.perm[(A + 1) & 255] + Z) & 255;
    const E = (this.perm[B & 255] + Z) & 255;
    const F = (this.perm[(B + 1) & 255] + Z) & 255;

    const result = this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.perm[C & 255], x, y, z),
          this.grad(this.perm[D & 255], x - 1, y, z)
        ),
        this.lerp(
          u,
          this.grad(this.perm[E & 255], x, y - 1, z),
          this.grad(this.perm[F & 255], x - 1, y - 1, z)
        )
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.perm[(C + 1) & 255], x, y, z - 1),
          this.grad(this.perm[(D + 1) & 255], x - 1, y, z - 1)
        ),
        this.lerp(
          u,
          this.grad(this.perm[(E + 1) & 255], x, y - 1, z - 1),
          this.grad(this.perm[(F + 1) & 255], x - 1, y - 1, z - 1)
        )
      )
    );

    // Save to cache and return normalized to 0-1 range
    this.noiseCache[key] = (result + 1) / 2;
    return this.noiseCache[key];
  }

  // Helper methods for noise function
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Initialize permutation table with seed
  initPermTable() {
    this.perm = new Array(512);
    const p = new Array(256);

    // Initialize with values 0...255
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Fisher-Yates shuffle based on seed
    const seedRng = this.seededRandom(this.seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seedRng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate values for seamless wrapping
    for (let i = 0; i < 256; i++) {
      this.perm[i] = this.perm[i + 256] = p[i];
    }
  }

  // Seeded random function
  seededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Fade out existing content (used for animation effect)
  fadeOut() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(0, 0, this.params.size, this.params.size);
  }

  // Rotate a point around origin
  rotatePlotter(x0, y0, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = x0 * cos - y0 * sin;
    const y = x0 * sin + y0 * cos;
    return [x, y];
  }

  // Get plotter characteristics from a value in [0, 1] interval
  getPlotter(value) {
    let colors;

    // Select color scheme
    switch (this.colorScheme) {
      case 'blues':
        colors = [
          [255, 255, 255, 0], // Transparent
          [85, 142, 213, 150], // Light blue
          [45, 96, 179, 150], // Medium blue
          [28, 69, 135, 150], // Dark blue
          [50, 50, 50, 150], // Gray
        ];
        break;
      case 'reds':
        colors = [
          [255, 255, 255, 0], // Transparent
          [235, 85, 85, 150], // Light red
          [213, 45, 45, 150], // Medium red
          [179, 18, 18, 150], // Dark red
          [50, 50, 50, 150], // Gray
        ];
        break;
      case 'grayscale':
        colors = [
          [255, 255, 255, 0], // Transparent
          [200, 200, 200, 150], // Light gray
          [128, 128, 128, 150], // Medium gray
          [50, 50, 50, 150], // Dark gray
          [0, 0, 0, 150], // Black
        ];
        break;
      default: // Original scheme
        colors = [
          [255, 255, 255, 0], // Transparent
          [235, 23, 25, 150], // Red
          [28, 69, 113, 150], // Blue
          [0, 0, 0, 150], // Black
        ];
        break;
    }

    // Size of an interval
    const n = colors.length;
    const size = 1 / n;

    // Corresponding color index for current value
    const index = Math.min(Math.floor(value / size), n - 1);

    // Position within the current interval
    const valueInInterval = (value - index * size) / size;

    // Calculate radius (using a different approach for better results)
    const radius = Math.max(
      1,
      this.params.maxRadius * (0.3 + 0.7 * valueInInterval)
    );

    return {
      color: colors[index],
      radius: radius,
    };
  }

  // Draw one frame of the animation
  drawFrame() {
    this.frameCount++;
    this.fadeOut();

    // Create a seeded random function
    const seedRng = this.seededRandom(this.seed + this.frameCount);

    // Draw particles
    for (let i = 0; i < this.particleCount; i++) {
      const a = seedRng() * 100;
      const b = seedRng() * 100;

      // Generate base coordinates
      const baseX = this.noise(a, b);
      const baseY = this.noise(b, a);

      // Scale to appropriate range and center
      const scaleFactor = 0.8;
      const x0 = (baseX - 0.5) * this.size * scaleFactor;
      const y0 = (baseY - 0.5) * this.size * scaleFactor;

      // Apply rotation for symmetry
      const angle = (-Math.PI * 3) / 4;
      const [x, y] = this.rotatePlotter(x0, y0, angle);

      // Add offsets to center in canvas
      const x1 = x + this.offsets.x;
      const y1 = y + this.offsets.y;

      // Symmetry - create mirrored particle
      const x2 = -x + this.offsets.x;
      const y2 = y + this.offsets.y;

      // Get plotter properties based on its position
      const val = this.noise(
        x * this.params.scale * 10,
        y * this.params.scale * 10,
        this.frameCount * this.params.speed
      );

      const plotter = this.getPlotter(val);

      // Skip transparent particles
      if (plotter.color[3] <= 0) continue;

      // Draw the particles
      this.ctx.fillStyle = `rgba(${plotter.color[0]}, ${plotter.color[1]}, ${
        plotter.color[2]
      }, ${plotter.color[3] / 255})`;
      this.ctx.beginPath();
      this.ctx.arc(x1, y1, plotter.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(x2, y2, plotter.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Return true if we should continue drawing
    return this.frameCount < this.runDuration;
  }

  // Run the complete generation process
  generate() {
    // Initialize
    this.initPermTable();

    // Run animation until completion
    console.log(
      `Generating Rorschach from address: ${this.ethAddress || 'random'}`
    );
    console.log(`Using seed: ${this.seed}`);

    let framesLeft = true;
    while (framesLeft) {
      framesLeft = this.drawFrame();
      // Show progress
      if (this.frameCount % 100 === 0) {
        console.log(
          `Progress: ${Math.floor((this.frameCount / this.runDuration) * 100)}%`
        );
      }
    }

    // Save final image
    this.saveImage();

    // Extract and return traits
    return this.extractTraits();
  }

  // Save the canvas as an image file
  saveImage() {
    // Create directory if it doesn't exist
    const dir = this.outputPath.substring(0, this.outputPath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save the canvas to a file
    const buffer = this.canvas.toBuffer('image/png');
    fs.writeFileSync(this.outputPath, buffer);
    console.log(`Image saved to: ${this.outputPath}`);
  }

  // Extract traits for NFT metadata
  extractTraits() {
    const features = this.extractEthFeatures();

    const traits = {
      colorScheme: this.colorScheme || 'default',
      particleDensity:
        this.particleCount < 2000
          ? 'Sparse'
          : this.particleCount < 3000
          ? 'Medium'
          : 'Dense',
      particleSize:
        this.params.maxRadius < 6
          ? 'Small'
          : this.params.maxRadius < 10
          ? 'Medium'
          : 'Large',
      complexity:
        this.params.scale < 0.006
          ? 'High'
          : this.params.scale < 0.01
          ? 'Medium'
          : 'Low',
    };

    return traits;
  }
}

// Example usage
function main() {
  const args = processArguments();

  const generator = new EthereumRorschachGenerator({
    size: args.size || 800,
    ethAddress: args.ethAddress,
    outputPath:
      args.outputPath || `out/particle_ror_${args.ethAddress || 'random'}.png`,
    particleCount: args.particleCount || 2000,
    runDuration: args.runDuration || 1000,
    scale: args.scale || 0.008,
    maxRadius: args.maxRadius || 8,
    speed: args.speed || 0.005,
  });

  const traits = generator.generate();

  console.log('NFT Traits:');
  for (const [key, value] of Object.entries(traits)) {
    console.log(`  ${key}: ${value}`);
  }

  // Save metadata if requested
  if (args.saveMetadata) {
    const metadataPath = args.outputPath.replace('.png', '.json');
    const metadata = {
      name: `Infinite Inkblot ${
        args.ethAddress ? args.ethAddress.substring(0, 8) : 'Random'
      }`,
      description:
        'A unique Rorschach-style inkblot generated from an Ethereum address',
      image: args.outputPath.split('/').pop(),
      attributes: Object.entries(traits).map(([trait_type, value]) => ({
        trait_type,
        value,
      })),
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved to: ${metadataPath}`);
  }
}

// Process command line arguments
function processArguments() {
  const args = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value =
        process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
          ? process.argv[++i]
          : true;

      // Convert numeric values
      args[key] =
        !isNaN(value) && typeof value === 'string' ? Number(value) : value;
    }
  }

  return args;
}

// Run the program
main();
