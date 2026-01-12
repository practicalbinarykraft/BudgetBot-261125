/**
 * Admin Sidebar Component
 *
 * Navigation sidebar for admin panel
 * Junior-Friendly: Simple navigation, clear structure
 */

import { Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Activity,
  FileText,
  Shield,
  Send,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/context";

const navigationItems = [
  {
    nameKey: "admin.nav.dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    nameKey: "admin.nav.users",
    href: "/admin/users",
    icon: Users,
  },
  {
    nameKey: "admin.nav.analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    nameKey: "admin.nav.broadcasts",
    href: "/admin/broadcasts",
    icon: Send,
  },
  {
    nameKey: "admin.nav.support",
    href: "/admin/support",
    icon: MessageCircle,
  },
  {
    nameKey: "admin.nav.audit_log",
    href: "/admin/audit-log",
    icon: Shield,
  },
  {
    nameKey: "admin.nav.system",
    href: "/admin/system",
    icon: Activity,
  },
];

export function AdminSidebar() {
  const { t } = useTranslation();
  // Use window.location instead of useLocation to avoid context issues
  const [location, setLocation] = useState(
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    // Update location on navigation
    const updateLocation = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener('popstate', updateLocation);
    // Also listen to pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      updateLocation();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      updateLocation();
    };

    // Initial check
    updateLocation();

    return () => {
      window.removeEventListener('popstate', updateLocation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">{t('admin.layout.title')}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(item.nameKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {t('admin.layout.version')}
        </div>
      </div>
    </div>
  );
}

