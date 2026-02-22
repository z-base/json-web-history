# Web Cryptography API Reference

## Scope

This reference summarizes the Web Cryptography API’s algorithms and key usages
as defined by the Web Cryptography Level 2 specification. It documents what the
spec defines, not what every implementation supports.

The Web Cryptography API does not require user agents to implement any
particular algorithm. The lists below reflect the algorithms defined in the
specification, not guaranteed implementation support.

## Key Usages (`KeyUsage`)

The Web Cryptography API defines the following key usages for `CryptoKey.usages`
and for method parameters:

- `encrypt`
- `decrypt`
- `sign`
- `verify`
- `deriveKey`
- `deriveBits`
- `wrapKey`
- `unwrapKey`

These usage values align with the operations that may be listed in a JWK’s
`key_ops` member when mapping between JWK and WebCrypto keys.

## Algorithms and Supported Operations

The Web Cryptography Level 2 algorithm overview table documents which
SubtleCrypto methods each algorithm can be used with. The table is
non-normative and not a recommendation; it documents method support. In
summary:

| Algorithm           | SubtleCrypto methods                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| `RSASSA-PKCS1-v1_5` | sign, verify, generateKey, importKey, exportKey                         |
| `RSA-PSS`           | sign, verify, generateKey, importKey, exportKey                         |
| `RSA-OAEP`          | encrypt, decrypt, generateKey, importKey, exportKey, wrapKey, unwrapKey |
| `ECDSA`             | sign, verify, generateKey, importKey, exportKey                         |
| `ECDH`              | deriveKey, deriveBits, generateKey, importKey, exportKey                |
| `Ed25519`           | sign, verify, generateKey, importKey, exportKey                         |
| `X25519`            | deriveKey, deriveBits, generateKey, importKey, exportKey                |
| `AES-CTR`           | encrypt, decrypt, generateKey, importKey, exportKey, wrapKey, unwrapKey |
| `AES-CBC`           | encrypt, decrypt, generateKey, importKey, exportKey, wrapKey, unwrapKey |
| `AES-GCM`           | encrypt, decrypt, generateKey, importKey, exportKey, wrapKey, unwrapKey |
| `AES-KW`            | wrapKey, unwrapKey, generateKey, importKey, exportKey                   |
| `HMAC`              | sign, verify, generateKey, importKey, exportKey                         |
| `SHA-1`             | digest                                                                  |
| `SHA-256`           | digest                                                                  |
| `SHA-384`           | digest                                                                  |
| `SHA-512`           | digest                                                                  |
| `HKDF`              | deriveKey, deriveBits, importKey                                        |
| `PBKDF2`            | deriveKey, deriveBits, importKey                                        |

## References

- Web Cryptography Level 2 — https://www.w3.org/TR/webcrypto-2/
- RFC 7517 (JSON Web Key) — https://www.rfc-editor.org/rfc/rfc7517.html
