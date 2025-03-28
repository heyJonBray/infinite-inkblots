import random
import math
import numpy as np
from PIL import Image, ImageFilter

def add_ink_texture(img):
    """
    Add subtle texture variations to make the ink look more realistic
    """
    # Apply a very subtle blur to smooth some of the edges
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    
    # Convert to numpy for pixel manipulation
    img_array = np.array(img)
    
    # Add micro-texture variations to ink
    h, w = img_array.shape[:2]
    for y in range(h):
        for x in range(w):
            if img_array[y, x, 3] > 200:  # If this is a solid ink pixel
                # Add subtle density variations
                variation = random.uniform(0.94, 1.0)
                img_array[y, x, 3] = int(img_array[y, x, 3] * variation)
    
    # Convert back to PIL Image
    return Image.fromarray(img_array)

def add_controlled_spots(draw, width, height, center_x, center_y, main_radius):
    """
    Add isolated ink spots with controlled distance from main shapes
    """
    spot_count = random.randint(40, 60)
    
    # Calculate the maximum distance spots can be from the center
    max_distance = main_radius * 2.0  # Limit how far spots can go
    
    for _ in range(spot_count):
        # Position spots with controlled distance
        angle = random.uniform(0, 2 * math.pi)
        # More spots closer to main shapes, fewer far away
        distance_factor = random.uniform(0.5, 1.0) ** 0.5 * 2.0  # Sqrrt distribution favors closer spots
        distance = main_radius * distance_factor
        
        # Ensure distance is within controlled range
        distance = min(distance, max_distance)
        
        x = center_x + int(distance * math.cos(angle))
        y = center_y + int(distance * math.sin(angle))
        
        # Skip if out of bounds
        if x < 0 or x >= width or y < 0 or y >= height:
            continue
        
        # Size of spot - mostly small
        if random.random() < 0.9:  # Mostly small spots
            size = random.randint(1, 2)
        else:
            size = random.randint(2, 3)  # Smaller max size
        
        # Draw slightly irregular spot instead of perfect circle
        if random.random() < 0.3:
            # Create a tiny irregular shape
            tiny_shape = []
            for i in range(8):
                angle = 2 * math.pi * i / 8
                r_var = random.uniform(0.8, 1.2)
                px = x + int(size * r_var * math.cos(angle))
                py = y + int(size * r_var * math.sin(angle))
                tiny_shape.append((px, py))
            draw.polygon(tiny_shape, fill=(0, 0, 0, 255))
        else:
            # Simple ellipse with slight variation
            width_var = random.uniform(0.9, 1.1)
            height_var = random.uniform(0.9, 1.1)
            draw.ellipse((x-size*width_var, y-size*height_var, 
                          x+size*width_var, y+size*height_var), 
                         fill=(0, 0, 0, 255))
        
        # Add a drip from some spots
        if random.random() < 0.2:  # Less drips
            drip_length = random.randint(2, 10)  # Shorter drips
            # Mostly downward but with some variation
            drip_angle = random.uniform(math.pi/2-0.3, math.pi/2+0.3)
            
            # Create points for the drip
            drip_points = [(x, y)]
            current_x, current_y = x, y
            current_angle = drip_angle
            
            for i in range(drip_length):
                # Add some subtle waviness
                current_angle += random.uniform(-0.15, 0.15)
                
                # Calculate new point
                new_x = current_x + int(1.5 * math.cos(current_angle))
                new_y = current_y + int(1.5 * math.sin(current_angle))
                
                # Safety check
                if new_x < 0 or new_x >= width or new_y < 0 or new_y >= height:
                    break
                
                drip_points.append((new_x, new_y))
                current_x, current_y = new_x, new_y
            
            # Draw the drip with decreasing thickness
            for i in range(len(drip_points) - 1):
                thickness = max(1, int(size * 0.7 * (1 - i/drip_length)**0.8))
                draw.line([drip_points[i], drip_points[i+1]], 
                          fill=(0, 0, 0, 255), width=thickness)

