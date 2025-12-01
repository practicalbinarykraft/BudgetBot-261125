/**
 * Sidebar - Main Export
 *
 * Central export for all sidebar components
 * Modular architecture: 7 files, all <200 lines
 * Junior-Friendly: Clean exports, easy to understand
 */

// Context and Provider
export {
  SidebarProvider,
  useSidebar,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_KEYBOARD_SHORTCUT,
  type SidebarContextProps,
} from "./sidebar-context"

// Core components
export {
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
} from "./sidebar-core"

// Layout components
export {
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarInput,
} from "./sidebar-layout"

// Group components
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./sidebar-group"

// Menu components
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
} from "./sidebar-menu"

// Submenu components
export {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar-submenu"
