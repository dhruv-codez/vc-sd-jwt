/**
 * Polyfills for atob and btoa for older browsers
 */
(function () {
    // Polyfill for atob and btoa
    if (typeof window !== 'undefined' && !window.atob) {
        window.atob = function (b64) {
            return Buffer.from(b64, 'base64').toString('binary');
        };
    }

    if (typeof window !== 'undefined' && !window.btoa) {
        window.btoa = function (str) {
            return Buffer.from(str, 'binary').toString('base64');
        };
    }
})();

/**
 * Base64URL decode function with fallback and sanitization
 * @param {string} input - Base64url encoded string
 * @returns {string} Decoded string
 */
function base64UrlDecode(input) {
    // Handle empty or null input
    if (!input) {
        throw new Error('Empty input to decode');
    }

    try {
        // Sanitize input - strip any non-base64url chars
        input = input.replace(/[^A-Za-z0-9\-_]/g, '');

        // Replace non-url compatible chars with base64 standard chars
        input = input.replace(/-/g, '+').replace(/_/g, '/');

        // Pad with '=' if needed
        const pad = input.length % 4;
        if (pad) {
            input += '='.repeat(4 - pad);
        }

        // Decode
        const base64 = atob(input);
        return base64;
    } catch (e) {
        console.error("Base64 decoding error:", e, "for input:", input);

        // Fallback approach for malformed input
        try {
            // Try decoding smaller chunks to avoid potential corruption
            let validInput = '';

            // Process 4 chars at a time (base64 uses 4-char groups)
            for (let i = 0; i < input.length; i += 4) {
                const chunk = input.slice(i, i + 4);
                try {
                    // Test if this chunk can be decoded
                    atob(chunk);
                    validInput += chunk;
                } catch (chunkErr) {
                    // Skip invalid chunks
                    console.warn("Skipping invalid base64 chunk:", chunk, chunkErr.message);
                }
            }

            // If we have any valid input, try to decode it
            if (validInput) {
                return atob(validInput);
            }

            throw new Error('Failed to recover from malformed base64');
        } catch (fallbackErr) {
            // If all recovery attempts fail, throw a clear error
            throw new Error('Invalid base64url format: ' + fallbackErr.message);
        }
    }
}

/**
 * SHA-256 hash function
 * @param {string} message - Message to hash
 * @returns {Promise<string>} Base64url encoded hash
 */
async function sha256(message) {
    // Encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // Hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // Convert to base64url
    return base64UrlEncode(new Uint8Array(hashBuffer));
}

/**
 * Base64URL encode function
 * @param {Uint8Array} input - Byte array to encode
 * @returns {string} Base64url encoded string
 */
