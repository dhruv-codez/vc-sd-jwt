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

  // Ensure keys are in .gitignore
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('/keys/')) {
      console.warn('\x1b[33m%s\x1b[0m', 'WARNING: keys directory not found in .gitignore. This could lead to accidental commit of private keys!');
      console.warn('\x1b[33m%s\x1b[0m', 'Please add "/keys/" to your .gitignore file.');
    }
  }

  // Add a .gitignore file in the keys directory as an extra layer of protection
  const keysGitignorePath = path.join(KEY_DIR, '.gitignore');
  if (!fs.existsSync(keysGitignorePath)) {
    fs.writeFileSync(keysGitignorePath, '# Ignore all files in this directory\n*\n!.gitignore\n');
    console.log('Created .gitignore in keys directory for extra security');
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
  console.log('\x1b[32m%s\x1b[0m', 'IMPORTANT: Never commit private keys to git repositories!');

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