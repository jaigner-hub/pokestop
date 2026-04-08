# Using Your Real Chrome Browser

The stock checker works best when connected to your real desktop Chrome. This bypasses bot detection because it uses your actual browser profile, cookies, TLS fingerprint, and residential IP — indistinguishable from normal browsing.

## Setup

### 1. Launch Chrome with remote debugging

Open PowerShell or Command Prompt and run:

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

Chrome will open normally. You can browse as usual — the app just opens new tabs in the background.

> If Chrome is already running, close it first. The `--remote-debugging-port` flag only works when Chrome starts fresh.

### 2. Start the app from WSL

```bash
npm start
```

The app will automatically detect Chrome on port 9222 and connect to it. You'll see:

```
Connecting to Chrome at http://127.0.0.1:9222...
Connected to Chrome.
```

If Chrome isn't running, it falls back to a bundled Chromium (which gets blocked by most stores).

## Configuration

Set these in `.env` if needed:

```env
CHROME_DEBUG_PORT=9222       # default
CHROME_DEBUG_HOST=127.0.0.1  # default
```

## Tips

- **Don't close Chrome** while the app is running. If the connection drops, the app will try to reconnect on the next poll cycle.
- **First run**: manually visit walmart.com, gamestop.com, bestbuy.com, and pokemoncenter.com once in Chrome to establish cookies/sessions. This helps avoid initial CAPTCHAs.
- The app only **disconnects** when it shuts down — it never closes your Chrome.
- You can keep using Chrome normally while the app runs. Stock checks open in background tabs that close automatically.

## Without a Desktop (SSH/headless)

If you're remote, you can use xvfb to run Chromium in a virtual display:

```bash
sudo apt install xvfb
Xvfb :99 -screen 0 1920x1080x24 &
DISPLAY=:99 npm start
```

This avoids the `HeadlessChrome` fingerprint but still gets blocked by CAPTCHAs since there's no one to solve them. The real desktop Chrome approach is strongly recommended.
