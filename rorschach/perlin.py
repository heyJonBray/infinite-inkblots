import numpy as np
import random

def generate_perlin_noise(shape, scale=0.1, octaves=6, persistence=0.5, 
                          lacunarity=2.0, seed=None, vertical_fix=True):
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