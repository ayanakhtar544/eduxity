const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// EXTREMELY IMPORTANT: Required to allow Metro to parse import.meta from node_modules (like zustand)
config.transformer = {
  ...config.transformer,
  unstable_transformProfile: "default",
};

module.exports = config;