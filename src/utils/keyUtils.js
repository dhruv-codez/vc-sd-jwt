const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'public.pem');

/**
 * Ensures the key directory exists
 */
function ensureKeyDir() {
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }
}

/**
 * Generates RSA key pair for JWT signing if they don't exist
 */
function generateKeyPair() {
  ensureKeyDir();

  // Check if keys already exist
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    console.log('Using existing keys from', KEY_DIR);
    return {
      privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'),
      publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf8')
    };
  }

  // Generate new keys
  console.log('Generating new RSA key pair...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Save keys to files
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
  console.log('Keys generated and saved to', KEY_DIR);

  return { privateKey, publicKey };
}

/**
 * Gets the key pair, generating if necessary
 */
function getKeyPair() {
  return generateKeyPair();
}

module.exports = {
  getKeyPair
};