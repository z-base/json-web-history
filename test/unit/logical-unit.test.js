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
import { createAssertion } from '../../dist/JWH/createAssertion/index.js'

const cloneHistory = (history) =>
  Object.fromEntries(
    Object.entries(history).map(([proof, entry]) => [proof, { ...entry }])
  )

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

const must = (value, message) => {
  assert.ok(value, message)
  return value
}

const tests = [
  {
    name: 'createAssertion returns frozen payload and proof string',
    run: async () => {
      const { signJwk } = await generateVerificationPair()
      const { proof, assertion } = await createAssertion(
        'did:example:alice',
        signJwk,
        123,
        { x: 1 }
      )
      assert.equal(typeof proof, 'string')
      assert.ok(proof.length > 0)
      assert.equal(assertion.nbf, 123)
      assert.ok(Object.isFrozen(assertion))
    },
  },
  {
    name: 'createAssertion supports omitted claims and verification method',
    run: async () => {
      const { signJwk } = await generateVerificationPair()
      const { assertion } = await createAssertion(
        'did:example:alice',
        signJwk,
        124
      )
      assert.equal(assertion.iss, 'did:example:alice')
      assert.equal(assertion.nbf, 124)
      assert.equal(assertion.verificationMethod, undefined)
    },
  },
  {
    name: 'createHistory creates one-entry chain with same root/head',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootIndex, rootEntry } = findRoot(history)
      const { headIndex, headEntry } = findHead(history)
      assert.equal(Object.keys(history).length, 1)
      assert.equal(rootIndex, headIndex)
      assert.equal(rootEntry, headEntry)
      assert.equal(rootEntry.iss, 'did:example:alice')
      assert.ok(rootEntry.verificationMethod)
    },
  },
  {
    name: 'openHistory returns stable entry view identity',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootIndex } = findRoot(history)
      assert.equal(history[rootIndex], history[rootIndex])
    },
  },
  {
    name: 'openHistory allows only next field mutation on entries',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootEntry } = findRoot(history)
      rootEntry.next = 'next-proof'
      assert.equal(rootEntry.next, 'next-proof')
      assert.throws(() => {
        rootEntry.iss = 'did:example:mallory'
      })
      assert.throws(() => {
        delete rootEntry.prev
      })
    },
  },
  {
    name: 'openHistory keeps top-level append-only rules',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootIndex, rootEntry } = findRoot(history)
      assert.throws(() => {
        history[rootIndex] = rootEntry
      })
      assert.throws(() => {
        delete history[rootIndex]
      })
      const { proof, assertion } = await createAssertion(
        'did:example:alice',
        signJwk,
        Date.now(),
        { prev: rootIndex }
      )
      history[proof] = assertion
      assert.ok(history[proof])
    },
  },
  {
    name: 'openHistory set trap rejects non-string and prototype-pollution keys',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const symbolSet = Reflect.set(history, Symbol('k'), { x: 1 })
      assert.equal(symbolSet, false)
      assert.equal(Reflect.set(history, '__proto__', { polluted: true }), false)
      assert.equal(Reflect.set(history, 'constructor', { x: 1 }), false)
      assert.equal(Reflect.set(history, 'prototype', { x: 1 }), false)
    },
  },
  {
    name: 'openHistory rejects defineProperty at history and entry levels',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootIndex, rootEntry } = findRoot(history)
      assert.throws(() => {
        Object.defineProperty(history, 'x', { value: 1, configurable: true })
      })
      assert.throws(() => {
        Object.defineProperty(rootEntry, 'next', {
          value: 'x',
          configurable: true,
        })
      })
      assert.ok(history[rootIndex])
    },
  },
  {
    name: 'updateHistory appends and links entries in root-to-head order',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      let history = await createHistory('did:example:alice', verifyJwk, signJwk)
      history = must(await updateHistory(history, { role: 'writer' }, signJwk))
      history = must(await updateHistory(history, { role: 'admin' }, signJwk))
      const order = orderedProofs(history)
      assert.equal(order.length, 3)
      assert.equal(history[order[1]].prev, order[0])
      assert.equal(history[order[2]].prev, order[1])
      assert.equal(history[order[0]].next, order[1])
      assert.equal(history[order[1]].next, order[2])
    },
  },
  {
    name: 'updateHistory preserves schema-flex payload members',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const claims = {
        profile: { tags: ['a', 'b'] },
        flags: [true, false],
        score: 42,
      }
      const history = must(
        await updateHistory(
          await createHistory('did:example:alice', verifyJwk, signJwk),
          claims,
          signJwk
        )
      )
      const { headEntry } = findHead(history)
      assert.deepEqual(headEntry.profile, claims.profile)
      assert.deepEqual(headEntry.flags, claims.flags)
      assert.equal(headEntry.score, claims.score)
    },
  },
  {
    name: 'closeHistory roundtrips json/msgpack/base64url',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = must(
        await updateHistory(
          await createHistory('did:example:alice', verifyJwk, signJwk),
          { roundtrip: true },
          signJwk
        )
      )
      const order = orderedProofs(history)
      const json = await closeHistory('json', history)
      const msgpack = await closeHistory('msgpack', history)
      const base64url = await closeHistory('base64url', history)
      assert.deepEqual(orderedProofs(openHistory(json)), order)
      assert.deepEqual(orderedProofs(openHistory(msgpack)), order)
      assert.deepEqual(orderedProofs(openHistory(base64url)), order)
    },
  },
  {
    name: 'closeHistory rejects unsupported snapshot type',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      await assert.rejects(async () => {
        await closeHistory('unsupported', history)
      })
    },
  },
  {
    name: 'mergeHistories verifies with next excluded from signature bytes',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', verifyJwk, signJwk)
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        rootEntry.iss,
        signJwk,
        Date.now(),
        { prev: rootIndex, phase: 1 }
      )
      trusted[rootIndex].next = proof
      trusted[proof] = { ...assertion }
      const merged = await mergeHistories(trusted, {})
      const accepted = must(merged, 'expected merge to pass')
      assert.equal(Object.keys(accepted).length, 2)
      assert.equal(findHead(accepted).headIndex, proof)
    },
  },
  {
    name: 'mergeHistories returns undefined when root verification method is missing',
    run: async () => {
      const merged = await mergeHistories(
        openHistory({
          proof: { iss: 'did:example:alice', nbf: Date.now() },
        }),
        {}
      )
      assert.equal(merged, undefined)
    },
  },
  {
    name: 'mergeHistories returns undefined when traversed next proof is missing',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootEntry } = findRoot(trusted)
      rootEntry.next = 'missing-proof'
      const merged = await mergeHistories(trusted, {})
      assert.equal(merged, undefined)
    },
  },
  {
    name: 'mergeHistories rejects issuer discontinuity on traversed path',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', verifyJwk, signJwk)
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        rootEntry.iss,
        signJwk,
        Date.now(),
        { prev: rootIndex, iss: 'did:example:mallory' }
      )
      trusted[rootIndex].next = proof
      trusted[proof] = { ...assertion }
      const merged = await mergeHistories(trusted, {})
      assert.equal(merged, undefined)
    },
  },
  {
    name: 'mergeHistories rejects tampered payload when proof is traversed',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', verifyJwk, signJwk)
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        rootEntry.iss,
        signJwk,
        Date.now(),
        { prev: rootIndex, stage: 'original' }
      )
      trusted[rootIndex].next = proof
      const alleged = { [proof]: { ...assertion, stage: 'tampered' } }
      const before = JSON.stringify(trusted)
      const merged = await mergeHistories(trusted, alleged)
      assert.equal(merged, undefined)
      assert.equal(JSON.stringify(trusted), before)
    },
  },
  {
    name: 'mergeHistories supports key rotation continuity',
    run: async () => {
      const k1 = await generateVerificationPair()
      const k2 = await generateVerificationPair()
      let writer = await createHistory('did:example:alice', k1.verifyJwk, k1.signJwk)
      const replica = openHistory(await closeHistory('msgpack', writer))
      writer = must(
        await updateHistory(
          writer,
          { step: 1 },
          k1.signJwk,
          Date.now(),
          k2.verifyJwk
        )
      )
      writer = must(await updateHistory(writer, { step: 2 }, k2.signJwk))
      const merged = must(await mergeHistories(replica, writer))
      const order = orderedProofs(merged)
      assert.equal(order.length, 3)
      assert.equal(merged[order[2]].step, 2)
    },
  },
  {
    name: 'trusted branch remains canonical under conflicting concurrent branch',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const root = await createHistory('did:example:alice', verifyJwk, signJwk)
      const local = openHistory(await closeHistory('msgpack', root))
      const remote = openHistory(await closeHistory('base64url', root))
      const localUpdated = must(await updateHistory(local, { branch: 'local' }, signJwk))
      const remoteUpdated = must(
        await updateHistory(remote, { branch: 'remote' }, signJwk)
      )
      const merged = must(await mergeHistories(localUpdated, remoteUpdated))
      const { headEntry } = findHead(merged)
      assert.equal(headEntry.branch, 'local')
    },
  },
  {
    name: 'findHead and findRoot throw on malformed disconnected structures',
    run: async () => {
      assert.throws(() => findHead(openHistory({})))
      assert.throws(() =>
        findRoot(
          openHistory({
            a: { iss: 'did:example:alice', nbf: 1, prev: 'b' },
            b: { iss: 'did:example:alice', nbf: 2, prev: 'a' },
          })
        )
      )
      assert.throws(() =>
        findHead(
          openHistory({
            a: { iss: 'did:example:alice', nbf: 1, next: 'missing' },
          })
        )
      )
    },
  },
  {
    name: 'findHead and findRoot break on empty keys and then throw',
    run: async () => {
      assert.throws(() =>
        findHead(
          openHistory({
            '': { iss: 'did:example:alice', nbf: 1 },
          })
        )
      )
      assert.throws(() =>
        findRoot(
          openHistory({
            '': { iss: 'did:example:alice', nbf: 1, prev: 'x' },
          })
        )
      )
    },
  },
  {
    name: 'updateHistory returns undefined when head issuer is not a string',
    run: async () => {
      const { signJwk } = await generateVerificationPair()
      const malformed = openHistory({
        proof: { nbf: Date.now() },
      })
      const updated = await updateHistory(malformed, { x: 1 }, signJwk)
      assert.equal(updated, undefined)
    },
  },
]

export async function run() {
  for (const unit of tests) {
    await unit.run()
    console.log(`ok - ${unit.name}`)
  }
  console.log(`1..${tests.length}`)
}
