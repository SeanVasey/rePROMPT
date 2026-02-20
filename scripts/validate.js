const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

function checkFile(file) {
  assert(fs.existsSync(path.join(process.cwd(), file)), `Missing required file: ${file}`);
}

const requiredFiles = [
  'server.js',
  'public/index.html',
  'public/app.js',
  'public/manifest.json',
  '.env.example',
  'README.md',
  'SECURITY.md',
  'api/_resolve.js',
  'api/_security.js',
  'api/health.js',
  'api/messages.js',
  'vercel.json',
  'docs/REPO_FLAGS.md',
];
requiredFiles.forEach(checkFile);

execSync('node --check server.js', { stdio: 'inherit' });
execSync('node --check public/app.js', { stdio: 'inherit' });
execSync('node --check api/_resolve.js', { stdio: 'inherit' });
execSync('node --check api/_security.js', { stdio: 'inherit' });
execSync('node --check api/health.js', { stdio: 'inherit' });
execSync('node --check api/messages.js', { stdio: 'inherit' });

const appJs = read('public/app.js');
assert(!appJs.includes('sk-ant-'), 'Client bundle appears to include an Anthropic key-like value.');
assert(!appJs.includes('anthropic-dangerous-direct-browser-access'), 'Insecure browser header detected in frontend code.');

const serverJs = read('server.js');
assert(serverJs.includes('resolveEndpoint'), 'Backend must use resolveEndpoint for AI provider configuration.');

const resolveJs = read('api/_resolve.js');
assert(resolveJs.includes('process.env.ANTHROPIC_API_KEY'), 'Resolve helper must read ANTHROPIC_API_KEY from environment.');
assert(resolveJs.includes('process.env.AI_GATEWAY_URL'), 'Resolve helper must read AI_GATEWAY_URL from environment.');

const envExample = read('.env.example');
assert(envExample.includes('ANTHROPIC_API_KEY='), '.env.example must document ANTHROPIC_API_KEY.');
assert(envExample.includes('AI_GATEWAY_URL'), '.env.example must document AI_GATEWAY_URL.');
assert(envExample.includes('AI_GATEWAY_AUTH_MODE'), '.env.example must document AI_GATEWAY_AUTH_MODE.');


const packageJson = JSON.parse(read('package.json'));
const repoVersion = read('VERSION').trim();
const changelog = read('CHANGELOG.md');

assert(packageJson.version === repoVersion, `VERSION (${repoVersion}) must match package.json version (${packageJson.version}).`);
assert(
  changelog.includes(`## [${packageJson.version}]`),
  `CHANGELOG.md must include an entry for version ${packageJson.version}.`
);

console.log('Validation checks passed.');
