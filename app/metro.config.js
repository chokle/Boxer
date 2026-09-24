const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow requiring the shared drill library at ../drills/drills.json
// (outside the project root). Monorepo-style watch folder.
config.watchFolders = [path.resolve(__dirname, '..')];

module.exports = config;
