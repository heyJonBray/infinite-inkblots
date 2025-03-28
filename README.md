# Infinite Inkblots

A generative art project that creates beautiful Rorschach-style inkblots from Ethereum addresses. Each address produces a unique, deterministic inkblot pattern that can be used as NFT art.

## Features

- Ethereum address-based deterministic generation
- Perlin noise foundation for organic patterns
- Grayscale inkblots with subtle gradients and natural textures
- Perfect symmetry with organic edge details (drips, tendrils, spots)
- Address-specific visual characteristics:
  - Pattern complexity based on character diversity
  - Ink density determined by character distribution
  - Contrast derived from address features
  - Shape characteristics tied to specific address patterns

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/infinite-inkblots.git
cd infinite-inkblots

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the package in development mode
pip install -e .
```

## Usage

### Command Line Interface

After installation, you can generate inkblots using the included command line tool:

```bash
# Generate a random inkblot
generate-inkblot --output my_inkblot.png

# Generate an inkblot from an Ethereum address
generate-inkblot --eth-address 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4

# Customize parameters
generate-inkblot --size 1024 --whitespace 0.2 --detail-intensity 0.8 --eth-address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

### Parameters

- `--size`: Size of the output image in pixels (square)
- `--eth-address`: Ethereum address for deterministic generation
- `--whitespace`: Margin around the inkblot (0.0-0.3)
- `--detail-intensity`: Amount of edge details to add (0.0-1.0)
- `--no-details`: Disable edge details entirely
- `--noise-scale`: Scale of the Perlin noise (lower = more detail)

### Ethereum Address Demo

Run the demo script to see how different Ethereum addresses create unique patterns:

```bash
python eth_demo.py
```

This will generate multiple inkblots from sample addresses and save them to `out/eth_demo/`.

### Using as a Python Package

```python
from rorschach import create_inkblot

# Generate a random inkblot
inkblot = create_inkblot(size=800)
inkblot.save("random_inkblot.png")

# Generate an inkblot from an Ethereum address
eth_address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
eth_inkblot = create_inkblot(
    size=800,
    eth_address=eth_address,
    whitespace_margin=0.15,
    detail_intensity=0.7
)
eth_inkblot.save("eth_inkblot.png")
```

## How It Works

Infinite Inkblots combines multiple techniques to create unique, deterministic inkblots:

1. **Ethereum Address Analysis**: Features are extracted from the address (character distribution, patterns, etc.)

2. **Perlin Noise Foundation**: These features modify Perlin noise parameters to create the base shapes

3. **Edge Detail Enhancement**: Organic details like drips, tendrils, and ink spots are added to the edges

4. **Composition Optimization**: The inkblot is centered in the canvas with appropriate margins

The same Ethereum address will always produce the same inkblot pattern, making it suitable for NFT projects.

## Dependencies

- NumPy
- Pillow (PIL)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Inspired by the classic Rorschach psychological test and the rich tradition of generative art.
