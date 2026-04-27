import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import { resolve } from 'node:path'

const ENV_FILE = 'config/env/local-postgres.env'
const NEXT_BIN = './node_modules/next/dist/bin/next'
const POSTGRES_HOST = '127.0.0.1'
const POSTGRES_PORT = 5432

const env = loadEnvFile(ENV_FILE)

await ensureLocalPostgres()
runNextDev()

function loadEnvFile(path) {
  const loadedEnv = { ...process.env }
  const contents = readFileSync(resolve(path), 'utf8')

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

    loadedEnv[key] = value
  }

  return loadedEnv
}

async function ensureLocalPostgres() {
  if (await canConnectToPostgres()) {
    console.log('Local Postgres is already listening on 127.0.0.1:5432.')
    return
  }

  console.log('Starting local Postgres with Docker Compose...')

  let composeResult = await run('docker', ['compose', 'up', '-d', 'postgres'])

  if (composeResult.code !== 0 && process.platform === 'darwin') {
    console.log('Docker is not available. Starting Colima, then retrying Docker Compose...')

    const colimaResult = await run('colima', ['start'], { stdio: 'inherit' })

    if (colimaResult.code !== 0) {
      fail('Colima failed to start. Start Docker manually, then run npm run dev again.')
    }

    composeResult = await run('docker', ['compose', 'up', '-d', 'postgres'])
  }

  if (composeResult.code !== 0) {
    fail('Docker Compose failed to start the local Postgres service.')
  }

  await waitForLocalPostgres()
}

function runNextDev() {
  const child = spawn(process.execPath, [NEXT_BIN, 'dev'], {
    env,
    stdio: 'inherit',
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      child.kill(signal)
    })
  }

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 1)
  })
}

async function waitForLocalPostgres() {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (await isPostgresReady()) {
      console.log('Local Postgres is ready.')
      return
    }

    await sleep(1_000)
  }

  fail('Timed out waiting for local Postgres to become ready on 127.0.0.1:5432.')
}

async function isPostgresReady() {
  const pgIsReady = await run(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'pg_isready',
      '-U',
      env.POSTGRES_USER ?? 'postgres',
      '-d',
      env.POSTGRES_DATABASE ?? 'bnb_renewal',
    ],
    { stdio: 'ignore' },
  )

  if (pgIsReady.code === 0) {
    return true
  }

  return canConnectToPostgres()
}

function canConnectToPostgres() {
  return new Promise((resolveConnect) => {
    const socket = net.createConnection({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
    })

    socket.setTimeout(750)

    socket.once('connect', () => {
      socket.destroy()
      resolveConnect(true)
    })

    socket.once('error', () => {
      socket.destroy()
      resolveConnect(false)
    })

    socket.once('timeout', () => {
      socket.destroy()
      resolveConnect(false)
    })
  })
}

function run(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      env,
      stdio: options.stdio ?? 'inherit',
    })

    child.once('error', (error) => {
      console.error(error.message)
      resolveRun({ code: 1 })
    })

    child.once('exit', (code) => {
      resolveRun({ code: code ?? 1 })
    })
  })
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms)
  })
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
