# Infinite Inkblots: ETH Address Trait Mapping

This document explains how an Ethereum address influences the various traits and characteristics of generated inkblot images.

## Parameter Customization

The system extracts features from Ethereum addresses and uses them to customize generation parameters:

| Feature                  | Parameter Effect     | Implementation                        |
| ------------------------ | -------------------- | ------------------------------------- |
| Diversity (unique chars) | Detail Level (Scale) | `scale = 0.005 + diversity * 0.01`    |
| Zeros Count              | Animation Speed      | `speed = 0.003 + zeros * 0.004`       |
| High Values (8-9, a-f)   | Particle Size        | `maxRadius = 5 + highValues * 10`     |
| Ones Count               | Particle Density     | `particleCount = 50 + ones * 50`      |
| Letters Count (a-f)      | Frame Count          | `framesToRender = 50 + letters * 150` |

## Color Schemes

ETH addresses directly determine the color scheme used:

| ETH Feature                    | Color Scheme    | Characteristics                                                              |
| ------------------------------ | --------------- | ---------------------------------------------------------------------------- |
| Address starts/ends with "420" | **420 Special** | Forest Green and Goldenrod with alternating patterns                         |
| Diversity > 0.7                | **Vibrant**     | Greater color variation with white alternating with primary/secondary colors |
| Letters > 0.6                  | **Blues**       | Predominantly blue palette with more saturated, continuous color transitions |
| Zeros > 0.3                    | **Monochrome**  | Black and white with minimal color, creating stark contrast                  |
| Default                        | **Classic**     | Balanced colors with structured distribution                                 |

## Deterministic Seeding

A SHA-256 hash of the address is used to create a deterministic seed:

```javascript
const hash = crypto.createHash('sha256').update(cleanAddress).digest('hex');
const seed = parseInt(hash.slice(0, 8), 16);
```

This ensures each address always produces the same unique pattern.

## Complexity Classification

The diversity feature extracted from the ETH address directly determines the complexity classification for metadata:

| Diversity Range | Complexity Rating |
| --------------- | ----------------- |
| > 0.6           | High              |
| > 0.4           | Medium            |
| ≤ 0.4           | Low               |

## Feature Extraction Process

From each ETH address, the system extracts:

1. **Diversity**: Proportion of unique characters (unique_chars / 16)
2. **Zeros**: Proportion of characters that are '0'
3. **Ones**: Proportion of characters that are '1'
4. **Letters**: Proportion of characters in a-f range
5. **High Values**: Proportion of characters in 8-9 or a-f range
6. **Even Characters**: Proportion of characters that are even in hex

## Particle Generation

The noise field used for particle generation is seeded by the ETH address, creating consistent patterns unique to each address. Particles are placed symmetrically to create a Rorschach-style inkblot effect.

## Visual Effects

1. **Detail Level**: Controlled by scale parameter - diverse addresses produce more intricate details
2. **Density**: Controlled by particle count - addresses with more '1's create denser patterns
3. **Size Variation**: Particles further from center become smaller, creating organic edges
4. **Symmetry**: Perfect bilateral symmetry for Rorschach effect
5. **Color Distribution**: Non-linear mapping for better color distribution
