const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'public.pem');

/**
 * Ensures the key directory exists and has proper gitignore settings
 */
function ensureKeyDir() {
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }

  // Ensure keys are properly excluded in .gitignore
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('/keys/private') && !gitignoreContent.includes('/keys/*.key')) {
      console.warn('\x1b[33m%s\x1b[0m', 'WARNING: private keys may not be properly ignored in .gitignore!');
      console.warn('\x1b[33m%s\x1b[0m', 'Please ensure your .gitignore contains rules to ignore private keys while allowing public keys.');
      console.warn('\x1b[33m%s\x1b[0m', 'Recommended configuration:');
      console.warn('\x1b[33m%s\x1b[0m', '/keys/private*');
      console.warn('\x1b[33m%s\x1b[0m', '/keys/*private*');
      console.warn('\x1b[33m%s\x1b[0m', '/keys/*.key');
      console.warn('\x1b[33m%s\x1b[0m', '!/keys/public*');
    }
  }

  // Add a README in the keys directory to explain how to handle keys
  const keysReadmePath = path.join(KEY_DIR, 'README.md');
  if (!fs.existsSync(keysReadmePath)) {
    const readmeContent = `# Keys Directory

This directory contains cryptographic keys used by the application.

## Security Notice

- This entire directory is excluded from git tracking.
- For deployment, you'll need to manually configure keys on each environment.
- Never commit keys to git repositories as they contain sensitive information.

## Key Distribution

Share the public key through secure channels for integration with other systems.
`;
    fs.writeFileSync(keysReadmePath, readmeContent);
    console.log('Created README.md in keys directory with security guidelines');
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
  console.log('\x1b[32m%s\x1b[0m', 'IMPORTANT: Keys are generated in a directory that should be excluded from git!');
  console.log('\x1b[32m%s\x1b[0m', 'For deployment or system integration, you must securely transfer these keys.');

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