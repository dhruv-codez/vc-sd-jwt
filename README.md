# Verifiable Credential SD-JWT Generator

A production-ready Node.js API for generating Verifiable Credentials using the SD-JWT format that enables selective disclosure of credential fields.

## Features

- Generates cryptographically signed Verifiable Credentials with selective disclosure support
- Uses RSA-256 (RS256) for secure JWT signing with 2048-bit keys
- Implements SHA-256 hashing for credential field disclosures
- Creates salted and hashed disclosures with cryptographically secure random values
- Returns the complete SD-JWT format with encoded disclosures
- Provides web-based verification interface for testing SD-JWT tokens
- Supports EveryCRED credential format with subjectMetaData selective disclosure
- Preserves the full credential structure while enabling privacy-preserving disclosures

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

**Request Body (New Format):**

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2", "https://w3id.org/everycred/v1"],
  "type": ["VerifiableCredential", "EveryCREDCredential"],
  "issuer": {
    "id": "did:evrc:issuer:polygon:f5fd0bfb-f2dd-4a5a-b4b5-e59b6c18fe79",
    "profile": "https://fractal.everycred.com/issuer/profiles/1/CertificationforLaravel.json"
  },
  "issuanceDate": "2024-12-09T09:39:09Z",
  "validFrom": "2024-12-09T06:45:00Z",
  "id": "urn:uuid:e74652ef-fc1d-4e78-89d5-c47772082c46",
  "credentialSubject": {
    "id": "did:evrc:subject:a9400321-df3b-4773-ae68-34d079a0ccd1",
    "profile": "https://fractal.everycred.com/subject/profiles/1/LaravelDeveloperCertification.json",
    "subjectMetaData": {
      "name": "Ruchit Patel",
      "email": "ruchit.patel@viitor.cloud",
      "description": "The above mentioned Developer has demonstrated their expertise...",
      "badge_name": "Senior Laravel Developer",
      "score": "91.10%",
      "date": "2024-09-27",
      "about_certification": "Senior Laravel Developer"
    }
  },
  "holder": {
    "id": "did:evrc:holder:b9ed7456-6298-47f6-96d0-6986d847a15a",
    "profile": "https://fractal.everycred.com/holder/profiles/did:evrc:holder:b9ed7456.json"
  }
}
```

**Response (New Format):**

```json
{
  "_sd_jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDpldnJjOmlzc3Vlcjpwb2x5Z29uOmY1ZmQwYmZiLWYyZGQtNGE1YS1iNGI1LWU1OWI2YzE4ZmU3OSNrZXktMSJ9.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3czaWQub3JnL2V2ZXJ5Y3JlZC92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiRXZlcnlDUkVEQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOnsiaWQiOiJkaWQ6ZXZyYzppc3N1ZXI6cG9seWdvbjpmNWZkMGJmYi1mMmRkLTRhNWEtYjRiNS1lNTliNmMxOGZlNzkiLCJwcm9maWxlIjoiaHR0cHM6Ly9mcmFjdGFsLmV2ZXJ5Y3JlZC5jb20vaXNzdWVyL3Byb2ZpbGVzLzEvQ2VydGlmaWNhdGlvbmZvckxhcmF2ZWwuanNvbiJ9LCJpc3N1YW5jZURhdGUiOiIyMDI0LTEyLTA5VDA5OjM5OjA5WiIsInZhbGlkRnJvbSI6IjIwMjQtMTItMDlUMDY6NDU6MDBaIiwiaWQiOiJ1cm46dXVpZDplNzQ2NTJlZi1mYzFkLTRlNzgtODlkNS1jNDc3NzIwODJjNDYiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpldnJjOnN1YmplY3Q6YTk0MDAzMjEtZGYzYi00NzczLWFlNjgtMzRkMDc5YTBjY2QxIiwicHJvZmlsZSI6Imh0dHBzOi8vZnJhY3RhbC5ldmVyeWNyZWQuY29tL3N1YmplY3QvcHJvZmlsZXMvMS9MYXJhdmVsRGV2ZWxvcGVyQ2VydGlmaWNhdGlvbi5qc29uIiwiX3NkIjpbIlYyUVZxeGMyU2c3MHR0bDRrVjRkRkQyNWtTcUdKY2JDNnlYMk51eGdBVGMiLCJmQWhBY2xiM2dLb09rWmNtczF3bWtKQ0h5TzZVZ3BJN0FTWH...JdLCJfc2RfYWxnIjoic2hhLTI1NiJ9LCJob2xkZXIiOnsiaWQiOiJkaWQ6ZXZyYzpob2xkZXI6YjllZDc0NTYtNjI5OC00N2Y2LTk2ZDAtNjk4NmQ4NDdhMTVhIiwicHJvZmlsZSI6Imh0dHBzOi8vZnJhY3RhbC5ldmVyeWNyZWQuY29tL2hvbGRlci9wcm9maWxlcy9kaWQ6ZXZyYzpob2xkZXI6YjllZDc0NTYuanNvbiJ9LCJleHAiOjE4MDkzODM1NDl9.aGVyZSBpcyBhIGZha2Ugc2lnbmF0dXJlIGZvciBleGFtcGxlIHB1cnBvc2Vz~WyJsSk84UEtuajBKZyIsImRhdGUiLCIyMDI0LTA5LTI3Il0~WyJ4UDJZMEVwTWh3NCIsImFib3V0X2NlcnRpZmljYXRpb24iLCJTZW5pb3IgTGFyYXZlbCBEZXZlbG9wZXIiXQ~WyJJT3c2XzVYaHlaZyIsIm5hbWUiLCJSdWNoaXQgUGF0ZWwiXQ~WyIyWFVyRkpTckdFMCIsImVtYWlsIiwicnVjaGl0LnBhdGVsQHZpaXRvci5jbG91ZCJd",
  "_sd": [
    "V2QVqxc2Sg70ttl4kV4dFD25kSqGJcbC6yX2NuxgATc",
    "fAhAclb3gKoOkZcms1wmkJCHyO6UgpI7ASXxAOvP3tU",
    "uMYiQcpc7DP819RW6IF_UjAmh5TW2etW5NuhilLClNg",
    "9H_sHyBL37uy8AmTM-w41XsSYTrk51SXGyFMlC_LPHY",
    "e24UwF-R51sMMEHQx6GxnrxP83NqA0K-AUFQNZWQHeI",
    "ZlkQJqcYM1tCGYvU9V84FQ8C9dxdQeZiS-BMKX_Aars",
    "WqF78DykXMRDzzfZZKEJbwzktnsf-RdsWOIR-nxB-2A"
  ],
  "_sd_alg": "sha-256",
  "disclosures": [
    ["IOw6_5XhyZg", "name", "Ruchit Patel"],
    ["2XUrFJSrGE0", "email", "ruchit.patel@viitor.cloud"],
    ["5HegKy8XwJM", "description", "The above mentioned Developer has demonstrated their expertise..."],
    ["g-F6aYyo0Eg", "badge_name", "Senior Laravel Developer"],
    ["j0jNMMFbCZo", "score", "91.10%"],
    ["lJO8PKnj0Jg", "date", "2024-09-27"],
    ["xP2Y0EpMhw4", "about_certification", "Senior Laravel Developer"]
  ],
  "encodedDisclosures": [
    "WyJJT3c2XzVYaHlaZyIsIm5hbWUiLCJSdWNoaXQgUGF0ZWwiXQ",
    "WyIyWFVyRkpTckdFMCIsImVtYWlsIiwicnVjaGl0LnBhdGVsQHZpaXRvci5jbG91ZCJd",
    "WyI1SGVnS3k4WHdKTSIsImRlc2NyaXB0aW9uIiwiVGhlIGFib3ZlIG1lbnRpb25lZCBEZXZlbG9wZXIgaGFzIGRlbW9uc3RyYXRlZCB0aGVpciBleHBlcnRpc2UuLi4iXQ",
    "WyJnLUY2YVl5bzBFZyIsImJhZGdlX25hbWUiLCJTZW5pb3IgTGFyYXZlbCBEZXZlbG9wZXIiXQ",
    "WyJqMGpOTU1GYkNabyIsInNjb3JlIiwiOTEuMTAlIl0",
    "WyJsSk84UEtuajBKZyIsImRhdGUiLCIyMDI0LTA5LTI3Il0",
    "WyJ4UDJZMEVwTWh3NCIsImFib3V0X2NlcnRpZmljYXRpb24iLCJTZW5pb3IgTGFyYXZlbCBEZXZlbG9wZXIiXQ"
  ]
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
   - For each field, a random salt is generated
   - The disclosure triplet `[salt, key, value]` is formed and hashed
   - Hash is stored in `_sd` array within the credential subject
   - The original `subjectMetaData` object is removed from the credential

2. **Verification**:
   - When a disclosure is shared, the verifier hashes it
   - The hash is compared against values in the `_sd` array
   - If the hash matches, the disclosure is verified as part of the original credential

## Credential Structure

The new credential structure follows the EveryCRED format:

- Standard W3C Verifiable Credential fields
- Nested issuer, holder, and subject objects with DIDs and profiles
- `subjectMetaData` containing all selectively disclosable credential attributes
- During processing, `subjectMetaData` is replaced with `_sd` and `_sd_alg` properties

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
- Provides selective disclosure for enhanced privacy
- Uses cryptographically secure random generation for all salts
- Maintains compatibility with standard SD-JWT verifiers
