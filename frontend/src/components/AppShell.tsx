import { Link } from "@tanstack/react-router";
import { MessageCircle, Info, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme";

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-surface/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              r/
            </span>
            <span className="font-semibold tracking-tight hidden sm:inline">Code Chat Reddit</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavTab to="/" icon={<MessageCircle className="size-4" />} label="Chat" />
            <NavTab to="/about" icon={<Info className="size-4" />} label="About" />
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="ml-1 size-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

function NavTab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className="px-3 h-9 rounded-full text-sm font-medium flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
