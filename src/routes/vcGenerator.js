const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { generateDisclosures, formatSdJwtWithDisclosures } = require("../utils/sdUtils");
const { getKeyPair } = require("../utils/keyUtils");

// Get signing keys on startup
const { privateKey } = getKeyPair();

router.post("/generate-vc", (req, res) => {
  try {
    // Validate request with new format
    const vcTemplate = req.body;

    if (!vcTemplate.credentialSubject?.subjectMetaData) {
      return res.status(400).json({ error: "Missing credentialSubject.subjectMetaData fields" });
    }

    // Extract subjectMetaData for selective disclosure
    const subjectMetaData = vcTemplate.credentialSubject.subjectMetaData;

    // Generate disclosures for all fields in subjectMetaData
    const { _sd, disclosures, encodedDisclosures } = generateDisclosures(subjectMetaData);

    // Create a deep copy of the original template
    const vcPayload = JSON.parse(JSON.stringify(vcTemplate));

    // Remove the original subjectMetaData and replace with _sd fields
    delete vcPayload.credentialSubject.subjectMetaData;
    vcPayload.credentialSubject._sd = _sd;
    vcPayload.credentialSubject._sd_alg = "sha-256";

    // Define JWT header with issuer's DID as kid
    const header = {
      alg: "RS256",
      typ: "JWT",
      kid: `${vcPayload.issuer.id}#key-1`
    };

    // Sign the JWT with the privateKey
    const signedJwt = jwt.sign(vcPayload, privateKey, {
      algorithm: 'RS256',
      header,
      expiresIn: '1y'  // Set expiration to 1 year
    });

    // Format the complete SD-JWT with disclosures
    const sdJwt = formatSdJwtWithDisclosures(signedJwt, encodedDisclosures);

    // Return the new response format
    res.json({
      _sd_jwt: sdJwt,
      _sd: _sd,
      _sd_alg: "sha-256",
      disclosures: disclosures,
      encodedDisclosures: encodedDisclosures
    });

  } catch (error) {
    console.error("VC Generation error:", error);
    res.status(500).json({ error: "Failed to generate VC", message: error.message });
  }
});

module.exports = router;