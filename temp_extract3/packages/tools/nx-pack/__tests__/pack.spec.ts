import { runExecutor } from '@nrwl/devkit';
import { ExecutorContext } from '@nrwl/devkit';
import fs from 'fs';
import { join } from 'path';

function createMockContext(project: string): ExecutorContext {
  const root = process.cwd();
  return {
    cwd: root,
    root,
    isVerbose: false,
    projectGraph: undefined as any,
    workspace: {
      version: 2,
      projects: {
        [project]: { root: `dist/mock/${project}`, sourceRoot: `dist/mock/${project}`, targets: {} }
      }
    },
    projectName: project,
    targetName: 'pack',
    configurationName: '',
    target: undefined as any
  };
}

describe('nx-pack executor', () => {
  it('creates artefacts', async () => {
    const proj = 'dummy';
    const ctx = createMockContext(proj);
    // mock terra.json
    const base = join(ctx.root, ctx.workspace.projects[proj].root);
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(join(base, 'terra.json'), JSON.stringify({ id: proj, type: 'backend' }));
    const { success } = await runExecutor(
      { outputPath: 'dist/pack' } as any,
      ctx as any
    );
    expect(success).toBe(true);
    const out = join(ctx.root, 'dist/pack', proj);
    expect(fs.existsSync(join(out, 'terra.json'))).toBe(true);
    expect(fs.existsSync(join(out, f"{proj}.sha256"))).toBe(true);
  });
});
