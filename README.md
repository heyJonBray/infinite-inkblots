# Rorschach Inkblot Generator

This package generates realistic Rorschach-style inkblot test images with organic flowing shapes and natural-looking fractal extensions. The generator creates symmetrical inkblots that can be seeded with Ethereum addresses for deterministic generation.

## Features

- Realistic inkblot generation with organic shapes
- Natural-looking ink effects (drips, spots, textures)
- Fractal-like tendrils and extensions
- Symmetrical design (both vertical and horizontal)
- Deterministic generation using Ethereum addresses as seeds

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rorschach-generator.git
cd rorschach-generator

# Install the package
pip install -e .
```

## Usage

### As a Command Line Tool

After installation, you can use the included command line tool:

```bash
# Generate a random inkblot
generate-rorschach --output my_inkblot.png

# Generate an inkblot with a specific size
generate-rorschach --size 2048 --output large_inkblot.png

# Generate an inkblot with a specific Ethereum address as seed
generate-rorschach --address 0x123456789abcdef --output eth_inkblot.png
```

### As a Python Package

```python
from rorschach import create_realistic_rorschach

# Generate a random inkblot
inkblot = create_realistic_rorschach(size=1024)
inkblot.save("random_inkblot.png")

# Generate an inkblot with a specific Ethereum address as seed
eth_address = "0x123456789abcdef"
seeded_inkblot = create_realistic_rorschach(size=1024, eth_address=eth_address)
seeded_inkblot.save("seeded_inkblot.png")
```

## Project Structure

```
rorschach/
├── __init__.py       # Package initialization
├── main.py           # Core functionality
├── shapes.py         # Shape generation
├── tendrils.py       # Tendril and fractal extensions
├── ink_effects.py    # Ink texture, drips, spots, etc.
├── utils.py          # Utility functions
└── example.py        # Example usage
```

## Dependencies

- NumPy
- Pillow (PIL)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
