import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation Bar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f9fbff]">
          {children}
        </main>
      </div>
    </div>
  );
}
