# Infinite Inkblots

A generative art system that creates unique, deterministic Rorschach-style inkblots from Ethereum addresses for NFTs. Each address produces a consistent, reproducible particle-based image.

## Features

- **Deterministic Generation**: Same Ethereum address always produces the same inkblot
- **Particle-Based Animation**: Thousands of small circles create organic, symmetrical patterns
- **Color Theory Integration**: Colors are derived from address characteristics
- **NFT-Ready**: Includes metadata generation and trait extraction
- **Special Cases**: Unique patterns for addresses containing "420" or with repeating characters

## Color Theory

The system uses color theory to create harmonious color combinations based on Ethereum address characteristics:

### Color Generation

- Primary color is derived from the first 7 characters of the address
  - First 3 characters determine the base hue (0-360°)
  - Next 2 characters set saturation (70-90%)
  - Next 2 characters control lightness (40-70%)

### Color Relationships

The system creates color pairs using the following relationships:

1. **Harmony (Adjacent Colors)**

   - Default relationship for most addresses
   - Colors are 20° apart on the color wheel
   - High saturation (70-90%) for vibrant combinations
   - Balanced lightness (40-70%) for optimal contrast

2. **Special Cases**
   - **420 Special**: Green color pair for addresses containing "420"
   - **Monochrome**: Low-saturation grayscale for addresses with repeating zeros
   - **Sepia**: Warm earth tones for addresses with repeating non-zero characters

### Color Naming

Colors are named based on their position on the color wheel and their properties:

- Base colors: Red, Orange, Yellow, Green, Teal, Blue, Indigo, Purple
- Modifiers: Dark, Light, Muted, Vibrant
- Special cases: Deep, Pale, Gray percentages

## Installation

```bash
npm install
```

## Usage

### Command Line

```bash
node index.js --ethAddress 0x123... --size 800 --outputPath output.png
```

Options:

- `--ethAddress`: Ethereum address for deterministic generation
- `--size`: Canvas size in pixels (default: 800)
- `--outputPath`: Path for saving the output image
- `--particleCount`: Number of particles per frame
- `--runDuration`: Number of frames to generate
- `--saveMetadata`: Flag to save NFT metadata
- `--examples`: Generate predefined example inkblots

You can also generate images for 50 random addresses to get a feel for what the inkblots look like in the wild:

```bash
node src/testAddresses.js
```

### API

```javascript
const { generateInkblot } = require('./src/generateRorschach');

const result = await generateInkblot({
  ethAddress: '0x123...',
  size: 800,
  outputPath: 'output.png',
  saveMetadata: true,
});
```

## NFT Integration

The generator creates metadata in standard NFT format:

```json
{
  "name": "Infinite Inkblot 0x5B38Da6a",
  "description": "A unique Rorschach-style inkblot generated from an Ethereum address",
  "image": "inkblot_0x5B38Da6a.png",
  "attributes": [
    {
      "trait_type": "ColorRelationship",
      "value": "Harmony"
    },
    {
      "trait_type": "Address",
      "value": "0x5B38Da6a..."
    }
  ]
}
```

## Development

### Project Structure

- `src/`: Source code for inkblot generation
  - `cli.js`: Command line interface
  - `config.js`: Global parameters
  - `generateRorschach.js`: Main generator module
  - `utils/`: Utility functions
    - `colors.js`: Hardcoded color mappings (for backwards compatibility)
    - `colorTheory.js`: Color generation and relationships
    - `ethUtils.js`: Ethereum address analysis
    - `particleUtils.js`: Particle generation
    - `renderUtils.js`: Image rendering

### Contracts

Smart contracts are built with Foundry, and can be found in `contracts/`.

## License

MIT
