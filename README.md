# Author: Vivek Kushwaha

# AI Agent Dashboard (Computer Use)

An AI-powered dashboard that allows a Claude-based agent to control a real computer environment while providing a structured, interactive visualization of all agent actions.

Built using Next.js, Vercel AI SDK, Anthropic Claude, and E2B / Vercel Sandbox.

---

## 🚀 Live Demo

https://ai-sdk-computer-use.vercel.app

---

## 🎯 Key Features

### 🧩 Two-Panel Layout

* Left: Chat + Tool Events + Debug Panel
* Right: VNC Viewer + Tool Details
* Fully resizable panels

---

### 🧠 Event System (Core Architecture)

* Centralized event store using Zustand
* TypeScript discriminated unions for event types
* Tracks:

  * type (typing, click, screenshot, bash)
  * status (pending, success, error)
  * timestamp & duration
  * payload (tool-specific data)

---

### 🎨 Tool Call Visualization

* Interactive event cards
* Status indicators (⏳ pending, ✅ success, ❌ error)
* Duration tracking
* Clickable → shows details in right panel

---

### 🔍 Debug Panel

* Chronological event timeline
* Event counts by type
* Raw JSON state for debugging

---

### 🔄 Chat Sessions

* Multiple sessions
* Switch / create / delete sessions
* Persistent storage (localStorage)
* Each session maintains its own:

  * messages
  * event history

---

### ⚡ Performance Optimizations

* VNC viewer isolated using React.memo
* Prevents unnecessary re-renders on chat updates
* Clean component boundaries

---

## 🏗️ Architecture Overview

```
User Input
   ↓
AI SDK (Streaming)
   ↓
Claude (Computer Use)
   ↓
Tool Calls (typing, click, screenshot, bash)
   ↓
Event Store (Zustand)
   ↓
UI Components (Tool Cards, Debug Panel)
   ↓
User Interaction (click → details view)
```

---

## 🧪 Live Flow

1. User sends a message
2. AI agent executes actions (type, click, screenshot)
3. Each action is stored as an event
4. Events are rendered as UI cards
5. Clicking an event shows details on the right panel

---

## 📁 Project Structure

```
app/                → Next.js app router
components/         → UI components
features/           → Chat, Events, Sessions modules
stores/             → Zustand stores (event, session, UI)
types/              → TypeScript event models
lib/                → Sandbox + utilities
```

---

## ⚙️ Setup

```bash
pnpm install
pnpm dev
```

---

## 🔑 Environment Variables

```
ANTHROPIC_API_KEY=
SANDBOX_SNAPSHOT_ID=
VERCEL_OIDC_TOKEN=
```

---

## 🎥 Demo Video

[Add your video link here]

---

## 💡 Technical Decisions

* Used Zustand for lightweight global state management
* Designed event pipeline using discriminated unions for type safety
* Decoupled UI from data layer for scalability
* Implemented derived state (event counts, status)
* Optimized VNC rendering to avoid performance bottlenecks

---

## 📌 Notes

* Existing functionality was preserved while extending architecture
* Focus was on system design, not just UI changes
* Designed for scalability and extensibility
