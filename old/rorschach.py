import numpy as np
import random
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import math
import hashlib

def create_realistic_rorschach(size=1024, eth_address=None):
    """
    Create a realistic Rorschach inkblot test image with organic flowing shapes
    and natural-looking fractal extensions.
    
    Parameters:
        size (int): Size of the output image in pixels (square)
        eth_address (str): Ethereum address to use as seed. If None, random seed is used.
    """
    if eth_address is not None:
        # Convert Ethereum address to a numerical seed
        # First, normalize the address (remove '0x' if present, convert to lowercase)
        eth_address = eth_address.lower().replace('0x', '')
        
        # Create a hash of the address to get a deterministic number
        hash_object = hashlib.sha256(eth_address.encode())
        hex_digest = hash_object.hexdigest()
        
        # Convert the first 8 bytes of the hash to an integer
        seed = int(hex_digest[:16], 16)
        np_seed = seed % (2**32)
        
        # Set the seeds for both random and numpy.random
        random.seed(seed)
        np.random.seed(np_seed)
    
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
    add_distributed_tendrils(draw, shapes, half_width, size)
    
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

def create_blob_bridge(draw, start, end):
    """
    Create a blob-like bridge between two shapes instead of a thin line
    """
    x1, y1 = start
    x2, y2 = end
    
    # Calculate length and angle of bridge
    dx = x2 - x1
    dy = y2 - y1
    dist = math.sqrt(dx*dx + dy*dy)
    angle = math.atan2(dy, dx)
    
    # Create a series of overlapping circles along the path
    steps = max(3, int(dist / 10))
    
    # Determine bridge width - thicker for more natural look
    max_width = max(5, int(dist * 0.15))
    min_width = max(3, int(max_width * 0.6))
    
    for i in range(steps + 1):
        t = i / steps
        # Position with slight waviness
        wave_factor = math.sin(t * math.pi) * 0.2
        pos_x = int(x1 + dx * t + random.uniform(-wave_factor, wave_factor) * dist)
        pos_y = int(y1 + dy * t + random.uniform(-wave_factor, wave_factor) * dist)
        
        # Width varies along bridge - thicker in middle
        width_factor = 1.0 - 2.0 * abs(t - 0.5)  # Peaks at middle
        width = min_width + int((max_width - min_width) * width_factor)
        
        # Draw a blob at this position
        draw.ellipse((pos_x - width, pos_y - width, 
                      pos_x + width, pos_y + width), 
                     fill=(0, 0, 0, 255))
    
    # Add slight texture to the bridge
    texture_count = random.randint(2, 4)
    for _ in range(texture_count):
        # Position along bridge
        t = random.uniform(0.2, 0.8)
        pos_x = int(x1 + dx * t)
        pos_y = int(y1 + dy * t)
        
        # Create a small tendril
        tendril_angle = angle + random.uniform(-0.7, 0.7)
        tendril_length = random.randint(5, 15)
        create_whispy_strand(draw, (pos_x, pos_y), tendril_angle, tendril_length)

def create_whispy_strand(draw, start, angle, length):
    """
    Create a thin, whispy strand that tapers at the end
    """
    x, y = start
    
    # Create points along the strand with gentle waviness
    points = [start]
    current_angle = angle
    
    for i in range(1, length + 1):
        # Add subtle waviness by varying the angle slightly
        current_angle += random.uniform(-0.3, 0.3)
        
        # Length of each segment
        segment_length = 1.5 + random.uniform(-0.3, 0.3)
        
        # Calculate new point
        new_x = x + int(segment_length * math.cos(current_angle))
        new_y = y + int(segment_length * math.sin(current_angle))
        
        # Safety check to ensure we stay within bounds
        if hasattr(draw, 'im') and hasattr(draw.im, 'size'):
            w, h = draw.im.size
            new_x = max(0, min(new_x, w-1))
            new_y = max(0, min(new_y, h-1))
        
        points.append((new_x, new_y))
        x, y = new_x, new_y
    
    # Draw the strand with decreasing thickness for tapering effect
    for i in range(len(points) - 1):
        # Use a more gradual taper for natural look
        thickness = max(1, int(2 * (1 - (i / length)**1.5)))
        draw.line([points[i], points[i+1]], fill=(0, 0, 0, 255), width=thickness)

