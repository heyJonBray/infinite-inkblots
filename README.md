# Noise-Based Rorschach Generator

This package generates beautiful Rorschach-style inkblot images using Perlin noise. The generator creates symmetrical inkblots with gradients and color transitions inspired by traditional ink on paper.

## Features

- Perlin noise-based inkblot generation
- Beautiful color gradients (dark blue/purple to cream)
- Perfect symmetry with organic forms
- Control over noise scale and pattern detail
- Deterministic generation using seeds

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/noise-rorschach.git
cd noise-rorschach

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
generate-rorschach --size 1024 --output large_inkblot.png

# Generate an inkblot with a specific noise scale
generate-rorschach --noise-scale 0.005 --output detailed_inkblot.png

# Generate a reproducible inkblot with a specific seed
generate-rorschach --seed 42 --output seeded_inkblot.png
```

### As a Python Package

```python
from noise_rorschach import create_noise_rorschach

# Generate a random inkblot
inkblot = create_noise_rorschach(size=800)
inkblot.save("random_inkblot.png")

# Generate an inkblot with custom parameters
custom_inkblot = create_noise_rorschach(
    size=1024,
    noise_scale=0.005,
    seed=42
)
custom_inkblot.save("custom_inkblot.png")
```

## How It Works

This generator uses Perlin noise to create organic patterns with natural transitions. The noise field is used to:

1. Determine color values (dark blue/purple or cream)
2. Control opacity and transitions between colors
3. Create natural-looking forms that maintain perfect symmetry

The noise scale parameter controls how detailed the patterns are - smaller values create more detailed patterns, while larger values create broader, simpler forms.

## Dependencies

- NumPy
- Pillow (PIL)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
