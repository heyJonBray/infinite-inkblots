import argparse
import os
from .noise_rorschach import create_noise_rorschach

def main():
    """
    Example usage of the Rorschach noise-based image generator
    """
    parser = argparse.ArgumentParser(description='Generate a Rorschach-like image using Perlin noise')
    parser.add_argument('--size', type=int, default=800, help='Size of the output image in pixels (square)')
    parser.add_argument('--noise-scale', type=float, default=0.009, help='Scale of the noise')
    parser.add_argument('--seed', type=int, default=None, help='Random seed')
    parser.add_argument('--output', type=str, default='noise_rorschach.png', help='Output file name')
    parser.add_argument('--output-dir', type=str, default='out', help='Directory to save output images')
    args = parser.parse_args()
    
    # Create the output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Build the full output path
    output_path = os.path.join(args.output_dir, args.output)
    
    # Generate the inkblot
    inkblot = create_noise_rorschach(size=args.size, noise_scale=args.noise_scale, seed=args.seed)
    
    # Save the inkblot
    inkblot.save(output_path)
    print(f"Noise-based Rorschach image generated and saved as {output_path}")

if __name__ == "__main__":
    main()