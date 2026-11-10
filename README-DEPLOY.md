# HANDXI — hostable build with private friend rooms

## What is included
- Existing HANDXI browser game and player collection.
- Node.js + Express server that serves the site.
- Socket.IO private rooms with 5-character room codes.
- After both players join, a draft coin toss decides who picks first. Players then alternate picks in role order: 4 batters (2 each), 2 all-rounders (1 each), then 4 bowlers (2 each).
- After the draft, a second coin toss decides who chooses bat or bowl first.
- Both players lock a number independently; the server reveals and scores the ball only after both have locked.
- Server-side game engine validation, six limits, lives and two-innings scoring.
- `/health` endpoint for hosting health checks.

## Run locally
1. Install Node.js 20 or newer.
2. Extract this folder and open it in VS Code.
3. Open the terminal in this folder and run:

   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000`.
5. For a friend on a different network, deploy this server publicly first. `localhost` is only your own computer.

## Deploy on Render (recommended: one service for frontend + backend)
1. Push the complete `HANDXI` folder contents to a new GitHub repository. `package.json`, `server.js`, `engine.js`, `players.js`, `friends.html` and `friends.js` must be in the repository root.
2. In Render, choose **New → Blueprint** and connect that repository. Render reads `render.yaml` and creates the Node web service.
3. Wait for deployment. Open the Render `onrender.com` URL. The home page and Socket.IO backend use the same domain.
4. Test `https://YOUR-SERVICE.onrender.com/health`; it should return JSON with `ok: true`.
5. Open the game on your phone/PC, select **Friends Match**, create a room and send the 5-character code to your friend. Your friend opens the same public URL and joins.

You can also create a Render **Web Service** manually with:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

## Important hosting notes
- Use the Render URL for both players. Do not open the site through VS Code Live Server for online matches; Live Server does not run this Node backend.
- Free hosting may sleep when idle. The first connection after inactivity can take a little time.
- Rooms are stored in server memory. They are temporary and disappear if the service restarts or redeploys. No database is needed for a two-person test match.
- Keep frontend and backend on the same Render service/domain to avoid CORS and Socket.IO URL configuration.
- This build currently supports normal two-innings friend matches. Online Super Over, draft mode, persistent player accounts, match history and reconnect recovery are not implemented yet.
- The current online mode automatically selects the highest-rated eligible bowler at the start of each over. Manual bowling order is not part of this online room flow yet.
- Player names and likeness-inspired parody labels are placeholders. Get legal review and use licensed/original player identities before public commercial release.

## Troubleshooting
- `Cannot connect to the game server`: confirm the Render deployment is live and open the Render URL, not a local Live Server URL.
- `Room not found`: check the 5-character code and create a new room if the server restarted.
- `This room already has two players`: create a new room; rooms support exactly two participants.
- If the first Render request is slow, wait for the service to wake and refresh once.
