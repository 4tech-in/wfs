"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Banknote,
  CalendarX,
  Search,
  Bell,
  Fuel,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { authStorage } from "@/lib/auth"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Employees", url: "/dashboard/employee", icon: Users },
  { title: "Attendance", url: "/dashboard/attendance", icon: UserCheck },
  { title: "Leave Management", url: "/dashboard/leave-management", icon: CalendarX },
  // { title: "Document Center", url: "/dashboard/document", icon: PaperclipIcon },
  { title: "Employee Salary", url: "/dashboard/employee-salary", icon: Banknote },
  { title: "Payroll Policies", url: "/dashboard/payroll-policies", icon: UserCheck },
  { title: "Attendance Policies", url: "/dashboard/attendance-policies", icon: UserCheck },
  { title: "Roster", url: "/dashboard/roaster", icon: UserCheck },
  { title: "Recruitment", url: "/dashboard/recruitment", icon: Search },
  { title: "Asset Tracking", url: "/dashboard/asset-tracking", icon: Search },
  { title: "Reminders", url: "/dashboard/reminders", icon: Bell },
  { title: "Company Master", url: "/dashboard/company-master", icon: Users },
  {title: "Fuel Expenses", url: "/dashboard/fuel-expenses", icon: Fuel},
  {title: "Bills", url: "/dashboard/Bill", icon: Banknote},
]

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "px-4")}>
      {collapsed ? (
        <span className="text-sm font-bold">WS.</span>
      ) : (
        <span className="text-xl text-center font-bold tracking-tight text-[#1e293b]">Workforce Sync.</span>
      )}
    </div>
  )
}

export function AppSidebar() {
  const { state } = useSidebar()
  const pathname = usePathname()
  const isCollapsed = state === "collapsed"
  
  // Initialize state directly from storage to avoid flicker on client-side
  const [userRole, setUserRole] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return authStorage.getUser()?.role || null
    }
    return null
  })

  React.useEffect(() => {
    const user = authStorage.getUser()
    if (user?.role) {
      setUserRole(user.role)
    }
  }, [])

  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // List of items that should be hidden for "hr" role
      const restrictedForHR = ["Payroll Policies", "Company Master"];
      
      if (restrictedForHR.includes(item.title)) {
        // If we don't have a role yet (SSR or initial client load), hide it to be safe
        if (!userRole) return false
        return userRole !== "hr"
      }
      return true
    })
  }, [userRole])

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-100"
      style={{
        "--sidebar": "#ffffff",
        "--sidebar-foreground": "#64748b",
        "--sidebar-primary": "#3CC3A3",
        "--sidebar-primary-foreground": "#ffffff",
        "--sidebar-accent": "#f8fafc",
        "--sidebar-accent-foreground": "#0f172a",
        "--sidebar-border": "#f1f5f9",
        "--sidebar-ring": "#3CC3A3",
      } as React.CSSProperties}
    >
      <SidebarHeader className="pt-10 pb-6 transition-all duration-300">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Logo collapsed={isCollapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {filteredItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      size="lg"
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "group transition-all duration-200 rounded-2xl px-4 h-14",
                        "hover:bg-gray-50",
                        isActive
                          ? "bg-[#3CC3A3]! text-white! shadow-lg shadow-[#3CC3A3]/30"
                          : "text-slate-500"
                      )}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center"
                      >
                        <item.icon className={cn(
                          "shrink-0 size-6 transition-colors",
                          isActive && "text-white!"
                        )} />
                        <span className={cn(
                          "text-[15px] font-semibold tracking-tight transition-opacity duration-300 group-data-[collapsible=icon]:hidden whitespace-nowrap",
                          isActive ? "text-white!" : "text-slate-500"
                        )}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}


