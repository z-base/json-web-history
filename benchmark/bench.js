import { performance } from 'node:perf_hooks'
import { generateVerificationPair } from '@z-base/cryptosuite'
import {
  closeHistory,
  createHistory,
  findHead,
  findRoot,
  mergeHistories,
  openHistory,
  updateHistory,
} from '../dist/index.js'
import { createAssertion } from '../dist/JWH/createAssertion/index.js'

const scenarios = [
  {
    name: 'small',
    logLength: 200,
    payloadSize: 256,
    iterations: {
      createAssertion: 120,
      createHistory: 20,
      find: 5000,
      close: 120,
      open: 120,
      update: 20,
      merge: 16,
    },
  },
  {
    name: 'medium',
    logLength: 1000,
    payloadSize: 1024,
    iterations: {
      createAssertion: 40,
      createHistory: 8,
      find: 1500,
      close: 35,
      open: 35,
      update: 6,
      merge: 5,
    },
  },
  {
    name: 'large',
    logLength: 5000,
    payloadSize: 2048,
    iterations: {
      createAssertion: 10,
      createHistory: 2,
      find: 400,
      close: 5,
      open: 5,
      update: 2,
      merge: 2,
    },
  },
]

const must = (value, message) => {
  if (!value) throw new Error(message)
  return value
}

const makeClaims = (payloadSize, seq) => {
  const payload = 'x'.repeat(payloadSize)
  return {
    seq,
    payload,
    parity: seq % 2 === 0 ? 'even' : 'odd',
    meta: {
      bytes: payloadSize,
      phase: `p-${seq % 7}`,
    },
  }
}

const format = (n, digits = 2) => n.toFixed(digits).padStart(10)

const printResult = (row) => {
  console.log(
    `${row.name.padEnd(44)}  iters=${String(row.iterations).padStart(5)}  totalMs=${format(
      row.totalMs
    )}  ms/op=${format(row.msPerOp, 4)}  ops/s=${format(row.opsPerSec)}`
  )
}

const bench = async (name, iterations, run) => {
  await run(-1)
  const start = performance.now()
  for (let i = 0; i < iterations; i += 1) {
    await run(i)
  }
  const totalMs = performance.now() - start
  const msPerOp = totalMs / iterations
  return {
    name,
    iterations,
    totalMs,
    msPerOp,
    opsPerSec: 1000 / msPerOp,
  }
}

const buildHistoryFast = async ({
  issuer,
  signJwk,
  verifyJwk,
  logLength,
  payloadSize,
}) => {
  let history = await createHistory(issuer, verifyJwk, signJwk)
  let { headIndex, headEntry } = findHead(history)
  const baseNbf = typeof headEntry.nbf === 'number' ? headEntry.nbf : Date.now()

  for (let i = 1; i < logLength; i += 1) {
    const { proof, assertion } = await createAssertion(
      issuer,
      signJwk,
      baseNbf + i,
      {
        ...makeClaims(payloadSize, i),
        prev: headIndex,
      }
    )
    history[proof] = assertion
    headEntry.next = proof
    headIndex = proof
    headEntry = history[proof]
    if (i % 1000 === 0) {
      console.log(`  fixture progress: ${i}/${logLength - 1}`)
    }
  }
  return history
}

const runScenario = async (scenario, keyPair) => {
  const issuer = `did:example:${scenario.name}`
  const scenarioLabel = `${scenario.name}  logLength=${scenario.logLength}  itemBytes=${scenario.payloadSize}`
  console.log(`\n=== ${scenarioLabel} ===`)

  const fixtureStart = performance.now()
  const history = await buildHistoryFast({
    issuer,
    signJwk: keyPair.signJwk,
    verifyJwk: keyPair.verifyJwk,
    logLength: scenario.logLength,
    payloadSize: scenario.payloadSize,
  })
  const fixtureMs = performance.now() - fixtureStart
  const rootProof = findRoot(history).rootIndex
  const headProof = findHead(history).headIndex
  console.log(
    `fixture built in ${fixtureMs.toFixed(2)} ms | entries=${Object.keys(history).length} | root=${rootProof.slice(
      0,
      12
    )}... | head=${headProof.slice(0, 12)}...`
  )

  const snapJson = await closeHistory('json', history)
  const snapMsgpack = await closeHistory('msgpack', history)
  const snapBase64 = await closeHistory('base64url', history)

  let ahead = openHistory(snapMsgpack)
  ahead = must(
    await updateHistory(
      ahead,
      makeClaims(scenario.payloadSize, scenario.logLength + 1),
      keyPair.signJwk
    ),
    'failed to create ahead history fixture'
  )
  const aheadSnapshot = await closeHistory('msgpack', ahead)
  const staleSnapshot = snapMsgpack

  const results = []

  results.push(
    await bench(
      `createAssertion(payload=${scenario.payloadSize})`,
      scenario.iterations.createAssertion,
      async (i) => {
        await createAssertion(
          issuer,
          keyPair.signJwk,
          Date.now() + i,
          makeClaims(scenario.payloadSize, i)
        )
      }
    )
  )

  results.push(
    await bench(`createHistory`, scenario.iterations.createHistory, async () => {
      await createHistory(issuer, keyPair.verifyJwk, keyPair.signJwk)
    })
  )

  results.push(
    await bench(`findRoot`, scenario.iterations.find, async () => {
      findRoot(history)
    })
  )
  results.push(
    await bench(`findHead`, scenario.iterations.find, async () => {
      findHead(history)
    })
  )

  results.push(
    await bench(`closeHistory(json)`, scenario.iterations.close, async () => {
      await closeHistory('json', history)
    })
  )
  results.push(
    await bench(`closeHistory(msgpack)`, scenario.iterations.close, async () => {
      await closeHistory('msgpack', history)
    })
  )
  results.push(
    await bench(`closeHistory(base64url)`, scenario.iterations.close, async () => {
      await closeHistory('base64url', history)
    })
  )

  results.push(
    await bench(`openHistory(json)`, scenario.iterations.open, async () => {
      openHistory(snapJson)
    })
  )
  results.push(
    await bench(`openHistory(msgpack)`, scenario.iterations.open, async () => {
      openHistory(snapMsgpack)
    })
  )
  results.push(
    await bench(`openHistory(base64url)`, scenario.iterations.open, async () => {
      openHistory(snapBase64)
    })
  )

  results.push(
    await bench(
      `updateHistory(append one, snapshot-open baseline)`,
      scenario.iterations.update,
      async (i) => {
        const candidate = openHistory(staleSnapshot)
        const next = await updateHistory(
          candidate,
          makeClaims(scenario.payloadSize, 100000 + i),
          keyPair.signJwk
        )
        must(next, 'updateHistory benchmark failed')
      }
    )
  )

  results.push(
    await bench(
      `mergeHistories(stale <- ahead one entry)`,
      scenario.iterations.merge,
      async () => {
        const trusted = openHistory(staleSnapshot)
        const alleged = openHistory(aheadSnapshot)
        const merged = await mergeHistories(trusted, alleged)
        must(merged, 'mergeHistories benchmark failed')
      }
    )
  )

  for (const row of results) printResult(row)
}

const main = async () => {
  console.log(`Node ${process.version}`)
  const keyPair = await generateVerificationPair()
  for (const scenario of scenarios) {
    await runScenario(scenario, keyPair)
  }
}

await main()
