import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import math
import random
import os
from .perlin import generate_perlin_noise
from .eth_utils import extract_eth_features, apply_eth_features_to_noise, get_eth_color_scheme

def create_inkblot(size=800, noise_scale=0.009, eth_address=None, render_details=True, 
                  whitespace_margin=0.15, detail_intensity=0.7):
    """
    Create a Rorschach-style inkblot image based on Ethereum addresses.
    
    Parameters:
        size (int): Size of the output image in pixels (square)
        noise_scale (float): Scale of the Perlin noise
        eth_address (str): Ethereum address for deterministic generation
        render_details (bool): Whether to render edge details
        whitespace_margin (float): Amount of whitespace to leave around the edges (0.0-0.3)
        detail_intensity (float): Intensity of the edge details (0.0-1.0)
        
    Returns:
        PIL.Image: Rorschach image
    """
    # Set up parameters based on Ethereum address if provided
    seed = None
    contrast = 1.3
    threshold = 0.48
    
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
        octaves = modified_params.get('octaves', 6)
        persistence = modified_params.get('persistence', 0.5)
        lacunarity = modified_params.get('lacunarity', 2.0)
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
            vertical_fix=True
        )
    else:
        # Use default parameters if no Ethereum address
        noise = generate_perlin_noise(
            (size, size), 
            scale=noise_scale, 
            seed=seed, 
            vertical_fix=True
        )
    
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
    black_level = color_scheme.get('black_level', 0)
    white_level = color_scheme.get('white_level', 250)
    threshold_value = color_scheme.get('threshold', threshold)
    
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
    
    # Convert to PIL image
    base_image = Image.fromarray(img_array, 'RGBA')
    
    # If we don't want edge details, center the inkblot and return
    if not render_details:
        return _center_and_scale_inkblot(base_image, size, whitespace_margin)
    
    # Create a binary mask of the ink areas
    mask = np.zeros((size, size), dtype=np.uint8)
    for y in range(size):
        for x in range(size):
            if img_array[y, x, 3] > 128 and img_array[y, x, 0] < 128:  # Ink pixels are dark and opaque
                mask[y, x] = 255
    
    # Convert mask to PIL image
    mask_image = Image.fromarray(mask)
    
    # Find edges of the mask
    edge_image = mask_image.filter(ImageFilter.FIND_EDGES)
    edge_array = np.array(edge_image)
    
    # Create a new image for the result
    result = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(result)
    
    # Fill the main blob shapes
    temp_mask = Image.fromarray(mask).convert('L')
    result.paste((0, 0, 0, 255), (0, 0), temp_mask)
    
    # Add edge details
    edge_points = []
    for y in range(size):
        for x in range(size):
            if edge_array[y, x] > 128:
                edge_points.append((x, y))
    
    # Determine how many edge points to process
    num_points = int(len(edge_points) * detail_intensity * 0.1)  # Only process a portion for performance
    selected_points = random.sample(edge_points, min(num_points, len(edge_points)))
    
    # Add details to the edges
    for x, y in selected_points:
        # Determine detail type based on position and random chance
        detail_roll = random.random()
        
        if detail_roll < 0.4:  # 40% chance for small drips
            add_drip(draw, x, y, size, size, 
                    length_range=(2, 8), 
                    width_range=(1, 2))
        elif detail_roll < 0.7:  # 30% chance for tiny tendrils
            add_tendril(draw, x, y, size, size,
                       length_range=(3, 10),
                       branch_chance=0.3,
                       max_depth=2)
        else:  # 30% chance for ink spots
            add_spots(draw, x, y, size, size, 
                     count_range=(1, 3),
                     radius_range=(1, 2),
                     max_distance=15)
    
    # Apply a very subtle blur for smoother edges
    result = result.filter(ImageFilter.GaussianBlur(0.5))
    
    # Center and scale the inkblot
    final_image = _center_and_scale_inkblot(result, size, whitespace_margin)
    
    return final_image

def _center_and_scale_inkblot(img, size, whitespace_margin):
    """Helper function to center and scale the inkblot with margin"""
    # Find the actual dimensions of the inkblot (non-transparent pixels)
    img_array = np.array(img)
    rows = np.any(img_array[:, :, 3] > 0, axis=1)
    cols = np.any(img_array[:, :, 3] > 0, axis=0)
    
    if not np.any(rows) or not np.any(cols):
        # Empty image, return as is
        return img
        
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    
    # Calculate inkblot dimensions
    inkblot_width = xmax - xmin + 1
    inkblot_height = ymax - ymin + 1
    
    # Calculate scaling to fit within the desired size with margin
    margin_percentage = whitespace_margin
    available_width = size * (1 - 2 * margin_percentage)
    available_height = size * (1 - 2 * margin_percentage)
    
    # Calculate scaling factor to fit within available space
    scale_width = available_width / inkblot_width
    scale_height = available_height / inkblot_height
    scale_factor = min(scale_width, scale_height)
    
    # Calculate new dimensions after scaling
    new_width = int(inkblot_width * scale_factor)
    new_height = int(inkblot_height * scale_factor)
    
    # Crop the inkblot to its bounding box and resize
    cropped_inkblot = img.crop((xmin, ymin, xmax + 1, ymax + 1))
    resized_inkblot = cropped_inkblot.resize((new_width, new_height), Image.LANCZOS)
    
    # Create final image with centered inkblot
    final_image = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    paste_x = (size - new_width) // 2
    paste_y = (size - new_height) // 2
    final_image.paste(resized_inkblot, (paste_x, paste_y), resized_inkblot)
    
    return final_image

