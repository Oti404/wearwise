// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Forces Metro to resolve the CommonJS versions of packages, 
// avoiding the ESM 'import.meta' crash on web.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;