# Infinite Inkblots

A generative art project that creates deterministic, particle-based Rorschach inkblots from Ethereum addresses. Each address produces a unique, inkblot pattern + color combination along with trait extraction for NFT metadata.

## Traits

Various aspects of an Ethereum address will result in different traits that alter the particle generation and color selection.

### Pattern Traits

- **Uniqueness**: Addresses with low repetition in their characters produce more variable particle sizes.
- **Palindrome**: If the end of an address is a palindrome, the pattern repeats from the edges and center.
- **420 Special**: Addresses that start or end with '420' produce a unique green color pairing and cannabis leaf shaped pattern.
- **Repeating Characters**: A large number of repeating characters (like in vanity addresses) get different color schemes:
  - **Zeroes**: monochrome
  - **Letters**: sepia

### Color Traits

The color selection is determined by analyzing various aspects of the Ethereum address:

1. **Special Cases**:

   - Addresses containing '420' get a special green color pair (Emerald & Jade)
   - Addresses with repeating zeros get a monochrome scheme (Black & Grey)
   - Addresses with repeating non-zero characters get a sepia scheme (Dark & Light Sepia)

2. **Color Theory Relationships**:

   - **Palindrome Addresses**: Generate complementary colors (opposites on the color wheel)
   - **High Diversity** (>70% unique characters): Use split complementary colors
   - **Low Diversity** (<30% unique characters): Use analogous accent colors
   - **Standard Addresses**: Randomly select from:
     - Complementary (Contrast)
     - Analogous (Harmony)
     - Split Complementary (Balance)
     - Analogous Accent

3. **Color Generation**:
   - Primary color is generated from the first 7 characters of the address:
     - First 3 chars determine the hue (0-360°)
     - Next 2 chars set saturation (40-100%)
     - Next 2 chars set lightness (35-75%)
   - Secondary color is determined by the color relationship type and includes subtle variations based on address segments

## Color Theory Approach

The project uses a sophisticated color theory system to ensure aesthetically pleasing and meaningful color combinations:

### Color Space

- Uses HSL (Hue, Saturation, Lightness) color space for intuitive color manipulation
- Maintains consistent color ranges for optimal visibility and aesthetics
- Ensures colors are web-safe and print-friendly

### Color Relationships

1. **Complementary Colors**

   - Opposite colors on the color wheel
   - Creates maximum contrast and visual interest
   - Used for palindrome addresses to emphasize symmetry

2. **Analogous Colors**

   - Adjacent colors on the color wheel
   - Creates harmonious, cohesive combinations
   - Used for addresses with low character diversity

3. **Split Complementary**

   - A variation of complementary colors
   - Uses one of the two colors adjacent to the complement
   - Creates high contrast while being less intense
   - Used for addresses with high character diversity

4. **Analogous Accent**
   - Adjacent colors with increased contrast
   - Creates subtle harmony with added visual interest
   - Used for addresses with low character diversity

### Color Naming

Colors are given descriptive names based on their HSL values:

- Base hue names (Red, Orange, Yellow, etc.)
- Lightness modifiers (Dark, Light)
- Saturation modifiers (Muted, Vibrant)
- Special cases (Deep, Pale, Gray percentages)

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
node index.js --ethAddress 0x7e2F9dd040cF7B41a1AF9e4A24A0EDB04093dDa1
```

### Advanced Options

```bash
node index.js \
  --ethAddress 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4 \
  --size 1200 \
  --outputPath output/custom_name.png
```

The generator will automatically save metadata to `output/metadata/` directory.

### Parameters

- `--ethAddress`: Ethereum address for deterministic generation
- `--size`: Canvas size in pixels (default: 1024)
- `--outputPath`: Path for saving the output image
- `--test`: Run a single address and save to test.png
- `--examples`: Generate example inkblots for multiple predefined addresses

The generator automatically determines optimal parameters based on the Ethereum address:

- Particle count: 50-100 particles per frame
- Frames to render: 50-200 frames
- Color scheme: Based on address diversity and character distribution
- Pattern detail: Based on address complexity

### Batch Generation

To generate multiple examples from different Ethereum addresses:

```bash
node src/cli.js --examples
```

This will generate:

- Images in `output/examples/`
- Metadata files in `output/examples/metadata/`

## How It Works

Infinite Inkblots uses a particle-based animation approach to create Rorschach-like patterns:

1. **Ethereum Address Analysis**: Extract unique features from the address
2. **Parameter Mapping**: The features influence visual aspects like color, density, and detail
3. **Progressive Generation**: Particles are added frame by frame with a fade effect, then mirrored to produce the classic Rorschach pattern
4. **Trait Extraction**: NFT metadata is derived and saved

### Metadata

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
      "value": "1024x1024"
    },
    {
      "trait_type": "ColorScheme",
      "value": "The Blues"
    },
    {
      "trait_type": "PrimaryColor",
      "value": "#0000FF"
    },
    {
      "trait_type": "SecondaryColor",
      "value": "#000080"
    },
    {
      "trait_type": "Complexity",
      "value": "Medium"
    },
    {
      "trait_type": "Pattern",
      "value": "Standard"
    }
  ]
}
```

### Contracts

Infinite Inkblot contracts are built with Foundry and can be found in the `contracts/` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

### todo

- [x] rename the color pairs
- [ ] make some more patterns
- [ ] tweak 420 pattern to look more leaf-like
- [ ] switch current high-zero pattern to be for palindromes
- [ ] create new high-zero pattern that uses lighter/smaller/less dense particles
