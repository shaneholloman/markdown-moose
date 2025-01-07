const sharp = require('sharp');
const path = require('path');
const projectRoot = path.join(__dirname, '..');

// Convert SVG to PNG
sharp(path.join(projectRoot, 'markdown-moose-logo.svg'))
    .resize(128, 128)
    .png()
    .toFile(path.join(projectRoot, 'icon.png'))
    .then(() => console.log('Icon converted successfully'))
    .catch(err => console.error('Error converting icon:', err));
