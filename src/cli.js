const fs = require('fs');
const { generateParticleRorschach } = require('./generateRorschach');
const { extractEthFeatures } = require('./utils/ethUtils');
const { getColorSchemeFromEthFeatures } = require('./utils/colors');

const SAMPLE_ADDRESSES = [
  '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', // jonbray.eth
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // vitalik.eth
  '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6', // Maker DAO (palindrome)
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Uniswap address
  '0x0000000000000000000000000000000000000000', // Zero address (monochrome)
  '0x8888888888888888888888888888888888888888', // 88888888 (sepia)
  '0xabcdef0123456789abcdef0123456789abcdef01', // Sequential
  '0x7e2F9dd040cF7B41a1AF9e4A24A0EDB04093d420', // 420 special
];

/**
 * Ensure directories exist
 * @param {string[]} dirs - Array of directory paths to create
 */
function ensureDirs(dirs) {
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Generate output filename for an inkblot
 * @param {string} address - Ethereum address
 * @param {boolean} isTest - Whether this is a test generation
 * @returns {string} Generated filename
 */
function generateOutputFilename(address, isTest = false) {
  if (isTest) return 'test.png';
  if (address) return `inkblot_${address.slice(0, 10)}.png`;
  return `inkblot_${Date.now()}.png`;
}

/**
 * Save metadata for an inkblot
 * @param {string} address - Ethereum address
 * @param {string} outputFilename - Name of the generated image file
 * @param {number} size - Size of the generated image
 * @param {string} metadataDir - Directory to save metadata
 */
function saveMetadata(address, outputFilename, size, metadataDir) {
  const ethFeatures = extractEthFeatures(address);
  const colorScheme = getColorSchemeFromEthFeatures(ethFeatures);

  // log generation details
  logGenerationDetails(address, ethFeatures, colorScheme);

  const metadataPath = `${metadataDir}/metadata_${address.slice(0, 8)}.json`;
  const metadata = generateMetadata(
    address,
    outputFilename,
    size,
    ethFeatures,
    colorScheme
  );

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`Metadata saved to ${metadataPath}`);
}

/**
 * Log generation details for an inkblot
 * @param {string} address - The Ethereum address
 * @param {Object} ethFeatures - Features extracted from the address
 * @param {Object} colorScheme - Color scheme for the inkblot
 */
function logGenerationDetails(address, ethFeatures, colorScheme) {
  console.log(`\nGeneration details for ${address}:`);
  console.log(`- Scale: ${ethFeatures.scale?.toFixed(4) || 'default'}`);
  console.log(`- Particles: ${ethFeatures.particleCount || 'default'}`);
  console.log(`- Frames: ${ethFeatures.framesToRender || 'default'}`);
  console.log(`- Seed: ${ethFeatures.seed}`);
  console.log(
    `- Pattern: ${
      ethFeatures.is420Address
        ? 'Star'
        : ethFeatures.isInverted
        ? 'Inverted'
        : 'Standard'
    }`
  );
  console.log(`- Type: ${ethFeatures.type}`);
  console.log(
    `- Color Scheme: ${
      colorScheme.is420Address ? '420 Special' : colorScheme.colorPairName
    }`
  );
}

/**
 * Generate metadata for an inkblot
 * @param {string} address - Ethereum address
 * @param {string} outputFilename - Name of the generated image file
 * @param {number} size - Size of the generated image
 * @param {Object} ethFeatures - Features extracted from the address
 * @param {Object} colorScheme - Color scheme for the inkblot
 * @returns {Object} Metadata object
 */
function generateMetadata(
  address,
  outputFilename,
  size,
  ethFeatures,
  colorScheme
) {
  const is420Address = address.toLowerCase().includes('420');
  const isInverted = !is420Address && ethFeatures.isPalindrome;

  return {
    name: `Infinite Inkblot ${address.slice(0, 10)}`,
    description:
      'A unique Rorschach-style inkblot generated from an Ethereum address',
    image: outputFilename,
    attributes: [
      {
        trait_type: 'Address',
        value: address,
      },
      {
        trait_type: 'Size',
        value: `${size}x${size}`,
      },
      {
        trait_type: 'Color Relationship',
        value: colorScheme.is420Address
          ? '420 Special'
          : colorScheme.colorPairName,
      },
      {
        trait_type: 'Primary Color',
        value: colorScheme.primaryColor,
      },
      {
        trait_type: 'Secondary Color',
        value: colorScheme.secondaryColor,
      },
      {
        trait_type: 'Type',
        value: ethFeatures.type,
      },
      {
        trait_type: 'Pattern',
        value: is420Address ? 'Leaf' : isInverted ? 'Inverted' : 'Standard',
      },
    ],
  };
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    ethAddress: null,
    size: 1024, // Default size from params
    outputPath: './output', // Default output path from params
    isTest: false,
    runExamples: false, // New flag for examples
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
    } else if (arg === '--examples') {
      result.runExamples = true;
    }
  }

  return result;
}

/**
 * Generate examples for multiple Ethereum addresses
 */
async function generateExamples() {
  const OUTPUT_DIR = 'output/examples';
  const METADATA_DIR = 'output/examples/metadata';

  ensureDirs([OUTPUT_DIR, METADATA_DIR]);

  console.log(
    `Generating inkblots for ${SAMPLE_ADDRESSES.length} addresses...`
  );

  for (let i = 0; i < SAMPLE_ADDRESSES.length; i++) {
    const address = SAMPLE_ADDRESSES[i];
    console.log(
      `\nGenerating for address ${i + 1}/${SAMPLE_ADDRESSES.length}: ${address}`
    );

    const outputFilename = generateOutputFilename(address);
    const outputPath = `${OUTPUT_DIR}/${outputFilename}`;

    // generate inkblot
    const imageBuffer = generateParticleRorschach(address, {
      size: 1024,
      outputPath: outputPath,
    });

    fs.writeFileSync(outputPath, imageBuffer);
    saveMetadata(address, outputFilename, 1024, METADATA_DIR);
  }

  console.log('\nAll inkblots generated successfully!');
}

/**
 * Main CLI function
 */
async function main() {
  const args = parseArgs();

  // --examples flag: run the example addresses
  if (args.runExamples) {
    await generateExamples();
    return;
  }

  if (args.isTest && !args.outputPath) {
    args.outputPath = './output';
  }

  const outputDir = args.outputPath || './output';
  const metadataDir = `${outputDir}/metadata`;

  ensureDirs([outputDir, metadataDir]);

  const outputFilename = generateOutputFilename(args.ethAddress, args.isTest);
  const outputPath = `${outputDir}/${outputFilename}`;

  console.log(`Generating particle-based Rorschach inkblot...`);
  console.log(`- Size: ${args.size}x${args.size}`);
  console.log(`- Output: ${outputPath}`);
  if (args.isTest) {
    console.log('- Test mode: Using default parameters');
  }

  const imageBuffer = generateParticleRorschach(args.ethAddress, {
    size: args.size,
  });

  fs.writeFileSync(outputPath, imageBuffer);
  console.log(`Inkblot generated successfully!`);

  if (args.ethAddress) {
    saveMetadata(args.ethAddress, outputFilename, args.size, metadataDir);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  parseArgs,
  main,
  generateExamples,
};
