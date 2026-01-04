# Fridge Magnets

An anonymous multiplayer refrigerator magnet canvas where users can drag, arrange, and interact with "magnets" in real-time. Built with Next.js, Socket.IO, and MongoDB.

<div style="display: flex; justify-content: space-around; margin-top: 30px;">
<img width="175px" src="https://i.imgur.com/sJvxTjn.png" alt="Fridge Magnets QR 1" />
<img width="175px" src="https://i.imgur.com/Z91gx2o.png" alt="Fridge Magnets QR 2" />
<img width="175px" src="https://i.imgur.com/w3kryhO.png" alt="Fridge Magnets QR 3" />
<img width="175px" src="https://i.imgur.com/QWlBtT6.png" alt="Fridge Magnets QR 4" />
</div>
<div style="text-align:center; margin-top:30px;"><a href="https://fridgemagnets.fun">fridgemagnets.fun</a></div>

## Overview

Fridge Magnets is a collaborative canvas application that simulates a shared refrigerator where anyone can place and move magnets. Users can:

- Drag and drop magnets large canvas
- Chat with other users in real-time
- Create words, sentences, or artistic arrangements
- Experience smooth animations and interpolated movement

## Features

### Core Functionality

- **Real-time Multiplayer Canvas**: Synchronized magnet positions across all connected clients
- **Interactive Magnets**: Letters, numbers, symbols, emojis, other special characters, and image sprites
- **Animated GIF Support**: Full support for animated GIFs as magnet sprites with optimized frame rendering
- **Chat System**: Real-time messaging with username support
- **Persistent State**: Magnet positions saved to MongoDB and restored on server restart
- **Rate Limiting**: Protection against spam and abuse
- **Cloudflare Turnstile**: Bot protection for contact form submissions

### User Interface

- **Responsive Canvas**: Pan and zoom with mouse or keyboard
- **Keyboard Shortcuts**:
  - `Arrow Keys` / `QWEASD`: Pan the viewport
  - `H`: Return to center of canvas
  - `Enter`: Open chat
  - `Esc`: Close chat
  - `Z`: Toggle header visibility
  - `P`: Toggle ping/latency display
  - `Ctrl+Shift+Alt+↑`: Open admin panel (if authenticated)
- **Dark/Light Mode**: Toggle via fridge icon in header
- **Resizable Panels**: Chat and admin panels can be resized

### Admin Features

- **User Management**: View active users, kick users, ban IPs
- **Real-time Metrics**: Monitor server performance, active connections, and movement tracking
- **Fridge Reset**: Reset all magnets to default positions
- **Movement Tracking**: See which users are moving which magnets
- **Kick/Ban Management**: Temporary kicks and permanent bans with custom messages

## Technology Stack

### Frontend

- **Next.js 16** (App Router)
- **React 18** with hooks
- **Zustand** for state management
- **Socket.IO Client** for real-time communication
- **Canvas API** for rendering
- **omggif** for animated GIF frame decoding

### Backend

- **Node.js** with custom HTTP server
- **Socket.IO 4** for WebSocket communication
- **MongoDB** with Mongoose for data persistence
- **Zod** for schema validation
- **bcrypt** for admin password hashing

### Infrastructure

- **Cloudflare Turnstile** for bot protection
- **Resend** for email notifications (contact messages)
- **MongoDB** for data storage

## Deployment

This application is deployed on **Heroku** due to its requirement for persistent WebSocket connections via Socket.IO. The custom server (`server.js`) runs a long-running Node.js process that maintains WebSocket connections, which is incompatible with serverless platforms like Vercel that use ephemeral function-based architecture. Heroku's traditional dyno model provides the persistent process environment needed for real-time multiplayer functionality.

