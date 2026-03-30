import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, Receipt, Users, BarChart3, Activity, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { isAdmin, isOperator } = useAuth();

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !isOperator },
    { to: "/expenses", label: "Spese", icon: Receipt, show: !isOperator },
    { to: "/budget", label: "Budget", icon: BarChart3, show: !isOperator },
    { to: "/upload", label: "Carica", icon: Upload, show: !isOperator },
    { to: "/tools/body-composition", label: "Corpo", icon: Activity, show: true },
    { to: "/tools/sivat", label: "SIVAT", icon: ClipboardCheck, show: true },
    { to: "/users", label: "Utenti", icon: Users, show: isAdmin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border-card bg-[#070A12]/95 backdrop-blur-sm lg:hidden safe-area-bottom">
      {items
        .filter((item) => item.show)
        .map(({ to, label, icon: Icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-accent-blue"
                  : "text-text-dim active:text-text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
