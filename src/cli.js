const fs = require('fs');
const { generateParticleRorschach } = require('./generateRorschach');
const { extractEthFeatures } = require('./utils/ethUtils');
const { getColorSchemeFromEthFeatures } = require('./utils/colors');

// Sample Ethereum addresses for examples
const SAMPLE_ADDRESSES = [
  '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', // jonbray.eth
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // vitalik.eth
  '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6', // Maker DAO address
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Uniswap address
  '0x0000000000000000000000000000000000000000', // Zero address
  '0x000000000000000000000000000000000000dead', // "Dead" address
  '0x9e13480a81Af1Dea2f255761810Ef8d6CbF21735', // $ROR address
  '0x8888888888888888888888888888888888888888', // Repeating 8s
  '0xabcdef0123456789abcdef0123456789abcdef01', // Sequential
  '0x7e2F9dd040cF7B41a1AF9e4A24A0EDB04093d420', // 420 special
];

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
  // Create output directories
  const OUTPUT_DIR = 'output/examples';
  const METADATA_DIR = 'output/examples/metadata';

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }

  console.log(
    `Generating inkblots for ${SAMPLE_ADDRESSES.length} addresses...`
  );

  for (let i = 0; i < SAMPLE_ADDRESSES.length; i++) {
    const address = SAMPLE_ADDRESSES[i];
    console.log(
      `\nGenerating for address ${i + 1}/${SAMPLE_ADDRESSES.length}: ${address}`
    );

    const outputPath = `${OUTPUT_DIR}/particle_ror_${address}.png`;

    // Generate the inkblot
    const imageBuffer = generateParticleRorschach(address, {
      size: 1024,
      outputPath: outputPath,
    });

    // Save the image
    fs.writeFileSync(outputPath, imageBuffer);

    // Extract features and get color scheme
    const ethFeatures = extractEthFeatures(address);
    const colorScheme = getColorSchemeFromEthFeatures(ethFeatures);

    // Determine pattern type based on address features
    const is420Address = address.toLowerCase().includes('420');
    const isInverted = !is420Address && ethFeatures.zeros > 0.5;

    // Save metadata
    const metadataPath = `${METADATA_DIR}/metadata_${address.substring(
      0,
      8
    )}.json`;
    const metadata = {
      name: `Infinite Inkblot ${address.slice(0, 10)}`,
      description:
        'A unique Rorschach-style inkblot generated from an Ethereum address',
      image: outputPath.split('/').pop(),
      attributes: [
        {
          trait_type: 'Address',
          value: address,
        },
        {
          trait_type: 'Size',
          value: '1024x1024',
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
        {
          trait_type: 'Pattern',
          value: is420Address ? 'Star' : isInverted ? 'Inverted' : 'Standard',
        },
      ],
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved to: ${metadataPath}`);
  }

  console.log('\nAll inkblots generated successfully!');
}

/**
 * Main CLI function
 */
async function main() {
  // Parse command line arguments
  const args = parseArgs();

  // If --examples flag is set, run the examples generator
  if (args.runExamples) {
    await generateExamples();
    return;
  }

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

    // Determine pattern type based on address features
    const is420Address = args.ethAddress.toLowerCase().includes('420');
    const isInverted = !is420Address && ethFeatures.zeros > 0.5;

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
        {
          trait_type: 'Pattern',
          value: is420Address ? 'Star' : isInverted ? 'Inverted' : 'Standard',
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
  main().catch(console.error);
}

// Export functions for use as a module
module.exports = {
  parseArgs,
  main,
  generateExamples,
};
