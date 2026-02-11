# AGENTS.md

# General

- **NEVER USE MEMORY CACHE.**
- **ALWAYS READ CURRENT FILE STATE FROM DISK OR THE ACTIVE CODE EDITOR BUFFER.**
- **AGENT MEMORY IS A FORBIDDEN STATE / REALITY SOURCE.**
- When uncertain about current behavior, **prefer primary specs + vendor docs** over assumptions.

---

## index.html (specification)

When working on `(cwd | root | .)/index.html`:

### 1) Authoring tool (ReSpec)

Follow ReSpec documentation and ecosystem guidance:

- https://respec.org/docs/
- https://github.com/speced/respec
- https://www.w3.org/community/reports/reqs/
- https://respec.org/docs/#using-respec

### 2) Normative references

Use these as the default normative sources:

**Keywords**

- https://www.rfc-editor.org/rfc/rfc2119.html

**Infra / general**

- WHATWG Infra — https://infra.spec.whatwg.org/

**Identifiers / Credentials**

- DID Core v1.0 (preferred for implementations) — https://www.w3.org/TR/did-core/
- DID Core v1.1 (experimental; do not implement unless explicitly required) — https://www.w3.org/TR/did-1.1/
- Verifiable Credentials Data Model v2.0 — https://www.w3.org/TR/vc-data-model-2.0/
- Verifiable Credentials Overview (non-normative overview, but canonical roadmap) — https://www.w3.org/TR/vc-overview/

**JSON-LD / RDF**

- JSON-LD 1.1 — https://www.w3.org/TR/json-ld11/
- JSON-LD 1.1 Processing Algorithms and API — https://www.w3.org/TR/json-ld11-api/
- RDF landing — https://www.w3.org/RDF/
- RDF 1.1 Concepts — https://www.w3.org/TR/rdf11-concepts/
- RDF Schema 1.1 — https://www.w3.org/TR/rdf-schema/

**WebCrypto**

- Web Cryptography Level 2 — https://www.w3.org/TR/webcrypto-2/

**JOSE**

- JWS — https://www.rfc-editor.org/rfc/rfc7515.html
- JWE — https://www.rfc-editor.org/rfc/rfc7516.html
- JWK — https://www.rfc-editor.org/rfc/rfc7517.html
- JWA — https://www.rfc-editor.org/rfc/rfc7518.html
- JWT — https://www.rfc-editor.org/rfc/rfc7519.html
- JWS Unencoded Payload Option — https://www.rfc-editor.org/rfc/rfc7797.html
- JWT BCP — https://www.rfc-editor.org/rfc/rfc8725.html
- JWS/JWE/JWK “typ” and “crit” Updates (JWT/JWS updates) — https://www.rfc-editor.org/rfc/rfc9864.html
- JOSE Cookbook — https://www.rfc-editor.org/rfc/rfc7520.html
- JWK Thumbprint — https://www.rfc-editor.org/rfc/rfc7638.html
- CFRG EdDSA for JOSE — https://www.rfc-editor.org/rfc/rfc8037.html
- IANA JOSE registries — https://www.iana.org/assignments/jose/jose.xhtml

**Schema.org**

- Schema.org documents — https://schema.org/docs/documents.html

### 3) Informative references

- WebSchemas / Schema.org @ W3C wiki — https://www.w3.org/wiki/WebSchemas

**CRDT (background / citations, not normative web specs)**

- Shapiro et al. (2011) “Comprehensive study…” archive page — https://webarchive.di.uminho.pt/haslab.uminho.pt/cbm/publications/comprehensive-study-convergent-and-commutative-replicated-data-types.html
- CRDT resources index (RR-7506 listing) — https://syncfree.proj.lip6.fr/index.php/crdt-resources.html
- RR-7506 PDF mirror — https://reed.cs.depaul.edu/lperkovic/csc536/lecture10/techreport.pdf
- SSS 2011 paper — https://asc.di.fct.unl.pt/~nmp/pubs/sss-2011.pdf
- 2018 CRDT chapter (author version) — https://perso.lip6.fr/Marc.Shapiro/papers/2018/CRDTs-Springer2018-authorversion.pdf

**State-based Set CRDT (CvRDT set reference)**

- Bieniusa et al. (2012) Optimized set (RR-8083 PDF) — https://lip6.fr/Marc.Shapiro/papers/RR-8083.pdf
- arXiv listing — https://arxiv.org/abs/1210.3368

**Delta-state CvRDTs**

- Delta-CRDTs (arXiv) — https://arxiv.org/abs/1603.01529
- Delta-CRDTs (PDF) — https://arxiv.org/pdf/1603.01529
- Journal PDF copy — https://members.loria.fr/CIgnat/files/replication/Delta-CRDT.pdf

**Production references (implementations)**

- Riak KV Sets docs — https://docs.riak.com/riak/kv/latest/developing/data-types/sets/index.html
- riak_dt library — https://github.com/basho/riak_dt
- Bigset / decomposed delta sets (PDF) — https://arxiv.org/pdf/1605.06424.pdf

---

# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated.
**Always retrieve current Cloudflare documentation** before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, Workers AI, Hyperdrive, or Agents task.

## Docs (entry points)

- Workers — https://developers.cloudflare.com/workers/
- Agents — https://developers.cloudflare.com/agents/
- Model Context Protocol (MCP) — https://developers.cloudflare.com/agents/model-context-protocol/

## Limits & quotas

For limits/quotas, always use the product’s official limits page:

- Workers — https://developers.cloudflare.com/workers/platform/limits/
- KV — https://developers.cloudflare.com/kv/platform/limits/
- R2 — https://developers.cloudflare.com/r2/platform/limits/
- D1 — https://developers.cloudflare.com/d1/platform/limits/
- Durable Objects — https://developers.cloudflare.com/durable-objects/platform/limits/
- Queues — https://developers.cloudflare.com/queues/platform/limits/
- Vectorize — https://developers.cloudflare.com/vectorize/platform/limits/
- Workers AI — https://developers.cloudflare.com/workers-ai/platform/limits/
- Hyperdrive — https://developers.cloudflare.com/hyperdrive/platform/limits/
- Agents — https://developers.cloudflare.com/agents/platform/limits/
- Pages (if relevant) — https://developers.cloudflare.com/pages/platform/limits/

## Commands

| Command               | Purpose                   |
| --------------------- | ------------------------- |
| `npx wrangler dev`    | Local development         |
| `npx wrangler deploy` | Deploy to Cloudflare      |
| `npx wrangler types`  | Generate TypeScript types |

Run `wrangler types` after changing bindings in `wrangler.jsonc` / `wrangler.toml`.

## Node.js compatibility

- https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors / observability

- Error reference — https://developers.cloudflare.com/workers/observability/errors/
- For any “CPU/Memory exceeded” or quota ambiguity: **re-check the product limits page** first.
