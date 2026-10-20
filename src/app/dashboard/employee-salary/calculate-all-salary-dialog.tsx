"use client"

import * as React from "react"
import { 
  Calculator, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Search,
  IndianRupee,
  Users,
  Clock,
  CalendarDays,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SalarySlipDialog } from "./salary-slip-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useCalculateAllPayrollMutation } from "@/hooks/queries/use-salary"
import { useCompanyDropdownInfiniteQuery } from "@/hooks/queries/use-company"
import { BulkPayrollEmployeeItem } from "@/types/salary"
import { cn } from "@/lib/utils"

interface CalculateAllSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

const YEARS = ["2024", "2025", "2026", "2027"]

export function CalculateAllSalaryDialog({
  open,
  onOpenChange,
}: CalculateAllSalaryDialogProps) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear().toString()
  
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth.toString().padStart(2, '0'))
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
  const [filterSearch, setFilterSearch] = React.useState("")
  const [selectedSlipEmployee, setSelectedSlipEmployee] = React.useState<BulkPayrollEmployeeItem | null>(null)
  const [slipOpen, setSlipOpen] = React.useState(false)
  const [isBatchSlip, setIsBatchSlip] = React.useState(false)
  const [expandedEmployeeId, setExpandedEmployeeId] = React.useState<string | null>(null)

  const { data: companyData } = useCompanyDropdownInfiniteQuery()
  const allCompanies = companyData?.pages.flatMap(page => page.data) || []

  const calculateAllMutation = useCalculateAllPayrollMutation()

  const handleCalculateAll = () => {
    const period = `${selectedYear}-${selectedMonth}`;
    calculateAllMutation.mutate({
      month: period,
      companyId: selectedCompanyId === "all" ? undefined : selectedCompanyId,
    });
  }

  // Reset filter when opening
  React.useEffect(() => {
    if (!open) {
      setFilterSearch("")
    }
  }, [open])

  const result = calculateAllMutation.data
  const filteredResults = React.useMemo(() => {
    if (!result?.results) return []
    if (!filterSearch.trim()) return result.results
    const q = filterSearch.toLowerCase()
    return result.results.filter(
      (item: BulkPayrollEmployeeItem) =>
        item.employeeName?.toLowerCase().includes(q) ||
        item.employeeCode?.toLowerCase().includes(q)
    )
  }, [result, filterSearch])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[28px] shadow-2xl bg-white">
        <DialogHeader className="p-6 md:p-8 pb-4 bg-slate-50/80 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600" />
            Calculate All Salaries
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Run automated payroll calculation for all configured employees for the selected month.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Company
              </Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Companies</SelectItem>
                  {allCompanies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCalculateAll}
            disabled={calculateAllMutation.isPending}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all gap-2"
          >
            {calculateAllMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating All Employees...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Run Calculation for All Employees
              </>
            )}
          </Button>

          {/* Error Message */}
          {calculateAllMutation.isError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Calculation Error</h4>
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {calculateAllMutation.error instanceof Error ? calculateAllMutation.error.message : "Failed to calculate payroll."}
                </p>
              </div>
            </div>
          )}

          {/* Results Summary & Table */}
          {result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Employees</span>
                  </div>
                  <p className="text-2xl font-black text-indigo-950">
                    {result.summary.totalCalculated}
                    <span className="text-xs font-normal text-indigo-600 ml-1">/ {result.summary.totalConfigured}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <IndianRupee className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Payout</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-950">
                    ₹{result.summary.grandTotalNetPay.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Days</span>
                  </div>
                  <p className="text-2xl font-black text-amber-950">
                    {result.summary.grandTotalPaidDays}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total OT Hrs</span>
                  </div>
                  <p className="text-2xl font-black text-sky-950">
                    {result.summary.grandTotalOvertimeHours}
                  </p>
                </div>
              </div>

              {/* Action & Search Bar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      Employee Breakdown
                      <span className="text-xs font-normal text-slate-400">({filteredResults.length})</span>
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative w-40 sm:w-56">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search employee..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-xl border-slate-200"
                      />
                    </div>

                    {filteredResults.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsBatchSlip(true)
                          setSelectedSlipEmployee(null)
                          setSlipOpen(true)
                        }}
                        className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl gap-1.5 text-xs shadow-xs shrink-0"
                      >
                        <Printer className="h-3.5 w-3.5 text-teal-400" />
                        Print All Slips ({filteredResults.length})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                  <div className="bg-slate-50/90 px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold text-slate-500 uppercase">
                    <span className="col-span-5 sm:col-span-4">Employee</span>
                    <span className="col-span-2 hidden sm:block">Type</span>
                    <span className="col-span-3 sm:col-span-2 text-right">Days / OT</span>
                    <span className="col-span-2 text-right">Net Pay</span>
                    <span className="col-span-2 sm:col-span-2 text-right">Actions</span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredResults.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No employees found matching filter.
                      </div>
                    ) : (
                      filteredResults.map((emp: BulkPayrollEmployeeItem) => {
                        const isExpanded = expandedEmployeeId === emp.employeeId
                        return (
                          <div key={emp.employeeId} className="divide-y divide-slate-100/70">
                            {/* Main Row */}
                            <div className="px-4 py-3 grid grid-cols-12 items-center hover:bg-slate-50/70 transition-colors text-xs">
                              <div 
                                className="col-span-5 sm:col-span-4 min-w-0 pr-2 cursor-pointer flex items-center gap-1.5"
                                onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.employeeId)}
                              >
                                <button className="text-slate-400 hover:text-slate-700">
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <div>
                                  <p className="font-bold text-slate-900 truncate">{emp.employeeName}</p>
                                  {emp.employeeCode && (
                                    <p className="text-[10px] font-mono text-slate-400 font-medium">ID: {emp.employeeCode}</p>
                                  )}
                                </div>
                              </div>

                              <div className="col-span-2 hidden sm:block">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                                  emp.salaryType === "monthly" && "bg-indigo-50 text-indigo-700",
                                  emp.salaryType === "daily" && "bg-emerald-50 text-emerald-700",
                                  emp.salaryType === "hourly" && "bg-amber-50 text-amber-700"
                                )}>
                                  {emp.salaryType}
                                </span>
                              </div>

                              <div className="col-span-3 sm:col-span-2 text-right pr-2">
                                <p className="font-bold text-slate-800">{emp.totalPaidDays ?? 0} d</p>
                                <p className="text-[10px] text-slate-400">{emp.totalOvertimeHours ?? 0}h OT</p>
                              </div>

                              <div className="col-span-2 text-right pr-2">
                                {emp.status === "failed" ? (
                                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                    {emp.error || "Failed"}
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span className="font-black text-sm text-emerald-700">
                                      ₹{emp.netPay?.toLocaleString() || "0"}
                                    </span>
                                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                      Calculated
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.employeeId)}
                                  className="h-7 px-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                >
                                  {isExpanded ? "Hide" : "Details"}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setIsBatchSlip(false)
                                    setSelectedSlipEmployee(emp)
                                    setSlipOpen(true)
                                  }}
                                  className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold gap-1 shadow-xs"
                                  title="View Individual Payslip"
                                >
                                  <FileText className="h-3 w-3 text-teal-400" />
                                  Slip
                                </Button>
                              </div>
                            </div>

                            {/* Expandable Rich Breakdown Drawer */}
                            {isExpanded && (
                              <div className="bg-slate-50/90 p-4 border-t border-slate-100 animate-in fade-in duration-200 space-y-3">
                                {/* Attendance Breakdown Tiles */}
                                <div>
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                                    Attendance Details
                                  </span>
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
                                      <span className="text-[9px] font-bold text-emerald-600 uppercase block">Present Days</span>
                                      <span className="text-sm font-black text-slate-900">{emp.presentDays ?? 0} d</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
                                      <span className="text-[9px] font-bold text-amber-600 uppercase block">Half Days</span>
                                      <span className="text-sm font-black text-slate-900">{emp.halfDays ?? 0} d</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
                                      <span className="text-[9px] font-bold text-rose-500 uppercase block">Absent Days</span>
                                      <span className="text-sm font-black text-slate-900">{emp.absentDays ?? 0} d</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
                                      <span className="text-[9px] font-bold text-indigo-600 uppercase block">Paid Sundays</span>
                                      <span className="text-sm font-black text-slate-900">{emp.paidSundays ?? 0} d</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-teal-200 bg-teal-50/30 shadow-xs col-span-2 sm:col-span-1">
                                      <span className="text-[9px] font-bold text-teal-700 uppercase block">Total Paid</span>
                                      <span className="text-sm font-black text-teal-950">{emp.totalPaidDays ?? 0} d</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Financial Breakdown Tiles */}
                                <div>
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                                    Earnings &amp; Deductions
                                  </span>
                                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Base Pay</span>
                                      <span className="font-extrabold text-slate-900">₹{(emp.basePay ?? 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Overtime Pay</span>
                                      <span className="font-extrabold text-slate-900">₹{(emp.overtimePay ?? 0).toLocaleString()}</span>
                                      <span className="text-[9px] text-slate-400 block">({emp.totalOvertimeHours ?? 0}h @ ₹{emp.overtimeRate ?? 0}/h)</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Deductions (PF/ESI/LWF)</span>
                                      <span className="font-extrabold text-rose-700">₹{(emp.totalDeductions ?? 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-emerald-600 uppercase block">Net Pay</span>
                                      <span className="font-black text-base text-emerald-800">₹{(emp.netPay ?? 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <SalarySlipDialog
      data={isBatchSlip ? null : selectedSlipEmployee}
      items={isBatchSlip ? filteredResults : null}
      open={slipOpen}
      onOpenChange={setSlipOpen}
      month={`${selectedYear}-${selectedMonth}`}
      companyName={allCompanies.find(c => c._id === selectedCompanyId)?.name}
    />
    </>
  )
}