**Note**: When deployed behind proxies (like Heroku's routing layer), the application automatically extracts the real client IP address from HTTP headers (`X-Forwarded-For` or `X-Real-IP`) rather than using the proxy's IP address. This ensures IP-based features (connection limits, bans, kicks) work correctly in production environments.

### Domain Configuration

The application enforces a canonical domain (`fridgemagnets.fun`) to ensure all traffic is routed through a single URL. This is implemented at two levels:

1. **Next.js Proxy** (`proxy.js`): Redirects all non-canonical domain requests to the canonical domain for Next.js app routes
2. **Custom Server** (`server.js`): Enforces domain restrictions for:
   - HTTP requests (including API routes)
   - Socket.IO WebSocket connections

**Supported Domains:**

- `fridgemagnets.fun` (canonical - only domain that serves the application)
- `www.fridgemagnets.fun` → redirects to canonical
- `🧲💩.ws` (xn--ls8hr8f.ws) → redirects to canonical
- `💩🧲.ws` (xn--ls8hs8f.ws) → redirects to canonical

The emoji domains are configured via DNS to redirect to the canonical domain, but even if someone attempts to access them directly, they will be automatically redirected. Socket.IO connections from non-canonical domains are rejected at the connection level, ensuring the emoji domains act as "doors only" and cannot be used to access the application directly.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (local or cloud)
- (Optional) Resend API key for email functionality
- (Optional) Cloudflare Turnstile keys for bot protection

### Installation

1. Clone the repository:

```bash
git clone https://github.com/emboiko/Fridge-Magnets.git
cd Fridge-Magnets
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory - See `.env.example` for the required variables.

4. Generate admin password hash:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(hash => console.log(hash))"
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
Fridge-Magnets/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes
│   ├── styles/           # Global CSS files
│   └── page.jsx          # Home page
├── src/
│   ├── components/       # React components
│   │   ├── FridgeCanvas/ # Canvas component and hooks
│   │   ├── modals/       # Modal components
│   │   └── pages/        # Page components
│   ├── entities/         # Domain entities (Magnet, Refrigerator)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Server-side utilities and libraries
│   │   ├── db/           # MongoDB models
│   │   ├── socket/       # Socket.IO handlers
│   │   ├── turnstile/    # Cloudflare Turnstile integration
│   │   └── validation/   # Zod schemas
│   └── stores/           # Zustand state stores
├── public/               # Static assets
│   └── img/              # Images and sprites
├── server.js             # Custom Next.js server with Socket.IO
└── package.json
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test:load` - Run load tests

### Load Testing

The project includes a load testing script (`tests/load/socketLoadTest.js`) that simulates multiple concurrent users connecting to the server and performing various actions. This helps identify performance bottlenecks, rate limiting behavior, and server capacity under load.

**How it works:**

The load test creates virtual users that:

- Connect to the server via Socket.IO
- Set usernames and receive initial magnet state
- Simulate dragging magnets at configurable intervals
- Track moves sent, updates received, errors, and latency

**Activity Modes:**

- **`full`** (default): Maximum load - all users continuously drag magnets at high frequency (~60fps)
- **`realistic`**: Simulates more natural user behavior with random drag sessions, pauses, and lower activity probability

**Network Simulation:**

The test can simulate different network conditions:

- `none` (default): No latency simulation
- `slow-3g`: 400-800ms latency
- `fast-3g`: 150-250ms latency
- `4g`: 20-30ms latency
- `custom`: Configurable latency and jitter

**Metrics Collected:**

- Connection success/failure rates
- Moves sent and updates received per second
- Error rates and rate limit hits
- Latency measurements (P50, P75, P90, P95, P99) with distribution histograms
- Connection times

**Usage:**

```bash
npm run test:load
```

Configure the test via environment variables (see `.env.example` for available options). The test will output real-time status updates and a comprehensive summary report at the end.

### Code Style

- Arrow functions by default (use `function` keyword only when needed)
- Explicit syntax (curly braces for conditionals, avoid ternaries)
- Descriptive variable names
- Async/await preferred over promises
- Minimal comments (code should be _reasonably_ self-documenting)

**Inline Styles:**

- Avoid inline styles unless required by JavaScript logic
- **Warranted uses**: Dynamic values that change based on state/props (e.g., user-resizable panel dimensions, progress bar percentages, CSS custom properties for dynamic sizing)
- **Unwarranted uses**: Static styles, conditional styles based on simple booleans (use CSS classes with `.dark-mode` or conditional classNames instead)
- Examples of warranted inline styles:
  - Resizable panel dimensions: `style={{ width: `${panelWidth}px`, height: `${panelHeight}px` }}`
  - Dynamic progress bars: `style={{ width: `${percentage}%` }}`
  - CSS custom properties for dynamic values: `style={{ "--chat-width": `${width}px` }}`
- Examples that should use CSS classes instead:
  - Dark mode filters: Use `.dark-mode` selector in CSS
  - Visibility toggles: Use conditional `className` with CSS classes
  - Static dimensions: Define in CSS files

### Dark/Light Mode

The application implements a class-based dark/light mode system with the following approach:

**State Management:**

- Dark mode state is managed in the Zustand `uiStore`
- Default mode is **dark mode** (ensures SSR/client match before hydration)
- Preference is persisted to `localStorage` with key `fridge-magnets-dark-mode`
- State is initialized client-side via `DarkModeInitializer` component to prevent hydration mismatches

**CSS Implementation:**

- Dark mode is toggled by adding/removing the `dark-mode` class on the `<html>` element
- CSS uses the `.dark-mode` selector for dark mode styles
- Some styles use `html:not(.dark-mode)` to explicitly set light mode styles (valid pattern)
- All dark mode styles are defined in CSS files, not inline styles

**Toggle Mechanism:**

- Toggle is triggered by clicking the fridge icon in the header
- The `toggleDarkMode` action updates both the Zustand state and the DOM class
- Changes are immediately reflected via CSS selectors

**Canvas Rendering:**

- Canvas API cannot use CSS classes, so `isDarkMode` is passed as a prop to canvas rendering functions
- Canvas text stroke colors and line widths adapt based on the `isDarkMode` prop
- This is the only place where dark mode logic exists outside of CSS

### Font Strategy

The application uses three fonts, each with a specific role:

**Raleway** (Primary UI Font)

- **Purpose**: Default body font (prevents Times New Roman fallback)
- **Used for**: Buttons, forms, chat, admin panel, contact forms, status pages, ping display
- **CSS Variable**: `--body-font`
- **Implementation**: Set as default `font-family` on `body` element

**Lalezar** (Display Font)

- **Purpose**: Decorative headings and titles
- **Used for**: Header title, modal titles
- **CSS Variable**: `--main-font`

**Luckiest Guy** (Canvas Font)

- **Purpose**: Magnet text rendering on canvas
- **Used for**: Letter/number/symbol text on magnets only
- **Implementation**: Hardcoded in canvas rendering (canvas API cannot use CSS variables directly)
- **Note**: This font is intentionally isolated to canvas rendering and should not be used elsewhere

**Guidelines:**

- Always use `var(--body-font)` for UI elements (buttons, inputs, text, etc.)
- Use `var(--main-font)` for decorative headings and titles

## Architecture

### Real-time Communication

The application uses Socket.IO for bidirectional communication:

- **Client → Server**: Magnet movements, chat messages, username changes
- **Server → Client**: Magnet position updates, chat broadcasts, system messages

### State Management

- **Client**: Zustand stores for UI state, magnet state, and admin state
- **Server**: In-memory Maps and Sets for active connections, rate limiting, and tracking

### Data Persistence

- **Magnets**: Saved to MongoDB using a debounced save mechanism - saves 3 seconds after the last change. This prevents blocking the event loop during active dragging, ensuring smooth real-time updates. New users always receive the current in-memory state on connection, so unsaved changes are visible to all connected clients. The server implements graceful shutdown handlers (SIGTERM/SIGINT) that perform a final save before termination, ensuring no data loss even during Heroku dyno restarts or manual shutdowns. Only unexpected crashes would lose unsaved changes being held up by the debounce.
- **Banned IPs**: Persisted in database
- **Kick Logs**: Tracked in database for audit purposes
- **Contact Messages**: Saved to database and emailed via Resend

### Performance Optimizations

- **Viewport Culling**: Only render visible magnets
- **Interpolated Movement**: Smooth animations for magnet position updates
- **Throttled Updates**: Position updates throttled to ~60fps
- **Sorted Magnet Cache**: Efficient z-index rendering with TTL-based cache invalidation
- **Direct DOM Manipulation**: Optimized resize operations
- **Animated GIF Frame-Skipping**: GIF animations only advance frames when magnets are visible in the viewport, saving CPU cycles for off-screen animated sprites

## Security

- **Rate Limiting**:
  - Magnet moves: 60 per second per client
  - Chat messages: 15 per 10 seconds per client
  - API requests: 5 per 15 minutes per IP
- **Input Validation**: Zod schemas for all socket events and API requests
- **IP-based Controls**: One connection per IP, kick/ban functionality
  - **IP Address Extraction**: On Heroku and other proxy environments, the real client IP is extracted from the `X-Forwarded-For` header (fallback to `X-Real-IP`). This ensures accurate IP-based controls when behind reverse proxies.
  - **IP Normalization**: All IP addresses are normalized by stripping the `::ffff:` prefix (IPv4-mapped IPv6 addresses) to ensure consistent comparison across different network configurations.
- **Admin Authentication**: bcrypt password hashing
- **CORS Protection**: Origin validation for Socket.IO connections
- **Domain Enforcement**: Canonical domain restriction ensures all traffic routes through `fridgemagnets.fun` (see [Domain Configuration](#domain-configuration))
- **Bot Protection**: Cloudflare Turnstile for contact form submissions

## Known Issues

- Browser zoom can cause canvas rendering issues (see TODO list)
- Magnet movement synchronization may be affected by high latency, network lag, or performance issues on client machines/browsers. The system doesn't handle these edge cases as gracefully as large-scale MMOs with sophisticated client-side prediction and server reconciliation. Under less-than-ideal conditions, magnets might not always move correctly or may appear to "jump" or desync. In some cases, clearing the Next.js cache has resolved odd local behaviors in development (rarely). This is something we'd like to improve in the future, but we're reasonably happy with current performance under normal conditions.
- Hot reload behaves poorly in development. Unsure if this is related to HMR/custom server/socket.io/etc.

## TODO / Wishlist

- Mobile support!
- Rendering of 'screen' components could probably use some router guards
- Screen components need backgrounds
- Convert PNGs to WebP for canvas images for performance (See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#supported_image_formats)
- More enhanced magnets:
  - Functional Portals
  - Stationary stuff
  - Rotatables
  - Magnet trails
  - Admin-only draggables
  - Boo magnet (he'd need several sprite frames to show which way he's facing. Closes his eyes when he's 'noticed')
  - DVD magnet (Sometimes it might bounce perfectly from a corner, often will not. Changes color when it bounces.)
- Separate canvas from the document better (zooming the browser has weird side effects- this will probably involve a scaling rabbit-hole). We'd still like to see an arbitrarily larger canvas with magnet density to go along with it, as long as we always have headroom for more magnets later on.
- Chat logs persisted in DB (not sure why we'd need or want this but might be useful later on)
- Track/store UTM params from QR codes, etc.
- SMS alerts alongside the emails & DB persistence of contact messages
- Support for additional fridge styles (stainless/black/eggshell/white/etc.) beyond dark/light mode
- CSS architecture improvements (low priority)
- Client queue system above a certain threshold once we have better baselines for performance metrics and latency
- Hardware metrics in admin panel are a bit crude and could benefit from better strategies (maybe using a library like `systeminformation`)
- We could easily support magnet-to-magnet or magnet-to-canvas interactions (like magnets being attracted to each other or repelled by each other). Magnet spawning rules could be modified to support collisions and canvas boundaries.

## Contributing

Contributions are welcome! Please feel free to submit a pull request. If you'd like to suggest new magnets or features, use the suggestion box in the app.
