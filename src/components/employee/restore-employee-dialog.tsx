"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Employee } from "@/types/employee"
import { useRestoreEmployeeMutation, useEmployeeIdInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { RotateCcw, CheckCircle2, AlertTriangle, Building2, Loader2, Key } from "lucide-react"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { AvailableEmployeeIdDialog } from "@/components/employee/available-employee-id-dialog"
import { cn } from "@/lib/utils"

interface RestoreEmployeeDialogProps {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RestoreEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: RestoreEmployeeDialogProps) {
  const [mode, setMode] = React.useState<"previous" | "new">("previous")
  const [selectedNewId, setSelectedNewId] = React.useState<string>("")
  const [selectedNewIdLabel, setSelectedNewIdLabel] = React.useState<string>("")
  const [searchTerm, setSearchTerm] = React.useState<string>("")

  const restoreMutation = useRestoreEmployeeMutation()
  const { data: companyResponse } = useCompanyDropdownQuery()

  const companies: any[] = React.useMemo(() => {
    if (Array.isArray(companyResponse)) return companyResponse
    if (companyResponse && Array.isArray((companyResponse as any).data)) {
      return (companyResponse as any).data
    }
    return []
  }, [companyResponse])

  // Resolve company details
  const companyObj = typeof employee?.companyId === "object" ? (employee?.companyId as any) : null
  const companyId = companyObj?._id || (typeof employee?.companyId === "string" ? employee?.companyId : undefined)
  const matchedCompany = companies.find((c) => c?._id === companyId || c?.id === companyId)
  const companyName = companyObj?.name || matchedCompany?.name || ""
  const companyPrefix = companyObj?.prefix || matchedCompany?.prefix || ""

  const prevIdDoc = employee?.employeeObjId
  const prevEmpId = prevIdDoc?.employeeId
  const prevIdObj = prevIdDoc?._id
  const isPrevAvailable = !!employee?.isPreviousEmployeeIdAvailable

  // Query available unassigned employee IDs filtered strictly by this employee's company
  const {
    data: availableIdsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingIds,
  } = useEmployeeIdInfiniteQuery(
    {
      search: searchTerm,
      prefix: companyPrefix || undefined,
      companyId: companyId || undefined,
    },
    open && mode === "new"
  )

  const availableIdsList = React.useMemo(() => {
    return availableIdsData?.pages.flatMap((page) => page.data) || []
  }, [availableIdsData])

  // Reset state when employee changes or dialog opens
  React.useEffect(() => {
    if (open && employee) {
      if (prevEmpId && isPrevAvailable) {
        setMode("previous")
      } else {
        setMode("new")
      }
      setSelectedNewId("")
      setSelectedNewIdLabel("")
      setSearchTerm("")
    }
  }, [open, employee, prevEmpId, isPrevAvailable])

  if (!employee) return null

  const handleRestore = () => {
    const targetEmpObjId = mode === "previous" ? prevIdObj : selectedNewId

    if (mode === "new" && !targetEmpObjId) {
      return
    }

    restoreMutation.mutate(
      {
        id: employee._id || employee.id,
        employeeObjId: targetEmpObjId,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
      }
    )
  }

  const isRestoreDisabled =
    restoreMutation.isPending ||
    (mode === "new" && !selectedNewId) ||
    (mode === "previous" && (!prevEmpId || !isPrevAvailable))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none rounded-[24px] shadow-2xl">
        {/* Header with decorative badge */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Restore Employee
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Reactivate account and allocate an Employee ID
              </DialogDescription>
            </div>
          </div>

          {/* Quick info chip */}
          <div className="mt-4 p-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{employee.name}</p>
                  <p className="text-xs text-slate-500">{employee.email || "No email"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] font-semibold bg-slate-50 text-slate-600 border-slate-200">
                  Punch ID: {employee.uniqueId}
                </Badge>
                <Badge variant="outline" className="text-[11px] font-semibold capitalize bg-emerald-50 text-emerald-700 border-emerald-200">
                  {employee.role}
                </Badge>
              </div>
            </div>

            {/* Company Tag */}
            {companyName && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Company:
                </span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  {companyName}
                  {companyPrefix && (
                    <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-200 px-1 rounded">
                      Prefix: {companyPrefix}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Employee ID Assignment
            </label>
            <p className="text-xs text-slate-500">
              Only Employee IDs related to <strong>{companyName || "this company"}</strong> are displayed.
            </p>
          </div>

          {/* Option 1: Previous Employee ID */}
          <div
            onClick={() => {
              if (isPrevAvailable) setMode("previous")
            }}
            className={cn(
              "relative p-4 rounded-2xl border transition-all select-none",
              isPrevAvailable
                ? "cursor-pointer hover:border-emerald-300"
                : "opacity-60 cursor-not-allowed bg-slate-50/50",
              mode === "previous" && isPrevAvailable
                ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs"
                : "border-slate-200 bg-white"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border flex items-center justify-center transition-all",
                    mode === "previous" && isPrevAvailable
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  )}
                >
                  {mode === "previous" && isPrevAvailable && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      Use Previous Employee ID
                    </span>
                    {prevEmpId && (
                      <span className="font-mono font-bold text-sm text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        {prevEmpId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {prevEmpId
                      ? `Retain the ID previously assigned to this employee in ${companyName || 'the company'}.`
                      : "No previous Employee ID found on record."}
                  </p>
                </div>
              </div>

              {prevEmpId ? (
                isPrevAvailable ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[11px] font-semibold gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none text-[11px] font-semibold gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Already Taken
                  </Badge>
                )
              ) : null}
            </div>

            {!isPrevAvailable && prevEmpId && (
              <div className="mt-3 text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{prevEmpId}</strong> has already been reassigned to another active employee. Please select an available Employee ID for {companyName || "this company"} below.
                </span>
              </div>
            )}
          </div>

          {/* Option 2: Assign New Employee ID */}
          <div
            onClick={() => setMode("new")}
            className={cn(
              "relative p-4 rounded-2xl border transition-all cursor-pointer",
              mode === "new"
                ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border flex items-center justify-center transition-all",
                    mode === "new"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  )}
                >
                  {mode === "new" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    Assign a New Employee ID
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select an unassigned ID matching <strong>{companyName || "the company"}</strong> ({companyPrefix || "All prefixes"}).
                  </p>
                </div>
              </div>
            </div>

            {/* Dropdown for new ID selection */}
            {mode === "new" && (
              <div className="mt-4 pt-3 border-t border-slate-200/70" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Available IDs for {companyName || "Company"} {companyPrefix ? `(${companyPrefix})` : ""} *
                  </label>
                  {availableIdsList.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {availableIdsList.length} unassigned ID(s)
                    </span>
                  )}
                </div>
                <InfiniteScrollSelect
                  placeholder={
                    isLoadingIds
                      ? "Loading available IDs..."
                      : availableIdsList.length === 0
                      ? `No unassigned IDs for ${companyName || 'company'}`
                      : `Select an ID for ${companyName || 'company'}`
                  }
                  searchPlaceholder={`Search ${companyPrefix ? `${companyPrefix}-` : ''}IDs...`}
                  items={availableIdsList}
                  value={selectedNewId}
                  onValueChange={(val, item) => {
                    setSelectedNewId(val)
                    setSelectedNewIdLabel(item?.employeeId || "")
                  }}
                  onSearchChange={setSearchTerm}
                  loadMore={() => fetchNextPage()}
                  hasNextPage={!!hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  isLoading={isLoadingIds && !availableIdsData}
                  getLabel={(item) => `${item.employeeId} ${item.remark ? `(${item.remark})` : ''}`}
                  getValue={(item) => item._id}
                  actionButton={
                    <div className="px-1 py-1" onPointerDown={(e) => e.stopPropagation()}>
                      <AvailableEmployeeIdDialog
                        triggerLabel={`Create ID for ${companyPrefix || 'Company'}`}
                        triggerClassName="w-full bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 h-8 text-xs font-bold"
                      />
                    </div>
                  }
                />

                {selectedNewIdLabel && (
                  <div className="mt-2 text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Selected: <strong>{selectedNewIdLabel}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <DialogFooter className="p-6 pt-2 bg-slate-50/60 border-t border-slate-100 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restoreMutation.isPending}
            className="rounded-xl border-slate-200 font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRestore}
            disabled={isRestoreDisabled}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {restoreMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Restore Employee</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
