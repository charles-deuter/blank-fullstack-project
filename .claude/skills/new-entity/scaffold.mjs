#!/usr/bin/env node
// Stamps a new vertical slice by copying the `foo` reference slice with the
// entity name substituted. Run from the repo root:
//   node .claude/skills/new-entity/scaffold.mjs <kebab-case-singular>
// The output is a starting point: every generated file still carries foo's
// shape (one `name` column, one create button) for you to edit.

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const kebab = process.argv[2];
if (!kebab || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(kebab) || kebab === 'foo') {
  console.error('usage: scaffold.mjs <kebab-case-singular-entity>   e.g. wallet-balance');
  process.exit(1);
}

const words = kebab.split('-');
const camel = words.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join('');
const pascal = camel[0].toUpperCase() + camel.slice(1);
const snake = words.join('_');
const screaming = snake.toUpperCase();

// Source (foo) → target path. Order matters only for the printed summary.
const FILES = [
  ['backend/src/database/models/foo.ts', `backend/src/database/models/${kebab}.ts`],
  ['backend/src/database/dal/foo.ts', `backend/src/database/dal/${kebab}.ts`],
  ['backend/src/api/foo.ts', `backend/src/api/${kebab}.ts`],
  ['backend/test/test-foo.spec.ts', `backend/test/test-${kebab}.spec.ts`],
  ['backend/test/test-foo-create.spec.ts', `backend/test/test-${kebab}-create.spec.ts`],
  ['frontend/src/server-actions/foo.ts', `frontend/src/server-actions/${kebab}.ts`],
  ['frontend/src/components/FooPanel.tsx', `frontend/src/components/${pascal}Panel.tsx`],
  ['frontend/src/components/FooTable.tsx', `frontend/src/components/${pascal}Table.tsx`],
];

const clashes = FILES.map(([, to]) => to).filter((to) => existsSync(resolve(ROOT, to)));
if (clashes.length) {
  console.error(`refusing to overwrite:\n  ${clashes.join('\n  ')}`);
  process.exit(1);
}

function substitute(source) {
  return (
    source
      // Identifiers: FOO_NAME_INVALID → WALLET_BALANCE_NAME_INVALID, FooPanel →
      // WalletBalancePanel, listFoos → listWalletBalances, foo → walletBalance.
      .replaceAll('FOO', screaming)
      .replaceAll('Foo', pascal)
      .replaceAll('foo', camel)
      // Things that are not identifiers keep their own casing.
      .replace(`pgTable('${camel}'`, `pgTable('${snake}'`)
      .replaceAll(`/api/${camel}`, `/api/${kebab}`)
      .replace(new RegExp(`(from '[./@][^']*/)${camel}'`, 'g'), `$1${kebab}'`)
  );
}

for (const [from, to] of FILES) {
  writeFileSync(resolve(ROOT, to), substitute(readFileSync(resolve(ROOT, from), 'utf8')));
}

// Registration: the schema barrel (drizzle-kit only sees models listed here)
// and the API router.
appendFileSync(resolve(ROOT, 'backend/src/database/schema.ts'), `export * from './models/${kebab}';\n`);

const routerPath = resolve(ROOT, 'backend/src/api/router.ts');
const router = readFileSync(routerPath, 'utf8')
  .replace("import foo from './foo';\n", `import foo from './foo';\nimport ${camel} from './${kebab}';\n`)
  .replace("router.use('/foo', foo);\n", `router.use('/foo', foo);\nrouter.use('/${kebab}', ${camel});\n`);
writeFileSync(routerPath, router);

const generated = FILES.map(([, to]) => to);
execSync(`npx prettier --write ${generated.map((f) => `"${f}"`).join(' ')} backend/src/api/router.ts`, {
  cwd: ROOT,
  stdio: 'ignore',
});

console.log(`scaffolded ${kebab} (table ${snake}, route /api/${kebab}):`);
for (const file of generated) console.log(`  ${file}`);
console.log(`  backend/src/database/schema.ts   (export added)`);
console.log(`  backend/src/api/router.ts        (mounted)`);
