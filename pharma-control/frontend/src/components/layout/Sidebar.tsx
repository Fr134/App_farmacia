import { Link, useLocation } from "react-router-dom";
import { Pill, LayoutDashboard, Upload, Receipt, Users, LogOut, X, BarChart3, Wrench, Activity, ClipboardCheck, History, LineChart, Sun, Moon, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isOperator = user?.role === "operator";

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !isOperator, section: "gestione" },
    { to: "/expenses", label: "Spese", icon: Receipt, show: !isOperator, section: "gestione" },
    { to: "/budget", label: "Budget", icon: BarChart3, show: !isOperator, section: "gestione" },
    { to: "/upload", label: "Carica Report", icon: Upload, show: !isOperator, section: "gestione" },
    { to: "/users", label: "Utenti", icon: Users, show: isAdmin, section: "gestione" },
    { to: "/pharmacies", label: "Farmacie", icon: Building2, show: isAdmin, section: "gestione" },
    { to: "/tools/body-composition", label: "Composizione Corporea", icon: Activity, show: true, section: "strumenti" },
    { to: "/tools/sivat", label: "Aderenza Terapeutica", icon: ClipboardCheck, show: true, section: "strumenti" },
    { to: "/tools/sivat/history", label: "Storico SIVAT", icon: History, show: true, section: "strumenti" },
    { to: "/tools/sivat/dashboard", label: "Analytics SIVAT", icon: LineChart, show: !isOperator, section: "strumenti" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-[240px] flex-col
          bg-bg-sidebar border-r border-border-card
          transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-8">
          <div className="flex items-center gap-2.5">
            <Pill className="h-6 w-6 text-accent-blue" />
            <div>
              <h1 className="text-[15px] font-bold text-text-primary">
                PharmaControl
              </h1>
              <p className="text-[10px] text-text-dim truncate max-w-[140px]">
                {user?.pharmacyName ?? "Controllo di Gestione"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-btn p-1 text-text-dim hover:text-text-primary lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          {(() => {
            const visible = navItems.filter((item) => item.show);
            let lastSection = "";
            return visible.map(({ to, label, icon: Icon, section }) => {
              const isActive = pathname === to || (to !== "/" && pathname.startsWith(to + "/"));
              const showSectionHeader = section !== lastSection;
              lastSection = section;
              return (
                <div key={to}>
                  {showSectionHeader && section === "strumenti" && (
                    <div className="flex items-center gap-2 mt-5 mb-2 px-3">
                      <Wrench className="h-3.5 w-3.5 text-text-dim" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                        Strumenti
                      </span>
                      <div className="flex-1 border-t border-border-card" />
                    </div>
                  )}
                  <Link
                    to={to}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 rounded-btn px-3 py-2.5 mb-1
                      text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "border-l-2 border-accent-blue bg-accent-blue/10 text-text-primary"
                          : "border-l-2 border-transparent text-text-muted hover:bg-white/[0.03] hover:text-text-primary"
                      }
                    `}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </Link>
                </div>
              );
            });
          })()}
        </nav>

        {/* Theme toggle */}
        <div className="px-4 pb-2">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-white/[0.03] hover:text-text-primary transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
            {theme === "dark" ? "Tema chiaro" : "Tema scuro"}
          </button>
        </div>

        {/* User info + logout */}
        <div className="border-t border-border-card px-4 py-4">
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user.name}
                </p>
                <span
                  className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    user.role === "admin"
                      ? "bg-accent-purple/15 text-accent-purple"
                      : user.role === "operator"
                        ? "bg-accent-green/15 text-accent-green"
                        : "bg-accent-blue/15 text-accent-blue"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : user.role === "operator" ? "Operatore" : "Viewer"}
                </span>
              </div>
              <button
                onClick={logout}
                className="rounded-btn p-2 text-text-dim hover:bg-accent-red/10 hover:text-accent-red transition-colors"
                title="Esci"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