function base64UrlEncode(input) {
    const bytes = new Uint8Array(input);
    const base64 = btoa(String.fromCharCode(...bytes));

    // Convert to base64url
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL encode a string
 * @param {string} str - String to encode
 * @returns {string} Base64url encoded string
 */
function strToBase64Url(str) {
    return base64UrlEncode(new TextEncoder().encode(str));
}

/**
 * Import a public key from PEM format
 * @param {string} pemKey - Public key in PEM format
 * @returns {Promise<CryptoKey>} Imported public key
 */
async function importPublicKey(pemKey) {
    if (!pemKey || pemKey.trim() === '') {
        console.error("❌ Empty public key provided");
        throw new Error('Public key is required for signature verification');
    }

    try {
        // Normalize line endings and remove whitespace
        let formattedKey = pemKey.replace(/\r\n/g, '\n').trim();

        // Check for PEM format
        if (!formattedKey.includes('-----BEGIN PUBLIC KEY-----')) {
            console.warn("⚠️ Public key doesn't have standard BEGIN marker");
            // Try to add PEM wrapper if missing
            if (!formattedKey.includes('-----BEGIN')) {
                formattedKey = `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
            } else {
                console.error("❌ Unsupported key format detected");
                throw new Error('Unsupported key format. Please provide a PEM formatted RSA public key.');
            }
        }

        // Extract the base64 part
        const matches = formattedKey.match(/-----BEGIN PUBLIC KEY-----\s*([\s\S]*?)\s*-----END PUBLIC KEY-----/);
        if (!matches || !matches[1]) {
            console.error("❌ Failed to extract key data from PEM format");
            throw new Error('Invalid PEM format');
        }

        // Get the base64 encoded key and remove all whitespace
        const pemContents = matches[1].replace(/\s+/g, '');

        // Decode the base64 key to get the DER format
        let binaryDer;
        try {
            binaryDer = atob(pemContents);
        } catch (e) {
            console.error("❌ Base64 decoding error in key:", e);
            throw new Error(`Failed to decode key: ${e.message}`);
        }

        const derBytes = new Uint8Array(binaryDer.length);
        for (let i = 0; i < binaryDer.length; i++) {
            derBytes[i] = binaryDer.charCodeAt(i);
        }

        // Import the key using Web Crypto API
        try {
            const cryptoKey = await crypto.subtle.importKey(
                'spki',
                derBytes,
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: { name: 'SHA-256' }
                },
                false,
                ['verify']
            );

            return cryptoKey;
        } catch (e) {
            console.error("❌ Error importing key with Web Crypto API:", e);
            throw new Error(`Failed to import key: ${e.message}`);
        }
    } catch (e) {
        console.error("❌ Error processing public key:", e);
        throw new Error(`Public key error: ${e.message}`);
    }
}

/**
 * Function to safely format and display token info
 * @param {HTMLElement} elem - Element to display in
 * @param {any} data - Data to display
 */
function displayTokenInfo(elem, data) {
    try {
        elem.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
        console.error("Error displaying token info:", e);
        elem.textContent = "Error displaying token information: " + e.message;
    }
}

/**
 * Parse the JWT token into header, payload and signature
 * @param {string} jwt - JWT token string
 * @returns {Object} Object containing header, payload, signature and parsing status
 */
function parseJwtToken(jwt) {
    let header = null;
    let payload = null;
    let jwtParts = [];
    let headerB64 = '';
    let payloadB64 = '';
    let signatureB64 = '';

    try {
        // Split JWT into parts
        jwtParts = jwt.split('.');
        if (jwtParts.length !== 3) {
            throw new Error("Invalid JWT format: must have header, payload, and signature parts");
        }

        [headerB64, payloadB64, signatureB64] = jwtParts;

        if (!headerB64 || !payloadB64) {
            throw new Error("Invalid JWT format: missing parts");
        }

        // Decode header
        try {
            header = JSON.parse(base64UrlDecode(headerB64));
        } catch (e) {
            throw new Error("Failed to parse JWT header: " + e.message);
        }

        // Decode payload
        try {
            payload = JSON.parse(base64UrlDecode(payloadB64));
        } catch (e) {
            throw new Error("Failed to parse JWT payload: " + e.message);
        }

        return { header, payload, manualParsingMode: false, headerB64, payloadB64, signatureB64 };
    } catch (jwtParseError) {
        console.error("JWT parsing failed, attempting manual extraction:", jwtParseError);

        // Return partial parsing results with a flag that we're in manual mode
        return {
            header: header || { error: "Could not parse header" },
            payload: payload || { error: "Could not parse payload" },
            headerB64,
            payloadB64,
            signatureB64,
            manualParsingMode: true,
            originalError: jwtParseError.message,
            jwt: jwt.substring(0, 100) + "...[truncated]"
        };
    }
}

/**
 * Parse disclosures into JSON objects
 * @param {Array} disclosures - Array of disclosure strings
 * @returns {Array} Array of parsed disclosure objects
 */
function parseDisclosures(disclosures) {
    const parsedDisclosures = [];
    for (const d of disclosures) {
        try {
            const decoded = base64UrlDecode(d);
            const parsed = JSON.parse(decoded);
            parsedDisclosures.push(parsed);
        } catch (e) {
            console.error("Error parsing disclosure:", e);
            parsedDisclosures.push({
                error: "Invalid disclosure format",
                raw: d,
                message: e.message
            });
        }
    }
    return parsedDisclosures;
}

/**
 * Check token expiration
 * @param {Object} payload - JWT payload
 * @returns {Object} Expiration verification result
 */
function checkExpiration(payload) {
    const now = Math.floor(Date.now() / 1000);
    const expValid = !payload.exp || payload.exp > now;
    let message;

    if (!payload.exp) {
        message = "No expiration set";
    } else if (expValid) {
        message = `Valid until ${new Date(payload.exp * 1000).toLocaleString()}`;
    } else {
        message = `Expired on ${new Date(payload.exp * 1000).toLocaleString()}`;
    }

    return {
        name: "Expiration",
        status: expValid,
        message
    };
}

/**
 * Check issuance date
 * @param {Object} payload - JWT payload
 * @returns {Object} Issuance date verification result and validity status
 */
function checkIssuanceDate(payload) {
    const now = Math.floor(Date.now() / 1000);

    if (payload.issuanceDate) {
        const issuanceDate = new Date(payload.issuanceDate);
        const issuanceDateValid = !isNaN(issuanceDate.getTime()) && issuanceDate <= new Date();
        const message = issuanceDateValid
            ? `Issued on ${issuanceDate.toLocaleString()}`
            : `Invalid: issued in the future (${issuanceDate.toLocaleString()})`;

        return {
            result: {
                name: "Issuance Date",
                status: issuanceDateValid,
                message
            },
            valid: issuanceDateValid
        };
    }

    if (payload.iat) {
        const iatValid = payload.iat <= now;
        const message = iatValid
            ? `Issued on ${new Date(payload.iat * 1000).toLocaleString()}`
            : `Invalid: issued in the future (${new Date(payload.iat * 1000).toLocaleString()})`;

        return {
            result: {
                name: "Issuance Date",
                status: iatValid,
                message
            },
            valid: iatValid
        };
    }

    // No issuance date information
    return {
        result: {
            name: "Issuance Date",
            status: true,
            message: "No issuance date set"
        },
        valid: true
    };
}

/**
 * Check SD-JWT structure
 * @param {Object} payload - JWT payload
 * @returns {Object} SD-JWT structure verification result and credentialSubject
 */
function checkSdJwtStructure(payload) {
    const credentialSubject = payload.credentialSubject || {};
    const sdArrayValid = Array.isArray(credentialSubject._sd);

    return {
        result: {
            name: "SD-JWT Structure",
            status: sdArrayValid,
            message: sdArrayValid ? "Valid _sd array found" : "Missing or invalid _sd array"
        },
        sdArrayValid,
        credentialSubject
    };
}

/**
 * Perform verification checks on the parsed JWT and disclosures
 * @param {string} jwt - Full JWT token string
 * @param {Object} payload - JWT payload
 * @param {Array} parsedDisclosures - Parsed disclosures
 * @param {boolean} manualParsingMode - Whether manual parsing mode was used
 * @param {string} publicKey - Public key in PEM format for signature verification
 * @returns {Object} Verification results and overall status
 */
async function performVerificationChecks(jwt, payload, parsedDisclosures, manualParsingMode, publicKey) {
    const verificationResults = [];
    let overallVerification = !manualParsingMode; // Start with false if in manual mode

    // 1. Check JWT format
    verificationResults.push({
        name: "JWT Format",
        status: !manualParsingMode,
        message: manualParsingMode
            ? "Invalid JWT format - displaying token in fallback mode"
            : "Valid JWT format"
    });

    if (manualParsingMode) {
        return { verificationResults, overallVerification, earlyExit: true };
    }

    // 2. Verify signature if public key is provided
    if (publicKey && publicKey.trim() !== '') {
        const signatureResult = await verifyWithWebCrypto(jwt, publicKey);

        verificationResults.push({
            name: "Signature",
            status: signatureResult.status,
            message: signatureResult.message
        });

        // Only update overall verification if we got a definitive result (not null)
        if (signatureResult.status !== null) {
            overallVerification = overallVerification && signatureResult.status;
        }
    } else {
        // No public key provided
        verificationResults.push({
            name: "Signature",
            status: null,
            message: "No public key provided for signature verification"
        });
    }

    // 3. Check token expiration
    const expirationResult = checkExpiration(payload);
    verificationResults.push(expirationResult);
    overallVerification = overallVerification && expirationResult.status;

    // 4. Check issuance date
    const { result: issuanceDateResult, valid: issuanceDateValid } = checkIssuanceDate(payload);
    verificationResults.push(issuanceDateResult);
    overallVerification = overallVerification && issuanceDateValid;

    // 5. Check SD-JWT structure
    const { result: sdJwtResult, sdArrayValid, credentialSubject } = checkSdJwtStructure(payload);
    verificationResults.push(sdJwtResult);
    overallVerification = overallVerification && sdArrayValid;

    // 6. Verify disclosures hash against _sd array (if structure is valid)
    let disclosureVerifications = [];
    if (sdArrayValid && parsedDisclosures.length > 0) {
        disclosureVerifications = await verifyDisclosures(parsedDisclosures, credentialSubject);

        // Check if all disclosures are valid
        const allDisclosuresValid = disclosureVerifications.every(d => d.status);

        verificationResults.push({
            name: "Disclosures",
            status: allDisclosuresValid,
            message: allDisclosuresValid
                ? "All disclosures verified"
                : "Some disclosures failed verification"
        });

        overallVerification = overallVerification && allDisclosuresValid;
    }

    return {
        verificationResults,
        overallVerification,
        earlyExit: false,
        disclosureVerifications
    };
}

/**
 * Verify individual disclosures against the _sd array
 * @param {Array} parsedDisclosures - Parsed disclosure objects
 * @param {Object} credentialSubject - Credential subject from JWT payload
 * @returns {Array} Array of disclosure verification results
 */
async function verifyDisclosures(parsedDisclosures, credentialSubject) {
    const sdArray = credentialSubject._sd;
    const disclosureVerifications = [];

    for (const disclosure of parsedDisclosures) {
        if (disclosure.error) {
            disclosureVerifications.push({
                name: disclosure.raw,
                claim: "Error",
                value: "Error",
                status: false,
                message: "Invalid disclosure format"
            });
            continue;
        }

        try {
            // Calculate hash of the disclosure
            const disclosureJson = JSON.stringify(disclosure);
            const disclosureHash = await sha256(disclosureJson);

            // Check if the hash is in the _sd array
            const verified = sdArray.includes(disclosureHash);

            disclosureVerifications.push({
                name: disclosure[1], // claim name
                claim: disclosure[1],
                value: disclosure[2],
                status: verified,
                message: verified
                    ? "Verified - hash matches _sd array"
                    : "Not verified - hash not found in _sd array"
            });
        } catch (e) {
            console.error("Disclosure verification error:", e);
            disclosureVerifications.push({
                name: disclosure[1] || "Unknown",
                claim: disclosure[1] || "Unknown",
                value: disclosure[2] || "Unknown",
                status: false,
                message: "Disclosure verification error: " + e.message
            });
        }
    }

    return disclosureVerifications;
}

/**
 * Display verification results in the UI
 * @param {Array} verificationResults - Verification results array
 * @param {Element} verificationDetailsList - Element to display verification details
 */
function displayVerificationResults(verificationResults, verificationDetailsList) {
    verificationResults.forEach(result => {
        const resultRow = document.createElement('div');
        resultRow.className = 'detail-row';

        let statusIcon = '';
        if (result.status === true) {
            statusIcon = '<span class="status-icon" style="color: #27ae60;">✓</span>';
        } else if (result.status === false) {
            statusIcon = '<span class="status-icon" style="color: #e74c3c;">✗</span>';
        } else {
            statusIcon = '<span class="status-icon" style="color: #f39c12;">?</span>';
        }

        resultRow.innerHTML = `
            <div class="detail-label">${statusIcon} ${result.name}:</div>
            <div>${result.message}</div>
        `;
        verificationDetailsList.appendChild(resultRow);
    });
}

/**
 * Display disclosure verification results in a table
 * @param {Array} disclosureVerifications - Disclosure verification results
 * @param {Element} disclosureTableBody - Table body element to display results
 */
function displayDisclosureTable(disclosureVerifications, disclosureTableBody) {
    disclosureVerifications.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${d.claim}</td>
            <td>${d.value}</td>
            <td>${d.status
                ? '<span class="status-icon" style="color: #27ae60;">✓</span> Verified'
                : '<span class="status-icon" style="color: #e74c3c;">✗</span> Not verified'}</td>
        `;
        disclosureTableBody.appendChild(row);
    });
}

/**
 * Add this function to properly extract and normalize the JWT part of an SD-JWT
 * @param {string} sdJwtString - SD-JWT string
 * @returns {string} Normalized JWT string
 */
function extractAndNormalizeJwt(sdJwtString) {
    // Remove any whitespace, newlines or carriage returns
    const cleanedInput = sdJwtString.replace(/\s/g, '');

    // Split by ~ to get just the JWT part (before any disclosures)
    const parts = cleanedInput.split('~');
    const jwt = parts[0];

    // Verify the JWT has the correct format (header.payload.signature)
    const jwtParts = jwt.split('.');
    if (jwtParts.length !== 3) {
        // Some JWTs may have line breaks or other issues
        const normalizedJwt = jwt.replace(/[^A-Za-z0-9_\-\.]/g, '');
        const normalizedParts = normalizedJwt.split('.');

        if (normalizedParts.length === 3) {
            return normalizedJwt;
        }

        console.error(`Invalid JWT format: expected 3 parts, got ${jwtParts.length}`);
        throw new Error("Invalid JWT format: token doesn't have the expected 3 parts");
    }

    return jwt;
}

/**
 * Verify signature using Web Crypto API
 * @param {string} token - Full JWT token
 * @param {string} publicKeyPem - Public key in PEM format
 * @returns {Promise<Object>} Verification result
 */
async function verifyWithWebCrypto(token, publicKeyPem) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return {
                status: false,
                message: "Invalid token format for Web Crypto verification"
            };
        }

        const [headerB64, payloadB64, signatureB64] = parts;

        // Decode header to get algorithm info
        let headerData;
        try {
            headerData = JSON.parse(base64UrlDecode(headerB64));
        } catch (headerError) {
            console.warn("⚠️ Could not parse header:", headerError);
            return {
                status: false,
                message: "Error parsing token header during verification"
            };
        }

        // Check if algorithm is supported
        if (headerData.alg !== 'RS256') {
            console.warn(`⚠️ Algorithm ${headerData.alg} not supported by Web Crypto`);
            return {
                status: false,
                message: `Algorithm '${headerData.alg}' is not supported. Only RS256 is supported in browser.`
            };
        }

        // Import the public key
        let cryptoKey;
        try {
            cryptoKey = await importPublicKey(publicKeyPem);
        } catch (keyError) {
            return {
                status: false,
                message: `Error importing public key: ${keyError.message}`
            };
        }

        // Prepare the data to verify
        const signedData = `${headerB64}.${payloadB64}`;
        const signedDataBuffer = new TextEncoder().encode(signedData);

        // Convert base64url signature to ArrayBuffer
        const signatureArrayBuffer = base64UrlToArrayBuffer(signatureB64);

        // Verify the signature
        try {
            const isValid = await crypto.subtle.verify(
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: { name: 'SHA-256' },
                },
                cryptoKey,
                signatureArrayBuffer,
                signedDataBuffer
            );

            return {
                status: isValid,
                message: isValid
                    ? "Signature verified successfully with Web Crypto API"
                    : "Signature verification failed - invalid signature"
            };
        } catch (verifyError) {
            console.error("Error during Web Crypto verification:", verifyError);
            return {
                status: false,
                message: `Web Crypto API verification error: ${verifyError.message}`
            };
        }
    } catch (e) {
        console.error("Unexpected error in Web Crypto verification:", e);
        return {
            status: false,
            message: `Verification error: ${e.message}`
        };
    }
}

