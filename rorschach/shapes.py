import random
import math
from PIL import Image, ImageDraw
import numpy as np

from .tendrils import add_distributed_tendrils, create_blob_bridge
from .ink_effects import add_controlled_spots, add_simple_drips

def generate_interconnected_shapes(size):
    """
    Generate an organic pattern of interconnected shapes instead of one large blob
    with more flowing, natural edges
    """
    half_width = size // 2
    img = Image.new('RGBA', (half_width, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Define central area
    center_y = size // 2
    center_x = half_width // 2
    
    # Generate multiple interconnected organic shapes
    # A few larger shapes instead of many small ones
    shapes_count = random.randint(4, 7)  # Fewer shapes, but larger
    shapes = []
    
    # Decide on a more varied distribution of shapes
    # Instead of one central shape, distribute more evenly
    shape_positions = []
    
    # Add central shape
    main_radius = size // 7  # Slightly larger main shape
    shape_positions.append((center_x, center_y, main_radius))
    
    # Add surrounding shapes in a more natural arrangement
    for i in range(shapes_count - 1):
        # Position relative to center but with more variation
        angle = random.uniform(0, 2 * math.pi)
        # Vary distance more to create clusters of shapes
        distance_factor = random.uniform(0.4, 1.2)
        
        # Some shapes are positioned relative to existing shapes
        if i > 1 and random.random() < 0.6:
            # Choose a random existing shape to position relative to
            ref_shape = random.choice(shape_positions[:i])
            base_x, base_y, base_radius = ref_shape
            
            # Position close to chosen shape for more interconnected look
            shape_x = base_x + int(base_radius * distance_factor * math.cos(angle))
            shape_y = base_y + int(base_radius * distance_factor * math.sin(angle))
            
            # Size varies but keeps a natural ratio to base shape
            radius = base_radius * random.uniform(0.5, 0.9)
        else:
            # Position relative to center
            shape_x = center_x + int(main_radius * 2 * distance_factor * math.cos(angle))
            shape_y = center_y + int(main_radius * 2 * distance_factor * math.sin(angle))
            
            # Size varies
            radius = main_radius * random.uniform(0.3, 0.8)
        
        # Ensure shape is within bounds
        shape_x = max(radius, min(half_width - radius, shape_x))
        shape_y = max(radius, min(size - radius, shape_y))
        
        shape_positions.append((shape_x, shape_y, radius))
    
    # First, draw each organic shape
    for pos in shape_positions:
        shape_x, shape_y, radius = pos
        # Generate more points for smoother edges
        shape = generate_flowing_shape(shape_x, shape_y, radius, 45)
        shapes.append(shape)
        draw.polygon(shape, fill=(0, 0, 0, 255))
    
    # Then connect shapes with blended overlaps instead of thin lines
    for i in range(1, len(shapes)):
        # Connect to a random previous shape
        connect_to = random.randint(0, i-1)
        
        # Find points between the two shapes
        shape1 = shapes[i]
        shape2 = shapes[connect_to]
        
        # Find closest points (simplified)
        min_dist = float('inf')
        closest_pair = None
        
        # Sample points to find close pairs
        samples = min(len(shape1), len(shape2), 10)
        for _ in range(samples):
            p1 = shape1[random.randint(0, len(shape1)-1)]
            p2 = shape2[random.randint(0, len(shape2)-1)]
            
            dist = math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)
            if dist < min_dist:
                min_dist = dist
                closest_pair = (p1, p2)
        
        if closest_pair and min_dist > 10:  # Only bridge if shapes aren't already overlapping
            # Create a blob bridge instead of a thin line
            create_blob_bridge(draw, closest_pair[0], closest_pair[1])
    
    # Add fractal-like branching structures at the edges - more controlled distribution
    add_distributed_tendrils(draw, shapes, half_width, size, center_x, center_y, main_radius)
    
    # Add isolated spots with controlled distance
    add_controlled_spots(draw, half_width, size, center_x, center_y, main_radius)
    
    # Add ink drips and runs
    add_simple_drips(draw, img, half_width, size)
    
    return img

def generate_flowing_shape(center_x, center_y, radius, points_count):
    """
    Generate an organic shape with very smooth, flowing edges
    """
    points = []
    
    # Use more points for smoother edges
    for i in range(points_count):
        angle = 2 * math.pi * i / points_count
        
        # Create subtle variation with multiple overlapping sine waves
        # Use more harmonics for natural complexity but with smaller amplitudes
        r_variation = 1.0
        # Base frequency modulation
        r_variation += 0.15 * math.sin(angle * 2.0)
        r_variation += 0.12 * math.sin(angle * 3.5)
        r_variation += 0.08 * math.sin(angle * 5.0)
        r_variation += 0.05 * math.sin(angle * 7.5)
        r_variation += 0.03 * math.sin(angle * 11.0)
        
        # Add very subtle noise - less randomness for smoother contours
        r_variation += random.uniform(-0.05, 0.05)
        
        # Ensure radius stays positive and smooth
        r_variation = max(0.8, r_variation)
        
        # Calculate point coordinates with a small smoothing factor
        x = center_x + int(radius * r_variation * math.cos(angle))
        y = center_y + int(radius * r_variation * math.sin(angle))
        points.append((x, y))
    
    # Apply a small amount of smoothing to the points
    smoothed_points = []
    for i in range(len(points)):
        prev_idx = (i - 1) % len(points)
        next_idx = (i + 1) % len(points)
        
        # Simple 3-point moving average for smoothing
        smoothed_x = int((points[prev_idx][0] + points[i][0] + points[next_idx][0]) / 3)
        smoothed_y = int((points[prev_idx][1] + points[i][1] + points[next_idx][1]) / 3)
        
        smoothed_points.append((smoothed_x, smoothed_y))
    
    return smoothed_points