"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Search as SearchIcon,
  Briefcase,
  Box,
  TrendingUp,
  FileText,
  UserCheck,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Category = "Pages" | "Employees" | "Recruitment" | "Assets"

interface SearchResult {
  title: string
  description: string
  url: string
  icon: React.ElementType
  category: Category
}

const SEARCH_DATA: SearchResult[] = [
  // PAGES
  { title: "Dashboard", description: "Overview and analytics", url: "/dashboard", icon: TrendingUp, category: "Pages" },
  { title: "Employee Master", description: "Manage labor directory", url: "/dashboard/employee", icon: Users, category: "Pages" },
  { title: "Recruitment", description: "Candidate tracking and onboarding", url: "/dashboard/recruitment", icon: Briefcase, category: "Pages" },
  { title: "Asset Tracking", description: "Company equipment and maintenance", url: "/dashboard/asset-tracking", icon: Box, category: "Pages" },
  { title: "Attendance", description: "Daily logs and clock-ins", url: "/dashboard/attendance", icon: UserCheck, category: "Pages" },
  { title: "Payroll", description: "Salary and payments", url: "/dashboard/payroll", icon: FileText, category: "Pages" },
  { title: "Bills", description: "Bills and payments", url: "/dashboard/bills", icon: FileText, category: "Pages" },
  { title: "Calendar", description: "Calendar and events", url: "/dashboard/calendar", icon: FileText, category: "Pages" },
  { title: "Company Master", description: "Company and master data", url: "/dashboard/company-master", icon: FileText, category: "Pages" },
  { title: "Document", description: "Documents and files", url: "/dashboard/document", icon: FileText, category: "Pages" },
  { title: "Leave Management", description: "Leave management", url: "/dashboard/leave-management", icon: FileText, category: "Pages" },
  { title: "Payroll Policies", description: "Payroll policies", url: "/dashboard/payroll-policies", icon: FileText, category: "Pages" },
  { title: "Reminders", description: "Reminders and notifications", url: "/dashboard/reminders", icon: FileText, category: "Pages" },
  { title: "Roster", description: "Roster and scheduling", url: "/dashboard/roaster", icon: FileText, category: "Pages" },
]

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const activeItemRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
      })
    }
  }, [selectedIndex])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const onSelect = (url: string) => {
    setOpen(false)
    setQuery("")
    router.push(url)
  }

  const results = React.useMemo(() => {
    if (!query) return SEARCH_DATA.filter(item => item.category === "Pages")

    const lowerQuery = query.toLowerCase()
    return SEARCH_DATA.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    )
  }, [query])

  const suggestion = React.useMemo(() => {
    if (!query || results.length === 0) return ""
    const topResult = results[0].title
    if (topResult.toLowerCase().startsWith(query.toLowerCase())) {
      return query + topResult.slice(query.length)
    }
    return ""
  }, [query, results])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<Category, SearchResult[]>)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex].url)
      }
    } else if (e.key === "Tab" || e.key === "ArrowRight") {
      if (suggestion && query !== suggestion) {
        e.preventDefault()
        setQuery(suggestion)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 sm:max-w-[600px] overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <div className="flex items-center px-4 py-4 border-b border-slate-100 bg-white/50">
          <SearchIcon className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <div className="relative flex-1 flex items-center">
            {suggestion && (
              <div className="absolute inset-0 flex items-center pointer-events-none text-[16px] text-slate-300">
                <span className="opacity-0">{query}</span>
                <span>{suggestion.slice(query.length)}</span>
              </div>
            )}
            <input
              ref={inputRef}
              className="flex-1 bg-transparent border-none outline-none text-[16px] text-slate-900 placeholder:text-slate-400 relative z-10"
              placeholder="Search anything... (Employees, Assets, Candidates, Pages)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-1">
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100 sm:flex">
              <span className="text-xs">TAB</span>
            </kbd>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100 sm:flex">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>
        </div>

        <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {(() => {
            let absoluteIndex = 0;
            return Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className="p-2">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>{category}</span>
                  <span className="h-px flex-1 bg-slate-100 ml-3"></span>
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentIndex = absoluteIndex++;
                    const isActive = selectedIndex === currentIndex;
                    return (
                      <button
                        key={item.title + item.url}
                        ref={isActive ? activeItemRef : null}
                        onClick={() => onSelect(item.url)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
                          isActive ? "bg-slate-100" : "hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                          isActive ? (
                            category === "Pages" ? "bg-emerald-600 text-white" :
                              category === "Employees" ? "bg-blue-600 text-white" :
                                category === "Recruitment" ? "bg-purple-600 text-white" :
                                  "bg-indigo-600 text-white"
                          ) : (
                            category === "Pages" ? "bg-emerald-50 text-emerald-600" :
                              category === "Employees" ? "bg-blue-50 text-blue-600" :
                                category === "Recruitment" ? "bg-purple-50 text-purple-600" :
                                  "bg-indigo-50 text-indigo-600"
                          )
                        )}>
                          <item.icon className={cn("h-5 w-5", isActive && "animate-in zoom-in-75 duration-300")} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className={cn("text-sm font-semibold truncate", isActive ? "text-slate-900" : "text-slate-700")}>{item.title}</div>
                          <div className="text-[12px] text-slate-400 truncate">{item.description}</div>
                        </div>
                        <div className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <kbd className="rounded bg-white border shadow-sm px-1.5 py-0.5 font-mono text-[10px] text-slate-500">↵</kbd>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          {results.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                <SearchIcon className="h-8 w-8" />
              </div>
              <p className="text-base font-medium text-slate-900">No results found for &quot;{query}&quot;</p>
              <p className="text-sm text-slate-500 mt-1 max-w-[280px] mx-auto">
                We couldn&apos;t find anything matching your search. Try searching for a name, asset ID, or a module title.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-sm">↑↓</kbd>
              <span className="text-[10px] text-slate-400 font-medium">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-sm">↵</kbd>
              <span className="text-[10px] text-slate-400 font-medium">Select</span>
            </div>
          </div>
          <div className="text-[10px] font-semibold text-[#3CC3A3] flex items-center gap-1">
            <SearchIcon className="h-3 w-3" />
            GOEL ENTERPRISES Search
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
