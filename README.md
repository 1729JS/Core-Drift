# Core Drift

A small browser multiplayer arena game with a Node.js HTTP and WebSocket server.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Deploy To Render

1. Push this folder to a GitHub repository.
2. In Render, choose **New > Web Service**.
3. Connect the GitHub repository.
4. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Deploy and open the generated `https://...onrender.com` URL.

The server reads Render's `PORT` environment variable and binds to `0.0.0.0`, so WebSocket multiplayer works on the same URL.
