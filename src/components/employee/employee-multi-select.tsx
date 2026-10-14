"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X, Users, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useDebounce } from "@/hooks/use-debounce"
import { EmployeeDropdownItem } from "@/types/employee"

interface EmployeeMultiSelectProps {
  values?: string[]
  departmentId?: string
  onValuesChange: (values: string[], employees: EmployeeDropdownItem[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function EmployeeMultiSelect({
  values = [],
  departmentId,
  onValuesChange,
  placeholder = "Select employee(s)...",
  className,
  disabled = false,
}: EmployeeMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [hasBeenOpened, setHasBeenOpened] = React.useState(false)
  const debouncedSearch = useDebounce(search, 400)

  // Track all discovered employees so we can resolve names for selected chips
  const [knownEmployees, setKnownEmployees] = React.useState<Map<string, EmployeeDropdownItem>>(
    () => new Map()
  )

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useEmployeesDropdownInfiniteQuery(
    { search: debouncedSearch, departmentId: departmentId || undefined, limit: 20 },
    hasBeenOpened || values.length > 0
  )

  const currentEmployees = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? []
  }, [data])

  // Update known employees map whenever new data arrives
  React.useEffect(() => {
    if (currentEmployees.length > 0) {
      setKnownEmployees((prev) => {
        const next = new Map(prev)
        for (const emp of currentEmployees) {
          if (emp._id) next.set(emp._id, emp)
        }
        return next
      })
    }
  }, [currentEmployees])

  const toggleEmployee = (emp: EmployeeDropdownItem) => {
    const isSelected = values.includes(emp._id)
    let nextValues: string[]

    if (isSelected) {
      nextValues = values.filter((id) => id !== emp._id)
    } else {
      nextValues = [...values, emp._id]
    }

    const selectedList = nextValues
      .map((id) => knownEmployees.get(id) || currentEmployees.find((e) => e._id === id))
      .filter(Boolean) as EmployeeDropdownItem[]

    onValuesChange(nextValues, selectedList)
  }

  const removeEmployee = (idToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const nextValues = values.filter((id) => id !== idToRemove)
    const selectedList = nextValues
      .map((id) => knownEmployees.get(id) || currentEmployees.find((e) => e._id === id))
      .filter(Boolean) as EmployeeDropdownItem[]
    onValuesChange(nextValues, selectedList)
  }

  const handleSelectAllCurrent = () => {
    const newIds = new Set(values)
    for (const emp of currentEmployees) {
      newIds.add(emp._id)
    }
    const nextValues = Array.from(newIds)
    const selectedList = nextValues
      .map((id) => knownEmployees.get(id) || currentEmployees.find((e) => e._id === id))
      .filter(Boolean) as EmployeeDropdownItem[]
    onValuesChange(nextValues, selectedList)
  }

  const handleClearAll = () => {
    onValuesChange([], [])
  }

  // Determine trigger label
  const triggerLabel = React.useMemo(() => {
    if (values.length === 0) return placeholder
    if (values.length === 1) {
      const emp = knownEmployees.get(values[0]) || currentEmployees.find((e) => e._id === values[0])
      return emp
        ? `${emp.name}${emp.otherName ? ` (${emp.otherName})` : ""} · ${emp.employeeId}`
        : "1 Employee selected"
    }
    return `${values.length} Employees selected`
  }, [values, knownEmployees, currentEmployees, placeholder])

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (newOpen) setHasBeenOpened(true)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-10 px-3 text-sm font-medium rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all",
              values.length > 0 && "border-emerald-500/50 ring-1 ring-emerald-500/10",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Users className="h-4 w-4 shrink-0 text-slate-400" />
              <span className={cn("truncate", values.length === 0 && "text-slate-400")}>
                {triggerLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {values.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] px-1.5 py-0 h-5 font-bold border border-emerald-200"
                >
                  {values.length}
                </Badge>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[380px] p-0 rounded-2xl border-slate-200 shadow-xl overflow-hidden"
          align="start"
        >
          {/* Search bar */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <Input
              placeholder="Search by name or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-xs px-1"
            />
          </div>

          {/* Bulk actions bar */}
          <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>
              {values.length} selected
            </span>
            <div className="flex items-center gap-2">
              {currentEmployees.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllCurrent}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Select Visible
                </button>
              )}
              {values.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* List of employees with scroll and infinite load */}
          <div className="max-h-[260px] overflow-y-auto p-1.5 custom-scrollbar divide-y divide-slate-50">
            {isLoading && currentEmployees.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading employees...</span>
              </div>
            ) : currentEmployees.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No employees found matching &quot;{search}&quot;
              </div>
            ) : (
              currentEmployees.map((emp) => {
                const isChecked = values.includes(emp._id)
                return (
                  <div
                    key={emp._id}
                    onClick={() => toggleEmployee(emp)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors text-xs select-none",
                      isChecked ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                        isChecked
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isChecked && <Check className="size-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-semibold truncate", isChecked ? "text-emerald-900" : "text-slate-800")}>
                        {emp.name}
                        {emp.otherName && (
                          <span className="text-slate-400 font-normal ml-1">
                            ({emp.otherName})
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        ID: <span className="font-mono font-medium text-slate-600">{emp.employeeId || "N/A"}</span>
                        {emp.departmentName && ` · ${emp.departmentName}`}
                      </p>
                    </div>
                  </div>
                )
              })
            )}

            {hasNextPage && (
              <div className="p-2 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="h-7 text-xs w-full text-slate-500 hover:text-emerald-600 cursor-pointer"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    "Load More..."
                  )}
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected employee pill chips */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto p-1 custom-scrollbar">
          {values.map((id) => {
            const emp = knownEmployees.get(id) || currentEmployees.find((e) => e._id === id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium px-2 py-0.5 rounded-lg shadow-2xs animate-in fade-in zoom-in-95 duration-150"
              >
                <span className="truncate max-w-[140px]">
                  {emp ? emp.name : id.slice(-6)}
                </span>
                {emp?.employeeId && (
                  <span className="font-mono text-[9px] text-emerald-600 font-bold bg-white/70 px-1 rounded">
                    {emp.employeeId}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => removeEmployee(id, e)}
                  className="hover:bg-emerald-200/60 rounded p-0.5 text-emerald-600 hover:text-emerald-900 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
