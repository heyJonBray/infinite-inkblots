const fs = require('fs');
const path = require('path');
const { generateParticleRorschach } = require('./generateRorschach');

// Create test output directory if it doesn't exist
const testDir = path.join(__dirname, '../output/test');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Generate a random Ethereum address
function generateRandomAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Generate 20 random addresses and their inkblots
async function generateTestSet() {
  const addresses = [];
  const results = [];

  console.log('Generating 20 test addresses and inkblots...');

  for (let i = 0; i < 20; i++) {
    const address = generateRandomAddress();
    addresses.push(address);

    const outputPath = path.join(testDir, `inkblot_${i + 1}.png`);

    try {
      // Generate the inkblot and get the buffer
      const imageBuffer = generateParticleRorschach(address, {
        size: 800,
      });

      // Save the image buffer to disk
      fs.writeFileSync(outputPath, imageBuffer);

      results.push({
        address,
        success: true,
        path: outputPath,
      });

      console.log(`Generated inkblot ${i + 1}/20 for address ${address}`);
    } catch (error) {
      results.push({
        address,
        success: false,
        error: error.message,
      });
      console.error(
        `Failed to generate inkblot ${i + 1}/20 for address ${address}:`,
        error.message
      );
    }
  }

  // Save a summary file
  const summary = {
    total: addresses.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    addresses: results.map((r) => ({
      address: r.address,
      success: r.success,
      error: r.error,
    })),
  };

  fs.writeFileSync(
    path.join(testDir, 'test_summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\nTest generation complete!');
  console.log(`Results saved in: ${testDir}`);
  console.log(`Successful generations: ${summary.successful}/${summary.total}`);
}

// Run the test generation
generateTestSet().catch(console.error);
