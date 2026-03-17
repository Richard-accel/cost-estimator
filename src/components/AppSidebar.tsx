import {
  LayoutDashboard, Calculator, Building2, Stethoscope, FileText, BookOpen,
  MessageCircle, Upload, Database, Settings, LogOut, ClipboardList, Layers,
  CreditCard, Users, Tag,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Bill Estimator", url: "/estimator", icon: Calculator },
];

const adminItems = [
  { title: "Hospitals", url: "/admin/hospitals", icon: Building2 },
  { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
  { title: "Procedures", url: "/admin/procedures", icon: ClipboardList },
  { title: "Reference Data", url: "/admin/reference-data", icon: Layers },
  { title: "Data Ingestion", url: "/admin/ingestion", icon: Upload },
  { title: "Averages", url: "/admin/averages", icon: Database },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Promotions", url: "/admin/promotions", icon: Tag },
];

const resourceItems = [
  { title: "User Manual", url: "/user-manual", icon: BookOpen },
  { title: "Documentation", url: "/documentation", icon: FileText },
  { title: "AI Assistant", url: "/chatbot", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasRole, signOut, profile } = useAuth();

  const renderItems = (items: typeof mainItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
              <item.icon className="mr-2 h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
            <img
              src="/kpj_logo.webp"
              alt="KPJ Logo"
              className="h-full w-full object-contain"
            />
            </div>
          {!collapsed && <span className="font-bold font-display text-sm text-sidebar-foreground">KPJ Bill Estimator</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>

        {hasRole("group") && (
          <SidebarGroup>
            <SidebarGroupLabel>Data Management</SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(adminItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(resourceItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-3 border-t border-sidebar-border">
          {!collapsed && profile && (
            <p className="text-xs text-sidebar-foreground/70 mb-2 px-2 truncate">{profile.email}</p>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
