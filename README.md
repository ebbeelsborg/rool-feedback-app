# Rool Issues

A chat-based issue tracker built on the [Rool SDK](https://docs.rool.dev/). Describe your issue in a conversation with the AI. When the LLM understands it, generate a summary and save it. Issues are stored in your Rool Space and browsable in a sidebar organized by date.

## Features

- **Chat interface**: User messages in orange, AI responses in black/gray
- **Summarize flow**: Click Summarize when done explaining; AI generates title + summary
- **Approve & save**: Store issues with full conversation + summary
- **Sidebar**: Date folders (S3-style) with issue objects; expand folders, click to view
- **Search**: Search across issues

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

## Shared Space (optional)

Set `VITE_ROOL_FEEDBACK_SPACE_ID` in `.env` to use a shared space across users.

## License

MIT
