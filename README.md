# Rool ❤️ Feedback

**→ [Try the app](https://rool-feedback.rool.app/)**

A chat-based issue tracker built on the [Rool SDK](https://docs.rool.dev/). Describe your issue in a conversation with the AI. When the LLM understands it, generate a summary and save it. Issues are stored in your Rool Space and browsable in a sidebar organized by date.

## Features

- **Chat interface**: User messages in orange, AI responses in black/gray
- **Summarize flow**: Click Summarize when done explaining; AI generates title + summary
- **Approve & save**: Store issues with full conversation + summary
- **Clear**: Reset the chat to start a new issue
- **Issues list**: Date folders with issue cards; click to view details
- **Search**: Instant in-memory search across issues
- **Hash routing**: Shareable links (e.g. `#/issues/abc123`)

## Tech Stack

- React, Vite, Tailwind CSS
- Rool SDK (Rool Spaces)
- Gemini via Rool token quota

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
