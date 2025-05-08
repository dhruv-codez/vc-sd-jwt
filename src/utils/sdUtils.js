const crypto = require("crypto");

/**
 * Base64url encode a buffer or string
 */
function base64urlEncode(input) {
  if (typeof input === 'string') {
    input = Buffer.from(input);
  }
  return input.toString("base64url");
}

/**
 * Generate a random salt for disclosure
 */
function generateSalt(length = 8) {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * Hash a disclosure using SHA-256
 */
function hashDisclosure(disclosure) {
  const jsonStr = JSON.stringify(disclosure);
  const hash = crypto.createHash("sha256").update(jsonStr).digest();
  return base64urlEncode(hash);
}

/**
 * Generate disclosures for credential fields
 */
function generateDisclosures(fields) {
  const _sd = [];
  const disclosures = [];
  const encodedDisclosures = [];

  for (const [key, value] of Object.entries(fields)) {
    // Skip the 'id' field since it should not be selectively disclosed
    if (key === 'id') continue;

    const salt = generateSalt();
    const disclosure = [salt, key, value];

    // Store the original disclosure array
    disclosures.push(disclosure);

    // Create the base64url encoded version
    const encodedDisclosure = base64urlEncode(JSON.stringify(disclosure));
    encodedDisclosures.push(encodedDisclosure);

    // Hash the disclosure for the _sd field
    _sd.push(hashDisclosure(disclosure));
  }

  return { _sd, disclosures, encodedDisclosures };
}

/**
 * Format disclosures for inclusion in the SD-JWT
 */
function formatSdJwtWithDisclosures(jwt, encodedDisclosures) {
  // Format: <JWT>~<disclosure>~<disclosure>~...
  return [jwt, ...encodedDisclosures].join('~');
}

module.exports = {
  generateDisclosures,
  formatSdJwtWithDisclosures,
  base64urlEncode
};