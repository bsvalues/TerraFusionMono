#!/usr/bin/env node

/**
 * SBOM Generator for TerraFusion Components
 * 
 * This script generates a Software Bill of Materials (SBOM) in CycloneDX format
 * based on the package.json and terra.json files of a TerraFusion component.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: sbom-generator.js <component-dir> <output-file> [format]');
  process.exit(1);
}

const componentDir = args[0];
const outputFile = args[1];
const format = args[2] || 'cyclonedx';

// Validate format
if (!['cyclonedx', 'spdx'].includes(format)) {
  console.error('Error: Format must be either "cyclonedx" or "spdx"');
  process.exit(1);
}

// Check if terra.json exists
const terraJsonPath = path.join(componentDir, 'terra.json');
if (!fs.existsSync(terraJsonPath)) {
  console.error('Error: terra.json not found in component directory');
  process.exit(1);
}

// Parse terra.json
const terraJson = JSON.parse(fs.readFileSync(terraJsonPath, 'utf8'));

// Check if package.json exists
const packageJsonPath = path.join(componentDir, 'package.json');
let packageJson = null;
if (fs.existsSync(packageJsonPath)) {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

// Generate SBOM
console.log(`Generating ${format.toUpperCase()} SBOM for ${terraJson.name}...`);

let sbom;
if (format === 'cyclonedx') {
  sbom = generateCycloneDxSBOM(terraJson, packageJson);
} else {
  sbom = generateSpdxSBOM(terraJson, packageJson);
}

// Write SBOM to file
fs.writeFileSync(outputFile, JSON.stringify(sbom, null, 2));
console.log(`SBOM written to ${outputFile}`);

/**
 * Generate CycloneDX format SBOM
 */
function generateCycloneDxSBOM(terraJson, packageJson) {
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'TerraFusion',
          name: 'sbom-generator',
          version: '1.0.0'
        }
      ],
      component: {
        type: terraJson.type === 'service' ? 'application' : 'library',
        bom_ref: terraJson.id,
        name: terraJson.name,
        version: terraJson.version,
        description: terraJson.description,
        licenses: terraJson.license ? [{ license: { id: terraJson.license } }] : [],
        supplier: terraJson.author ? { name: terraJson.author } : undefined,
        purl: `pkg:${terraJson.type}/${terraJson.id}@${terraJson.version}`
      }
    },
    components: []
  };
  
  // Add dependencies from terra.json
  if (terraJson.dependencies && terraJson.dependencies.length > 0) {
    terraJson.dependencies.forEach(dependency => {
      const [name, version] = dependency.split('@');
      sbom.components.push({
        type: 'library',
        name: name,
        version: version,
        purl: `pkg:${terraJson.type}/${name}@${version}`
      });
    });
  }
  
  // Add dependencies from package.json
  if (packageJson && packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      // Clean up version string (remove ^, ~, etc.)
      const cleanVersion = version.replace(/^[^0-9]*/, '');
      sbom.components.push({
        type: 'library',
        name: name,
        version: cleanVersion,
        purl: `pkg:npm/${name}@${cleanVersion}`
      });
    });
  }
  
  return sbom;
}

/**
 * Generate SPDX format SBOM
 */
function generateSpdxSBOM(terraJson, packageJson) {
  const sbom = {
    spdxVersion: 'SPDX-2.2',
    dataLicense: 'CC0-1.0',
    SPDXID: `SPDXRef-DOCUMENT`,
    name: `${terraJson.id}-sbom`,
    documentNamespace: `https://terrafusion.io/spdx/${terraJson.id}/${terraJson.version}`,
    creationInfo: {
      created: new Date().toISOString(),
      creators: [`Tool: TerraFusion-sbom-generator-1.0.0`],
      licenseListVersion: '3.16'
    },
    packages: [
      {
        name: terraJson.name,
        SPDXID: `SPDXRef-Package-${terraJson.id}`,
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        homepage: terraJson.homepage || 'NOASSERTION',
        licenseConcluded: terraJson.license || 'NOASSERTION',
        licenseDeclared: terraJson.license || 'NOASSERTION',
        supplier: terraJson.author ? `Person: ${terraJson.author}` : 'NOASSERTION',
        versionInfo: terraJson.version
      }
    ],
    relationships: []
  };
  
  // Add dependencies from terra.json
  if (terraJson.dependencies && terraJson.dependencies.length > 0) {
    terraJson.dependencies.forEach(dependency => {
      const [name, version] = dependency.split('@');
      const packageId = `SPDXRef-Package-${name}`;
      
      sbom.packages.push({
        name: name,
        SPDXID: packageId,
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        versionInfo: version
      });
      
      sbom.relationships.push({
        spdxElementId: `SPDXRef-Package-${terraJson.id}`,
        relatedSpdxElement: packageId,
        relationshipType: 'DEPENDS_ON'
      });
    });
  }
  
  // Add dependencies from package.json
  if (packageJson && packageJson.dependencies) {
    Object.entries(packageJson.dependencies).forEach(([name, version]) => {
      // Clean up version string (remove ^, ~, etc.)
      const cleanVersion = version.replace(/^[^0-9]*/, '');
      const packageId = `SPDXRef-Package-npm-${name}`;
      
      sbom.packages.push({
        name: name,
        SPDXID: packageId,
        downloadLocation: `https://registry.npmjs.org/${name}/-/${name}-${cleanVersion}.tgz`,
        filesAnalyzed: false,
        versionInfo: cleanVersion
      });
      
      sbom.relationships.push({
        spdxElementId: `SPDXRef-Package-${terraJson.id}`,
        relatedSpdxElement: packageId,
        relationshipType: 'DEPENDS_ON'
      });
    });
  }
  
  return sbom;
}