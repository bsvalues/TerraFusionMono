/**
 * @fileoverview Entry point for the @terrafusion/nx-pack plugin
 */

module.exports = {
  executors: {
    pack: require.resolve('./executors/pack'),
  },
};