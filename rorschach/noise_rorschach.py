import numpy as np
from PIL import Image
import math
import random
import os
from .eth_utils import extract_eth_features, apply_eth_features_to_noise, get_eth_color_scheme

def generate_perlin_noise(shape, scale=0.1, octaves=6, persistence=0.5, lacunarity=2.0, seed=None, vertical_fix=True):
    """
    Generate a Perlin noise array
    
    Parameters:
        shape (tuple): Size of the array to generate
        scale (float): Scale of the noise
        octaves (int): Number of octaves for the noise
        persistence (float): Persistence of the noise
        lacunarity (float): Lacunarity of the noise
        seed (int): Random seed
        vertical_fix (bool): If True, applies adjustments to prevent horizontal banding
        
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
    noise = (noise / max_value + 1) / 2
    
    # Apply vertical fix to prevent bottom bar
    if vertical_fix:
        # Apply a gradual adjustment to the bottom 10% of the image
        height = shape[0]
        bottom_area = int(height * 0.1)
        
        for y in range(height - bottom_area, height):
            # Calculate attenuation factor (1.0 at top of bottom area, gradually decreasing to 0.5 at bottom)
            factor = 1.0 - 0.5 * ((y - (height - bottom_area)) / bottom_area)
            
            for x in range(shape[1]):
                # Attenuate the noise using the scaling factor
                noise[y, x] = 0.5 + (noise[y, x] - 0.5) * factor
    
    return noise

def create_noise_rorschach(size=800, noise_scale=0.009, seed=None, vertical_fix=True, eth_address=None, 
                     contrast=1.0, threshold=0.5):
    """
    Create a Rorschach-like image using Perlin noise
    
    Parameters:
        size (int): Size of the output image in pixels (square)
        noise_scale (float): Scale of the noise
        seed (int): Random seed
        vertical_fix (bool): If True, applies adjustments to prevent horizontal banding
        eth_address (str): Ethereum address to use for parameterization
        contrast (float): Contrast adjustment for the noise
        threshold (float): Threshold value for ink vs background
        
    Returns:
        PIL.Image: Rorschach image
    """
    # If Ethereum address is provided, extract features and modify parameters
    if eth_address is not None:
        eth_features = extract_eth_features(eth_address)
        
        # Get base parameters
        base_params = {
            'noise_scale': noise_scale,
            'octaves': 6,
            'persistence': 0.5,
            'lacunarity': 2.0,
            'contrast': contrast,
            'threshold': threshold
        }
        
        # Apply Ethereum features to modify parameters
        modified_params = apply_eth_features_to_noise(base_params, eth_features)
        
        # Extract modified parameters
        noise_scale = modified_params['noise_scale']
        octaves = modified_params['octaves']
        persistence = modified_params['persistence']
        lacunarity = modified_params['lacunarity']
        contrast = modified_params['contrast']
        threshold = modified_params['threshold']
        
        # Get color scheme based on Ethereum address
        color_scheme = get_eth_color_scheme(eth_features)
        
        # Use seed from Ethereum features
        seed = eth_features['seed']
    else:
        # Default color scheme if no Ethereum address is provided
        color_scheme = {
            'black_level': 0,
            'white_level': 250,
            'contrast_level': 1.0,
            'threshold': 0.5
        }
    
    # Set random seed if provided
    if seed is not None:
        random.seed(seed)
        np_seed = seed % (2**32)
        np.random.seed(np_seed)
    
    # Create array for the image
    img_array = np.zeros((size, size, 4), dtype=np.uint8)
    
    # Generate noise with custom parameters if Ethereum address is provided
    if eth_address is not None:
        noise = generate_perlin_noise(
            (size, size), 
            scale=noise_scale,
            octaves=octaves,
            persistence=persistence,
            lacunarity=lacunarity,
            seed=seed, 
            vertical_fix=vertical_fix
        )
    else:
        # Use default parameters if no Ethereum address
        noise = generate_perlin_noise((size, size), scale=noise_scale, seed=seed, vertical_fix=vertical_fix)
    
    # Apply contrast adjustment
    if contrast != 1.0:
        # Center around 0.5
        centered_noise = noise - 0.5
        # Apply contrast
        contrasted_noise = centered_noise * contrast
        # Recenter
        noise = contrasted_noise + 0.5
        # Clip to 0-1 range
        noise = np.clip(noise, 0, 1)
    
    # Extract color scheme values
    black_level = color_scheme['black_level']
    white_level = color_scheme['white_level']
    threshold_value = color_scheme['threshold'] if eth_address else threshold
    
    # Fill image based on noise values
    for y in range(size):
        for x in range(size):
            noise_val = noise[y, x]
            
            # Apply symmetry - only process left half, mirror to right half
            if x < size // 2:
                mirrored_x = size - x - 1
                
                # For grayscale, use same value for R, G, B
                if noise_val < threshold_value:
                    # Map noise values below threshold to black region
                    # Rescale from [0, threshold] to [0, 1] for interpolation
                    black_interp = noise_val / threshold_value if threshold_value > 0 else 0
                    
                    # Dark region (black)
                    gray_value = int(np.interp(black_interp, [0, 1], [black_level, 50]))
                    opacity = int(np.interp(black_interp, [0, 1], [255, 180]))
                    
                    # Set pixel values
                    img_array[y, x] = [gray_value, gray_value, gray_value, opacity]
                    img_array[y, mirrored_x] = [gray_value, gray_value, gray_value, opacity]
                else:
                    # Map noise values above threshold to white region
                    # Rescale from [threshold, 1] to [0, 1] for interpolation
                    white_interp = (noise_val - threshold_value) / (1 - threshold_value) if threshold_value < 1 else 0
                    
                    # Light region (cream/white background)
                    gray_value = int(np.interp(white_interp, [0, 1], [220, white_level]))
                    opacity = 255
                    
                    # Set pixel values
                    img_array[y, x] = [gray_value, gray_value, gray_value, opacity]
                    img_array[y, mirrored_x] = [gray_value, gray_value, gray_value, opacity]
    
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