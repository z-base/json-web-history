import assert from 'node:assert/strict'
import { TextEncoder } from 'node:util'
import {
  VerificationCluster,
  generateVerificationPair,
} from '@z-base/cryptosuite'
import {
  closeHistory,
  createHistory,
  findHead,
  findRoot,
  mergeHistories,
  openHistory,
  updateHistory,
} from '../../dist/index.js'

const encoder = new TextEncoder()

const must = (value, message) => {
  assert.ok(value, message)
  return value
}

const orderedProofs = (history) => {
  const { rootIndex } = findRoot(history)
  const order = []
  const seen = new Set()
  let step = rootIndex
  while (typeof step === 'string' && step.length > 0 && !seen.has(step)) {
    seen.add(step)
    order.push(step)
    const next = history[step]?.next
    step = typeof next === 'string' ? next : ''
  }
  return order
}

const verificationKeyAt = (history, unixMs) => {
  const order = orderedProofs(history)
  if (order.length === 0) return undefined
  let active = history[order[0]].verificationMethod
  for (const proof of order) {
    const entry = history[proof]
    if (entry.nbf > unixMs) break
    if (entry.verificationMethod) active = entry.verificationMethod
  }
  return active
}

const tests = [
  {
    name: 'end-to-end async signature verification by historical key intent',
    run: async () => {
      const k1 = await generateVerificationPair()
      const k2 = await generateVerificationPair()
      let writer = await createHistory('did:example:alice', k1.verifyJwk, k1.signJwk)
      const { rootEntry } = findRoot(writer)
      const t1 = rootEntry.nbf + 1
      const t2 = t1 + 50
      const t3 = t2 + 50

      const payload1 = encoder.encode('out-of-band-before-rotation')
      const sig1 = await VerificationCluster.sign(k1.signJwk, payload1)

      writer = must(
        await updateHistory(
          writer,
          { kind: 'rotate' },
          k1.signJwk,
          t2,
          k2.verifyJwk
        )
      )
      writer = must(await updateHistory(writer, { kind: 'post-rotate' }, k2.signJwk, t3))

      const payload2 = encoder.encode('out-of-band-after-rotation')
      const sig2 = await VerificationCluster.sign(k2.signJwk, payload2)

      const consumer = openHistory(await closeHistory('base64url', writer))
      const keyAtT1 = verificationKeyAt(consumer, t1)
      const keyAtT3 = verificationKeyAt(consumer, t3)
      assert.ok(keyAtT1)
      assert.ok(keyAtT3)

      assert.equal(await VerificationCluster.verify(keyAtT1, payload1, sig1), true)
      assert.equal(await VerificationCluster.verify(keyAtT3, payload2, sig2), true)
      assert.equal(await VerificationCluster.verify(keyAtT1, payload2, sig2), false)
    },
  },
  {
    name: 'end-to-end eventual sync across mixed snapshot transports',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const seed = await createHistory('did:example:alice', verifyJwk, signJwk)
      let a = openHistory(await closeHistory('json', seed))
      let b = openHistory(await closeHistory('msgpack', seed))
      let c = openHistory(await closeHistory('base64url', seed))
      let d = openHistory(await closeHistory('msgpack', seed))

      a = must(await updateHistory(a, { seq: 1 }, signJwk))
      a = must(await updateHistory(a, { seq: 2 }, signJwk))
      a = must(await updateHistory(a, { seq: 3 }, signJwk))

      b = must(await mergeHistories(b, openHistory(await closeHistory('msgpack', a))))
      c = must(await mergeHistories(c, openHistory(await closeHistory('base64url', b))))
      d = must(await mergeHistories(d, openHistory(await closeHistory('json', c))))
      a = must(await mergeHistories(a, openHistory(await closeHistory('msgpack', d))))

      const expected = orderedProofs(a)
      assert.deepEqual(orderedProofs(b), expected)
      assert.deepEqual(orderedProofs(c), expected)
      assert.deepEqual(orderedProofs(d), expected)
      assert.equal(expected.length, 4)
    },
  },
  {
    name: 'end-to-end trusted continuity resists later conflicting branch',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const seed = await createHistory('did:example:alice', verifyJwk, signJwk)
      let trusted = openHistory(await closeHistory('msgpack', seed))
      let writer = openHistory(await closeHistory('base64url', seed))
      let attacker = openHistory(await closeHistory('json', seed))

      writer = must(await updateHistory(writer, { branch: 'trusted-1' }, signJwk))
      writer = must(await updateHistory(writer, { branch: 'trusted-2' }, signJwk))
      trusted = must(await mergeHistories(trusted, writer))

      attacker = must(await updateHistory(attacker, { branch: 'conflict' }, signJwk))
      trusted = must(await mergeHistories(trusted, attacker))

      const { headEntry } = findHead(trusted)
      assert.equal(headEntry.branch, 'trusted-2')
      const branchValues = orderedProofs(trusted).map((proof) => trusted[proof].branch)
      assert.ok(!branchValues.includes('conflict'))
    },
  },
]

export async function run() {
  for (const e2e of tests) {
    await e2e.run()
    console.log(`ok - ${e2e.name}`)
  }
  console.log(`1..${tests.length}`)
}
