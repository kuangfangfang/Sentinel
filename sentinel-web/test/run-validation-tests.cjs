const { mkdirSync, rmSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const root = join(__dirname, '..');
const outDir = join(root, '.tmp-validation-tests');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    stdio: 'inherit',
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'package.json'), '{"type":"commonjs"}\n');

run(process.execPath, [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.validation-test.json']);
run(process.execPath, [join(outDir, 'test', 'schema-validation.test.js')]);
run(process.execPath, [join(outDir, 'test', 'translation-widget.test.js')]);
