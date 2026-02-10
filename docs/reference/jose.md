# JOSE (JWS, JWE, JWT) Reference

This document summarizes the JOSE (JSON Object Signing and Encryption) technologies and the core specifications that define them: JWS, JWE, JWT, plus the supporting JWK and JWA specs.

## Quick comparison

| Spec | Primary purpose | Protection | Serialization |
| --- | --- | --- | --- |
| JWS | Represent content secured with signatures or MACs | Integrity (signature/MAC) | Compact and JSON |
| JWE | Represent encrypted content with integrity | Confidentiality + integrity | Compact and JSON |
| JWT | Compact, URL-safe claims representation | Signed/MACed and/or encrypted (via JWS/JWE) | Always Compact (JWS or JWE) |

## JWS (JSON Web Signature)

JWS represents content secured with digital signatures or MACs using JSON-based data structures and provides integrity protection for an arbitrary sequence of octets.

Serializations:
- Compact: URL-safe string form.
- JSON: JSON object form that can represent multiple signatures or MACs.

Base64url encoding is used for the protected header, payload, and signature because JSON cannot directly represent arbitrary octet sequences.

Compact serialization format:
```text
BASE64URL(UTF8(JWS Protected Header)) .
BASE64URL(JWS Payload) .
BASE64URL(JWS Signature)
```

JWS Signing Input (the data that is signed or MACed):
```text
ASCII(BASE64URL(UTF8(JWS Protected Header)) || '.' || BASE64URL(JWS Payload))
```

## JWE (JSON Web Encryption)

JWE uses authenticated encryption to protect the confidentiality and integrity of the plaintext, and to provide integrity protection for the JWE Protected Header and AAD.

Serializations:
- Compact: URL-safe string form.
- JSON: JSON object form that can encrypt to multiple recipients.

Base64url encoding is used for the protected header, encrypted key, initialization vector, ciphertext, and authentication tag; AAD is base64url encoded when present.

Compact serialization format:
```text
BASE64URL(UTF8(JWE Protected Header)) .
BASE64URL(JWE Encrypted Key) .
BASE64URL(JWE Initialization Vector) .
BASE64URL(JWE Ciphertext) .
BASE64URL(JWE Authentication Tag)
```

JWE JSON Serialization members (subset may appear, but these eight are defined):
```text
protected, unprotected, header, encrypted_key, iv, ciphertext, tag, aad
```

## JWT (JSON Web Token)

JWT is a compact, URL-safe means of representing claims. The claims are encoded as a JSON object and used as the payload of a JWS or the plaintext of a JWE, enabling the claims to be signed/MACed and/or encrypted.

JWTs are always represented using the JWS Compact Serialization or the JWE Compact Serialization.

A JWT is a sequence of URL-safe parts separated by '.' characters; each part is base64url encoded. The number of parts depends on whether it is a JWS or JWE compact form.

## Supporting specs: JWK and JWA

JWK defines a JSON data structure for representing cryptographic keys, and a JWK Set format for representing sets of keys. A JWK Set is a JSON object that MUST have a `keys` array.

JWA registers cryptographic algorithms and identifiers for use with JWS, JWE, and JWK, and defines IANA registries for those identifiers.

## Best practices (JWT BCP)

These recommendations update and harden JWT usage:
- Algorithm verification: libraries must allow callers to specify an allowlist of algorithms, must ensure the `alg` or `enc` header matches the algorithm used, and must ensure each key is used with exactly one algorithm.
- Use appropriate algorithms: applications should allow only cryptographically current algorithms that meet their security requirements and be designed for cryptographic agility.

## Examples and further reading

RFC 7520 (the JOSE Cookbook) provides worked examples of JWK, JWS, and JWE, and publishes the example corpus in a machine-readable format at the JOSE cookbook repository.

## References

- RFC 7515: JSON Web Signature (JWS) — https://www.rfc-editor.org/rfc/rfc7515.html
- RFC 7516: JSON Web Encryption (JWE) — https://www.rfc-editor.org/rfc/rfc7516
- RFC 7517: JSON Web Key (JWK) — https://www.rfc-editor.org/rfc/rfc7517
- RFC 7518: JSON Web Algorithms (JWA) — https://www.rfc-editor.org/rfc/rfc7518.html
- RFC 7519: JSON Web Token (JWT) — https://www.rfc-editor.org/rfc/rfc7519.html
- RFC 8725: JSON Web Token Best Current Practices — https://www.rfc-editor.org/rfc/rfc8725
- RFC 7520: JOSE Examples (JOSE Cookbook) — https://www.rfc-editor.org/rfc/rfc7520.html
