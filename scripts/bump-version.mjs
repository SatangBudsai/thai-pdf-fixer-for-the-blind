#!/usr/bin/env node
/**
 * Bump version in all 4 files at once.
 * Usage: node scripts/bump-version.mjs 1.2.0
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const version = process.argv[2]
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/bump-version.mjs <version>')
  console.error('Example: node scripts/bump-version.mjs 1.2.0')
  process.exit(1)
}

const files = [
  {
    path: 'package.json',
    replace: content => content.replace(/"version":\s*"[^"]*"/, `"version": "${version}"`)
  },
  {
    path: 'src-tauri/tauri.conf.json',
    replace: content => content.replace(/"version":\s*"[^"]*"/, `"version": "${version}"`)
  },
  {
    path: 'src-tauri/Cargo.toml',
    replace: content => content.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`)
  },
  {
    path: 'src/pages/index.tsx',
    replace: content => content.replace(/Thai PDF Fixer v[\d.]+/, `Thai PDF Fixer v${version}`)
  }
]

for (const file of files) {
  const fullPath = resolve(root, file.path)
  const content = readFileSync(fullPath, 'utf-8')
  const updated = file.replace(content)
  if (content === updated) {
    console.log(`  SKIP  ${file.path} (no change)`)
  } else {
    writeFileSync(fullPath, updated, 'utf-8')
    console.log(`  DONE  ${file.path} → ${version}`)
  }
}

console.log(`\nVersion bumped to ${version}`)
console.log(`Next: git add -A && git commit -m "release: v${version}" && git tag v${version} && git push origin main --tags`)
