import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

// Very simple in-memory store
const users = new Map<string, { id: string; name: string; email: string; avatar: string }>();
const messages: { id: string; text: string; userId: string; timestamp: number }[] = [];
const otps = new Map<string, string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // --- API Routes ---
  
  app.post("/api/auth/request-code", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(email, code);
    
    console.log(`[DEMO] OTP for ${email} is ${code}`);
    // In a real app we'd send an email. For demo, we return it to display in UI.
    res.json({ message: "Code sent!", demoCode: code });
  });

  app.post("/api/auth/verify-code", (req, res) => {
    const { email, code } = req.body;
    if (otps.get(email) !== code) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }
    
    otps.delete(email);
    const userId = Buffer.from(email).toString('base64');
    const name = email.split('@')[0];
    const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`;
    
    if (!users.has(userId)) {
      users.set(userId, { id: userId, name, email, avatar });
    }
    
    res.json({ token: userId, user: users.get(userId) });
  });

  app.post("/api/auth/google", (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "No credential provided" });
    
    // Decode JWT (Demo only! In production, verify signature)
    try {
      const payloadBase64 = credential.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      
      const { email, name, picture } = decoded;
      const userId = Buffer.from(email).toString('base64');
      
      if (!users.has(userId)) {
        users.set(userId, { id: userId, name, email, avatar: picture || `https://api.dicebear.com/7.x/notionists/svg?seed=${name}` });
      }
      
      res.json({ token: userId, user: users.get(userId) });
    } catch (err) {
      res.status(401).json({ error: "Invalid Google credential" });
    }
  });

  // --- Socket.io ---
  
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Send existing messages
    socket.emit("init_messages", messages.map(m => ({ ...m, user: users.get(m.userId) })));
    
    socket.on("send_message", (data) => {
      const { text, token } = data;
      const user = users.get(token);
      if (!user) return; // Unauthorized
      
      const msg = {
        id: Math.random().toString(36).substring(7),
        text,
        userId: user.id,
        timestamp: Date.now()
      };
      
      messages.push(msg);
      // Keep only last 100
      if (messages.length > 100) messages.shift();
      
      io.emit("new_message", { ...msg, user });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // --- Vite Middleware ---
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
