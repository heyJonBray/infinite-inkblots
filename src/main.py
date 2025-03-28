import numpy as np
from PIL import Image, ImageOps

from .shapes import generate_interconnected_shapes
from .ink_effects import add_ink_texture
from .utils import set_seed_from_eth_address, apply_seed

def create_realistic_rorschach(size=1024, eth_address=None):
    """
    Create a realistic Rorschach inkblot test image with organic flowing shapes
    and natural-looking fractal extensions.
    
    Parameters:
        size (int): Size of the output image in pixels (square)
        eth_address (str): Ethereum address to use as seed. If None, random seed is used.
    """
    # Initialize seed if ethereum address is provided
    seed, np_seed = set_seed_from_eth_address(eth_address)
    apply_seed(seed, np_seed)
    
    # Create canvas with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    
    # Step 1: Generate the base blob shape
    base_shape = generate_interconnected_shapes(size)
    
    # Step 2: Add texture and details
    textured_shape = add_ink_texture(base_shape)
    
    # Step 3: Mirror to create the vertical symmetry characteristic of Rorschach images
    half_width = size // 2
    left_half = textured_shape.crop((0, 0, half_width, size))
    right_half = ImageOps.mirror(left_half)
    
    # Paste both halves onto the canvas
    img.paste(left_half, (0, 0), left_half)
    img.paste(right_half, (half_width, 0), right_half)
    
    # Step 4: Mirror the image horizontally to create a four-quadrant image
    top_half = img.crop((0, 0, size, size // 2))
    bottom_half = ImageOps.flip(top_half)
    
    # Create a new image for the four-quadrant result
    four_quadrant_img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    four_quadrant_img.paste(top_half, (0, 0), top_half)
    four_quadrant_img.paste(bottom_half, (0, size // 2), bottom_half)
    
    # Step 5: Reduce the size of the horizontal mirror by 25%
    resized_img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    
    # Calculate new size (75% of original)
    new_size = (int(size * 0.75), int(size * 0.75))
    resized_four_quadrant = four_quadrant_img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Calculate position to center the resized image
    x_offset = (size - new_size[0]) // 2
    y_offset = (size - new_size[1]) // 2
    
    # Paste the resized image onto the final canvas
    resized_img.paste(resized_four_quadrant, (x_offset, y_offset), resized_four_quadrant)
    
    # Return the final image
    return resized_img.convert('RGB')