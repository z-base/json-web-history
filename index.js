import { generateVerificationPair } from '@z-base/cryptosuite'
import { create, merge } from './dist/index.js'
const issuer = 'f27ec28f-5f21-486f-96d2-3ef81f8e1bab'
const { verifyJwk, signJwk } = await generateVerificationPair()

const genesis = await create(issuer, verifyJwk, signJwk)

console.log(genesis)

merge(genesis, await create(issuer, verifyJwk, signJwk))

console.log(genesis)
