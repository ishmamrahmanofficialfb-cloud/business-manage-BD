import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check email status config
  app.get("/api/mail-status", (req, res) => {
    dotenv.config({ override: true });
    res.json({
      configured: !!process.env.RESEND_API_KEY,
      isDemo: !process.env.RESEND_API_KEY
    });
  });

  // API Routes
  app.post("/api/send-email", async (req, res) => {
    dotenv.config({ override: true });
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields: to, subject, html." });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log(`[Email Simulator] No RESEND_API_KEY configured. Simulating mail send:`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      return res.status(200).json({ 
        id: "simulated-id-" + Math.random().toString(36).substring(2, 9),
        simulated: true,
        message: "Email simulated successfully. (Missing RESEND_API_KEY)" 
      });
    }

    try {
      const resendInstance = new Resend(apiKey);
      const data = await resendInstance.emails.send({
        from: "Manage BD <onboarding@resend.dev>", // Default Resend test domain
        to,
        subject,
        html,
      });

      res.status(200).json(data);
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || "";

  // Google OAuth Status
  app.get("/api/google/status", (req, res) => {
    res.json({
      configured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
      clientId: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 8)}...` : ""
    });
  });

  // Get Google Auth URL
  app.get("/api/google/auth-url", (req, res) => {
    const { redirect_uri } = req.query;
    if (!redirect_uri) {
      return res.status(400).json({ error: "Missing redirect_uri query parameter." });
    }

    if (!GOOGLE_CLIENT_ID) {
      // In simulation mode, return dummy url that points back to redirect with a test code
      return res.json({ 
        url: `${redirect_uri}?code=simulated_auth_code` 
      });
    }

    // Standard scopes for Chat API & User info
    const scopes = [
      "https://www.googleapis.com/auth/chat.spaces.readonly",
      "https://www.googleapis.com/auth/chat.spaces",
      "https://www.googleapis.com/auth/chat.messages",
      "openid",
      "email",
      "profile"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(String(redirect_uri))}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    res.json({ url: authUrl });
  });

  // Exchange Auth Code for Tokens
  app.post("/api/google/exchange-code", async (req, res) => {
    const { code, redirect_uri } = req.body;
    if (!code || !redirect_uri) {
      return res.status(400).json({ error: "Missing code or redirect_uri parameters." });
    }

    if (!GOOGLE_CLIENT_ID || code === "simulated_auth_code") {
      // Simulated OAuth Response
      console.log("[Google OAuth Simulator]: Simulating code exchange.");
      return res.json({
        access_token: "simulated_access_token_" + Math.random().toString(36).substring(2, 10),
        refresh_token: "simulated_refresh_token_xyz123",
        expires_in: 3600,
        user: {
          email: "ishmamrahmanofficialfb@gmail.com",
          name: "Ishmam Rahman (Demo)",
          picture: "https://lh3.googleusercontent.com/a/default-user"
        },
        simulated: true
      });
    }

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: "authorization_code"
        }).toString()
      });

      const data = await response.json() as any;
      if (data.error) {
        return res.status(400).json({ error: data.error_description || data.error });
      }

      // Fetch user profile info
      let userProfile = { email: "", name: "", picture: "" };
      try {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${data.access_token}`
          }
        });
        if (profileRes.ok) {
          userProfile = await profileRes.json() as any;
        }
      } catch (profileError) {
        console.error("Failed to fetch user profile:", profileError);
      }

      res.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: userProfile,
        simulated: false
      });
    } catch (error: any) {
      console.error("Error exchanging code:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy: List Google Chat Spaces
  app.get("/api/google/chat/spaces", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header." });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    if (accessToken.startsWith("simulated_access_token")) {
      // Return simulated list of spaces
      return res.json({
        spaces: [
          {
            name: "spaces/simulated_space_general",
            displayName: "ম্যানেজ বিডি - সাধারণ ফোরাম",
            type: "SPACE"
          },
          {
            name: "spaces/simulated_space_sales",
            displayName: "বিক্রয় ও স্টক এলার্ট",
            type: "SPACE"
          },
          {
            name: "spaces/simulated_space_management",
            displayName: "ম্যানেজমেন্ট টিম",
            type: "SPACE"
          }
        ],
        simulated: true
      });
    }

    try {
      const response = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json() as any;
      if (data.error) {
        return res.status(response.status || 400).json({ error: data.error.message || "Failed to list spaces." });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error listing spaces:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy: Send Message to space
  app.post("/api/google/chat/send", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { spaceName, text, card } = req.body;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header." });
    }
    if (!spaceName) {
      return res.status(400).json({ error: "Missing spaceName parameter." });
    }
    if (!text && !card) {
      return res.status(400).json({ error: "Missing text or card message content." });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    if (accessToken.startsWith("simulated_access_token")) {
      console.log(`[Google Chat Simulator] Posting message to ${spaceName}:`);
      console.log(`Text: ${text}`);
      if (card) {
        console.log(`Card:`, JSON.stringify(card, null, 2));
      }
      return res.json({
        name: `${spaceName}/messages/simulated_${Math.random().toString(36).substring(2, 9)}`,
        text,
        sender: {
          displayName: "Manage BD System",
          type: "HUMAN"
        },
        createTime: new Date().toISOString(),
        simulated: true
      });
    }

    try {
      const payload: any = {};
      if (text) payload.text = text;
      if (card) payload.cardsV2 = [card];

      const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as any;
      if (data.error) {
        return res.status(response.status || 400).json({ error: data.error.message || "Failed to send message." });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy: Get recent messages from space
  app.get("/api/google/chat/messages", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { spaceName } = req.query;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header." });
    }
    if (!spaceName) {
      return res.status(400).json({ error: "Missing spaceName parameter." });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    if (accessToken.startsWith("simulated_access_token")) {
      return res.json({
        messages: [
          {
            name: `${spaceName}/messages/sim1`,
            text: "স্বাগতম! ম্যানেজ বিডি থেকে আজ ৩টি নতুন স্টক আপডেট এসেছে। ✅",
            sender: { displayName: "ম্যানেজার এআই", type: "HUMAN" },
            createTime: new Date(Date.now() - 3600000).toISOString()
          },
          {
            name: `${spaceName}/messages/sim2`,
            text: "অর্ডার #১০২৪ সফলভাবে ডেলিভারি দেওয়া হয়েছে! 🚀",
            sender: { displayName: "সিস্টেম বট", type: "HUMAN" },
            createTime: new Date(Date.now() - 1800000).toISOString()
          },
          {
            name: `${spaceName}/messages/sim3`,
            text: "চলতি মাসের খরচ রিপোর্ট আপলোড করা হয়েছে। সেটিংস পাতা চেক করুন।",
            sender: { displayName: "অ্যাকাউন্টস ডিপার্টমেন্ট", type: "HUMAN" },
            createTime: new Date(Date.now() - 300000).toISOString()
          }
        ],
        simulated: true
      });
    }

    try {
      const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=20`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json() as any;
      if (data.error) {
        return res.status(response.status || 400).json({ error: data.error.message || "Failed to list messages." });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error listing chat messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
