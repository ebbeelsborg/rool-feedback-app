import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackPage } from "@/pages/feedback";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <h1 className="text-lg font-semibold">Rool Feedback</h1>
          <ThemeToggle />
        </header>
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <FeedbackPage />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
