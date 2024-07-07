import express from "express";
import axios from "axios";
import os from "os";
import path from "path";
import bodyParser from "body-parser";

const app = express();

const PORT = process.env.VITE_PORT || 5173;
const {
  VITE_CLIENT_ID: CLIENT_ID,
  VITE_CLIENT_SECRET: CLIENT_SECRET,
  VITE_REDIRECT_URI: REDIRECT_URI,
} = process.env;

const DIST_DIR = path.join(__dirname, "../dist");
const INDEX_FILE = path.join(DIST_DIR, "index.html");

app.use(express.static(DIST_DIR));
app.use(express.json());
app.use(bodyParser.json());

const apiEndPoint = "api/exchange-token";
app.post(apiEndPoint, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    console.error("Authorization code is missing");
    return res.status(400).send("Authorization code is required");
  }

  const payload = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  };
  const url = "https://anilist.co/api/v2/oauth/token";

  console.log("Sending request to Anilist API");
  console.log("URL", url);
  console.log("Payload", payload);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
      },
    });

    console.log("Received response from Anilist API");
    console.log("Response Status:", response.status);
    console.log("Response Data:", response.data);

    if (response.data.access_token) {
      res.json({ accessToken: response.data.access_token });
    } else {
      throw new Error("Access token not found in the response");
    }
  } catch (error) {
    console.error("Error during token exchange:", error.message);
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Details:", error.response.data);
    }
    res.status(500).json({
      error: "Failed to exchange token",
      details: error.response?.data || error.message,
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(INDEX_FILE, (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(500).send("An error ocurred while serving the application");
    }
  });
});

function getLocalIpAddress() {
  const networkInterfaces = os.networkInterfaces();

  for (const networkInterface of Object.values(networkInterfaces)) {
    const found = networkInterface?.find(
      (net) => net.family === "IPv4" && !net.internal
    );
    if (found) return found.address;
  }
  return "localhost";
}

app.listen(PORT, () => {
  const ipAddress = getLocalIpAddress();
  console.log(
    `Server is running at:\n- Localhost: http://localhost:${PORT}\n- Local IP: http://${ipAddress}:${PORT}`
  );
});
