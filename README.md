# Infinite Inkblots

A generative art project that creates beautiful particle-based Rorschach-style inkblots from Ethereum addresses. Each address produces a unique, deterministic inkblot pattern that can be used as NFT art.

## Features

- **Particle-Based Generation**: Creates beautiful organic patterns from thousands of small particles
- **Ethereum Address Integration**: Deterministic generation based on address features
- **Perfect Symmetry**: Creates the classic Rorschach "butterfly" pattern
- **Color Schemes**: Multiple color options derived from address characteristics
- **NFT-Ready**: Automatic trait extraction for NFT metadata
- **High Quality**: Renders clean, high-resolution images

## Installation

```bash
# Clone the repository
git clone https://github.com/heyjonbray/infinite-inkblots.git
cd infinite-inkblots

# Install dependencies
npm install
```

### Requirements

- Node.js (v14 or higher)
- The only dependency is the `canvas` package

## Usage

### Basic Usage

```bash
npm run generate -- --ethAddress 0x7e2F9dd040cF7B41a1AF9e4A24A0EDB04093dDa1
```

### Advanced Options

```bash
npm run generate -- \
  --ethAddress 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4 \
  --size 1200 \
  --outputPath output/custom_name.png
```

The generator will automatically save metadata to `output/metadata/` directory.

### Parameters

- `--ethAddress`: Ethereum address for deterministic generation
- `--size`: Canvas size in pixels (default: 800)
- `--outputPath`: Path for saving the output image

The generator automatically determines optimal parameters based on the Ethereum address:

- Particle count: 50-100 particles per frame
- Frames to render: 50-200 frames
- Color scheme: Based on address diversity and character distribution
- Pattern detail: Based on address complexity

### Batch Generation

To generate multiple examples from different Ethereum addresses:

```bash
node examples.js
```

This will generate:

- Images in `output/examples/`
- Metadata files in `output/examples/metadata/`

## How It Works

Infinite Inkblots uses a particle-based animation approach to create Rorschach-like patterns:

1. **Ethereum Address Analysis**: The system extracts unique features from the address
2. **Parameter Mapping**: These features influence visual aspects like color, density, and detail
3. **Progressive Generation**: Particles are added frame by frame with a fade effect
4. **Symmetry Application**: Perfect mirroring creates the classic Rorschach look
5. **Trait Extraction**: NFT metadata is derived from the generation parameters

## Example Outputs

Different Ethereum addresses produce distinctly different inkblots:

- Zero address (0x000...): Tends to create very symmetrical, structured patterns
- Addresses with many repeating characters: Creates more uniform, consistent patterns
- Addresses with high character diversity: Produces more complex, detailed patterns
- Specific character distributions: Influences color and density distributions

### NFT Integration

The generator automatically extracts traits for NFT metadata and saves them to `output/metadata/`:

```json
{
  "name": "Infinite Inkblot 0x5B38Da6a",
  "description": "A unique Rorschach-style inkblot generated from an Ethereum address",
  "image": "particle_ror_0x5B38Da6a701c568545dCfcB03FcB875f56beddC4.png",
  "attributes": [
    {
      "trait_type": "Address",
      "value": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
    },
    {
      "trait_type": "Size",
      "value": "800x800"
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
