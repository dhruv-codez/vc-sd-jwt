const http = require('http');

const data = JSON.stringify({
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