def add_distributed_tendrils(draw, shapes, width, height):
    """
    Add fractal-like tendrils with controlled distribution to prevent clumping
    """
    # Identify points along the edges of the shapes
    edge_points = []
    center_x = width // 2
    center_y = height // 2
    
    # Process all shapes
    for shape in shapes:
        for point in shape:
            x, y = point
            # Calculate distance from center
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Add point if it's near an edge (using distance as heuristic)
            if dist > width * 0.25:
                edge_points.append((point, dist))
    
    # Sort by distance
    edge_points.sort(key=lambda p: -p[1])
    
    # Break the image into 8 sectors and distribute tendrils more evenly
    sectors = [[] for _ in range(8)]
    
    for point, dist in edge_points:
        x, y = point
        # Determine sector (0-7) based on angle from center
        angle = math.atan2(y - center_y, x - center_x)
        sector = int(((angle + math.pi) / (2 * math.pi) * 8) % 8)
        sectors[sector].append((point, dist))
    
    # Create tendrils in each sector to ensure distribution
    tendril_count = min(20, len(edge_points))  # Limit total number
    tendrils_per_sector = max(1, tendril_count // 8)
    
    # Track tendril endpoints to ensure we don't place them too close together
    tendril_endpoints = []
    
    for sector_points in sectors:
        # Take the farthest points in each sector
        points_to_use = sector_points[:tendrils_per_sector]
        
        for point_data in points_to_use:
            start_point = point_data[0]
            
            # Check if this point is too close to existing tendrils
            too_close = False
            for endpoint in tendril_endpoints:
                endpoint_x, endpoint_y = endpoint
                start_x, start_y = start_point
                if math.sqrt((endpoint_x - start_x)**2 + (endpoint_y - start_y)**2) < 20:
                    too_close = True
                    break
            
            if too_close:
                continue
                
            # Direction generally outward from the center
            dx = start_point[0] - center_x
            dy = start_point[1] - center_y
            
            # Calculate angle with slight randomness
            mag = math.sqrt(dx*dx + dy*dy)
            if mag > 0:
                angle = math.atan2(dy, dx) + random.uniform(-0.3, 0.3)
                
                # Create a tendril with controlled depth
                depth = random.randint(2, 4)  # Reduced depth to prevent over-complexity
                create_natural_tendril(draw, start_point, angle, depth)
                
                # Calculate and store approximate endpoint
                length = 4 + depth * random.randint(2, 4)  # Matches create_natural_tendril
                end_x = start_point[0] + int(length * math.cos(angle))
                end_y = start_point[1] + int(length * math.sin(angle))
                tendril_endpoints.append((end_x, end_y))

def create_natural_tendril(draw, start, angle, depth):
    """
    Create a natural-looking tendril with fractal-like branching
    """
    if depth <= 0:
        return
    
    x, y = start
    
    # Length varies with depth
    length = 4 + depth * random.randint(2, 4)
    
    # Calculate end point with slight curvature
    curve_angle = angle + random.uniform(-0.2, 0.2) * (1 / depth)
    end_x = x + int(length * math.cos(curve_angle))
    end_y = y + int(length * math.sin(curve_angle))
    
    # Safety check boundaries
    if hasattr(draw, 'im') and hasattr(draw.im, 'size'):
        w, h = draw.im.size
        end_x = max(0, min(end_x, w-1))
        end_y = max(0, min(end_y, h-1))
    
    end_point = (end_x, end_y)
    
    # Draw the tendril segment with tapered thickness
    thickness = max(1, depth - 1)
    draw.line([start, end_point], fill=(0, 0, 0, 255), width=thickness)
    
    # Junction point for branches - with slight natural variation
    fork_position = random.uniform(0.6, 0.8)
    junction_x = x + int(length * fork_position * math.cos(curve_angle))
    junction_y = y + int(length * fork_position * math.sin(curve_angle))
    
    # Safety check
    if hasattr(draw, 'im') and hasattr(draw.im, 'size'):
        w, h = draw.im.size
        junction_x = max(0, min(junction_x, w-1))
        junction_y = max(0, min(junction_y, h-1))
        
    junction = (junction_x, junction_y)
    
    # Branch count depends on depth - deeper levels have more branches
    branch_count = 2
    if depth > 2:
        branch_count = random.randint(2, 3)
    
    # Create branches with natural angles
    # Primary branch continues approximate direction
    main_branch_angle = curve_angle + random.uniform(-0.3, 0.3)
    create_natural_tendril(draw, junction, main_branch_angle, depth-1)
    
    # Secondary branches diverge more
    for _ in range(branch_count - 1):
        # Branch at more natural angles
        branch_angle = curve_angle + random.uniform(0.4, 1.0) * random.choice([-1, 1])
        
        # Recursive call with reduced depth
        create_natural_tendril(draw, junction, branch_angle, depth-1)

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

# Generate and save the image
if __name__ == "__main__":
    # Example usage with an Ethereum address
    eth_address = "0xshmooshmoo0000000000000"
    inkblot = create_realistic_rorschach(size=1024, eth_address=eth_address)
    inkblot.save("eth_rorschach.png")
    
    # You can also generate a random inkblot by not providing an ethereum address
    # random_inkblot = create_realistic_rorschach(size=1024)
    # random_inkblot.save("random_rorschach.png")