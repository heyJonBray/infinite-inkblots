# Rorschach Generator Improvements

## 1. Ink Density and Texture Variation

**Description:**  
Real Rorschach inkblots show significant variation in ink density, with some areas appearing darker or more concentrated than others. Current images have uniform black with little internal texture. Adding this variation would create a more natural appearance with a sense of depth that mimics how real ink behaves on paper.

**Responsible File:**  
`ink_effects.py`

**Technical Approach:**

- Modify the `add_ink_texture()` function to create more variation in opacity
- Use Perlin noise to generate natural-looking density patterns within black areas
- Implement a multi-pass approach where some areas get additional "layers" of ink
- Sample code approach:
  ```python
  def enhance_ink_texture(img_array):
      h, w = img_array.shape[:2]
      noise = generate_perlin_noise((h, w))

      for y in range(h):
          for x in range(w):
              if img_array[y, x, 3] > 200:  # If this is a solid ink pixel
                  # Map noise to opacity variation (80-100% opacity)
                  variation = 0.8 + (noise[y, x] * 0.2)
                  img_array[y, x, 3] = int(255 * variation)

                  # Slight color variation (not pure black but very dark gray)
                  color_var = int(noise[y, x] * 15)  # 0-15 variation
                  img_array[y, x, 0:3] = [color_var, color_var, color_var]
  ```

## 2. Improved Ink Edge Behavior

**Description:**  
Real inkblots exhibit characteristic edge behaviors where ink meets paper - feathering, tiny irregularities, varied edge sharpness. Some edges are crisp while others show diffusion where ink has been absorbed into the paper. Adding these details would significantly enhance realism.

**Responsible File:**  
`shapes.py` and `ink_effects.py`

**Technical Approach:**

- Add a new function `create_feathered_edges()` in `ink_effects.py`
- Apply varying levels of edge diffusion to different sections of each shape
- Use distance fields to create smooth transitions at selected edges
- Implement a selective Gaussian blur with variable radius at edges
- Sample approach:
  ```python
  def create_feathered_edges(img):
      # Convert to numpy for pixel manipulation
      img_array = np.array(img)

      # Find edges using simple edge detection
      edges = find_ink_edges(img_array)

      # For each edge pixel, decide on feathering type
      for x, y in edges:
          # Randomly choose edge treatment: sharp, slightly feathered, or diffused
          treatment_type = random.choices(
              ["sharp", "feather", "diffuse"],
              weights=[0.6, 0.3, 0.1]
          )[0]

          if treatment_type == "sharp":
              continue  # Keep edge as is
          elif treatment_type == "feather":
              apply_light_feathering(img_array, x, y, radius=2)
          else:
              apply_diffusion(img_array, x, y, radius=3)
  ```

## 3. Organic Inter-Shape Transitions

**Description:**  
Real Rorschach blots display organic transitions between shapes - how one form flows into another follows natural fluid dynamics. The current generator creates good complex shapes but could benefit from more natural transitions between connected elements, improving the authenticity of the inkblots.

**Responsible File:**  
`shapes.py`, specifically the `create_blob_bridge()` function

**Technical Approach:**

- Enhance the `create_blob_bridge()` function to create more varied connection types
- Implement fluid simulation concepts to model how ink naturally flows between areas
- Add occasional "pooling" where shapes connect
- Create natural thinning in connections according to fluid physics
- Sample approach:
  ```python
  def enhanced_blob_bridge(draw, start, end, thickness_variation=True, pooling_chance=0.3):
      x1, y1 = start
      x2, y2 = end

      # Calculate bridge parameters
      dx, dy = x2 - x1, y2 - y1
      dist = math.sqrt(dx*dx + dy*dy)
      angle = math.atan2(dy, dx)

      # Create a more natural flow path with slight curves
      control_point_offset = random.uniform(0.1, 0.3) * dist
      control_x = (x1 + x2) / 2 + control_point_offset * math.cos(angle + math.pi/2)
      control_y = (y1 + y2) / 2 + control_point_offset * math.sin(angle + math.pi/2)

      # Generate points along a quadratic Bezier curve
      steps = max(5, int(dist / 8))
      points = []

      for i in range(steps + 1):
          t = i / steps
          # Quadratic Bezier formula
          px = (1-t)*(1-t)*x1 + 2*(1-t)*t*control_x + t*t*x2
          py = (1-t)*(1-t)*y1 + 2*(1-t)*t*control_y + t*t*y2
          points.append((px, py))
  ```

## 4. Subtle Asymmetry

**Description:**  
While Rorschach tests maintain fundamental symmetry, real inkblots always contain subtle asymmetries between the left and right sides due to paper texture, ink viscosity variations, and environmental factors. Adding these subtle imperfections would make the images feel less digital and more authentic.

**Responsible File:**  
`main.py`, in the mirroring section

**Technical Approach:**

