import axios from "axios";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function exchangeAccessToken(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).send("Authorization code is required");
  }

  const payload = {
    client_id: process.env.VITE_CLIENT_ID,
    client_secret: process.env.VITE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.VITE_REDIRECT_URI,
  };

  const url = "https://anilist.co/api/v2/oauth/token";

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
      },
    });

    if (response.data.access_token) {
      res.json({ accessToken: response.data.access_token });
    } else {
      throw new Error("Access token not found in response");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      const message = error.message;

      const details =
        axios.isAxiosError(error) && error.response
          ? error.response.data
          : message;
      res.status(500).json({
        error: "Failed to exchange token",
        details,
      });
    } else {
      res.status(500).json({
        error: "Failed to exchange token",
        details: "An unknown error occurred",
      });
    }
  }
}
