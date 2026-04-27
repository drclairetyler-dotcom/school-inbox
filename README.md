# School Inbox

Tasks and school dates for Bovingdon Primary Academy — Year 2 & Year 6.

## What it does
- Reads Gmail and WhatsApp messages to extract tasks and school events
- Tracks special days (dress-up days, performances, trips etc.) with reminders
- Sends email reminders 7 days before and on the morning of each event
- Works as an installed app on Android (PWA)

## Deploy to Netlify

### 1. Push to GitHub
Push this folder to a new GitHub repo called `school-inbox`.

### 2. Connect to Netlify
- Go to [netlify.com](https://netlify.com) and log in
- Click **Add new site** → **Import an existing project** → **GitHub**
- Select your `school-inbox` repo
- Build settings are automatic (netlify.toml handles everything)
- Click **Deploy site**

### 3. Add your API key
- In Netlify: go to **Site configuration** → **Environment variables**
- Click **Add a variable**
- Key: `ANTHROPIC_API_KEY`
- Value: your Anthropic API key (starts with `sk-ant-...`)
- Click **Save** then **Trigger deploy**

### 4. Install on Android
- Open your Netlify site URL in Chrome on your Android phone
- Tap the three-dot menu → **Add to Home screen**
- Tap **Install** — it will appear as an app icon

## File structure
```
school-inbox/
├── index.html              # Main app
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline support)
├── netlify.toml            # Netlify config
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── netlify/
    └── functions/
        └── claude.mjs      # API proxy (keeps your key secure)
```
