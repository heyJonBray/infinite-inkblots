module.exports = {
  defaultParams: {
    size: 1024, // canvas size
    particleCount: 90, // particles per frame
    framesToRender: 220, // simulate frames
    speed: 0.005, // animation speed
    scale: 0.01, // noise scale
    maxRadius: 10, // max particle radius
    fadeAlpha: 8, // lower = more particle accumulation
    outputPath: './output',
    horizontalMargin: 0.1,
    verticalMargin: 0.25,
  },
};
