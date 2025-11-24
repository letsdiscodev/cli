#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const docsDir = '/Users/g/Desktop/disco/disco-cloud-all-public-sites/src-docs/src/content/docs/cli';
const templatePath = join(docsDir, 'reference.md.template');
const outputPath = join(docsDir, 'reference.md');

// Step 1: Run build
console.log('Running npm run build...');
execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

// Step 2: Copy template to reference.md
console.log('Copying reference.md.template to reference.md...');
copyFileSync(templatePath, outputPath);

// Step 3: Run oclif readme
console.log('Running oclif readme...');
execSync(
  `oclif readme --repository-prefix "<%- repo %>/blob/main/<%- commandPath %>" --readme-path "${outputPath}"`,
  { cwd: projectRoot, stdio: 'inherit' }
);

console.log('Done!');
