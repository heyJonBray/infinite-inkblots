import numpy as np
from PIL import Image
import math
import random
import os

def generate_perlin_noise(shape, scale=0.1, octaves=6, persistence=0.5, lacunarity=2.0, seed=None):
    """
    Generate a Perlin noise array
    
    Parameters:
        shape (tuple): Size of the array to generate
        scale (float): Scale of the noise
        octaves (int): Number of octaves for the noise
        persistence (float): Persistence of the noise
        lacunarity (float): Lacunarity of the noise
        seed (int): Random seed
        
    Returns:
        numpy.ndarray: Perlin noise array with values between 0 and 1
    """
    if seed is not None:
        np.random.seed(seed)
        
    # Generate gradients
    def generate_gradients(shape):
        angles = 2 * np.pi * np.random.random(shape)
        return np.dstack((np.cos(angles), np.sin(angles)))
    
    def generate_grid(shape, scale):
        grid_shape = (int(shape[0] * scale) + 1, int(shape[1] * scale) + 1)
        return generate_gradients(grid_shape)
    
    def interpolate(a, b, t):
        # Smooth interpolation
        t = t * t * (3 - 2 * t)
        return a + (b - a) * t
    
    # Initialize noise array
    noise = np.zeros(shape)
    
    # Generate multiple octaves of noise
    max_value = 0
    amplitude = 1.0
    frequency = scale
    
    for _ in range(octaves):
        # Generate grid for this octave
        grid = generate_grid(shape, frequency)
        grid_width, grid_height = grid.shape[:2]
        
        # Calculate noise values
        for y in range(shape[0]):
            for x in range(shape[1]):
                # Determine grid cell coordinates
                grid_y, grid_dy = divmod(y * frequency, 1)
                grid_x, grid_dx = divmod(x * frequency, 1)
                
                grid_y, grid_x = int(grid_y), int(grid_x)
                
                # Get gradients at grid points
                if grid_y < grid_height - 1 and grid_x < grid_width - 1:
                    g00 = grid[grid_y, grid_x]
                    g01 = grid[grid_y, grid_x + 1]
                    g10 = grid[grid_y + 1, grid_x]
                    g11 = grid[grid_y + 1, grid_x + 1]
                    
                    # Calculate dot products
                    d00 = g00[0] * grid_dx + g00[1] * grid_dy
                    d01 = g01[0] * (grid_dx - 1) + g01[1] * grid_dy
                    d10 = g10[0] * grid_dx + g10[1] * (grid_dy - 1)
                    d11 = g11[0] * (grid_dx - 1) + g11[1] * (grid_dy - 1)
                    
                    # Interpolate
                    noise[y, x] += amplitude * interpolate(
                        interpolate(d00, d01, grid_dx),
                        interpolate(d10, d11, grid_dx),
                        grid_dy
                    )
        
        max_value += amplitude
        amplitude *= persistence
        frequency *= lacunarity
    
    # Normalize to 0-1
    return (noise / max_value + 1) / 2

def create_noise_rorschach(size=800, noise_scale=0.009, seed=None):
    """
    Create a Rorschach-like image using Perlin noise
    
    Parameters:
        size (int): Size of the output image in pixels (square)
        noise_scale (float): Scale of the noise
        seed (int): Random seed
        
    Returns:
        PIL.Image: Rorschach image
    """
    # Set random seed if provided
    if seed is not None:
        random.seed(seed)
        np_seed = seed % (2**32)
        np.random.seed(np_seed)
    
    # Create array for the image
    img_array = np.zeros((size, size, 4), dtype=np.uint8)
    
    # Generate noise
    noise = generate_perlin_noise((size, size), scale=noise_scale, seed=seed)
    
    # Fill image based on noise values
    for y in range(size):
        for x in range(size):
            noise_val = noise[y, x]
            
            # Apply symmetry - only process left half, mirror to right half
            if x < size // 2:
                mirrored_x = size - x - 1
                
                hue = 0
                saturation = 0
                luminosity = 0
                opacity = 0
                
                if noise_val < 0.5:
                    # Dark blue/purple region
                    hue_range = (250, 270)
                    hue = int(np.interp(noise_val, [0, 0.5], hue_range))
                    saturation = 250
                    luminosity = 15
                    opacity = int(np.interp(noise_val, [0, 1], [0, 255]))
                    
                    # Convert HSL to RGB
                    r, g, b = hsv_to_rgb(hue/360, saturation/100, luminosity/100)
                    
                    # Set pixel values
                    img_array[y, x] = [r, g, b, opacity]
                    img_array[y, mirrored_x] = [r, g, b, opacity]
                else:
                    # Cream region
                    hue_range = (50, 70)
                    hue = int(np.interp(noise_val, [0.5, 1], hue_range))
                    saturation = 20
                    luminosity = 90
                    opacity = 255
                    
                    # Convert HSL to RGB
                    r, g, b = hsv_to_rgb(hue/360, saturation/100, luminosity/100)
                    
                    # Set pixel values
                    img_array[y, x] = [r, g, b, opacity]
                    img_array[y, mirrored_x] = [r, g, b, opacity]
    
    # Create PIL image from array
    img = Image.fromarray(img_array, 'RGBA')
    
    return img

def hsv_to_rgb(h, s, v):
    """
    Convert HSV color to RGB
    
    Parameters:
        h (float): Hue (0-1)
        s (float): Saturation (0-1)
        v (float): Value (0-1)
        
    Returns:
        tuple: (r, g, b) values (0-255)
    """
    if s == 0.0:
        return int(v * 255), int(v * 255), int(v * 255)
    
    i = int(h * 6)
    f = (h * 6) - i
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    
    i %= 6
    
    if i == 0:
        r, g, b = v, t, p
    elif i == 1:
        r, g, b = q, v, p
    elif i == 2:
        r, g, b = p, v, t
    elif i == 3:
        r, g, b = p, q, v
    elif i == 4:
        r, g, b = t, p, v
    elif i == 5:
        r, g, b = v, p, q
    
    return int(r * 255), int(g * 255), int(b * 255)