def add_simple_drips(draw, img, width, height):
    """
    Add simple ink drips with a more natural flow
    """
    # Get the black pixels from the image
    img_array = np.array(img)
    if img_array.shape[2] >= 4:  # Check if there's an alpha channel
        alpha_channel = img_array[:, :, 3]
    else:
        # If no alpha channel, use any non-white pixel as "ink"
        alpha_channel = np.any(img_array[:, :, :3] < 250, axis=2).astype(np.uint8) * 255
    
    # Find bottom edges and side edges of the ink shape
    drip_points = []
    
    # Check bottom edges
    for x in range(width):
        for y in range(height-20):
            if y+1 < height and alpha_channel[y, x] > 200 and alpha_channel[y+1, x] < 50:
                # Bottom edge found
                if random.random() < 0.08:  # Control density
                    drip_points.append((x, y, "down"))  # Mark direction
    
    # Check side edges too for horizontal drips
    for y in range(height):
        for x in range(10, width-10):
            if x+1 < width and alpha_channel[y, x] > 200 and alpha_channel[y, x+1] < 50:
                # Right edge found
                if random.random() < 0.04:  # Less common
                    drip_points.append((x, y, "right"))
            elif x > 0 and alpha_channel[y, x] > 200 and alpha_channel[y, x-1] < 50:
                # Left edge found
                if random.random() < 0.04:  # Less common
                    drip_points.append((x, y, "left"))
    
    # Create drips from the edge points
    for x, y, direction in drip_points:
        if direction == "down":
            drip_length = random.randint(5, 30)  # Slightly less extreme length
            create_flowing_drip(draw, x, y, drip_length, direction, width, height)
        else:
            # Horizontal drips tend to be shorter
            drip_length = random.randint(3, 10)  # Even shorter
            create_flowing_drip(draw, x, y, drip_length, direction, width, height)

def create_flowing_drip(draw, x, y, length, direction, width, height):
    """
    Create a flowing drip with natural curves and variations
    """
    # Start point
    points = [(x, y)]
    current_x, current_y = x, y
    
    # Initial direction based on drip type
    if direction == "down":
        main_direction = math.pi/2  # Downward
        drift_range = 0.5  # Can drift left or right
    elif direction == "right":
        main_direction = 0  # Right
        drift_range = 0.3
    else:  # left
        main_direction = math.pi  # Left
        drift_range = 0.3
    
    # Initial angle with slight randomness
    current_angle = main_direction + random.uniform(-0.2, 0.2)
    
    # Track the major drift direction so we don't zigzag unnaturally
    drift_bias = random.uniform(-0.2, 0.2)
    
    # Create the drip with natural flow
    for i in range(length):
        # Calculate drift - with memory of previous drift
        drift_bias += random.uniform(-0.1, 0.1)
        drift_bias = max(-0.3, min(0.3, drift_bias))  # Limit overall bias
        
        # Update angle with natural tendency toward main direction
        angle_variation = drift_bias + random.uniform(-0.15, 0.15)
        current_angle = main_direction + angle_variation * drift_range
        
        # For longer drips, gradually angle more downward (gravity)
        if i > length * 0.6 and direction != "down":
            current_angle = current_angle * 0.9 + math.pi/2 * 0.1
        
        # Calculate new point
        step_length = random.uniform(1.0, 1.5)
        new_x = current_x + int(step_length * math.cos(current_angle))
        new_y = current_y + int(step_length * math.sin(current_angle))
        
        # Stop if out of bounds
        if new_y >= height or new_x < 0 or new_x >= width:
            break
            
        points.append((new_x, new_y))
        current_x, current_y = new_x, new_y
    
    # Draw the drip with naturally decreasing width
    for i in range(len(points) - 1):
        # Calculate position along the drip
        t = i / (len(points) - 1)
        
        # Use a more natural taper - slower at start, faster toward end
        width_val = max(1, int(3 * (1 - t**1.5)))
        draw.line([points[i], points[i+1]], fill=(0, 0, 0, 255), width=width_val)