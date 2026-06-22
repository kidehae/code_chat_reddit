import { AppShell } from "./components/AppShell";
import { Chat } from "./components/Chat";
import { ThemeProvider } from "./lib/theme";
import { Routes, Route } from "react-router-dom";
import About from "./pages/About";

export default function App() {
  return (
    <ThemeProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </AppShell>
    </ThemeProvider>
  );
}