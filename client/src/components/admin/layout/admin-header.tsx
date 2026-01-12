/**
 * Admin Header Component
 *
 * Top header bar for admin panel with user info and logout
 * Junior-Friendly: Simple header, clear actions
 */

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/context";

export function AdminHeader() {
  const { t } = useTranslation();
  // TODO: Replace with real admin user data from context/hook
  const adminUser = {
    name: "Admin User",
    email: "admin@budgetbot.app",
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logout clicked");
    // For now, just redirect to login
    window.location.href = "/admin/login";
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - can add breadcrumbs or page title here */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('admin.layout.title')}
        </h2>
      </div>

      {/* Right side - User info and logout */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
          <User className="h-4 w-4" />
          <span>{adminUser.name}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('admin.layout.logout')}</span>
        </Button>
      </div>
    </header>
  );
}

