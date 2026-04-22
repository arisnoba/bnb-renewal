import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [, , envFile, command, ...args] = process.argv

if (!envFile || !command) {
  console.error('Usage: node scripts/run-with-env.mjs <env-file> <command> [...args]')
  process.exit(1)
}

const env = { ...process.env }
const contents = readFileSync(resolve(envFile), 'utf8')

for (const rawLine of contents.split(/\r?\n/)) {
  const line = rawLine.trim()

  if (!line || line.startsWith('#')) {
    continue
  }

  const separatorIndex = line.indexOf('=')

  if (separatorIndex === -1) {
    continue
  }

  const key = line.slice(0, separatorIndex).trim()
  let value = line.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  env[key] = value
}

const child = spawn(command, args, {
  env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
