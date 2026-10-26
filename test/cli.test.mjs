import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const scratch = path.resolve('.graveyard/test-homes');
mkdirSync(scratch, { recursive: true });
function cli(args, extraEnv = {}, preload = false, prepare) {
  const home = mkdtempSync(path.join(scratch, 'login-'));
  prepare?.(home);
  const result = spawnSync(process.execPath, [
    ...(preload ? ['--import', './test/mentor-server.mjs'] : []),
    'dist/cli.js', ...args,
  ], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home, STATECHANGE_API_KEY: '', NO_COLOR: '1', ...extraEnv },
    timeout: 10000,
  });
  assert.equal(result.error, undefined);
  return { ...result, home };
}

test('login directs a new user to Mentor without contacting Xano or saving credentials', () => {
  const result = cli(['login'], {}, true);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /https:\/\/mentor\.statechange\.ai\/connect\/keys/);
  assert.match(result.stdout, /mentor login --token <your-api-key>/);
  assert.match(result.stdout, /Login completes after you save the key/);
  assert.equal(existsSync(path.join(result.home, '.statechange/auth.json')), false);
});

test('manual login saves the key privately and tells the user to validate it', () => {
  const result = cli(['login', '--token', 'test-mentor-key']);
  assert.equal(result.status, 0, result.stderr);
  const authPath = path.join(result.home, '.statechange/auth.json');
  assert.deepEqual(JSON.parse(readFileSync(authPath, 'utf8')), { apiKey: 'test-mentor-key' });
  if (process.platform !== 'win32') assert.equal(statSync(authPath).mode & 0o777, 0o600);
  assert.match(result.stdout, /mentor whoami/);
  assert.doesNotMatch(result.stdout + result.stderr, /test-mentor-key/);
});

test('whoami validates an existing key against the new Mentor API', () => {
  const result = cli(['whoami', '--json'], { STATECHANGE_API_KEY: 'test-mentor-key' }, true);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.server_validated, true);
  assert.equal(data.source, 'env');
});

test('data commands use the new Mentor API and the existing X-API-Key header', () => {
  const result = cli(['models', '--json'], { STATECHANGE_API_KEY: 'test-mentor-key' }, true);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { models: [] });
});

test('whoami rejects an invalid key', () => {
  const result = cli(['whoami', '--json'], { STATECHANGE_API_KEY: 'invalid-fixture' }, true);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).reason, 'rejected');
});


test('replacing a key preserves shared auth fields and corrects existing file permissions', () => {
  const result = cli(['login', '--token', 'replacement-key'], {}, false, (home) => {
    mkdirSync(path.join(home, '.statechange'));
    writeFileSync(path.join(home, '.statechange/auth.json'), JSON.stringify({
      apiKey: 'previous-key', authToken: 'shared-token', authTokenExpires: 12345,
    }), { mode: 0o644 });
  });
  assert.equal(result.status, 0, result.stderr);
  const authPath = path.join(result.home, '.statechange/auth.json');
  assert.deepEqual(JSON.parse(readFileSync(authPath, 'utf8')), {
    apiKey: 'replacement-key', authToken: 'shared-token', authTokenExpires: 12345,
  });
  if (process.platform !== 'win32') assert.equal(statSync(authPath).mode & 0o777, 0o600);
});
