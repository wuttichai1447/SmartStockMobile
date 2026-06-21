const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Preserve Expo web module names after minification (required for Vercel production builds).
config.transformer.minifierConfig = {
  keep_classnames: /^Expo/,
  keep_fnames: /^createExpo/,
};

module.exports = config;
