#!/usr/bin/env python
"""
Demo script to generate multiple Rorschach inkblots from different Ethereum addresses.
This showcases how different addresses produce different inkblots.
"""

import os
import sys
import argparse
from rorschach.noise_rorschach import create_noise_rorschach

# Sample Ethereum addresses (replace with real ones if needed)
SAMPLE_ADDRESSES = [
    "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",  # Generic test address
    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",  # Vitalik Buterin's address
    "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6",  # Maker DAO address
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",  # Uniswap address
    "0x0000000000000000000000000000000000000000",  # Zero address
    "0xdead000000000000000000000000000000000000",  # "Dead" address
    "0xcafe00000000000000000000000000000000cafe",  # "Cafe" address
    "0x88888888888888888888888888888888888888888", # Repeating 8s
    "0xabcdef0123456789abcdef0123456789abcdef01"   # Sequential
]

def main():
    parser = argparse.ArgumentParser(description='Generate multiple Rorschach inkblots from different Ethereum addresses')
    parser.add_argument('--size', type=int, default=800, help='Size of the output images in pixels (square)')
    parser.add_argument('--output-dir', type=str, default='out/eth_demo', help='Directory to save output images')
    parser.add_argument('--vertical-fix', action='store_true', default=True, 
                        help='Apply vertical adjustment to prevent banding at bottom')
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"Generating inkblots from {len(SAMPLE_ADDRESSES)} Ethereum addresses...")
    
    # Generate an inkblot for each address
    for i, address in enumerate(SAMPLE_ADDRESSES):
        # Create a shorter version of the address for the filename
        short_addr = address[:10]
        
        # Output filename
        output_file = f"inkblot_{i+1}_{short_addr}.png"
        output_path = os.path.join(args.output_dir, output_file)
        
        print(f"Generating {output_file} from address: {address}")
        
        # Generate the inkblot
        inkblot = create_noise_rorschach(
            size=args.size,
            vertical_fix=args.vertical_fix,
            eth_address=address
        )
        
        # Save the inkblot
        inkblot.save(output_path)
    
    print(f"\nAll inkblots generated successfully in '{args.output_dir}'")
    print("Each address produces a unique deterministic inkblot pattern.")

if __name__ == "__main__":
    main()