# Infinite Inkblots

A generative art project that creates beautiful Rorschach-style inkblot images from Ethereum addresses. Each address produces a unique, deterministic inkblot pattern that can be used as NFT art.

## Features

- Ethereum address-based deterministic generation
- Perlin noise foundation for organic patterns
- Grayscale inkblots with subtle gradients
- Perfect symmetry with organic forms
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

# Install the package
pip install -e .
```

## Usage

### Command Line Interface

After installation, you can use the included command line tool:

```bash
# Generate a random inkblot
generate-rorschach --output my_inkblot.png

# Generate an inkblot from an Ethereum address
generate-rorschach --eth-address 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4

# Customize parameters
generate-rorschach --size 1024 --noise-scale 0.005 --eth-address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

### Ethereum Address Demo

Run the demo script to see how different Ethereum addresses create unique patterns:

```bash
python eth_demo.py
```

### As a Python Package

```python
from rorschach import create_noise_rorschach

# Generate a random inkblot
inkblot = create_noise_rorschach(size=800)
inkblot.save("random_inkblot.png")

# Generate an inkblot from an Ethereum address
eth_address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
eth_inkblot = create_noise_rorschach(size=800, eth_address=eth_address)
eth_inkblot.save("eth_inkblot.png")
```

## How It Works

Infinite Inkblots uses Perlin noise to create organic patterns with natural transitions. When an Ethereum address is provided:

1. Features are extracted from the address (character distribution, patterns, etc.)
2. These features modify the Perlin noise parameters
3. The modified parameters create unique visual characteristics
4. The result is a deterministic inkblot that's unique to that address

## Parameters

- `size`: Size of the output image in pixels (square)
- `noise_scale`: Scale of the noise (smaller values = more detailed patterns)
- `eth_address`: Ethereum address to use for deterministic generation
- `contrast`: Contrast adjustment for the noise
- `threshold`: Threshold value for ink vs background
- `vertical_fix`: Apply vertical adjustment to prevent banding at bottom

## Dependencies

- NumPy
- Pillow (PIL)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
