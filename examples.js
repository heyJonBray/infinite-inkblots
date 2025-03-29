// Examples script for Infinite Inkblots
// Generates multiple examples from different Ethereum addresses

const {
  generateParticleRorschach,
  extractEthFeatures,
} = require('./src/patternGeneration');
const { getColorSchemeFromEthFeatures } = require('./src/utils/colors');
const fs = require('fs');

// Sample Ethereum addresses for testing
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

// Create output directories
const OUTPUT_DIR = 'output/examples';
const METADATA_DIR = 'output/examples/metadata';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

// Generate for each address
async function generateExamples() {
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
      size: 800,
      outputPath: outputPath,
    });

    // Save the image
    fs.writeFileSync(outputPath, imageBuffer);

    // Extract features and get color scheme
    const ethFeatures = extractEthFeatures(address);
    const colorScheme = getColorSchemeFromEthFeatures(ethFeatures);

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
          value: '800x800',
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

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved to: ${metadataPath}`);
  }

  console.log('\nAll inkblots generated successfully!');
}

// Run the examples
generateExamples().catch(console.error);
