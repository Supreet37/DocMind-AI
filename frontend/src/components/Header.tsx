import { LogOut, Bell, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useLocation } from "wouter";
import { toast } from "sonner";

const planColors: Record<string, string> = {
  Free: "bg-muted text-muted-foreground",
  Pro: "bg-indigo-500/15 text-indigo-400",
  Team: "bg-violet-500/15 text-violet-400",
};

export default function Header({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  function handleLogout() {
    logout();
    toast.success("Signed out");
    setLocation("/");
  }

  const initials = user?.name
    ? user.name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          data-testid="button-toggle-theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
          data-testid="button-notifications"
        >
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-border" data-testid="user-info">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground leading-none" data-testid="text-username">
                {user?.name || "Guest"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[user?.plan || "Free"]}`} data-testid="badge-plan">
                {user?.plan || "Free"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          data-testid="button-logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
