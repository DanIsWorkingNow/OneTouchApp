// metro.config.js - Firebase compatibility fix for Expo SDK 53
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Firebase compatibility fixes for Expo SDK 53
// This disables Metro's package.json:exports which breaks Firebase
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;