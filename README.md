# Rool Feedback App

A simple AI-powered feedback app built on the [Rool SDK](https://docs.rool.dev/). Chat-style input for sharing feedback, plus a browsable archive with category filters and search. Uses Gemini (via Rool's token quota) to auto-categorize and summarize each submission.

## Features

- **Chat-style input**: Share feedback in natural language—no forms. Optional email for follow-up.
- **AI-powered**: Each submission is categorized (bug, feature, improvement, general) and summarized by Rool/Gemini.
- **Browsable archive**: Filter by category, search by text, expand to read full feedback.
- **Persistent storage**: Feedback is stored as objects in your Rool Space.
- **Theme picker**: Light/dark mode toggle.
- **Real-time updates**: New feedback appears immediately via Rool's real-time sync.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui-style components
- **Backend/Storage**: Rool SDK (Rool Spaces)
- **AI**: Gemini via Rool token quota (categorization + summaries)

## Getting Started

### Prerequisites

- Node.js (v20+)
- A [Rool](https://console.rool.dev/) account

### Installation

```bash
npm install
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Sign in with Rool if prompted. Share feedback via the chat input; browse past feedback in the archive below.

### Build

```bash
npm run build
```

## License

MIT
