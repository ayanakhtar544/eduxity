module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@core': './core',
            '@components': './components',
            '@hooks': './hooks',
            '@store': './store',
            '@assets': './assets',
          },
        },
      ],
      'react-native-reanimated/plugin', // Ye hamesha last mein hona chahiye
    ],
  };
};