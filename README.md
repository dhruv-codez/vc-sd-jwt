# Verifiable Credential SD-JWT Generator

A production-ready Node.js API for generating Verifiable Credentials using the SD-JWT format that enables selective disclosure of credential fields.

## Features

- Generates cryptographically signed Verifiable Credentials with selective disclosure support
- Uses RSA-256 (RS256) for secure JWT signing with 2048-bit keys
- Implements SHA-256 hashing for credential field disclosures
- Creates salted and hashed disclosures with cryptographically secure random values
- Returns the complete SD-JWT format with encoded disclosures
- Provides web-based verification interface for testing SD-JWT tokens
- Allows customization of issuer and holder identifiers

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-restart
npm run dev
```

## API Usage

### Generate a Verifiable Credential

**Endpoint:** `POST /api/generate-vc`

**Request Body:**

```json
{
  "credentialSubject": {
    "name": "Ruchit Patel",
    "email": "ruchit.patel@viitor.cloud",
    "score": "91.10%",
    "employeeId": "EMP123456",
    "department": "Engineering"
  },
  "issuer": "did:example:viitorcloud",
  "holder": "did:example:ruchit"
}
```

**Response:**

```json
{
  "sd_jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDpleGFtcGxlOnZpaXRvcmNsb3VkI2tleS0xIn0.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3czaWQub3JnL3NlY3VyaXR5L3N1aXRlcy9qd3MtMjAyMC92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6ImRpZDpleGFtcGxlOnZpaXRvcmNsb3VkIiwiaXNzdWFuY2VEYXRlIjoiMjAyMy0xMC0yNVQxMDozNToyMS4zOTRaIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJkaWQ6ZXhhbXBsZTpydWNoaXQiLCJfc2QiOlsiWVlYc1JuUGlITWNUZUNpN20xM1hUU3pQa0dsVHJNRjFQNTVOWEhWSkQwayIsIjkxaTF2bUxNcVhSV04zSlJUbTlYZlZrNExRLWNGTzFBbmxGME9YYm02N1EiLCJBWkc1TlNJckFoTHVPNmVjNk42eE80WnpkWVRYTDNrM1hTcGxKUGJHLU8wIiwiakZCbDIzNDEyZVVKV0dZIiwiYXpyaHJtYXhqa1VCSCJdLCJfc2RfYWxnIjoic2hhLTI1NiJ9LCJleHAiOjE3MjkzNjAxMjF9.Rkqpw1lXnvGtfzBl1qJ8qOBxeCqSIjw38vxuRbJ-9aWQ5TG_aKa-nz-JzLQ~WyJ5NGlHVno0eE85IiwibmFtZSIsIlJ1Y2hpdCBQYXRlbCJd~WyJwWlRHOC1qX1lBIiwiZW1haWwiLCJydWNoaXQucGF0ZWxAdmlpdG9yLmNsb3VkIl0~WyJqRkI4NVVKV0dZIiwic2NvcmUiLCI5MS4xMCUiXQ~WyJpbmxrYW1zNUg0MiIsImVtcGxveWVlSWQiLCJFTVAxMjM0NTYiXQ~WyI0OEtodE50ck01ZSIsImRlcGFydG1lbnQiLCJFbmdpbmVlcmluZyJd",

  "vc": {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://w3id.org/security/suites/jws-2020/v1"
    ],
    "type": ["VerifiableCredential"],
    "issuer": "did:example:viitorcloud",
    "issuanceDate": "2023-10-25T10:35:21.394Z",
    "credentialSubject": {
      "id": "did:example:ruchit",
      "_sd": [
        "YYXsRnPiHMcTeCi7m13XTSzPkGlTrMF1P55NXHVJD0k",
        "91i1vmLMqXRWN3JRTm9XfVk4LQ-cFO1AnlF0OXbm67Q",
        "AZG5NSIrAhLuO6ec6N6xO4ZzdYTXL3k3XSplJPbG-O0",
        "jFBl23412eUJWGY",
        "azrhrmaxjkUBH"
      ],
      "_sd_alg": "sha-256"
    }
  },

  "disclosures": [
    ["y4iGVz4xO9", "name", "Ruchit Patel"],
    ["pZTG8-j_YA", "email", "ruchit.patel@viitor.cloud"],
    ["jFB85UJWGY", "score", "91.10%"],
    ["inlkams5H42", "employeeId", "EMP123456"],
    ["48KhtNtrM5e", "department", "Engineering"]
  ],

  "verification": {
    "issuer": "did:example:viitorcloud",
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BA...",
    "format": "SD-JWT format: <JWT>~<disclosure>~<disclosure>~..."
  }
}
```

## SD-JWT Format

The SD-JWT format combines a JWT with encoded disclosures following the specification:

```
<JWT>~<disclosure>~<disclosure>~...
```

Where:
- `<JWT>` is a standard JWT signed token containing the `_sd` and `_sd_alg` fields
- Each `<disclosure>` is a base64url-encoded JSON array: `[salt, claim_name, claim_value]`
- The `_sd` array contains SHA-256 hashes of each disclosure JSON representation
- Each disclosure hash is used to verify authenticity during selective sharing

## Selective Disclosure Process

1. **Disclosure Creation**:
   - For each credential field, a random salt is generated
   - The disclosure triplet `[salt, key, value]` is formed and hashed
   - Hash is stored in `_sd` array within the credential

2. **Verification**:
   - When a disclosure is shared, the verifier hashes it
   - The hash is compared against values in the `_sd` array
   - If the hash matches, the disclosure is verified as part of the original credential

## Verification

A browser-based verification page is available at `/verify` where you can:
1. Paste the complete SD-JWT token
2. Provide the public key (optional for format verification)
3. View decoded credentials with headers, payload, and disclosures

## Implementation Details

- **Cryptographic Algorithms**:
  - RSA-256 (RS256) for JWT signing
  - SHA-256 for disclosure hashing
  - Cryptographically secure random generation for salts
  - 2048-bit RSA key pairs for signing

- **Key Management**:
  - RSA key pair (auto-generated on first run)
  - Keys are stored in the `keys/` directory
  - Public key is provided with responses for verification

- **SD-JWT Standard**:
  - Implements the [SD-JWT specification](https://www.ietf.org/archive/id/draft-fett-selective-disclosure-jwt-00.html)
  - Uses proper base64url encoding for all components
  - Follows the standard disclosure format

## Testing

To quickly test the API, run:

```bash
node test-api.js
```

This will:
1. Send a sample request to the API
2. Display the generated SD-JWT token
3. Show the disclosures and verification info
4. Provide instructions to test in the verification page

## Security Considerations

- Keys are stored in the local filesystem (for production, consider a secure key management system)
- JWT tokens are signed with RSA-256 with 2048-bit keys
- Default expiration is set to 1 year (configurable)
- Provides selective disclosure for enhanced privacy
- Uses cryptographically secure random generation for all salts
