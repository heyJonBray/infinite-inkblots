import hashlib, random, math
from PIL import Image, ImageDraw

address = "0x7e2F9dd040cF7B41a1AF9e4A24A0EDB04093dDa1"

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
    img = Image.new("RGB", (size, size), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    center_x, center_y = grid // 4, grid // 2

    for dx in range(-grid//4, grid//4):
        for dy in range(-grid//2, grid//2):
            dist = (dx**2 + dy**2)**0.5
            prob = fill_prob * (1.0 - dist / (grid/2))
            if rnd.random() < prob:
                gx = center_x + dx
                gy = center_y + dy

                x0 = int(gx * cell_size)
                y0 = int(gy * cell_size)
                x1 = int((gx + 1) * cell_size)
                y1 = int((gy + 1) * cell_size)
                draw.rectangle([x0, y0, x1, y1], fill=0)

    # Mirror left to right
    left = img.crop((0, 0, size//2, size))
    img.paste(left.transpose(Image.FLIP_LEFT_RIGHT), (size//2, 0))

    # Conditional splatter
    hex_part = address.lower().replace("0x", "")
    zero_count = hex_part.count("0")

    if zero_count > 1:
        count = int(((zero_count - 1) / 9) * 400)
        add_grid_splatter(img, draw, seed, grid_size=grid, scale=2, count=count)

    # Add colored gradient border (always corner-based)
    add_grid_border_gradient_colored(img, grid_size=grid, address=address)

    return img


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
        draw.rectangle([x0, y0, x1, y1], fill=0)


def get_border_palette(address: str):
    hex_addr = address.lower().replace("0x", "")
    h = hashlib.sha256(hex_addr.encode()).hexdigest()
    palette_index = int(h[0:2], 16) % len(PALETTES)
    return PALETTES[palette_index]


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def add_grid_border_gradient_colored(img, grid_size, address):
    draw = ImageDraw.Draw(img)
    w, h = img.size
    cell_size = w / grid_size

    c0, c1 = get_border_palette(address)

    for gx in range(grid_size):
        for gy in range(grid_size):
            is_edge = gx == 0 or gx == grid_size - 1 or gy == 0 or gy == grid_size - 1
            if not is_edge:
                continue

            # Always use corner-based gradient
            dist_x = min(gx, grid_size - 1 - gx)
            dist_y = min(gy, grid_size - 1 - gy)
            progress = (dist_x + dist_y) / (2 * (grid_size - 1))
            progress = max(0, min(1, progress))

            color = lerp_color(c0, c1, progress)

            x0 = int(gx * cell_size)
            y0 = int(gy * cell_size)
            x1 = int((gx + 1) * cell_size)
            y1 = int((gy + 1) * cell_size)
            draw.rectangle([x0, y0, x1, y1], fill=color)
            
def get_palette_metadata(address: str):
    hex_addr = address.lower().replace("0x", "")
    h = hashlib.sha256(hex_addr.encode()).hexdigest()
    index = int(h[0:2], 16) % len(PALETTES)
    return {
        "palette_index": index,
        "start_color": PALETTES[index][0],
        "end_color": PALETTES[index][1],
    }



# Example usage
if __name__ == "__main__":
    img = generate_pixel_inkblot(address)
    metadata = get_palette_metadata(address)
    print(metadata)  # pass this to service
    img.save("inkblot.png")
