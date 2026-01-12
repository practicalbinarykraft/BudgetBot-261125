/**
 * Admin Layout Component
 *
 * Main layout wrapper for admin panel with sidebar and header
 * Junior-Friendly: Simple structure, clear separation
 */

import { useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { useToast } from "@/hooks/use-toast";
import { setAdminToastHandler } from "@/lib/admin/api/admin-query-client";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { toast } = useToast();

  // Устанавливаем обработчик toast для глобальной обработки ошибок
  useEffect(() => {
    setAdminToastHandler((options) => {
      toast(options);
    });
  }, [toast]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

