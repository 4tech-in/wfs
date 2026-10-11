"use client"

import * as React from "react"
import { 
  CalendarDays, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  X 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { attendanceService } from "@/services/attendance-service"
import { exportToCSV, exportToExcel } from "@/lib/export-utils"
import { toast } from "sonner"

interface MonthlyAttendanceExportDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultCompanyId?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function MonthlyAttendanceExportDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultCompanyId = "all"
}: MonthlyAttendanceExportDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? controlledOnOpenChange : setInternalOpen

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = React.useState<number>(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = React.useState<number>(currentDate.getFullYear())
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(defaultCompanyId)
  const [includeTimes, setIncludeTimes] = React.useState<boolean>(true)
  const [isExporting, setIsExporting] = React.useState<boolean>(false)

  const { data: companiesData } = useCompanyDropdownQuery()
  const companies = companiesData?.data || []

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const handleExportMatrix = async (format: "excel" | "csv") => {
    try {
      setIsExporting(true)
      const res = await attendanceService.getMonthlyMatrix(
        selectedYear,
        selectedMonth,
        selectedCompanyId === "all" ? undefined : selectedCompanyId
      )

      if (!res?.data || res.data.length === 0) {
        toast.error("No employee attendance records found for this month")
        return
      }

      const totalDays = res.totalDays || 31
      const monthName = MONTH_NAMES[selectedMonth - 1]

      // Format matrix rows for Excel / CSV
      const rows = res.data.map((item, index) => {
        const row: Record<string, unknown> = {
          "S.No": index + 1,
          "Employee ID": item.user?.employeeId || "N/A",
          "Employee Name": item.user?.name || "N/A",
          "Designation": item.user?.designation || "N/A",
          "Department": item.user?.department || "N/A",
          "Company": item.user?.companyName || "N/A",
        }

        // Fill days 1 to totalDays with status and checkin/checkout below
        for (let d = 1; d <= totalDays; d++) {
          const dayData = item.days[d]
          let statusLabel = "--"
          if (dayData) {
            if (dayData.status === "Present") statusLabel = "P"
            else if (dayData.status === "Absent") statusLabel = "A"
            else if (dayData.status === "Half-Day") statusLabel = "HD"
            else if (dayData.status === "On Leave") statusLabel = "L"
            else if (dayData.status === "WeeklyOff") statusLabel = "WO"
            else if (dayData.status === "Holiday") statusLabel = "H"
            else statusLabel = dayData.status || "--"
          }

          if (includeTimes && dayData) {
            const hasIn = Boolean(dayData.punchIn)
            const hasOut = Boolean(dayData.punchOut)

            if (hasIn && hasOut) {
              row[`Day ${d}`] = `${statusLabel}\nIn: ${dayData.punchIn}\nOut: ${dayData.punchOut}`
            } else if (hasIn) {
              row[`Day ${d}`] = `${statusLabel}\nIn: ${dayData.punchIn}`
            } else if (hasOut) {
              row[`Day ${d}`] = `${statusLabel}\nOut: ${dayData.punchOut}`
            } else {
              row[`Day ${d}`] = statusLabel
            }
          } else {
            row[`Day ${d}`] = statusLabel
          }
        }

        // Summary counts
        row["Present Days"] = item.summary?.present || 0
        row["Absent Days"] = item.summary?.absent || 0
        row["Half-Days"] = item.summary?.halfDay || 0
        row["Leave Days"] = item.summary?.onLeave || 0
        row["Total Worked (Hours)"] = item.summary?.totalWorkedHours || 0
        row["Overtime (Hours)"] = item.summary?.overtimeHours || 0

        return row
      })

      const filename = `Monthly_Attendance_Sheet_${monthName}_${selectedYear}`

      if (format === "excel") {
        exportToExcel(rows, filename, `${monthName}_${selectedYear}`)
      } else {
        exportToCSV(rows, filename)
      }

      toast.success(`Exported ${monthName} ${selectedYear} attendance successfully`)
      setIsOpen?.(false)
    } catch (err) {
      console.error("Monthly export failed", err)
      toast.error("Failed to generate monthly export")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportDetailed = async () => {
    try {
      setIsExporting(true)
      const res = await attendanceService.getMonthlyMatrix(
        selectedYear,
        selectedMonth,
        selectedCompanyId === "all" ? undefined : selectedCompanyId
      )

      if (!res?.data || res.data.length === 0) {
        toast.error("No employee attendance records found for this month")
        return
      }

      const totalDays = res.totalDays || 31
      const monthName = MONTH_NAMES[selectedMonth - 1]

      // Flatten each user x day into individual punch logs
      const detailedRows: Record<string, unknown>[] = []
      let rowNum = 1

      res.data.forEach((item) => {
        for (let d = 1; d <= totalDays; d++) {
          const dayData = item.days[d]
          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`

          detailedRows.push({
            "S.No": rowNum++,
            "Date": dateStr,
            "Day": d,
            "Employee ID": item.user?.employeeId || "N/A",
            "Employee Name": item.user?.name || "N/A",
            "Designation": item.user?.designation || "N/A",
            "Company": item.user?.companyName || "N/A",
            "Punch In": dayData?.punchIn || "--:--",
            "Punch Out": dayData?.punchOut || "--:--",
            "Worked Hours": dayData?.hours || 0,
            "Status": dayData?.status || "Not Marked"
          })
        }
      })

      const filename = `Monthly_Attendance_Detailed_${monthName}_${selectedYear}`
      exportToExcel(detailedRows, filename, "Detailed Log")

      toast.success(`Exported detailed logs for ${monthName} ${selectedYear} successfully`)
      setIsOpen?.(false)
    } catch (err) {
      console.error("Detailed export failed", err)
      toast.error("Failed to export detailed records")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px] p-6 rounded-[28px] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CalendarDays className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">Attendance Export</span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            Monthly Attendance Export
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-xs">
            Download the complete month attendance matrix or detailed daily logs for all employees.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => setSelectedMonth(Number(val))}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-xs text-slate-700">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-60">
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)} className="text-xs font-semibold">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Year</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-xs text-slate-700">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs font-semibold">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-xs text-slate-700">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="text-xs font-semibold">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company._id} value={company._id} className="text-xs font-semibold">
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5 pr-2">
              <Label className="text-xs font-bold text-slate-700 cursor-pointer" htmlFor="includeTimes">
                Show Punch In / Out Below Status
              </Label>
              <p className="text-[10px] text-slate-400 font-medium">
                Includes punch-in and punch-out (or single punch if only one available) below P / A / HD
              </p>
            </div>
            <input
              id="includeTimes"
              type="checkbox"
              checked={includeTimes}
              onChange={(e) => setIncludeTimes(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Export Options */}
          <div className="pt-2 space-y-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Choose Export Format</p>
            
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                onClick={() => handleExportMatrix("excel")}
                disabled={isExporting}
                className="h-14 flex flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <span>Monthly Sheet (Excel)</span>
              </Button>

              <Button
                onClick={() => handleExportMatrix("csv")}
                disabled={isExporting}
                variant="outline"
                className="h-14 flex flex-col items-center justify-center gap-1 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-500" />
                )}
                <span>Monthly Sheet (CSV)</span>
              </Button>
            </div>

            <Button
              onClick={handleExportDetailed}
              disabled={isExporting}
              variant="outline"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs shadow-none active:scale-95 transition-all"
            >
              <Download className="h-4 w-4 text-slate-400" />
              <span>Export Detailed Day-by-Day Logs (Excel)</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-end border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => setIsOpen?.(false)}
            disabled={isExporting}
            className="text-slate-400 font-semibold text-xs hover:bg-slate-50 rounded-xl"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
