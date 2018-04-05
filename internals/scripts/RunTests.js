import spawn from 'cross-spawn';
import path from 'path';

const patternParameter = process.argv[2];
let pattern;
if (patternParameter && patternParameter.indexOf('.js') > 0) {
  // specify one test file
  pattern = patternParameter.replace(/\\/g, '/');
} else if (patternParameter === 'e2e') {
  // all e2e tests
  pattern = 'test/e2e/.+\\.spec\\.js';
} else {
  // all normal tests
  pattern = 'test/(?!e2e/)[^/]+/.+\\.spec\\.js$';
}

const result = spawn.sync(
  path.normalize('./node_modules/.bin/jest'),
  [pattern, ...process.argv.slice(2), '--coverage'],
  { stdio: 'inherit' }
);

process.exit(result.status);
