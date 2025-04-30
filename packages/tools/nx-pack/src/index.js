/**
 * TerraFusion NX Pack Plugin
 * 
 * This plugin provides executors for packaging TerraFusion components and bundles.
 * It includes support for validation, checksum generation, and SBOM creation.
 */

module.exports = {
  executors: {
    pack: require('./executors/pack')
  }
};