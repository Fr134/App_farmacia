import { Link, useLocation } from "react-router-dom";
import { Pill, LayoutDashboard, Upload, Receipt, Users, LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/expenses", label: "Spese", icon: Receipt, show: true },
    { to: "/upload", label: "Carica Report", icon: Upload, show: true },
    { to: "/users", label: "Utenti", icon: Users, show: isAdmin },
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
          bg-[#070A12] border-r border-border-card
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
              <p className="text-[10px] text-text-dim">
                Controllo di Gestione
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
          {navItems
            .filter((item) => item.show)
            .map(({ to, label, icon: Icon }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
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
              );
            })}
        </nav>

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
                      : "bg-accent-blue/15 text-accent-blue"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Viewer"}
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
