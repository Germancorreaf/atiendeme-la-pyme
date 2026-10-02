#!/usr/bin/env node
// scripts/predeploy-check.mjs
// Se ejecuta automáticamente antes de `npm run deploy` (hook "predeploy").
// Evita desplegar a producción código que no está en GitHub, una copia vieja del
// repo o un árbol con cambios sin commitear de otra sesión (p. ej. Claude Code).
//
// Para saltarlo de forma consciente: ALLOW_DIRTY_DEPLOY=1 npm run deploy

import { execSync } from 'node:child_process';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const fail = (msg) => {
  console.error(`\n✖ Despliegue bloqueado: ${msg}\n`);
  process.exit(1);
};

if (process.env.ALLOW_DIRTY_DEPLOY === '1') {
  console.warn('⚠ ALLOW_DIRTY_DEPLOY=1: se omiten las comprobaciones previas al despliegue.');
  process.exit(0);
}

const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') fail(`estás en la rama "${branch}". Solo se despliega desde main.`);

const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).replace(/\s+$/, '');
if (dirty) {
  fail(
    'hay cambios sin commitear (¿otra sesión trabajando?):\n' +
      dirty.split('\n').map((l) => `    ${l}`).join('\n') +
      '\n  wrangler empaqueta lo que hay en disco, así que irían a producción.\n' +
      '  Commitea o guarda esos cambios (git stash), o despliega desde una copia limpia (git worktree).'
  );
}

try {
  sh('git fetch origin main --quiet');
} catch {
  fail('no pude consultar GitHub (git fetch). Revisa tu conexión.');
}
const [ahead, behind] = sh('git rev-list --left-right --count HEAD...origin/main').split(/\s+/).map(Number);
if (behind > 0) fail(`tu copia está ${behind} commit(s) atrás de origin/main. Haz git pull antes de desplegar.`);
if (ahead > 0) fail(`tienes ${ahead} commit(s) sin subir a GitHub. Haz git push antes de desplegar.`);

console.log(`✔ main limpio y al día con origin/main (${sh('git rev-parse --short HEAD')}). Corriendo tests…`);
