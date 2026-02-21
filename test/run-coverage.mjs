import { run } from './unit/logical-unit.test.js'
import { run as runIntegration } from './integration/integration.test.js'

await run()
await runIntegration()
await import('../dist/JWH/inspectHistory/index.js')
