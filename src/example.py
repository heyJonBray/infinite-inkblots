import argparse
from rorschach import create_realistic_rorschach

def main():
    """
    Example usage of the Rorschach inkblot generator
    """
    parser = argparse.ArgumentParser(description='Generate a Rorschach inkblot test image')
    parser.add_argument('--size', type=int, default=1024, help='Size of the output image in pixels (square)')
    parser.add_argument('--address', type=str, default=None, help='Ethereum address to use as seed')
    parser.add_argument('--output', type=str, default='rorschach.png', help='Output file name')
    args = parser.parse_args()
    
    # Generate the inkblot
    inkblot = create_realistic_rorschach(size=args.size, eth_address=args.address)
    
    # Save the inkblot
    inkblot.save(args.output)
    print(f"Rorschach inkblot generated and saved as {args.output}")

if __name__ == "__main__":
    main()