import { MessageCircle, Info, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { Link, NavLink } from "react-router-dom"

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="app-shell-header">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="app-shell-brand group">
            <span className="app-shell-brand-badge">r/</span>
            <span className="app-shell-brand-text hidden sm:inline">Code Chat Reddit</span>
          </Link>
          <nav className="app-shell-nav">
            <NavTab to="/" icon={<MessageCircle className="size-4" />} label="Chat" />
            <NavTab to="/about" icon={<Info className="size-4" />} label="About" />
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="app-shell-theme-toggle"
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
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `app-shell-nav-tab ${isActive ? "active" : ""}`
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}