- Modify the mirroring process to introduce slight variations
- Add subtle distortions to the mirror plane
- Apply minor random transformations to one side
- Implement controlled noise at mirroring boundaries
- Sample approach:
  ```python
  def create_subtle_asymmetry(left_half, distortion_level=0.02):
      """
      Add subtle asymmetry to the mirrored half to make it more natural
      """
      right_half = ImageOps.mirror(left_half)

      # Get dimensions
      width, height = right_half.size

      # Convert to numpy for manipulation
      right_array = np.array(right_half)

      # Apply subtle warping
      for y in range(height):
          for x in range(width):
              # Calculate distortion amount (more at edges, less near mirror line)
              dist_factor = (x / width) * distortion_level

              # Apply subtle pixel shifts
              if right_array[y, x, 3] > 0:  # Only modify ink pixels
                  # Random sub-pixel shifting
                  shift_y = int(random.uniform(-2, 2) * dist_factor)

                  # Apply shift if within bounds
                  if 0 <= y + shift_y < height:
                      right_array[y, x, 3] = max(0, right_array[y, x, 3] - int(random.uniform(0, 10) * dist_factor))

      return Image.fromarray(right_array)
  ```

## 5. Varied Vertical-Horizontal Symmetry

**Description:**  
Real Rorschach tests often have different characteristics between top and bottom halves (vertical asymmetry) due to gravitational effects on ink. Your suggestion to scale one half differently is excellent and would add variety to the images while maintaining the essential Rorschach-like appearance.

**Responsible File:**  
`main.py`, in the four-quadrant creation section

**Technical Approach:**

- Modify the code that creates horizontal symmetry
- Add parameters to control scaling differences
- Implement slight rotation or subtle transformations
- Vary the vertical midpoint slightly
- Sample approach:
  ```python
  def create_four_quadrant_with_variation(img, size, vertical_scale_range=(0.7, 0.9)):
      """
      Create four-quadrant image with variation between top and bottom
      """
      # Get the top half with vertical symmetry
      half_width = size // 2
      top_half = img.crop((0, 0, size, size // 2))

      # Choose a scaling factor for bottom half
      vertical_scale = random.uniform(vertical_scale_range[0], vertical_scale_range[1])

      # Create bottom half with different scaling
      bottom_half = ImageOps.flip(top_half)

      # Resize the bottom half
      new_height = int(bottom_half.height * vertical_scale)
      bottom_half = bottom_half.resize((bottom_half.width, new_height), Image.Resampling.LANCZOS)

      # Create new image with the varied halves
      result_img = Image.new('RGBA', (size, size), (255, 255, 255, 255))

      # Paste top half
      result_img.paste(top_half, (0, 0), top_half)

      # Calculate vertical position for bottom half (centered)
      bottom_y = size - new_height

      # Paste bottom half
      result_img.paste(bottom_half, (0, bottom_y), bottom_half)

      return result_img
  ```

## 6. Varied Ink Appearance (Gradient Effects)

**Description:**  
Real ink interacts with paper to create subtle gradients and variations rather than solid black. Adding these effects would simulate the way ink naturally disperses and is absorbed by paper, creating areas of varying saturation and subtle color gradation.

**Responsible File:**  
New file: `ink_physics.py`

**Technical Approach:**

- Create a new module to simulate ink physics
- Implement algorithms that mimic how ink disperses on paper
- Add subtle dark gray/blue tints instead of pure black
- Create gradient effects where ink fades out
- Sample approach:
  ```python
  def simulate_ink_absorption(img):
      """
      Simulate how ink is absorbed into paper, creating natural gradients
      """
      img_array = np.array(img)
      h, w = img_array.shape[:2]

      # Generate absorption map (how paper absorbs ink in different areas)
      # Higher value = more absorption = lighter ink
      absorption_map = generate_perlin_noise((h, w), scale=20.0)

      # Apply the absorption effect
      for y in range(h):
          for x in range(w):
              if img_array[y, x, 3] > 0:  # Only process ink pixels
                  # Get local absorption factor
                  absorption = absorption_map[y, x] * 0.3  # 0-0.3 range

                  # Calculate new alpha based on absorption
                  new_alpha = int(img_array[y, x, 3] * (1.0 - absorption))

                  # Apply very subtle color variation
                  # Pure black (0,0,0) -> Very dark blue-gray (10,10,15)
                  tint_factor = absorption * 0.5
                  r = int(tint_factor * 10)
                  g = int(tint_factor * 10)
                  b = int(tint_factor * 15)

                  img_array[y, x, 0:4] = [r, g, b, new_alpha]

      return Image.fromarray(img_array)
  ```

## 7. Improved Ink-to-Whitespace Balance

**Description:**  
Real Rorschach tests typically maintain a specific ratio of ink to white space for optimal psychological interpretation. Some of your current images appear either too dense or too sparse. Adjusting this balance would create more authentic and psychologically effective inkblots.

