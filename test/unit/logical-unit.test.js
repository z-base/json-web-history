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

const must = (value, message) => {
  assert.ok(value, message)
  return value
}

const cloneHistory = (history) =>
  Object.fromEntries(
    Object.entries(history).map(([proof, entry]) => [
      proof,
      { ...entry, headers: { ...entry.headers } },
    ])
  )

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
    name: 'createAssertion returns proof and payload',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: 'did:example:alice',
          nxt: null,
          prv: null,
          vrf: verifyJwk,
        },
        { x: 1 }
      )
      assert.equal(typeof proof, 'string')
      assert.ok(proof.length > 0)
      assert.equal(assertion.headers.sub, 'did:example:alice')
      assert.deepEqual(assertion.body, { x: 1 })
    },
  },
  {
    name: 'createAssertion supports default headers and body',
    run: async () => {
      const { signJwk } = await generateVerificationPair()
      const { assertion } = await createAssertion(signJwk)
      assert.equal(assertion.headers.sub, null)
      assert.equal(assertion.headers.nxt, null)
      assert.equal(assertion.headers.prv, null)
      assert.equal(assertion.headers.vrf, null)
      assert.deepEqual(assertion.body, {})
    },
  },
  {
    name: 'createAssertion normalizes missing nxt and prv to null',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: 'did:example:alice',
          prv: null,
          vrf: verifyJwk,
        },
        {}
      )
      assert.equal(assertion.headers.nxt, null)
      assert.equal(assertion.headers.prv, null)

      const trusted = openHistory({
        [proof]: assertion,
      })
      const merged = await mergeHistories(trusted, openHistory({}))
      const accepted = must(merged, 'expected merge to pass')
      const { rootEntry } = findRoot(accepted)
      assert.equal(rootEntry.headers.nxt, null)
    },
  },
  {
    name: 'createHistory creates one-entry chain with same root/head',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory(
        'did:example:alice',
        { seed: true },
        signJwk,
        verifyJwk
      )
      const { rootIndex, rootEntry } = findRoot(history)
      const { headIndex, headEntry } = findHead(history)
      assert.equal(rootIndex, headIndex)
      assert.equal(rootEntry, headEntry)
      assert.equal(rootEntry.headers.sub, 'did:example:alice')
      assert.ok(rootEntry.headers.vrf)
      assert.deepEqual(rootEntry.body, { seed: true })
    },
  },
  {
    name: 'openHistory returns stable entry view identity',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      const { rootIndex } = findRoot(history)
      assert.equal(history[rootIndex], history[rootIndex])
      assert.equal(history.missing, undefined)
    },
  },
  {
    name: 'openHistory returns mutable entries and headers',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      const { rootEntry } = findRoot(history)

      rootEntry.body = { changed: true }
      rootEntry.headers.sub = 'did:example:mallory'
      rootEntry.headers.nxt = 123
      assert.deepEqual(rootEntry.body, { changed: true })
      assert.equal(rootEntry.headers.sub, 'did:example:mallory')
      assert.equal(rootEntry.headers.nxt, 123)

      rootEntry.headers.nxt = 'next-proof'
      assert.equal(rootEntry.headers.nxt, 'next-proof')
      rootEntry.headers.nxt = null
      assert.equal(rootEntry.headers.nxt, null)

      delete rootEntry.body
      assert.equal(rootEntry.body, undefined)

      Object.defineProperty(rootEntry, 'body', { value: 1, configurable: true })
      assert.equal(rootEntry.body, 1)

      delete rootEntry.headers.nxt
      assert.equal(
        Object.prototype.hasOwnProperty.call(rootEntry.headers, 'nxt'),
        false
      )

      Object.defineProperty(rootEntry.headers, 'nxt', {
        value: 'x',
        configurable: true,
      })
      assert.equal(rootEntry.headers.nxt, 'x')
    },
  },
  {
    name: 'openHistory returns plain mutable history object',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      const { rootIndex } = findRoot(history)
      const replacement = {
        headers: { sub: 'did:example:alice', prv: null, nxt: null, vrf: null },
        body: { replaced: true },
      }
      assert.equal(Reflect.set(history, rootIndex, replacement), true)
      assert.equal(history[rootIndex], replacement)
      assert.equal(Reflect.deleteProperty(history, rootIndex), true)
      assert.equal(history[rootIndex], undefined)

      const symbolKey = Symbol('k')
      assert.equal(Reflect.set(history, symbolKey, { x: 1 }), true)
      assert.equal(Reflect.get(history, symbolKey).x, 1)

      Object.defineProperty(history, 'x', { value: 1, configurable: true })
      assert.equal(history.x, 1)

      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: 'did:example:alice',
          nxt: null,
          prv: rootIndex,
          vrf: null,
        },
        { x: 1 }
      )
      assert.equal(Reflect.set(history, proof, assertion), true)
      assert.ok(history[proof])
    },
  },
  {
    name: 'closeHistory roundtrips json/msgpack/base64url snapshots',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      let history = await createHistory(
        'did:example:alice',
        { roundtrip: 0 },
        signJwk,
        verifyJwk
      )
      history = must(await updateHistory(history, { roundtrip: 1 }, signJwk))
      const expected = orderedProofs(history)

      const json = await closeHistory('json', history)
      const msgpack = await closeHistory('msgpack', history)
      const base64url = await closeHistory('base64url', history)
      assert.deepEqual(orderedProofs(openHistory(json)), expected)
      assert.deepEqual(orderedProofs(openHistory(msgpack)), expected)
      assert.deepEqual(orderedProofs(openHistory(base64url)), expected)
    },
  },
  {
    name: 'closeHistory rejects unsupported snapshot type',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      await assert.rejects(async () => {
        await closeHistory('unsupported', history)
      })
    },
  },
  {
    name: 'updateHistory appends a linked entry with body content',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      let history = await createHistory(
        'did:example:alice',
        { stage: 0 },
        signJwk,
        verifyJwk
      )
      history = must(await updateHistory(history, { stage: 1 }, signJwk))
      history = must(await updateHistory(history, { stage: 2 }, signJwk))
      const order = orderedProofs(history)
      assert.equal(order.length, 3)
      assert.equal(history[order[1]].headers.prv, order[0])
      assert.equal(history[order[2]].headers.prv, order[1])
      assert.equal(history[order[0]].headers.nxt, order[1])
      assert.equal(history[order[1]].headers.nxt, order[2])
      assert.deepEqual(history[order[2]].body, { stage: 2 })
    },
  },
  {
    name: 'updateHistory returns undefined when head subject is not a string',
    run: async () => {
      const { signJwk } = await generateVerificationPair()
      const malformed = openHistory({
        proof: {
          headers: { sub: null, nxt: null, prv: null, vrf: null },
          body: {},
        },
      })
      const updated = await updateHistory(malformed, { x: 1 }, signJwk)
      assert.equal(updated, undefined)
    },
  },
  {
    name: 'findRoot and findHead traverse and throw for malformed histories',
    run: async () => {
      const reordered = openHistory({
        child: {
          headers: {
            sub: 'did:example:alice',
            nxt: null,
            prv: 'root',
            vrf: null,
          },
          body: {},
        },
        root: {
          headers: {
            sub: 'did:example:alice',
            nxt: 'child',
            prv: null,
            vrf: null,
          },
          body: {},
        },
      })
      assert.equal(findRoot(reordered).rootIndex, 'root')
      assert.equal(findHead(reordered).headIndex, 'child')

      assert.throws(() => findRoot(openHistory({})))
      assert.throws(() => findHead(openHistory({})))
      assert.throws(() =>
        findHead(
          openHistory({
            a: {
              headers: {
                sub: 'did:example:alice',
                nxt: 'missing',
                prv: null,
                vrf: null,
              },
              body: {},
            },
          })
        )
      )
      assert.throws(() =>
        findRoot(
          openHistory({
            a: {
              headers: {
                sub: 'did:example:alice',
                nxt: null,
                prv: 'missing',
                vrf: null,
              },
              body: {},
            },
          })
        )
      )
      assert.throws(() =>
        findHead(
          openHistory({
            '': {
              headers: {
                sub: 'did:example:alice',
                nxt: null,
                prv: null,
                vrf: null,
              },
              body: {},
            },
          })
        )
      )
      assert.throws(() =>
        findRoot(
          openHistory({
            '': {
              headers: {
                sub: 'did:example:alice',
                nxt: null,
                prv: null,
                vrf: null,
              },
              body: {},
            },
          })
        )
      )
    },
  },
  {
    name: 'mergeHistories verifies tokens with nxt excluded from signed bytes',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', {}, signJwk, verifyJwk)
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: rootEntry.headers.sub,
          nxt: null,
          prv: rootIndex,
          vrf: null,
        },
        { phase: 1 }
      )
      trusted[rootIndex].headers.nxt = proof
      trusted[proof] = { ...assertion, headers: { ...assertion.headers } }

      const merged = await mergeHistories(trusted, {})
      const accepted = must(merged, 'expected merge to pass')
      assert.equal(Object.keys(accepted).length, 2)
      assert.equal(findHead(accepted).headIndex, proof)
    },
  },
  {
    name: 'mergeHistories returns undefined without root verification key',
    run: async () => {
      const merged = await mergeHistories(
        openHistory({
          proof: {
            headers: {
              sub: 'did:example:alice',
              nxt: null,
              prv: null,
              vrf: null,
            },
            body: {},
          },
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
      const trusted = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      const { rootEntry } = findRoot(trusted)
      rootEntry.headers.nxt = 'missing-proof'
      const merged = await mergeHistories(trusted, {})
      assert.equal(merged, undefined)
    },
  },
  {
    name: 'mergeHistories rejects subject discontinuity on traversed path',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', {}, signJwk, verifyJwk)
      )
      const { rootIndex } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: 'did:example:mallory',
          nxt: null,
          prv: rootIndex,
          vrf: null,
        },
        { stage: 1 }
      )
      trusted[rootIndex].headers.nxt = proof
      trusted[proof] = assertion
      const merged = await mergeHistories(trusted, {})
      assert.equal(merged, undefined)
    },
  },
  {
    name: 'mergeHistories rejects when current prv does not match previous proof',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', {}, signJwk, verifyJwk)
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: rootEntry.headers.sub,
          nxt: null,
          prv: 'wrong-proof',
          vrf: null,
        },
        { stage: 1 }
      )
      trusted[rootIndex].headers.nxt = proof
      trusted[proof] = assertion
      const merged = await mergeHistories(trusted, {})
      assert.equal(merged, undefined)
    },
  },
  {
    name: 'mergeHistories rejects tampered payloads',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = cloneHistory(
        await createHistory('did:example:alice', {}, signJwk, verifyJwk)
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        signJwk,
        {
          sub: rootEntry.headers.sub,
          nxt: null,
          prv: rootIndex,
          vrf: null,
        },
        { stage: 'original' }
      )
      trusted[rootIndex].headers.nxt = proof
      const alleged = {
        [proof]: {
          ...assertion,
          headers: { ...assertion.headers },
          body: { stage: 'tampered' },
        },
      }
      const before = JSON.stringify(await closeHistory('json', trusted))
      const merged = await mergeHistories(trusted, alleged)
      assert.equal(merged, undefined)
      assert.equal(JSON.stringify(await closeHistory('json', trusted)), before)
    },
  },
  {
    name: 'mergeHistories supports key rotation continuity',
    run: async () => {
      const k1 = await generateVerificationPair()
      const k2 = await generateVerificationPair()

      let writer = await createHistory(
        'did:example:alice',
        { step: 0 },
        k1.signJwk,
        k1.verifyJwk
      )
      const replica = openHistory(await closeHistory('msgpack', writer))
      writer = must(
        await updateHistory(writer, { step: 1 }, k1.signJwk, k2.verifyJwk)
      )
      writer = must(await updateHistory(writer, { step: 2 }, k2.signJwk))

      const merged = must(await mergeHistories(replica, writer))
      const order = orderedProofs(merged)
      assert.equal(order.length, 3)
      assert.deepEqual(merged[order[2]].body, { step: 2 })
    },
  },
  {
    name: 'trusted branch remains canonical under conflicting concurrent branch',
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

      const localUpdated = must(
        await updateHistory(local, { branch: 'A' }, signJwk)
      )
      const remoteUpdated = must(
        await updateHistory(remote, { branch: 'B' }, signJwk)
      )
      const merged = must(await mergeHistories(localUpdated, remoteUpdated))
      const { headEntry } = findHead(merged)
      assert.deepEqual(headEntry.body, { branch: 'A' })
      const mergedProofs = new Set(orderedProofs(merged))
      const remoteHead = findHead(remoteUpdated).headIndex
      assert.equal(mergedProofs.has(remoteHead), false)
    },
  },
  {
    name: 'mergeHistories may mutate trusted next pointers when merge fails',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const trusted = await createHistory(
        'did:example:alice',
        {},
        signJwk,
        verifyJwk
      )
      const { rootIndex } = findRoot(trusted)
      const before = JSON.stringify(await closeHistory('json', trusted))

      const alleged = openHistory({
        [rootIndex]: {
          ...trusted[rootIndex],
          headers: { ...trusted[rootIndex].headers, nxt: 'missing-proof' },
        },
      })
      const merged = await mergeHistories(trusted, alleged)
      assert.equal(merged, undefined)
      assert.notEqual(
        JSON.stringify(await closeHistory('json', trusted)),
        before
      )
      assert.equal(trusted[rootIndex].headers.nxt, 'missing-proof')
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
