const http = require('http');

const data = JSON.stringify({
  // Credential subject data
  credentialSubject: {
    name: "Abhishek Patel",
    email: "abhishek.patel@viitor.cloud",
    score: "90.10%",
    employeeId: "EMP123456",
    department: "Engineering"
  },
  // Optional customizations
  issuer: "did:example:viitorcloud",
  holder: "did:example:abhishek"
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
    console.log(parsedResponse.sd_jwt);

    console.log('\n=== Disclosures ===');
    console.log(parsedResponse.disclosures);

    console.log('\n=== Verification Info ===');
    console.log(`Issuer: ${parsedResponse.verification.issuer}`);
    console.log(`Format: ${parsedResponse.verification.format}`);

    console.log('\nSave the SD-JWT token and test it at http://localhost:3000/verify');
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.write(data);
req.end();

console.log('Sending request to generate VC...');