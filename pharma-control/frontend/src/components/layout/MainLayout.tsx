import { Outlet } from "react-router-dom";
import { Pill } from "lucide-react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sidebar — desktop only */}
      <Sidebar open={false} onClose={() => {}} />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-card bg-bg-primary/80 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Pill className="h-5 w-5 text-accent-blue" />
        <span className="text-sm font-semibold text-text-primary">
          PharmaControl
        </span>
      </div>

      {/* Main content — bottom padding on mobile for BottomNav */}
      <main className="lg:ml-[240px] p-4 sm:p-6 pb-20 lg:pb-6">
        <Outlet />
      </main>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  );
}
