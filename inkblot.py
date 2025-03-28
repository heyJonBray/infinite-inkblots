import hashlib, random, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Finite color palettes (R, G, B)
PALETTES = [
    [(0, 0, 0), (100, 100, 100)],          # black → gray
    [(0, 0, 80), (80, 80, 255)],           # navy → blue
    [(80, 0, 0), (255, 100, 100)],         # dark red → pink
    [(0, 60, 0), (120, 255, 120)],         # forest → mint
    [(50, 30, 0), (255, 220, 150)],        # brown → tan
    [(50, 0, 50), (200, 100, 200)],        # plum → lavender
]


def generate_pixel_inkblot(address: str, size=1024, grid=24, fill_prob=1.1) -> Image:
    seed = int(hashlib.sha256(address.lower().encode()).hexdigest(), 16)
    rnd = random.Random(seed)

    cell_size = size / grid

    # Step 1: draw inkblot with transparent background
    ink_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ink_layer)
    center_x, center_y = grid // 4, grid // 2

    for dx in range(-grid // 4, grid // 4):
        for dy in range(-grid // 2, grid // 2):
            dist = (dx**2 + dy**2)**0.5
            prob = fill_prob * (1.0 - dist / (grid / 2))
            if rnd.random() < prob:
                gx = center_x + dx
                gy = center_y + dy
                x0 = int(gx * cell_size)
                y0 = int(gy * cell_size)
                x1 = int((gx + 1) * cell_size)
                y1 = int((gy + 1) * cell_size)
                draw.rectangle([x0, y0, x1, y1], fill=(0, 0, 0, 255))

    # Step 2: mirror
    left = ink_layer.crop((0, 0, size // 2, size))
    ink_layer.paste(left.transpose(Image.FLIP_LEFT_RIGHT), (size // 2, 0))

    # Step 3: conditional splatter
    hex_part = address.lower().replace("0x", "")
    zero_count = hex_part.count("0")

    if zero_count > 1:
        count = int(((zero_count - 1) / 9) * 400)
        draw = ImageDraw.Draw(ink_layer)
        add_grid_splatter(ink_layer, draw, seed, grid_size=grid, scale=2, count=count)

    # Step 4: create white background
    base = Image.new("RGBA", ink_layer.size, (255, 255, 255, 255))

    # Step 5: create and add branching structures using cellular automata
    branch_layer = create_pixel_branches(ink_layer, seed, iterations=4, branch_prob=0.6, fade_factor=0.2)
    
    # Step 6: Add ink drips for more Rorschach-like appearance
    drip_layer = create_ink_drips(ink_layer, seed, drip_count=4)
    
    # Composite the layers
    combined = Image.alpha_composite(base, branch_layer)
    combined = Image.alpha_composite(combined, drip_layer)
    combined = Image.alpha_composite(combined, ink_layer)

    # Step 7: add gradient border on top
    final = combined.convert("RGB")
    add_grid_border_gradient_colored(final, grid_size=grid, address=address)

    return final


def create_pixel_branches(ink_img: Image.Image, seed, iterations=4, branch_prob=0.28, fade_factor=0.7) -> Image.Image:
    """
    Creates branching structures from the main ink blot using a cellular automata-like approach.
    This preserves the pixel art style while creating natural-looking ink spread.
    """
    rnd = random.Random(seed + 123)
    w, h = ink_img.size
    
    # Get alpha channel of original ink
    ink_alpha = np.array(ink_img.getchannel("A"))
    
    # Create output layer (starts with zeros)
    branches = np.zeros((h, w), dtype=np.uint8)
    
    # Find the edge pixels of the ink blot
    # These will be our starting points for the branches
    edge_mask = Image.fromarray(ink_alpha).filter(ImageFilter.FIND_EDGES)
    edge_pixels = np.array(edge_mask) > 10
    
    # Create a list of edge pixel coordinates
    edge_points = []
    for y in range(h):
        for x in range(w):
            if edge_pixels[y, x]:
                edge_points.append((x, y))
    
    # Neighbor directions (8-connected: cardinal + diagonal directions)
    directions = [
        (-1, -1), (0, -1), (1, -1),  # Above
        (-1, 0),           (1, 0),   # Sides
        (-1, 1),  (0, 1),  (1, 1)    # Below
    ]
    
    # Direction weights - we can make downward directions more likely
    # This simulates gravity's effect on ink
    dir_weights = [
        0.6, 0.7, 0.6,  # Above
        0.8,      0.8,  # Sides
        0.9, 1.0, 0.9   # Below (higher probability)
    ]
    
    # Active points and their intensities
    active_points = {}
    for pt in edge_points:
        active_points[pt] = 255  # Start with full intensity
    
    # Run the cellular automata for several iterations
    for iteration in range(iterations):
        new_active_points = active_points.copy()
        
        # Process each active point
        for (x, y), intensity in active_points.items():
            # Skip if intensity is too low
            if intensity < 30:
                continue
                
            # Determine next intensity level (fading)
            next_intensity = int(intensity * fade_factor)
            
            # Try to branch in random directions
            for i, (dx, dy) in enumerate(directions):
                nx, ny = x + dx, y + dy
                
                # Check bounds
                if nx < 0 or nx >= w or ny < 0 or ny >= h:
                    continue
                
                # Skip if this pixel is already part of the solid ink
                if ink_alpha[ny, nx] > 0:
                    continue
                
                # Skip if this pixel already has higher intensity in branches
                if branches[ny, nx] >= next_intensity:
                    continue
                
                # Chance to create a branch in this direction
                # Adjust probability based on direction and random factors
                adjusted_prob = branch_prob * dir_weights[i]
                
                # Add random variation based on position
                # This creates more organic growth patterns
                pos_factor = 0.9 + 0.2 * math.sin(nx * 0.1) * math.cos(ny * 0.1)
                adjusted_prob *= pos_factor
                
                if rnd.random() < adjusted_prob:
                    # Add this point to the next iteration with reduced intensity
                    new_active_points[(nx, ny)] = next_intensity
                    branches[ny, nx] = next_intensity
        
        # Update active points for next iteration
        active_points = {k: v for k, v in new_active_points.items() if v >= 20}
    
    # Create RGBA image from branches array
    branch_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    branch_img.putalpha(Image.fromarray(branches))
    
    return branch_img


def create_ink_drips(ink_img: Image.Image, seed, drip_count=8) -> Image.Image:
    """
    Creates vertical drip effects that commonly appear in ink blots
    """
    rnd = random.Random(seed + 456)
    w, h = ink_img.size
    drips = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(drips)
    
    # Find the bottom edge of the ink blot
    ink_alpha = np.array(ink_img.getchannel("A"))
    
    # Scan the bottom half of the image
    for x in range(w):
        for y in range(h//2, h-20):  # Start from middle, avoid very bottom
            # If we find an ink pixel and there's empty space below it
            if ink_alpha[y, x] > 200 and y+1 < h and ink_alpha[y+1, x] < 50:
                # Potential drip starting point
                if rnd.random() < 0.03:  # Only create drips at some edge points
                    # Create a drip
                    drip_length = rnd.randint(5, 25)
                    drip_width = rnd.randint(1, 3)
                    
                    # Vary the drip shape
                    points = [(x, y)]
                    current_y = y
                    drift = 0
                    
                    for i in range(drip_length):
                        # Allow slight horizontal drift
                        drift += rnd.uniform(-0.3, 0.3)
                        drift = max(-drip_width, min(drip_width, drift))
                        
                        current_y += 1
                        current_x = int(x + drift)
                        
                        # Ensure within bounds
                        current_x = max(0, min(w-1, current_x))
                        if current_y >= h:
                            break
                            
                        points.append((current_x, current_y))
                    
                    # Draw the drip with fading opacity
                    for i, (px, py) in enumerate(points):
                        opacity = int(255 * (1 - i/len(points))**0.8)
                        draw.rectangle([px, py, px+drip_width-1, py], fill=(0, 0, 0, opacity))
    
    return drips


def add_grid_splatter(img, draw, seed, grid_size, scale, count):
    rnd = random.Random(seed + 1337)
    w, h = img.size
    splat_grid = grid_size * scale
    cell_size = w / splat_grid

    for _ in range(count):
        gx = rnd.randint(0, splat_grid - 1)
        gy = rnd.randint(0, splat_grid - 1)
        if abs(gx - splat_grid // 2) < splat_grid // 4:
            continue
        x0 = int(gx * cell_size)
        y0 = int(gy * cell_size)
        x1 = int((gx + 1) * cell_size)
        y1 = int((gy + 1) * cell_size)
        draw.rectangle([x0, y0, x1, y1], fill=(0, 0, 0, 255))


def get_border_palette(address: str):
    hex_addr = address.lower().replace("0x", "")
    if hex_addr.startswith("420") or hex_addr.endswith("420") or \
       hex_addr.startswith("69") or hex_addr.endswith("69"):
        # Three-stage gradient: outer → inner → center
        return [(153, 112, 0), (255, 230, 128), (153, 112, 0)]
    h = hashlib.sha256(hex_addr.encode()).hexdigest()
    palette_index = int(h[0:2], 16) % len(PALETTES)
    return PALETTES[palette_index]


def get_palette_metadata(address: str):
    hex_addr = address.lower().replace("0x", "")
    h = hashlib.sha256(hex_addr.encode()).hexdigest()
    index = int(h[0:2], 16) % len(PALETTES)
    return {
        "palette_index": index,
        "start_color": PALETTES[index][0],
        "end_color": PALETTES[index][1],
    }


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def add_grid_border_gradient_colored(img, grid_size, address):
    draw = ImageDraw.Draw(img)
    w, h = img.size
    cell_size = w / grid_size

    palette = get_border_palette(address)
    if len(palette) == 2:
        c0, c1 = palette
        def get_color(progress):
            return lerp_color(c0, c1, progress)
    elif len(palette) == 3:
        c0, c1, c2 = palette
        def get_color(progress):
            # progress: 0 → 0.5 → 1 (c0 → c1 → c2)
            if progress < 0.5:
                return lerp_color(c0, c1, progress * 2)
            else:
                return lerp_color(c1, c2, (progress - 0.5) * 2)
    else:
        raise ValueError("Invalid palette")

    for gx in range(grid_size):
        for gy in range(grid_size):
            is_edge = gx == 0 or gx == grid_size - 1 or gy == 0 or gy == grid_size - 1
            if not is_edge:
                continue
            dist_x = min(gx, grid_size - 1 - gx)
            dist_y = min(gy, grid_size - 1 - gy)
            progress = (dist_x + dist_y) / (2 * (grid_size - 1))
            progress = max(0, min(1, progress))
            color = get_color(progress)
            x0 = int(gx * cell_size)
            y0 = int(gy * cell_size)
            x1 = int((gx + 1) * cell_size)
            y1 = int((gy + 1) * cell_size)
            draw.rectangle([x0, y0, x1, y1], fill=color)


# Example usage
if __name__ == "__main__":
    address = "0x7e2F9dd040cF7B41a1A0000004A0EDB04093dD69"
    img = generate_pixel_inkblot(address)
    metadata = get_palette_metadata(address)
    print(metadata)
    img.save("inkblot.png")