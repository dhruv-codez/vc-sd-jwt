const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const vcGenerator = require("./routes/vcGenerator");

// Initialize the app
const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Routes
app.use("/api", vcGenerator);

// Serve key verification page
app.use("/verify", express.static(path.join(__dirname, "../public")));

// Basic root route for health check
app.get("/", (_req, res) => {
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