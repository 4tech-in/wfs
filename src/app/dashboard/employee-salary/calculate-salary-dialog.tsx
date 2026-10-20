"use client"

import * as React from "react"
import { 
  Calculator, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useCalculatePayrollQuery } from "@/hooks/queries/use-salary"
import { cn } from "@/lib/utils"
import { SalarySlipDialog } from "./salary-slip-dialog"

interface CalculateSalaryDialogProps {
  employeeId: string | null;
  employeeName: string | null;
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

export function CalculateSalaryDialog({
  employeeId,
  employeeName,
  open,
  onOpenChange,
}: CalculateSalaryDialogProps) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear().toString()
  
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth.toString().padStart(2, '0'))
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  const [isCalculating, setIsCalculating] = React.useState(false)
  const [monthToCalculate, setMonthToCalculate] = React.useState<string>("")
  const [slipOpen, setSlipOpen] = React.useState(false)

  const { data: calculationResult, isLoading, isError, error, refetch, isFetching } = useCalculatePayrollQuery(
    employeeId || "",
    monthToCalculate
  )

  const handleCalculate = () => {
    const period = `${selectedYear}-${selectedMonth}`;
    if (monthToCalculate === period) {
       refetch();
    } else {
       setIsCalculating(true);
       setMonthToCalculate(period);
    }
  }

  // Reset state when opening/closing
  React.useEffect(() => {
    if (!open) {
      setMonthToCalculate("")
      setIsCalculating(false)
    }
  }, [open])

  // Stop loading state when data is in
  React.useEffect(() => {
    if (!isLoading && !isFetching) {
      setIsCalculating(false)
    }
  }, [isLoading, isFetching])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[28px] shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-slate-50/80 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-500" />
            Salary Calculator
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Calculate estimated earnings and generate payslip for {employeeName}.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCalculate}
            disabled={isCalculating || isLoading || isFetching}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            {isCalculating || isLoading || isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Run Calculation"
            )}
          </Button>

          {/* Result Area */}
          {(calculationResult || isError) && (
            <div className={cn(
              "p-6 rounded-2xl border animate-in fade-in zoom-in duration-300",
              isError ? "bg-rose-50 border-rose-100" : "bg-emerald-50/50 border-emerald-100"
            )}>
              {isError ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Calculation Error</h4>
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {error instanceof Error ? error.message : "Failed to calculate payroll for this period."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-emerald-900">Net Calculated Salary</span>
                    </div>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Generated</Badge>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                     <span className="text-sm font-medium text-emerald-600">₹</span>
                     <span className="text-3xl font-black text-emerald-900 tracking-tight">
                        {calculationResult?.netPay?.toLocaleString() || "0"}
                     </span>
                  </div>

                  <div className="pt-4 border-t border-emerald-100/50 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-100/40">
                      <p className="text-[9px] font-bold text-emerald-600/70 uppercase">Paid Days</p>
                      <p className="text-sm font-black text-emerald-950">{calculationResult?.totalPaidDays || "0"}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-100/40">
                      <p className="text-[9px] font-bold text-emerald-600/70 uppercase">OT Hours</p>
                      <p className="text-sm font-black text-emerald-950">{calculationResult?.totalOvertimeHours || "0"}h</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-100/40">
                      <p className="text-[9px] font-bold text-emerald-600/70 uppercase">Present</p>
                      <p className="text-sm font-black text-emerald-950">{calculationResult?.presentDays ?? 0} d</p>
                    </div>
                  </div>

                  {calculationResult?.payrollDetails && (
                    <div className="pt-3 border-t border-emerald-100/50 space-y-2">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earnings & Deductions</p>
                       <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white/70 p-2 rounded-lg border border-emerald-100/30">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Basic</p>
                             <p className="text-xs font-black text-slate-700">₹{calculationResult.payrollDetails.basic || 0}</p>
                          </div>
                          <div className="bg-white/70 p-2 rounded-lg border border-emerald-100/30">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">OT Pay</p>
                             <p className="text-xs font-black text-slate-700">₹{calculationResult.overtimePay || 0}</p>
                          </div>
                          <div className="bg-white/70 p-2 rounded-lg border border-emerald-100/30">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">PF / Ded</p>
                             <p className="text-xs font-black text-slate-700">₹{calculationResult.totalDeductions || calculationResult.payrollDetails.pfEmployee || 0}</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* View Salary Slip Action */}
                  <Button
                    onClick={() => setSlipOpen(true)}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow gap-2 text-xs"
                  >
                    <FileText className="h-4 w-4 text-teal-400" />
                    View &amp; Print Salary Slip
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <SalarySlipDialog
      data={calculationResult || null}
      open={slipOpen}
      onOpenChange={setSlipOpen}
      month={monthToCalculate}
    />
    </>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white",
      className
    )}>
      {children}
    </span>
  )
}
