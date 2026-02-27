# Rool ❤️ Feedback

**→ [Try the app](https://rool-feedback.rool.app/)**

A chat-based issue tracker built on the [Rool SDK](https://docs.rool.dev/). Describe your issue in a conversation with the AI. When the LLM understands it, generate a summary and save it. Issues are stored in your Rool Space and browsable in a sidebar organized by date.

## Features

- **AI Chat interface**: Orange user messages and black/gray responses for a clear dialogue.
- **Smart Summarization**: Automatically extracts title, summary, category, and bug status from conversations.
- **Issue Tracking**:
    - **Categorization**: Grouped by Bug, Feature, UX, or General.
    - **Status Management**: Track progress via Open, Solved, or Rejected states.
    - **Screenshots**: Upload and view multiple image attachments per issue.
    - **Sequential Numbers**: Every issue gets a unique reference number.
- **Discovery**:
    - **Sidebar Nav**: Issues organized by date folders (e.g. Recent, February 2026).
    - **Instant Search**: Blazing fast in-memory search across all titles and summaries.
- **Infrastructure**:
    - **Persistent State**: Chat sessions survive page refreshes.
    - **Hash Routing**: Shareable links for direct access to specific issues.

## Tech Stack

- React, Vite, Tailwind CSS
- Rool SDK (Rool Spaces)

## Shared Space

The app uses a shared Rool Space for all users (with **editor** permissions):
- **Name**: Rool Feedback
- **ID**: `vYI49S`

## Getting Started

```bash
npm install
npm run dev
```

Sign in with Rool when prompted. Chat about your issue, click **Summarize** when ready, then **Approve & Save**.

## Permissions

- Everyone can **read** all issues
- Everyone can **create** new issues
- Users can **edit** (status, category) only their own issues

## License

MIT
