# Rool Feedback App

A web app for collecting product feedback about Rool, built on the [Rool SDK](https://docs.rool.dev/). Uses Gemini (via Rool's token quota) as the AI engine to generate summaries of submitted feedback.

## Features

- **Feedback form**: Category (bug, feature, improvement, general), 1–5 star rating, message, optional email
- **AI-powered summaries**: Each submission is processed by the Rool/Gemini LLM to add a one-sentence summary
- **Persistent storage**: Feedback is stored as objects in your Rool Space
- **Theme picker**: Light/dark mode toggle (matches remote-job-aggregator style)
- **Real-time updates**: New feedback appears immediately via Rool's real-time sync

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui-style components
- **Backend/Storage**: Rool SDK (Rool Spaces)
- **AI**: Gemini via Rool token quota (used for feedback summaries)

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

Open [http://localhost:5173](http://localhost:5173). You'll be prompted to sign in with Rool if not already authenticated. After signing in, you can submit feedback; it will be stored in a Rool Space named "Rool Feedback".

### Build

```bash
npm run build
```

## Feedback Fields

| Field     | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| Category  | select | Yes      | Bug, Feature Request, Improvement, General |
| Rating    | 1–5    | No       | Star rating (defaults to 3)          |
| Message   | text   | Yes      | Your feedback text                  |
| Email     | email  | No       | Optional contact for follow-up       |

Each submission triggers an AI-generated one-sentence summary, stored alongside your feedback in the Rool Space.

## License

MIT
