const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure TTF fonts are properly handled
config.resolver.assetExts.push('ttf');

module.exports = config;
