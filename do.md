# 🤖 Copilot Instruction for Discord Tools Web App

## 🔧 Project Stack

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Backend**: Node.js API routes (in Next.js)
- **Database**: Firebase Realtime Database
- **Discord Bot**: Node.js (discord.js)
- **Scripts**: JavaScript automation files (autoMessager.js, etc.)

---

## 🌐 Project Overview

Create a full-stack web application with:

- Homepage with login via Discord
- 3 tools: Auto Messager, Auto Replier, Auto DM Reply
- Tool access controlled via a Discord bot
- Users can use tools via both website and bot
- Realtime sync between website and bot using Firebase

---

## 🧠 User Flow

1. User lands on homepage
2. Clicks a tool → if not logged in, gets redirected to Discord login
3. After login, website checks if user has access to selected tool (via Firebase)
4. If access is granted, tool input form appears
5. User enters required fields (e.g., token, channel ID, message)
6. Clicks "Start" → backend launches script via child process
7. Script status and logs update in Firebase
8. User can view status on Monitoring page
9. Discord bot can also start/stop scripts and update Firebase

---

## ✅ Component/Feature Specs

### 🌍 Homepage (`/`)

- Login with Discord button using `next-auth`
- Cards for each tool with Get Started button

### 🔐 Discord Auth (via next-auth)

- On login, fetch Discord ID and store session
- Send Discord ID to backend API to check Firebase for permissions

### 🛠 Tool Pages (`/tools/auto-messager`, etc.)

- Auth protected pages
- Input fields:

  - Discord Token
  - Channel ID / Guild ID
  - Message Content
  - Time Delay (ms)

- Start / Stop buttons
- Calls respective backend API endpoint to start/stop tool

### 🧩 Script Execution API (`/api/runTool`, `/api/stopTool`)

- On start:

  - Use `child_process.spawn()` to run tool script
  - Save PID, status, inputs in Firebase under:

    ```json
    /tools/tool_name/discord_user_id = {
      status: "running",
      pid: 1234,
      startTime: timestamp,
      inputs: {...}
    }
    ```

- On stop:

  - Kill process using PID
  - Update Firebase status to `stopped`

### 🔁 Firebase Structure

```json
users: {
  discord_id: {
    canUse: ["auto_messager", "auto_dm_reply"]
  }
},
tools: {
  auto_messager: {
    discord_id: {
      status: "running",
      pid: 1234,
      ...inputs
    }
  }
}
```

### 📡 Monitoring Page (`/monitoring`)

- Realtime fetch Firebase tool statuses
- Show current running tool per user
- Allow Stop button for active tools

---

## 🤖 Discord Bot Specs (Node.js + discord.js)

- Admin-only command:

  - `!authorize @user tool_name`
  - Adds user to Firebase `users/discord_id/canUse[]`

- User Commands:

  - `!start auto_messager`

    - Calls backend API to launch script

  - `!stop auto_messager`

    - Calls backend API to stop tool

- Bot syncs status with Firebase
- When tool is started from bot → UI on website reflects it as running

---

## 📁 File Structure

```
/myproject
├── /scripts
│   └── autoMessager.js
├── /pages
│   ├── index.js
│   ├── /tools
│   │   └── auto-messager.js
│   └── /api
│       └── runTool.js
│       └── stopTool.js
│       └── checkPermissions.js
├── /lib
│   └── firebase.js
├── /bot
│   └── bot.js
├── /components
├── tailwind.config.js
├── firebase.json
```

---

## 🛠 Tasks for Copilot

- Scaffold UI with Tailwind and conditional rendering based on auth
- Create API routes to trigger JS scripts
- Setup Firebase read/write helper
- Validate user permission and limit 1 process per tool
- Bot integration with Firebase and backend APIs

---

## ⚠️ Rules

- Only one instance per tool per user can run at a time
- Don’t allow tool start if already running
- Auth must be validated through Discord login + Firebase access control

---

## 🧪 Testing Checklist

- ***

> Built by VasuDev with Copilot ✨
