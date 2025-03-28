import random
import math
from PIL import ImageDraw

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

def add_distributed_tendrils(draw, shapes, width, height, center_x, center_y, main_radius):
    """
    Add fractal-like tendrils with controlled distribution to prevent clumping
    """
    # Identify points along the edges of the shapes
    edge_points = []
    
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