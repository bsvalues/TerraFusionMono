import { ExecutorContext } from '@nrwl/devkit';
import fs from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import cp from 'child_process';
import { promisify } from 'util';
const exec = promisify(cp.exec);

interface Options { outputPath: string; }

function readJson(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

async function validateTerraJson(terraPath: string, ctx: ExecutorContext) {
  const data = readJson(terraPath);

  // Bundle validations
  if (data.type === 'bundle') {
    const seen = new Set<string>();
    for (const c of data.contains) {
      const id = (c as string).split('@')[0];
      if (seen.has(id)) throw new Error(`Duplicate id '${id}' in bundle`);
      seen.add(id);

      const child = join(ctx.root, `dist/pack/${id}/terra.json`);
      if (!fs.existsSync(child)) {
        throw new Error(`dependency ${id} not packed yet`);
      }
    }
  }

  // Helm lint validation
  if (data.infra?.helmChart) {
    const chart = data.infra.helmChart as string;
    const { stderr } = await exec(`helm lint ${chart}`);
    if (stderr) throw new Error(stderr);
  }
}

async function buildSbom(outDir: string, proj: string) {
  // syft must be installed in CI runner
  const sbomPath = join(outDir, `${proj}.sbom.json`);
  await exec(`syft packages dir:${outDir} -o json > ${sbomPath}`);
}

export default async function run(options: Options, ctx: ExecutorContext) {
  const projRoot = ctx.workspace.projects[ctx.projectName!].root;
  const terraSrc = join(projRoot, 'terra.json');

  if (!fs.existsSync(terraSrc)) {
    throw new Error(`terra.json missing in ${projRoot}`);
  }

  const outDir = join(ctx.root, options.outputPath, ctx.projectName!);
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(terraSrc, join(outDir, 'terra.json'));

  // Simple sha256 on terra.json contents
  const hash = crypto.createHash('sha256').update(fs.readFileSync(terraSrc)).digest('hex');
  fs.writeFileSync(join(outDir, `${ctx.projectName!}.sha256`), hash);

  // extra checks
  await validateTerraJson(terraSrc, ctx);
  await buildSbom(outDir, ctx.projectName!);

  console.log(`📦 packed ${ctx.projectName!} into ${outDir}`);
  return { success: true };
}