/**
 * Convert base64url to ArrayBuffer for cryptographic operations
 * @param {string} base64url - Base64URL encoded string
 * @returns {ArrayBuffer} Array buffer for crypto operations
 */
function base64UrlToArrayBuffer(base64url) {
    // Convert base64url to base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    // Decode base64 to binary string
    const binary = atob(padded);

    // Convert to ArrayBuffer
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return buffer;
}

// Add DID resolver function for future expansion
async function resolveDid(did) {
    // In a production system, this would:
    // 1. Contact a DID resolver service
    // 2. Retrieve the DID Document
    // 3. Return the verification keys

    // For now, return a simple mock response
    if (did.includes('viitorcloud')) {
        return {
            did: did,
            keys: [{
                id: `${did}#key-1`,
                type: "RsaVerificationKey2018",
                publicKeyPem: document.getElementById('publicKey').value
            }]
        };
    }

    throw new Error(`Unknown DID: ${did}`);
}

// Update the runDiagnosticTest function to be more comprehensive
async function runDiagnosticTest() {
    // Get the exact token from the input field for testing
    // instead of using a fixed token that might not match your case
    const testToken = document.getElementById('sdJwt').value.trim();
    const testKey = document.getElementById('publicKey').value.trim();

    if (!testToken || !testKey) {
        console.error("❌ Test data missing: Please provide both token and key");
        return false;
    }

    try {
        // Try to normalize the token
        const normalizedToken = extractAndNormalizeJwt(testToken);

        // Parse the token parts
        const parts = normalizedToken.split('.');
        if (parts.length !== 3) {
            console.error("❌ Invalid token format after normalization");
            return false;
        }

        const [headerB64] = parts;

        // Decode header and payload
        try {
            const headerJson = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(headerB64.length + (4 - headerB64.length % 4) % 4, '='));

            const header = JSON.parse(headerJson);

            // Check if the header contains a kid for DID resolution
            if (header.kid && header.kid.startsWith('did:')) {
                try {
                    await resolveDid(header.kid.split('#')[0]);
                } catch (didError) {
                    console.warn("⚠️ DID resolution not implemented yet:", didError);
                }
            }

            // Test verification with different approaches
            const result = await verifyWithWebCrypto(normalizedToken, testKey);

            if (result.status) {
                return true;
            } else {
                console.error("❌ DIAGNOSTIC FAILED: Known-good token failed to verify");
                return false;
            }
        } catch (error) {
            console.error("❌ DIAGNOSTIC ERROR:", error);
            return false;
        }
    } catch (error) {
        console.error("❌ DIAGNOSTIC ERROR:", error);
        return false;
    }
}

