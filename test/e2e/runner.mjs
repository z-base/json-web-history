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
  if (
    typeof value === 'object' &&
    value !== null &&
    'badNodes' in value &&
    'mergeResult' in value
  ) {
    assert.equal(value.badNodes, false, message)
    return value.mergeResult
  }
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
    const next = history[step]?.headers?.nxt
    step = typeof next === 'string' ? next : ''
  }
  return order
}

const verificationKeys = (history) => {
  const order = orderedProofs(history)
  let active = undefined
  const keys = []
  for (const proof of order) {
    const entry = history[proof]
    if (entry.headers.vrf) active = entry.headers.vrf
    keys.push(active)
  }
  return keys
}

const tests = [
  {
    name: 'end-to-end key intent continuity through rotation history',
    run: async () => {
      const k1 = await generateVerificationPair()
      const k2 = await generateVerificationPair()
      let writer = await createHistory(
        'did:example:alice',
        {},
        k1.signJwk,
        k1.verifyJwk
      )

      writer = must(
        await updateHistory(
          writer,
          { phase: 'rotate' },
          k1.signJwk,
          k2.verifyJwk
        )
      )
      writer = must(await updateHistory(writer, { phase: 'after' }, k2.signJwk))

      const payloadBefore = encoder.encode('before-rotation')
      const payloadAfter = encoder.encode('after-rotation')
      const sigBefore = await VerificationCluster.sign(
        k1.signJwk,
        payloadBefore
      )
      const sigAfter = await VerificationCluster.sign(k2.signJwk, payloadAfter)

      const consumer = openHistory(await closeHistory('base64url', writer))
      const keys = verificationKeys(consumer)
      assert.equal(keys.length, 3)
      assert.ok(keys[0])
      assert.ok(keys[1])
      assert.ok(keys[2])

      assert.equal(
        await VerificationCluster.verify(keys[0], payloadBefore, sigBefore),
        true
      )
      assert.equal(
        await VerificationCluster.verify(keys[2], payloadAfter, sigAfter),
        true
      )
      assert.equal(
        await VerificationCluster.verify(keys[0], payloadAfter, sigAfter),
        false
      )
    },
  },
  {
    name: 'end-to-end eventual sync across mixed snapshot transports',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const seed = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      let a = openHistory(await closeHistory('json', seed))
      let b = openHistory(await closeHistory('msgpack', seed))
      let c = openHistory(await closeHistory('base64url', seed))
      let d = openHistory(await closeHistory('msgpack', seed))

      a = must(await updateHistory(a, { seq: 1 }, signJwk))
      a = must(await updateHistory(a, { seq: 2 }, signJwk))
      a = must(await updateHistory(a, { seq: 3 }, signJwk))

      b = must(
        await mergeHistories(b, openHistory(await closeHistory('msgpack', a)))
      )
      c = must(
        await mergeHistories(c, openHistory(await closeHistory('base64url', b)))
      )
      d = must(
        await mergeHistories(d, openHistory(await closeHistory('json', c)))
      )
      a = must(
        await mergeHistories(a, openHistory(await closeHistory('msgpack', d)))
      )

      const expected = orderedProofs(a)
      assert.deepEqual(orderedProofs(b), expected)
      assert.deepEqual(orderedProofs(c), expected)
      assert.deepEqual(orderedProofs(d), expected)
      assert.equal(expected.length, 4)
    },
  },
  {
    name: 'end-to-end trusted continuity resists conflicting later branch',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const seed = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      let trusted = openHistory(await closeHistory('msgpack', seed))
      let writer = openHistory(await closeHistory('base64url', seed))
      let attacker = openHistory(await closeHistory('json', seed))

      writer = must(
        await updateHistory(writer, { branch: 'trusted-1' }, signJwk)
      )
      writer = must(
        await updateHistory(writer, { branch: 'trusted-2' }, signJwk)
      )
      trusted = must(await mergeHistories(trusted, writer))

      attacker = must(
        await updateHistory(attacker, { branch: 'conflict' }, signJwk)
      )
      trusted = must(await mergeHistories(trusted, attacker))

      const { headEntry } = findHead(trusted)
      assert.deepEqual(headEntry.body, { branch: 'trusted-2' })
      const bodies = orderedProofs(trusted).map(
        (proof) => trusted[proof].body?.branch
      )
      assert.equal(bodies.includes('conflict'), false)
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
