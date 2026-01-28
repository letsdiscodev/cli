#!/usr/bin/env node

// Disable oclif's auto-transpile feature in production
// This prevents the "Could not find typescript" warning when NODE_ENV=development
globalThis.oclif = globalThis.oclif || {}
globalThis.oclif.enableAutoTranspile = false

const {execute} = await import('@oclif/core')

await execute({dir: import.meta.url})
