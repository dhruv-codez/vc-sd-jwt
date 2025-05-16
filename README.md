# Verifiable Credential SD-JWT Generator

A Node.js API for generating and verifying Verifiable Credentials using the SD-JWT format that enables selective disclosure of credential fields.

## Features

- Generates cryptographically signed Verifiable Credentials with selective disclosure support
- Uses RSA-256 (RS256) for JWT signing with 2048-bit keys
- Implements SHA-256 hashing for credential field disclosures
- Creates salted and hashed disclosures with cryptographically secure random values
- Returns the complete SD-JWT format with encoded disclosures
- Provides web-based verification interface for testing SD-JWT tokens
- Supports EveryCRED credential format with subjectMetaData selective disclosure

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
  "@context": ["https://www.w3.org/ns/credentials/v2", "https://w3id.org/everycred/v1"],
  "type": ["VerifiableCredential", "EveryCREDCredential"],
  "issuer": {
    "id": "did:evrc:issuer:ethereum:78a31b4c-c892-47fd-a9a2-3b96c9cfd68e",
    "profile": "https://credentials.everycred.com/issuer/profiles/1/CertificationforReactJS.json"
  },
  "issuanceDate": "2025-03-15T14:22:31Z",
  "validFrom": "2025-03-15T12:00:00Z",
  "id": "urn:uuid:c982a45d-3f8b-42e7-b4a7-982c536df910",
  "credentialSubject": {
    "id": "did:evrc:subject:b7345ef9-2c1a-4d87-91f5-8e692108c7d3",
    "profile": "https://credentials.everycred.com/subject/profiles/1/ReactJSDeveloperCertification.json",
    "subjectMetaData": {
      "name": "Alex Johnson",
      "email": "alex.johnson@example.com",
      "description": "The above mentioned Developer has demonstrated outstanding skills in React development...",
      "badge_name": "Senior React Developer",
      "score": "94.75%",
      "date": "2025-02-28",
      "about_certification": "Advanced React JS Development"
    }
  },
  "holder": {
    "id": "did:evrc:holder:c4f89d23-9a17-48e5-b38c-75f90e7a6b2c",
    "profile": "https://credentials.everycred.com/holder/profiles/did:evrc:holder:c4f89d23.json"
  }
}
```

**Response:**

```json
{
  "_sd_jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDpldnJjOmlzc3VlcjpldGhlcmV1bTo3OGEzMWI0Yy1jODkyLTQ3ZmQtYTlhMi0zYjk2YzljZmQ2OGUja2V5LTEifQ...[truncated]~WyJhQjRUdVp4NzJOOCIsImRhdGUiLCIyMDI1LTAyLTI4Il0~WyI5cVJYc25qazZiTyIsImFib3V0X2NlcnRpZmljYXRpb24iLCJBZHZhbmNlZCBSZWFjdCBKUyBEZXZlbG9wbWVudCJd~[more disclosures]",
  "_sd": [
    "d3BTVnQ4eGpSZzRUeXd1eUsxZHBCVXc2Z3BFOFMyckpmX1k5c21PUkR5MA",
    "blF1dElGLVdHWGhwcDFuSWVlYlFmT3lZQXNDdWotWDhzZnhoRmtxbEs5UQ",
    "LVlsOTZTelBwVFRCRk5MNXRNZEhvX3I5R1FvbXJ2VVpIWTZiQ1pINU1rTQ",
    "YVJnLVczcEVFQmVVZFBDUUl2ZURyMWRaNEJBaV9sRnVLaVRGOVh3LTdsMA",
    "ZXpYSEpoVGgzR2ZRdWdLX2p0SmJhSENVMWxRS1Z3WXNiWlhOUlpKZnJxbw",
    "cFVXYXplUXUyQTJoSGdQM2doZUdqeXBDNWU2bUVXcUJheV9TVGRacGNpVQ",
    "NUxnNEVqempJcF9McUlOMUJzZUl2VUs5dUlSaWxXV1p5SXdsNnpzeGpQUQ"
  ],
  "_sd_alg": "sha-256"
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
   - Fields within `credentialSubject.subjectMetaData` are extracted for selective disclosure
   - For each field, a random salt is generated using crypto.randomBytes
   - The disclosure triplet `[salt, key, value]` is formed and hashed with SHA-256
   - Hash is stored in `_sd` array within the credential subject
   - The original `subjectMetaData` object is removed from the credential

2. **Verification**:
   - When a disclosure is shared, the verifier hashes it
   - The hash is compared against values in the `_sd` array
   - If the hash matches, the disclosure is verified as part of the original credential

## Credential Structure

The credential structure follows the EveryCRED format:

- Standard W3C Verifiable Credential fields
- Nested issuer, holder, and subject objects with DIDs and profiles
- `subjectMetaData` containing all selectively disclosable credential attributes
- During processing, `subjectMetaData` is replaced with `_sd` and `_sd_alg` properties

## Verification Interface

A browser-based verification page is available at `/verify` where you can:

1. Paste the complete SD-JWT token
2. Provide the public key for signature verification
3. View decoded credentials with headers, payload, and disclosures
4. Verify the authenticity of individual disclosures

The verification interface supports:

- JWT signature verification using Web Crypto API
- Expiration and issuance date validation
- Disclosure hash verification
- Optional skipping of signature verification
- Detailed status reporting for each verification step

## Implementation Details

- **Cryptographic Algorithms**:
  - RSA-256 (RS256) for JWT signing
  - SHA-256 for disclosure hashing
  - Cryptographically secure random generation for salts
  - 2048-bit RSA key pairs for signing

- **Key Management**:
  - RSA key pair (auto-generated on first run)
  - Keys are stored in the `keys/` directory
  - Keys directory is excluded from git via .gitignore

- **SD-JWT Standard**:
  - Uses proper base64url encoding for all components
  - Follows the standard disclosure format
  - Preserves the original credential structure while enabling privacy through selective disclosure

## Testing

To quickly test the API, run:

```bash
node test-api.js
```

This will:

1. Send a sample request to the API with the EveryCRED credential template
2. Display the generated SD-JWT token
3. Show the SD digest array and algorithm used
4. Provide instructions to test in the verification page

## Security Considerations

- Keys are stored in the local filesystem (for production, consider a secure key management system)
- JWT tokens are signed with RSA-256 with 2048-bit keys
- Default expiration is set to 1 year (configurable)
- Uses cryptographically secure random generation for all salts
- Maintains compatibility with standard SD-JWT verifiers
- The verification UI provides detailed error messages for troubleshooting

## Project Structure

```
├── keys/             # Auto-generated directory for cryptographic keys
├── public/           # Web-based verification interface files
│   ├── index.html    # Verification page HTML
│   ├── script.js     # Verification client-side logic
│   └── styles.css    # Verification page styling
├── src/              # Server-side code
│   ├── app.js        # Express server entry point
│   ├── routes/       # API route handlers
│   │   └── vcGenerator.js # VC generation endpoint
│   └── utils/        # Helper utilities
│       ├── keyUtils.js  # Key management functions
│       └── sdUtils.js   # SD-JWT utilities
├── .gitignore        # Git ignore rules (includes keys directory)
├── package.json      # Project dependencies and scripts
├── README.md         # Project documentation
└── test-api.js       # API test script
```
