//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
let NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
  config.target = 'web';

  config.plugins = [
    ...config.plugins,
    new NodePolyfillPlugin({
      excludeAliases: ['console'],
    }),
  ];

  // https://github.com/ryanclark/karma-webpack/issues/497
  config.output.globalObject = 'globalThis';

  return config;
};
