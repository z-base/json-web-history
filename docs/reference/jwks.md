# JWKS Reference

## Overview

JSON Web Key (JWK) is a JSON object representation of a cryptographic key.
JSON Web Key Set (JWKS) is a JSON object representation of a set of JWKs.
JWKs and JWKS are used to represent keys for use with JSON Web Signature (JWS)
and JSON Web Encryption (JWE).

## JWKS Structure

The JWKS object MUST contain a member named `keys` with a value that is an array
of JWK objects. Each element in the array is a JWK.

Minimal example:

```json
{
  "keys": []
}
```

## References

- RFC 7517: JSON Web Key (JWK)
  https://www.rfc-editor.org/rfc/rfc7517
