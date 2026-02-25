# Rool Issues

A chat-based issue tracker built on the Rool SDK. Describe your issue in a conversation with an AI; when understood, generate a summary and save it. Issues are stored in a Rool Space and browsable in a sidebar organized by date.

## Tech Stack

- React 18, Vite 6, TypeScript, Tailwind CSS
- Rool SDK (`@rool-dev/sdk`) for storage and AI (Gemini via Rool token quota)
- Radix UI primitives, lucide-react icons

## Project Structure

```
src/
  App.tsx                  - Root app with routing/layout
  main.tsx                 - Entry point
  index.css                - Global styles
  components/
    chat.tsx               - Chat interface (user/AI messages)
    issue-card.tsx         - Individual issue display
    issue-status-menu.tsx  - Status dropdown for issues
    issues-page.tsx        - Issues list/browse page
    search-page.tsx        - Search across issues
    sidebar-nav.tsx        - Date-folder sidebar navigation
    theme-toggle.tsx       - Dark/light mode toggle
    ui/                    - Shared UI primitives (button, etc.)
  lib/
    format.ts              - Date/text formatting helpers
    rool.ts                - Rool SDK initialization
    theme-provider.tsx     - Theme context
    utils.ts               - Utility functions
```

## Environment Variables

- `VITE_ROOL_FEEDBACK_SPACE_ID` - Optional. Set to a Rool Space ID to share issues across all users.

## Development

```bash
npm install
npm run dev   # Starts on 0.0.0.0:5000
```

## Workflow

- **Start application**: `npm run dev` → port 5000 (webview)

## Deployment

Configured as a static site. Build: `npm run build` → output: `dist/`
