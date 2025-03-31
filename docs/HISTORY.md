# Infinite Inkblots Project History

## Initial Implementation (b43e39d)

- Basic pixel-based Rorschach generator in Python
- Simple black and white output
- Deterministic generation based on Ethereum address
- Basic splatter effect based on zero count in address

## Color and Border Enhancements (cd00522)

- Added color palettes for border gradients
- Implemented deterministic color selection based on address
- Added metadata generation for color traits
- Created corner-based gradient borders

## Ink Bleed and Special Effects (3ec20a0)

- Added ink bleed layer with Gaussian blur
- Implemented special gold frame for '420' and '69' addresses
- Enhanced visual effects with layered rendering
- Added support for three-stage gradients

## Project Refactoring (b6ba2f2)

- Migrated from Python to JavaScript
- Improved code organization and modularity
- Enhanced performance with canvas-based rendering
- Added better error handling and parameter validation

## Particle System Implementation (b498424)

- Introduced particle-based generation system
- Added organic movement patterns
- Implemented noise-based particle behavior
- Enhanced visual quality with particle accumulation

## Color System Improvements (fae09b9)

- Refactored color system for better organization
- Added more color palettes and combinations
- Improved color scheme generation from ETH features
- Enhanced metadata for color traits

## Project Structure Updates (24dda69)

- Reorganized output directory structure
- Improved file organization
- Enhanced build and deployment process
- Added better documentation

## Special Address Features (29bc1b3)

- Added special handling for '420' addresses
- Implemented unique visual effects for special addresses
- Enhanced metadata for special address traits
- Added documentation for special address features

## Color Pairs Refinement (Current)

- Simplified trait system to focus solely on color pairs
- Removed parameter customization based on ETH features (now uses default parameters for all addresses)
- Implemented 11 precisely defined color pairs with exact RGB values:
  - Special '420' pair: Emerald ([0, 106, 58]) and Jade ([68, 156, 116])
  - 10 regular pairs including Navy & Slate, Golden Brown, Magenta Burst, etc.
- Created a deterministic selection system that assigns one pair per ETH address
- Enhanced color distribution within noise ranges for consistent visual patterns
- Updated metadata to include descriptive color pair names
- Improved visual cohesion with primary/secondary color positions in patterns

## Current State

The project has evolved from a simple pixel-based generator to a sophisticated particle-based system with:

- Deterministic generation from Ethereum addresses
- Organic, ink-like visual effects
- Special handling for specific address patterns
- Comprehensive metadata generation

## Future Considerations

- SVG output support
- Additional trait extraction
- More organic appearance improvements
- Enhanced ink bleeding effects
- Additional color palettes and effects
- Improved performance optimizations
