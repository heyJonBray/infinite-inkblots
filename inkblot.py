import hashlib, random, math
from PIL import Image, ImageDraw

def generate_pixel_inkblot(address: str, size=1024, grid=24, fill_prob=1.1) -> Image:
    seed = int(hashlib.sha256(address.lower().encode()).hexdigest(), 16)
    rnd = random.Random(seed)

    cell_size = size / grid
    img = Image.new("L", (size, size), color=255)
    draw = ImageDraw.Draw(img)

    center_x, center_y = grid // 4, grid // 2

    for dx in range(-grid//4, grid//4):
        for dy in range(-grid//2, grid//2):
            dist = (dx**2 + dy**2)**0.5
            prob = fill_prob * (1.0 - dist / (grid/2))  # cluster to center
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
            continue  # skip center

        x0 = int(gx * cell_size)
        y0 = int(gy * cell_size)
        x1 = int((gx + 1) * cell_size)
        y1 = int((gy + 1) * cell_size)
        draw.rectangle([x0, y0, x1, y1], fill=0)


# Example usage
if __name__ == "__main__":
    img = generate_pixel_inkblot("0x7e2F9dd040cF7B41a1AF9e4A24A0EDB04093dDa1")
    img.save("inkblot.png")
