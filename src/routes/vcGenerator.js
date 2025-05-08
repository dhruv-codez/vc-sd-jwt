const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { generateDisclosures, formatSdJwtWithDisclosures } = require("../utils/sdUtils");
const { getKeyPair } = require("../utils/keyUtils");

// Get signing keys on startup
const { privateKey, publicKey } = getKeyPair();

router.post("/generate-vc", (req, res) => {
  try {
    // Validate request
    const { credentialSubject, issuer, holder } = req.body;
    if (!credentialSubject) {
      return res.status(400).json({ error: "Missing credentialSubject fields" });
    }

    // Set default values or use from request
    const issuerId = issuer || "did:example:issuer123";
    const holderId = holder || "did:example:holder456";

    // Add id to credentialSubject if not present
    const subjectWithId = {
      ...credentialSubject,
      id: credentialSubject.id || holderId
    };

    // Generate disclosures for all fields except 'id'
    const { _sd, disclosures, encodedDisclosures } = generateDisclosures(subjectWithId);

    // Create the VC payload
    const vcPayload = {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://w3id.org/security/suites/jws-2020/v1"
      ],
      type: ["VerifiableCredential"],
      issuer: issuerId,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: holderId,
        _sd,
        _sd_alg: "sha-256"
      }
    };

    // Define JWT header
    const header = {
      alg: "RS256",
      typ: "JWT",
      kid: `${issuerId}#key-1`
    };

    // Sign the JWT (VC payload) with the privateKey
    const signedJwt = jwt.sign(vcPayload, privateKey, {
      algorithm: 'RS256',
      header,
      expiresIn: '1y'  // Set expiration to 1 year
    });

    // Format the complete SD-JWT with disclosures
    const sdJwt = formatSdJwtWithDisclosures(signedJwt, encodedDisclosures);

    // Return VC, disclosures and verification info
    res.json({
      sd_jwt: sdJwt,
      vc: vcPayload,
      disclosures,
      verification: {
        issuer: issuerId,
        publicKey: publicKey,
        format: "SD-JWT format: <JWT>~<disclosure>~<disclosure>~..."
      }
    });
  } catch (error) {
    console.error("VC Generation error:", error);
    res.status(500).json({ error: "Failed to generate VC", message: error.message });
  }
});

module.exports = router;