// Update the verification process in the document ready handler
document.addEventListener('DOMContentLoaded', function () {
    // Set up the verify button
    document.getElementById('verifyBtn').addEventListener('click', async function () {
        const sdJwt = document.getElementById('sdJwt').value.trim();
        const publicKey = document.getElementById('publicKey').value.trim();
        const resultDiv = document.getElementById('verificationResult');
        const tokenInfoDiv = document.getElementById('tokenInfo');
        const verificationDetails = document.getElementById('verificationDetails');
        const verificationDetailsList = document.getElementById('verificationDetailsList');
        const disclosureSection = document.getElementById('disclosureSection');
        const disclosureTableBody = document.getElementById('disclosureTableBody');

        // Get skip verification setting
        const skipVerification = document.getElementById('skipVerification') &&
            document.getElementById('skipVerification').checked;

        // Clear previous results
        verificationDetailsList.innerHTML = '';
        disclosureTableBody.innerHTML = '';
        verificationDetails.style.display = 'none';
        disclosureSection.style.display = 'none';

        if (!sdJwt) {
            resultDiv.innerHTML = '<p class="error">Please enter an SD-JWT token</p>';
            return;
        }

        try {
            // Extract the JWT part from the SD-JWT
            let jwt;
            try {
                jwt = extractAndNormalizeJwt(sdJwt);
            } catch (tokenError) {
                console.error("Error extracting JWT from SD-JWT:", tokenError);
                resultDiv.innerHTML = `<p class="error">Error processing token: ${tokenError.message}</p>`;
                return;
            }

            // Split the SD-JWT into its components: <JWT>~<disclosure>~<disclosure>~...
            const parts = sdJwt.split('~');
            const disclosures = parts.slice(1);

            // Parse JWT token and disclosures
            const { header, payload, manualParsingMode } = parseJwtToken(jwt);
            const parsedDisclosures = parseDisclosures(disclosures);

            // Display decoded information
            displayTokenInfo(tokenInfoDiv, {
                header,
                payload,
                disclosures: parsedDisclosures
            });

            try {
                // Check if header alg is compatible with our verification
                if (header && header.alg && header.alg !== 'RS256') {
                    console.warn(`Algorithm ${header.alg} detected. Only RS256 is fully supported for signature verification.`);
                }

                // Skip signature verification if checkbox is checked
                let verificationResults = [];
                let overallVerification = !manualParsingMode;
                let earlyExit = false;
                let disclosureVerifications = [];

                // Check JWT format first
                verificationResults.push({
                    name: "JWT Format",
                    status: !manualParsingMode,
                    message: manualParsingMode
                        ? "Invalid JWT format - displaying token in fallback mode"
                        : "Valid JWT format"
                });

                if (manualParsingMode) {
                    earlyExit = true;
                } else {
                    // Handle signature verification or skipping
                    if (skipVerification) {
                        verificationResults.push({
                            name: "Signature",
                            status: null,
                            message: "Signature verification skipped by user"
                        });
                    } else if (publicKey && publicKey.trim() !== '') {
                        const signatureResult = await verifyWithWebCrypto(jwt, publicKey);
                        verificationResults.push({
                            name: "Signature",
                            status: signatureResult.status,
                            message: signatureResult.message
                        });
                        // Only update overall verification if we got a definitive result (not null)
                        if (signatureResult.status !== null) {
                            overallVerification = overallVerification && signatureResult.status;
                        }
                    } else {
                        verificationResults.push({
                            name: "Signature",
                            status: null,
                            message: "No public key provided for signature verification"
                        });
                    }

                    // Perform the rest of the verification checks
                    const expirationResult = checkExpiration(payload);
                    verificationResults.push(expirationResult);
                    overallVerification = overallVerification && expirationResult.status;

                    const { result: issuanceDateResult, valid: issuanceDateValid } = checkIssuanceDate(payload);
                    verificationResults.push(issuanceDateResult);
                    overallVerification = overallVerification && issuanceDateValid;

                    const { result: sdJwtResult, sdArrayValid, credentialSubject } = checkSdJwtStructure(payload);
                    verificationResults.push(sdJwtResult);
                    overallVerification = overallVerification && sdArrayValid;

                    // Verify disclosures hash against _sd array (if structure is valid)
                    if (sdArrayValid && parsedDisclosures.length > 0) {
                        disclosureVerifications = await verifyDisclosures(parsedDisclosures, credentialSubject);

                        // Check if all disclosures are valid
                        const allDisclosuresValid = disclosureVerifications.every(d => d.status);

                        verificationResults.push({
                            name: "Disclosures",
                            status: allDisclosuresValid,
                            message: allDisclosuresValid
                                ? "All disclosures verified"
                                : "Some disclosures failed verification"
                        });

                        overallVerification = overallVerification && allDisclosuresValid;
                    }
                }

                // Handle early exit for manual parsing mode
                if (earlyExit) {
                    resultDiv.innerHTML = '<p class="error">⚠️ Token format is invalid. Displaying in fallback mode.</p>';
                    verificationDetails.style.display = 'block';
                    const resultRow = document.createElement('div');
                    resultRow.className = 'detail-row';
                    resultRow.innerHTML = `
                        <div class="detail-label"><span class="status-icon" style="color: #e74c3c;">✗</span> Token:</div>
                        <div>This token appears to be malformed. Unable to properly parse and verify it.</div>
                    `;
                    verificationDetailsList.appendChild(resultRow);
                    return;
                }

                // Display verification results
                verificationDetails.style.display = 'block';
                displayVerificationResults(verificationResults, verificationDetailsList);

                // Display disclosure table if available
                if (disclosureVerifications && disclosureVerifications.length > 0) {
                    disclosureSection.style.display = 'block';
                    displayDisclosureTable(disclosureVerifications, disclosureTableBody);
                }

                // Display overall verification result
                // Check if signature verification was performed or skipped
                const signatureResult = verificationResults.find(r => r.name === "Signature");
                const signatureStatus = signatureResult ? signatureResult.status : null;
                const signatureSkipped = signatureResult && signatureResult.message.includes("skipped");

                // Calculate overall verification without signature if it was skipped
                const effectiveVerification = skipVerification
                    ? verificationResults.filter(r => r.name !== "Signature").every(r => r.status !== false)
                    : overallVerification;

                if (effectiveVerification) {
                    if (signatureStatus === true) {
                        resultDiv.innerHTML = '<p class="success">✓ Token format and signature verified successfully</p>';
                    } else if (signatureSkipped) {
                        resultDiv.innerHTML = '<p class="warning">⚠️ Token format is valid (signature verification skipped)</p>';
                    } else if (signatureStatus === null) {
                        resultDiv.innerHTML = '<p class="warning">⚠️ Token format is valid (signature verification skipped)</p>';
                    } else {
                        resultDiv.innerHTML = '<p class="warning">⚠️ Token format valid but signature verification failed</p>';

                        // Add signature troubleshooting guidance
                        const helpRow = document.createElement('div');
                        helpRow.className = 'troubleshooting-tips';
                        helpRow.innerHTML = `
                            <h4>Signature Verification Failed - Troubleshooting:</h4>
                            <ul>
                                <li><strong>Key Mismatch:</strong> The public key doesn't correspond to the private key used to sign the token</li>
                                <li><strong>Token Modification:</strong> The token may have been modified after signing</li>
                                <li><strong>Algorithm:</strong> Token uses ${header?.alg || 'Unknown'} algorithm - verify it's compatible with RS256</li>
                                <li><strong>Environment:</strong> The Web Crypto API may have limited functionality in this browser or context</li>
                            </ul>
                            <div class="verification-tip">
                                <strong>Tip:</strong> Try enabling "Skip Signature Verification" to focus on the token content.
                            </div>
                        `;
                        verificationDetailsList.appendChild(helpRow);
                    }
                } else {
                    resultDiv.innerHTML = '<p class="error">✗ Token verification failed</p>';

                    // If signature specifically failed, add guidance
                    if (signatureStatus === false) {
                        const helpRow = document.createElement('div');
                        helpRow.className = 'troubleshooting-tips';
                        helpRow.innerHTML = `
                            <h4>Invalid Signature - Debugging Steps:</h4>
                            <ol>
                                <li>Verify your public key is in the correct format (PEM with BEGIN/END PUBLIC KEY markers)</li>
                                <li>Confirm that this public key is paired with the private key that signed this token</li>
                                <li>Check that the token hasn't been modified since it was signed</li>
                                <li>Verify that your token uses the RS256 algorithm (current: ${header?.alg || 'Unknown'})</li>
                                <li>Try enabling "Skip Signature Verification" to proceed with viewing token content</li>
                            </ol>
                        `;
                        verificationDetailsList.appendChild(helpRow);
                    }
                }
            } catch (verificationError) {
                // Handle verification errors
                console.error("Verification process error:", verificationError);
                resultDiv.innerHTML = `<p class="error">✗ Verification process error: ${verificationError.message}</p>`;

                // Still display what we can
                verificationDetails.style.display = 'block';
                const errorRow = document.createElement('div');
                errorRow.className = 'detail-row';
                errorRow.innerHTML = `
                    <div class="detail-label"><span class="status-icon" style="color: #e74c3c;">✗</span> Error:</div>
                    <div>${verificationError.message}</div>
                `;
                verificationDetailsList.appendChild(errorRow);

                // Add signature troubleshooting guidance for certain errors
                if (verificationError.message.includes('signature') ||
                    verificationError.message.includes('atob') ||
                    verificationError.message.includes('decode')) {
                    const helpRow = document.createElement('div');
                    helpRow.className = 'troubleshooting-tips';
                    helpRow.innerHTML = `
                        <h4>Signature Verification Troubleshooting:</h4>
                        <ul>
                            <li>This error is often related to the token signature format or the public key</li>
                            <li>Try using a different JWT token or public key</li>
                            <li>Ensure the token was signed with RS256 algorithm</li>
                            <li>Try enabling "Skip Signature Verification" to proceed with viewing token content</li>
                        </ul>
                    `;
                    verificationDetailsList.appendChild(helpRow);
                }
            }
        } catch (e) {
            console.error("Error processing SD-JWT token:", e);
            resultDiv.innerHTML = `<p class="error">Error decoding token: ${e.message}</p>`;
            displayTokenInfo(tokenInfoDiv, "Failed to decode token");
        }
    });

    // Add test data button
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        // Add skip verification checkbox
        const skipVerificationLabel = document.createElement('label');
        skipVerificationLabel.className = 'checkbox-label';
        skipVerificationLabel.innerHTML = `
            <input type="checkbox" id="skipVerification"> Skip Signature Verification
        `;
        skipVerificationLabel.style.marginLeft = '10px';
        skipVerificationLabel.style.display = 'inline-flex';
        skipVerificationLabel.style.alignItems = 'center';
        verifyBtn.parentNode.insertBefore(skipVerificationLabel, verifyBtn.nextSibling);

        const testDataBtn = document.createElement('button');
        testDataBtn.id = 'testDataBtn';
        testDataBtn.type = 'button';
        testDataBtn.style.marginLeft = '10px';
        testDataBtn.style.backgroundColor = '#6c757d';
        testDataBtn.textContent = 'Insert Test Data';
        verifyBtn.parentNode.insertBefore(testDataBtn, verifyBtn.nextSibling);

        // Add diagnostic button
        const diagnosticBtn = document.createElement('button');
        diagnosticBtn.id = 'diagnosticBtn';
        diagnosticBtn.type = 'button';
        diagnosticBtn.style.marginLeft = '10px';
        diagnosticBtn.style.backgroundColor = '#17a2b8';
        diagnosticBtn.textContent = 'Run Diagnostic';
        verifyBtn.parentNode.insertBefore(diagnosticBtn, testDataBtn.nextSibling);

        // Run diagnostic when clicked - enhance the diagnostic test
        diagnosticBtn.addEventListener('click', async function () {
            console.clear(); // Clear console for clean output

            // First, check if we have token and key data
            const sdJwt = document.getElementById('sdJwt').value.trim();
            const publicKey = document.getElementById('publicKey').value.trim();

            if (!sdJwt || !publicKey) {
                alert("Please enter both token and public key before running diagnostics.");
                return;
            }

            // Run diagnostics with visual feedback
            const resultDiv = document.getElementById('verificationResult') || document.createElement('div');
            resultDiv.innerHTML = '<p class="running">Running diagnostics...</p>';

            try {
                const result = await runDiagnosticTest();

                if (result) {
                    resultDiv.innerHTML = '<p class="success">Diagnostic test PASSED! The token signature verified successfully.</p>';
                    alert("Diagnostic test PASSED! The verification system works correctly with this token and key.");
                } else {
                    resultDiv.innerHTML = '<p class="error">Diagnostic test FAILED! There appears to be an issue with the token or key.</p>';
                    alert("Diagnostic test FAILED! Please check the console for detailed information.");
                }
            } catch (error) {
                console.error("Diagnostic error:", error);
                resultDiv.innerHTML = `<p class="error">Diagnostic error: ${error.message}</p>`;
                alert(`Diagnostic error: ${error.message}. Check console for details.`);
            }
        });

        // Add the test data when clicked
        testDataBtn.addEventListener('click', function () {
            // Sample token generated with RS256
            document.getElementById('sdJwt').value = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRpZDpleGFtcGxlOnZpaXRvcmNsb3VkI2tleS0xIn0.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3czaWQub3JnL3NlY3VyaXR5L3N1aXRlcy9qd3MtMjAyMC92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImlzc3VlciI6ImRpZDpleGFtcGxlOnZpaXRvcmNsb3VkIiwiaXNz
dWFuY2VEYXRlIjoiMjAyNS0wNS0xMlQxMDo1NzoyNi4wNzJaIiwiY3JlZGVudGlhbFN1YmplY3QiOns
iaWQiOiJkaWQ6ZXhhbXBsZTphYmhpc2hlayIsIl9zZCI6WyJTZ2pubFcteWlRVUtGWnpucjNhODBnX0
pCdnNLYkg2MVlHM3g3U1U3VTZBIiwib0dyWUVIbC1nLWF1Y2NhajZFMV9mR1RTTi0zd09uSmFjc3ZMa
VUzNjJMbyIsIngzN2k4b1Y0aXRVSTg2QTNpbkdEcDBwcXMtSjZ0ajlyYU9kQ0dULThDTUUiLCJkSzY5
MlBNMVIxRGRucXJDeVhBaWRNTERMZnZHS19yTnpsT0V6SHNtUjRvIiwib19UbExqcnk4Z0hVaTBKZ2p
JWWx2c0JjX1ViQmZuWWgtLUIzbUlxXzU1TSJdLCJfc2RfYWxnIjoic2hhLTI1NiJ9LCJpYXQiOjE3ND
cwNDc0NDYsImV4cCI6MTc3ODYwNTA0Nn0.JFsCkeBahLHGiOrcI98g3ES90HlJStey00wHhJ56oECvF
Lhb9Lkk7knc-6md1o1raV6ikANoo9ifzl3SZ_4x9TXjkAxlWhIxCt8Iq35qgz8EyWEME3MBMGhwH4u_
ti2J2sBP3HF58cRr0r7BLTFC6q_9RgKVQZVEeO3OAX6xdvFLDBbN1de7VlBd-7GFOXUEJQz8tMgA6Gs
Yw4mujhrKqwZ3pyZwWTMMYoi7fpvf7xppiNs3UPYxAYVoFQv9IeZXac3nUxRY7mmlVbSCuUmV_HLerM
E_Q-MiwUx2zLkyLjE_CsVBimTuVHqi6SQ9HAjKQrRKmJ9GraQDi7lvCNT3NA~WyJteVVEUS16b1plQS
IsIm5hbWUiLCJBYmhpc2hlayBQYXRlbCJd~WyJjNVY0UGRObWRFbyIsImVtYWlsIiwiYWJoaXNoZWsu
cGF0ZWxAdmlpdG9yLmNsb3VkIl0~WyItNTI0cmN4OWR6QSIsInNjb3JlIiwiOTAuMTAlIl0~WyJjb09
fYlhXQWwzRSIsImVtcGxveWVlSWQiLCJFTVAxMjM0NTYiXQ~WyJGZ041U2tQRUotQSIsImRlcGFydG1
lbnQiLCJFbmdpbmVlcmluZyJd`;

            // Public key that corresponds to the private key used to sign the token
            document.getElementById('publicKey').value = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApfRCODxSPb1kkSk5+0so
bPKmEhXYykIs7+48pvXyqfkcFiXeE3RAXsVLVw9t2a0LXNx8515w3gE3zWoaGFdm
iR01mCKtt6DUkaVaAWlxxgPSGnr0tLTzUUk75i1vI8VfX88FaREqRnpMTEAOeizi
W/jf2dc6hm8lmy2XKxc/bAYU60Nyr5oLghvI/JDcaMqn+1+q6vVmtxKn6NMtSAwA
9zsE/pZFnF/nyaTyK15NHFMsDKMUXTid2KAgOP0cbKCbqJozwXV9GaQ4xVKylVqg
kMM11paEY0TosUpM36hxkC3DN2eAXQvMtVCypTBb4sl7TTv6QxUlcx7IGxI6EqwY
ZQIDAQAB
-----END PUBLIC KEY-----`;
        });
    }
});

// Create a function to add a debug button to the UI
function createDebugOutput() {
    // Check if we already have a debug section
    if (document.getElementById('debugSection')) {
        return;
    }

    const debugSection = document.createElement('div');
    debugSection.id = 'debugSection';
    debugSection.className = 'debug-section';
    debugSection.style.marginTop = '20px';
    debugSection.style.padding = '15px';
    debugSection.style.border = '1px solid #ddd';
    debugSection.style.borderRadius = '5px';
    debugSection.style.backgroundColor = '#f8f9fa';

    debugSection.innerHTML = `
        <h3>Verification Debugging</h3>
        <p>Based on diagnostic analysis, the most likely issue is:</p>
        <ul>
            <li>The public key doesn't match the private key used to sign this token</li>
            <li>The token signature was created with a different algorithm or format</li>
            <li>The token has been modified since it was signed</li>
        </ul>
    `;

    // Add to the page
    const resultArea = document.getElementById('result');
    resultArea.appendChild(debugSection);
}
