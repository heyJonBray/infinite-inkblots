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
git clone https://github.com/yourusername/infinite-inkblots.git
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
node eth_rorschach.js --ethAddress 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
```

### Advanced Options

```bash
node eth_rorschach.js \
  --ethAddress 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4 \
  --size 1200 \
  --particleCount 2500 \
  --runDuration 1000 \
  --outputPath out/custom_name.png \
  --saveMetadata
```

### Parameters

- `--ethAddress`: Ethereum address for deterministic generation
- `--size`: Canvas size in pixels (default: 800)
- `--outputPath`: Path for saving the output image
- `--particleCount`: Number of particles per frame
- `--runDuration`: Number of frames to generate
- `--scale`: Noise scale (smaller = more detailed)
- `--maxRadius`: Maximum particle radius
- `--saveMetadata`: Flag to save NFT metadata

### Batch Generation

To generate multiple examples from different Ethereum addresses:

```bash
node examples.js
```

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

## NFT Integration

The generator automatically extracts traits for NFT metadata:

```json
{
  "name": "Infinite Inkblot #123",
  "description": "A unique Rorschach-style inkblot generated from an Ethereum address",
  "image": "particle_ror_0x1234.png",
  "attributes": [
    {
      "trait_type": "ColorScheme",
      "value": "Blues"
    },
    {
      "trait_type": "ParticleDensity",
      "value": "Medium"
    },
    {
      "trait_type": "ParticleSize",
      "value": "Medium"
    },
    {
      "trait_type": "Complexity",
      "value": "High"
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Particle distribution approach inspired by Nicolas Decoster's P5.js implementation
- Built on the rich tradition of generative art and NFT collections
