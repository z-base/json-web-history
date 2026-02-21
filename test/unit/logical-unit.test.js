import assert from 'node:assert/strict'
import { generateVerificationPair } from '@z-base/cryptosuite'
import {
  createHistory,
  findHead,
  findRoot,
  mergeHistories,
  updateHistory,
} from '../../dist/index.js'
import { createAssertion } from '../../dist/JWH/createAssertion/index.js'

const tests = [
  {
    name: 'openHistory allows only next mutation',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootEntry } = findRoot(history)

      rootEntry.next = 'next-proof'
      assert.equal(rootEntry.next, 'next-proof')

      assert.throws(() => {
        rootEntry.iss = 'did:example:mallory'
      })
    },
  },
  {
    name: 'updateHistory appends and links a new head',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const history = await createHistory('did:example:alice', verifyJwk, signJwk)
      const { rootIndex } = findRoot(history)

      const updated = await updateHistory(history, { role: 'writer' }, signJwk)
      assert.ok(updated)
      assert.equal(Object.keys(updated).length, 2)

      const { headIndex, headEntry } = findHead(updated)
      assert.equal(updated[rootIndex].next, headIndex)
      assert.equal(headEntry.prev, rootIndex)
    },
  },
  {
    name: 'mergeHistories verifies entries with next excluded from signed bytes',
    run: async () => {
      const { signJwk, verifyJwk } = await generateVerificationPair()
      const opened = await createHistory('did:example:alice', verifyJwk, signJwk)
      const trusted = Object.fromEntries(
        Object.entries(opened).map(([proof, entry]) => [proof, { ...entry }])
      )
      const { rootIndex, rootEntry } = findRoot(trusted)
      const { proof, assertion } = await createAssertion(
        rootEntry.iss,
        signJwk,
        Date.now(),
        { prev: rootIndex }
      )
      trusted[proof] = { ...assertion }
      trusted[rootIndex].next = proof

      const merged = await mergeHistories(trusted, {})
      assert.ok(merged)
      assert.equal(Object.keys(merged).length, 2)
      assert.equal(merged[rootIndex].next, proof)
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
