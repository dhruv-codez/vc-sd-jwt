const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const vcGenerator = require("./routes/vcGenerator");
const { getKeyPair } = require("./utils/keyUtils");

// Initialize the app
const app = express();

// Generate keys on startup
console.log("Initializing cryptographic keys...");
try {
  const { privateKey, publicKey } = getKeyPair();
  console.log("Cryptographic keys ready");
} catch (error) {
  console.error("Failed to initialize keys:", error);
  process.exit(1);
}

// Parse JSON bodies
app.use(bodyParser.json());

// Routes
app.use("/api", vcGenerator);

// Serve key verification page
app.use("/verify", express.static(path.join(__dirname, "../public")));

// Basic root route for health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "VC Generator API is running",
    endpoints: {
      generateVC: "/api/generate-vc",
      verifyPage: "/verify"
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VC Generator API running on port ${PORT}`);
  console.log(`- API endpoint: http://localhost:${PORT}/api/generate-vc`);
  console.log(`- Verification page: http://localhost:${PORT}/verify`);
});