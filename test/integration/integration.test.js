import assert from 'node:assert/strict'
import { generateVerificationPair } from '@z-base/cryptosuite'
import {
  closeHistory,
  createHistory,
  findHead,
  findRoot,
  mergeHistories,
  openHistory,
  updateHistory,
} from '../../dist/index.js'

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
    const next = history[step]?.headers?.nxt
    step = typeof next === 'string' ? next : ''
  }
  return order
}

const tests = [
  {
    name: 'distributed replicas converge after eventual synchronization',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const seed = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      let writer = openHistory(await closeHistory('json', seed))
      let b = openHistory(await closeHistory('msgpack', seed))
      let c = openHistory(await closeHistory('base64url', seed))

      writer = must(await updateHistory(writer, { v: 1 }, signJwk))
      writer = must(await updateHistory(writer, { v: 2 }, signJwk))

      b = must(await mergeHistories(b, writer))
      c = must(await mergeHistories(c, b))
      writer = must(await mergeHistories(writer, c))

      const expected = orderedProofs(writer)
      assert.deepEqual(orderedProofs(b), expected)
      assert.deepEqual(orderedProofs(c), expected)
      assert.equal(expected.length, 3)
    },
  },
  {
    name: 'merging same snapshot repeatedly is idempotent',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      let writer = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      writer = must(await updateHistory(writer, { idempotent: 1 }, signJwk))

      let replica = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      replica = must(await mergeHistories(replica, writer))
      const once = orderedProofs(replica)
      replica = must(await mergeHistories(replica, writer))
      const twice = orderedProofs(replica)
      assert.deepEqual(twice, once)
    },
  },
  {
    name: 'trust anchor chooses local branch under concurrent conflict',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const root = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      const local = openHistory(await closeHistory('msgpack', root))
      const remote = openHistory(await closeHistory('base64url', root))

      const localMerged = must(
        await updateHistory(local, { branch: 'A' }, signJwk)
      )
      const remoteMerged = must(
        await updateHistory(remote, { branch: 'B' }, signJwk)
      )

      const trustedA = must(await mergeHistories(localMerged, remoteMerged))
      const trustedB = must(await mergeHistories(remoteMerged, localMerged))
      assert.deepEqual(findHead(trustedA).headEntry.body, { branch: 'A' })
      assert.deepEqual(findHead(trustedB).headEntry.body, { branch: 'B' })
    },
  },
  {
    name: 'foreign-root history cannot extend trusted rooted chain',
    run: async () => {
      const a = await generateVerificationPair()
      const b = await generateVerificationPair()

      let trusted = await createHistory(
        'did:example:shared',
        {},
        a.signJwk,
        a.verifyJwk
      )
      trusted = must(await updateHistory(trusted, { local: true }, a.signJwk))

      let foreign = await createHistory(
        'did:example:shared',
        {},
        b.signJwk,
        b.verifyJwk
      )
      foreign = must(await updateHistory(foreign, { foreign: true }, b.signJwk))

      const merged = must(await mergeHistories(trusted, foreign))
      const trustedProofs = new Set(orderedProofs(trusted))
      for (const proof of orderedProofs(merged)) {
        assert.ok(trustedProofs.has(proof))
      }
    },
  },
  {
    name: 'rotation continuity survives snapshot transport and merge',
    run: async () => {
      const k1 = await generateVerificationPair()
      const k2 = await generateVerificationPair()

      let writer = await createHistory(
        'did:example:alice',
        {},
        k1.signJwk,
        k1.verifyJwk
      )
      const replica = openHistory(await closeHistory('base64url', writer))

      writer = must(
        await updateHistory(
          writer,
          { phase: 'rotate' },
          k1.signJwk,
          k2.verifyJwk
        )
      )
      writer = must(
        await updateHistory(writer, { phase: 'after-rotate' }, k2.signJwk)
      )

      const merged = must(await mergeHistories(replica, writer))
      const order = orderedProofs(merged)
      assert.equal(order.length, 3)
      assert.deepEqual(merged[order[2]].body, { phase: 'after-rotate' })
    },
  },
]

export async function run() {
  for (const integration of tests) {
    await integration.run()
    console.log(`ok - ${integration.name}`)
  }
  console.log(`1..${tests.length}`)
}
