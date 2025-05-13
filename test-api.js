const http = require('http');

const data = JSON.stringify({
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
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-vc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:');
    const parsedResponse = JSON.parse(responseData);

    console.log('\n=== SD-JWT Token ===');
    console.log(parsedResponse._sd_jwt);

    console.log('\n=== SD Digest Array ===');
    console.log(parsedResponse._sd);

    console.log('\n=== SD Algorithm ===');
    console.log(parsedResponse._sd_alg);

    console.log('\nSave the SD-JWT token and test it at http://localhost:3000/verify');
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.write(data);
req.end();

console.log('Sending request to generate VC with new template format...');