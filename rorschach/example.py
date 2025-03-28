import argparse
import os
from .inkblot import create_inkblot

def main():
    """
    Command-line interface for the Infinite Inkblots generator
    """
    parser = argparse.ArgumentParser(description='Generate a Rorschach-style inkblot image')
    parser.add_argument('--size', type=int, default=800, help='Size of the output image in pixels (square)')
    parser.add_argument('--noise-scale', type=float, default=0.009, help='Scale of the noise')
    parser.add_argument('--eth-address', type=str, default=None, help='Ethereum address for deterministic generation')
    parser.add_argument('--output', type=str, default='inkblot.png', help='Output file name')
    parser.add_argument('--output-dir', type=str, default='out', help='Directory to save output images')
    parser.add_argument('--no-details', action='store_false', dest='render_details', 
                      help='Disable edge detail rendering')
    parser.add_argument('--whitespace', type=float, default=0.15, 
                      help='Whitespace margin (0.0-0.3)')
    parser.add_argument('--detail-intensity', type=float, default=0.7,
                      help='Intensity of edge details (0.0-1.0)')
    args = parser.parse_args()
    
    # Create the output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Build the full output path
    output_path = os.path.join(args.output_dir, args.output)
    
    # Generate the inkblot
    inkblot = create_inkblot(
        size=args.size,
        noise_scale=args.noise_scale,
        eth_address=args.eth_address,
        render_details=args.render_details,
        whitespace_margin=args.whitespace,
        detail_intensity=args.detail_intensity
    )
    
    # Save the inkblot
    inkblot.save(output_path)
    print(f"Inkblot generated and saved as {output_path}")

if __name__ == "__main__":
    main()