def add_drip(draw, x, y, width, height, length_range=(3, 15), width_range=(1, 3)):
    """Add a small ink drip at the given position"""
    # Determine drip properties
    drip_length = random.randint(length_range[0], length_range[1])
    drip_width = random.randint(width_range[0], width_range[1])
    
    # Determine direction - weighted toward down but can go any direction
    angle_weights = [
        (math.pi/2, 0.5),       # Down (50% chance)
        (0, 0.15),              # Right (15% chance)
        (math.pi, 0.15),        # Left (15% chance)
        (0, 0.1),               # Slight right diagonal (10% chance)
        (math.pi, 0.1)          # Slight left diagonal (10% chance)
    ]
    
    # Select direction based on weights
    direction = random.choices(angle_weights, weights=[w[1] for w in angle_weights])[0][0]
    direction += random.uniform(-0.2, 0.2)  # Add slight variation
    
    # Generate drip points
    points = [(x, y)]
    current_x, current_y = x, y
    
    for i in range(drip_length):
        # Add some waviness
        direction += random.uniform(-0.1, 0.1)
        
        # Calculate new point
        new_x = current_x + math.cos(direction) * random.uniform(0.8, 1.2)
        new_y = current_y + math.sin(direction) * random.uniform(0.8, 1.2)
        
        # Stay within bounds
        new_x = max(0, min(width-1, new_x))
        new_y = max(0, min(height-1, new_y))
        
        points.append((new_x, new_y))
        current_x, current_y = new_x, new_y
    
    # Draw the drip with decreasing thickness
    for i in range(len(points) - 1):
        # Calculate width based on position - thicker at start, thinner at end
        pos = i / (len(points) - 1)
        current_width = max(1, int(drip_width * (1 - pos * 0.8)))
        draw.line([points[i], points[i+1]], fill=(0, 0, 0, 255), width=current_width)

def add_tendril(draw, x, y, width, height, length_range=(5, 15), branch_chance=0.3, max_depth=2):
    """Add a small branching tendril at the given position"""
    def _create_tendril(start_x, start_y, direction, length, depth):
        if depth > max_depth:
            return
        
        # Create points for this branch
        points = [(start_x, start_y)]
        current_x, current_y = start_x, start_y
        current_direction = direction
        
        for i in range(length):
            # Add some waviness
            current_direction += random.uniform(-0.2, 0.2)
            
            # Calculate new point
            step = random.uniform(0.8, 1.2)
            new_x = current_x + math.cos(current_direction) * step
            new_y = current_y + math.sin(current_direction) * step
            
            # Stay within bounds
            new_x = max(0, min(width-1, new_x))
            new_y = max(0, min(height-1, new_y))
            
            points.append((new_x, new_y))
            current_x, current_y = new_x, new_y
            
            # Possibly branch off
            if i > 1 and random.random() < branch_chance and depth < max_depth:
                branch_dir = current_direction + random.choice([
                    random.uniform(0.5, 1.0),     # Branch right
                    random.uniform(-1.0, -0.5)    # Branch left
                ])
                branch_length = max(2, int(length * 0.6))
                _create_tendril(current_x, current_y, branch_dir, branch_length, depth + 1)
        
        # Draw this branch with decreasing thickness
        for i in range(len(points) - 1):
            # Calculate width based on depth and position
            pos = i / (len(points) - 1)
            current_width = max(1, int(2 * (1 - depth * 0.3) * (1 - pos * 0.7)))
            draw.line([points[i], points[i+1]], fill=(0, 0, 0, 255), width=current_width)
    
    # Initial tendril properties
    initial_length = random.randint(length_range[0], length_range[1])
    initial_direction = random.uniform(0, 2 * math.pi)  # Any direction
    
    # Create the tendril
    _create_tendril(x, y, initial_direction, initial_length, 0)

def add_spots(draw, x, y, width, height, count_range=(1, 5), radius_range=(1, 3), max_distance=20):
    """Add small ink spots around the given position"""
    num_spots = random.randint(count_range[0], count_range[1])
    
    for _ in range(num_spots):
        # Determine spot position (near the edge point)
        distance = random.uniform(2, max_distance)
        direction = random.uniform(0, 2 * math.pi)
        spot_x = x + distance * math.cos(direction)
        spot_y = y + distance * math.sin(direction)
        
        # Stay within bounds
        spot_x = max(0, min(width-1, spot_x))
        spot_y = max(0, min(height-1, spot_y))
        
        # Determine spot properties
        radius = random.uniform(radius_range[0], radius_range[1])
        
        # Draw slightly irregular spot
        if random.random() < 0.7:  # 70% chance for perfect circle
            draw.ellipse((spot_x-radius, spot_y-radius, spot_x+radius, spot_y+radius), 
                         fill=(0, 0, 0, 255))
        else:  # 30% chance for slightly irregular shape
            num_points = 8
            poly_points = []
            for i in range(num_points):
                angle = 2 * math.pi * i / num_points
                r_var = radius * random.uniform(0.8, 1.2)
                px = spot_x + r_var * math.cos(angle)
                py = spot_y + r_var * math.sin(angle)
                poly_points.append((px, py))
            draw.polygon(poly_points, fill=(0, 0, 0, 255))