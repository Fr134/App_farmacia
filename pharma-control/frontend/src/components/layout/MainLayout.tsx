import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Pill } from "lucide-react";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-card bg-bg-primary/80 px-4 py-3 backdrop-blur-sm lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-btn p-1.5 text-text-muted hover:text-text-primary"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Pill className="h-5 w-5 text-accent-blue" />
        <span className="text-sm font-semibold text-text-primary">
          PharmaControl
        </span>
      </div>

      {/* Main content */}
      <main className="lg:ml-[240px] p-6">
        <Outlet />
      </main>
    </div>
  );
}
