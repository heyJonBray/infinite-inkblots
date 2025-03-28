import hashlib, random, math
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

    # Step 5: create and add ink bleed underneath
    bleed = create_ink_bleed_layer_blur(ink_layer, blur_radius=8, alpha=180)
    combined = Image.alpha_composite(base, bleed)
    combined = Image.alpha_composite(combined, ink_layer)

    # Step 6: add gradient border on top
    final = combined.convert("RGB")
    add_grid_border_gradient_colored(final, grid_size=grid, address=address)

    return final


def create_ink_bleed_layer_blur(ink_img: Image.Image, blur_radius=6, alpha=180) -> Image.Image:
    """
    Create a strong, soft black blur underneath the inkblot to simulate ink bleed.
    """
    # Extract the alpha channel from the ink layer
    alpha_mask = ink_img.getchannel("A")

    # Create a fully black image with uniform alpha applied via the mask
    black = Image.new("RGBA", ink_img.size, (0, 0, 0, alpha))
    black.putalpha(alpha_mask)

    # Apply Gaussian blur to simulate bleed
    return black.filter(ImageFilter.GaussianBlur(blur_radius))


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
    address = "0xddeF9dd040cF7B41a1AF9e4A24A0EDB04093dD69"
    img = generate_pixel_inkblot(address)
    metadata = get_palette_metadata(address)
    print(metadata)
    img.save("inkblot.png")