**Responsible File:**  
`shapes.py`, in the generation parameters

**Technical Approach:**

- Add a density control parameter to the main generation function
- Adjust the number and size of shapes based on target density
- Implement automatic adjustment of shape parameters to maintain balance
- Create a feedback loop that measures and controls ink coverage
- Sample approach:
  ```python
  def generate_balanced_shapes(size, target_density=0.25, tolerance=0.05):
      """
      Generate shapes with controlled ink-to-whitespace ratio
      target_density = proportion of image that should be ink (0.0-1.0)
      """
      half_width = size // 2

      # Initial parameters
      shapes_count = 5
      main_radius = size // 7

      while True:
          # Generate shapes with current parameters
          img = Image.new('RGBA', (half_width, size), (0, 0, 0, 0))
          draw = ImageDraw.Draw(img)

          # [...shape generation code...]

          # Measure actual ink density
          img_array = np.array(img)
          ink_pixels = np.sum(img_array[:, :, 3] > 128)
          total_pixels = half_width * size
          actual_density = ink_pixels / total_pixels

          # Check if within tolerance
          if abs(actual_density - target_density) <= tolerance:
              return img  # Success

          # Adjust parameters
          if actual_density < target_density:
              # Too sparse - increase coverage
              shapes_count = min(shapes_count + 1, 8)
              main_radius = int(main_radius * 1.1)
          else:
              # Too dense - decrease coverage
              shapes_count = max(shapes_count - 1, 3)
              main_radius = int(main_radius * 0.9)
  ```

## 8. Natural Ink Drip Physics

**Description:**  
Image 2 stands out partly because of its more convincing drip effects. Real ink drips follow specific physics - they thin as they extend, follow gravitational influence, and have characteristic tear-drop endings. Enhancing the drip simulation would make all images more realistic.

**Responsible File:**  
`ink_effects.py`, specifically the `create_flowing_drip()` function

**Technical Approach:**

- Enhance the drip physics simulation
- Add gravity influence to drip direction
- Implement realistic thinning patterns
- Create teardrop terminations at drip ends
- Sample approach:
  ```python
  def enhanced_drip_physics(draw, x, y, length, direction, width, height):
      """
      Create physically accurate ink drips
      """
      # Start point properties
      points = [(x, y)]
      current_x, current_y = x, y

      # Drip properties
      initial_thickness = random.randint(3, 5)
      drip_speed = random.uniform(0.8, 1.2)  # Affects drip shape
      viscosity = random.uniform(0.7, 0.9)   # Higher = more resistant to direction changes

      # Direction setup with gravity influence
      gravity_direction = math.pi/2  # Downward
      gravity_influence = 0.05       # Strength of gravity pull

      if direction == "down":
          main_direction = math.pi/2
          current_angle = main_direction + random.uniform(-0.2, 0.2)
      elif direction == "right":
          main_direction = 0
          current_angle = main_direction + random.uniform(-0.1, 0.1)
      else:  # left
          main_direction = math.pi
          current_angle = main_direction + random.uniform(-0.1, 0.1)

      # Create the drip with natural flow
      for i in range(length):
          # Direction changes due to gravity and randomness
          random_factor = random.uniform(-0.1, 0.1) * (1 - viscosity)
          gravity_factor = math.sin(current_angle - gravity_direction) * gravity_influence

          # Update angle (combination of inertia, gravity and randomness)
          current_angle = (
              current_angle * viscosity +
              (gravity_direction * gravity_influence) -
              gravity_factor +
              random_factor
          )

          # Calculate new position
          step_length = drip_speed * random.uniform(0.8, 1.2)
          new_x = current_x + step_length * math.cos(current_angle)
          new_y = current_y + step_length * math.sin(current_angle)

          # Boundary check
          if new_y >= height or new_x < 0 or new_x >= width:
              break

          points.append((new_x, new_y))
          current_x, current_y = new_x, new_y

          # Slow down as drip progresses (ink gets thicker/stickier)
          drip_speed *= 0.97

      # Draw the drip with physically realistic tapering
      for i in range(len(points) - 1):
          # Position along drip (0.0 to 1.0)
          t = i / (len(points) - 1)

          # Calculate width using a more physically accurate model
          # Start thick, then thin out, then form a teardrop at the end
          if t < 0.1:
              # Initial thickness maintained
              width_val = initial_thickness
          elif t > 0.9:
              # Teardrop formation at the end
              end_t = (t - 0.9) * 10  # Rescale to 0-1 in last 10%
              width_val = max(1, int(initial_thickness * 0.3 * (1 - end_t) + 2 * end_t))
          else:
              # Gradual thinning in middle section
              mid_t = (t - 0.1) / 0.8  # Rescale to 0-1 in middle 80%
              width_val = max(1, int(initial_thickness * (1 - 0.7 * mid_t)))

          draw.line([points[i], points[i+1]], fill=(0, 0, 0, 255), width=width_val)
  ```
