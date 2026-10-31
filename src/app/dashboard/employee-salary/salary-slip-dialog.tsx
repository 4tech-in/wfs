"use client"

import * as React from "react"
import { 
  Printer, 
  X, 
  CalendarDays, 
  Building2, 
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  FileText,
  Download,
  Loader2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PayrollCalculationResult, BulkPayrollEmployeeItem } from "@/types/salary"
import { downloadPayslipPdf, printPayslipPdf } from "./payslip-pdf"

interface SalarySlipDialogProps {
  data?: PayrollCalculationResult | BulkPayrollEmployeeItem | null
  items?: BulkPayrollEmployeeItem[] | null
  open: boolean
  onOpenChange: (open: boolean) => void
  month?: string // YYYY-MM
  companyName?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function getFormattedMonthYear(monthStr?: string): string {
  if (!monthStr) return ""
  const [y, m] = monthStr.split("-")
  const mIndex = parseInt(m, 10) - 1
  return `${MONTH_NAMES[mIndex] || ""} ${y || ""}`.trim()
}

function numberToWordsINR(amount: number): string {
  const rounded = Math.floor(amount)
  const paise = Math.round((amount - rounded) * 100)

  if (rounded === 0 && paise === 0) return "Zero Rupees Only"

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function numToWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "")
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + numToWords(n % 100) : "")
    return ""
  }

  function convertIndian(n: number): string {
    let result = ""
    const crore = Math.floor(n / 10000000)
    n %= 10000000
    const lakh = Math.floor(n / 100000)
    n %= 100000
    const thousand = Math.floor(n / 1000)
    n %= 1000
    const hundred = n

    if (crore > 0) result += numToWords(crore) + " Crore "
    if (lakh > 0) result += numToWords(lakh) + " Lakh "
    if (thousand > 0) result += numToWords(thousand) + " Thousand "
    if (hundred > 0) result += numToWords(hundred) + " "

    return result.trim()
  }

  let words = "Rupees " + convertIndian(rounded)
  if (paise > 0) {
    words += " and " + numToWords(paise) + " Paise"
  }
  words += " Only"
  return words
}

/**
 * Reusable single payslip card component
 */
function SinglePayslipCard({
  item,
  month,
  defaultCompany,
}: {
  item: PayrollCalculationResult | BulkPayrollEmployeeItem
  month?: string
  defaultCompany?: string
}) {
  const displayMonth = getFormattedMonthYear((item as any).month || month)
  const companyName = item.companyName || defaultCompany || "GOEL ENTERPRISES"
  const employeeName = item.employeeName || "Employee"
  const employeeCode = item.employeeCode || "N/A"
  const designation = item.designation || "Staff"
  const department = item.department || "Operations"
  const doj = item.doj || "N/A"
  const aadharNo = item.aadharNo || "N/A"
  const mobileNo = item.mobileNo || "N/A"
  const pfNo = item.pfNo || "N/A"
  const esiNo = item.esiNo || "N/A"

  // Attendance metrics
  const totalCalendarDays = item.totalCalendarDays || 31
  const totalWorkingDays = item.totalWorkingDays || 27
  const presentDays = item.presentDays ?? 0
  const halfDays = item.halfDays ?? 0
  const absentDays = item.absentDays ?? 0
  const paidSundays = item.paidSundays ?? 0
  const totalPaidDays = item.totalPaidDays ?? 0
  const totalOtHours = item.totalOvertimeHours ?? 0
  const otRate = item.overtimeRate ?? 0

  // Financials
  const basicSalaryPolicy = item.basicSalary ?? 0   // configured salary from payroll policy (backend)
  const basic = item.payrollDetails?.basic ?? (item.basePay || 0)
  const hra = item.payrollDetails?.hra ?? 0
  const conveyance = item.payrollDetails?.conveyance ?? 0
  const otPay = item.overtimePay ?? 0
  const grossEarnings = item.grossEarnings ?? (basic + hra + conveyance + otPay)

  // Half-day pay: comes directly from backend (correctly calculated as basicSalary/workingDays × 0.5 × halfDays)
  const halfDaySalary = item.halfDaySalary ?? 0
  const rate = (item as any).rate ?? 0

  const pfEmployee = item.payrollDetails?.pfEmployee ?? 0
  const esiEmployee = item.payrollDetails?.esiEmployee ?? 0
  const lwfEmployee = item.payrollDetails?.lwfEmployee ?? 0
  const totalDeductions = item.totalDeductions ?? (pfEmployee + esiEmployee + lwfEmployee)

  const netPay = item.netPay ?? (grossEarnings - totalDeductions)

  return (
    <div className="payslip-page w-full max-w-[760px] mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm print:shadow-none print:border-none print:p-8 text-slate-800 print:text-black font-sans text-xs space-y-5 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
            {companyName}
          </h1>
          <p className="text-[11px] font-semibold text-slate-500">
            Industrial &amp; Corporate Services &bull; Payroll Division
          </p>
          <p className="text-[10px] text-slate-400">
            Official Salary Slip &bull; Regulated Employment Standards
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded-md text-[10px] font-extrabold uppercase tracking-widest">
            Payslip
          </span>
          <p className="text-xs font-black text-slate-900 mt-1 uppercase">
            {displayMonth}
          </p>
          <p className="text-[9px] text-slate-400">
            Generated: {new Date().toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      {/* Employee Details Grid */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-[11px]">
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">Employee Name</span>
            <span className="font-extrabold text-slate-900 uppercase">{employeeName}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">Employee Code</span>
            <span className="font-bold text-slate-800">{employeeCode || "N/A"}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">Designation</span>
            <span className="font-bold text-slate-800">{designation}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">Department</span>
            <span className="font-bold text-slate-800">{department}</span>
          </div>

          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">Date of Joining</span>
            <span className="font-medium text-slate-700">{doj}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">Aadhar / Mobile</span>
            <span className="font-medium text-slate-700">{aadharNo !== "N/A" ? aadharNo : mobileNo}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">PF Number</span>
            <span className="font-medium text-slate-700">{pfNo}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold uppercase text-slate-400">ESI Number</span>
            <span className="font-medium text-slate-700">{esiNo}</span>
          </div>
        </div>
      </div>

      {/* Attendance & Calendar Summary */}
      <div>
        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 text-slate-500" />
          Attendance &amp; Calendar Summary ({displayMonth})
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Cal Days</span>
            <span className="text-xs font-black text-slate-800">{totalCalendarDays}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Work Days</span>
            <span className="text-xs font-black text-slate-800">{totalWorkingDays}</span>
          </div>
          <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
            <span className="block text-[8px] font-bold text-emerald-600 uppercase">Present</span>
            <span className="text-xs font-black text-emerald-900">{presentDays}</span>
          </div>
          <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
            <span className="block text-[8px] font-bold text-amber-600 uppercase">Half Day</span>
            <span className="text-xs font-black text-amber-900">{halfDays}</span>
          </div>
          <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-100">
            <span className="block text-[8px] font-bold text-rose-500 uppercase">Absent</span>
            <span className="text-xs font-black text-rose-900">{absentDays}</span>
          </div>
          <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
            <span className="block text-[8px] font-bold text-indigo-600 uppercase">Paid Sun</span>
            <span className="text-xs font-black text-indigo-900">{paidSundays}</span>
          </div>
          <div className="bg-teal-50 p-2 rounded-lg border border-teal-200">
            <span className="block text-[8px] font-bold text-teal-700 uppercase">Paid Days</span>
            <span className="text-xs font-black text-teal-950">{totalPaidDays}</span>
          </div>
          <div className="bg-sky-50 p-2 rounded-lg border border-sky-200">
            <span className="block text-[8px] font-bold text-sky-700 uppercase">OT Hours</span>
            <span className="text-xs font-black text-sky-950">{totalOtHours}h</span>
          </div>
        </div>
      </div>

      {/* Earnings & Deductions Table */}
      <div className="border border-slate-300 rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-slate-300">
          {/* Earnings Side */}
          <div>
            <div className="bg-slate-100 px-3.5 py-1.5 font-black uppercase text-[10px] text-slate-800 tracking-wider flex justify-between border-b border-slate-300">
              <span>Earnings</span>
              <span>Amount (₹)</span>
            </div>
            <div className="p-3 space-y-1.5 divide-y divide-slate-100 text-[11px]">
              {basicSalaryPolicy > 0 && (
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 italic">Basic Salary (Policy)</span>
                  <span className="font-bold text-indigo-700">₹{basicSalaryPolicy.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Basic Pay</span>
                <span className="font-bold text-slate-900">₹{basic.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {hra > 0 && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-600">House Rent Allowance (HRA)</span>
                  <span className="font-bold text-slate-900">₹{hra.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {conveyance > 0 && (
                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-600">Conveyance Allowance</span>
                  <span className="font-bold text-slate-900">₹{conveyance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {halfDays > 0 && halfDaySalary > 0 && (
                <div className="flex justify-between pt-1.5">
                  <div>
                    <span className="text-amber-700 block">Half Day Pay ({halfDays} day{halfDays > 1 ? 's' : ''})</span>
                    <span className="text-[9px] text-amber-500">
                      (₹{basicSalaryPolicy.toLocaleString()} ÷ {(item as any).totalWorkingDays ?? 0} days × 0.5)
                    </span>
                  </div>
                  <span className="font-bold text-amber-700 self-center">₹{halfDaySalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {otPay > 0 && (
                <div className="flex justify-between pt-1.5">
                  <div>
                    <span className="text-slate-600 block">Overtime Pay</span>
                    <span className="text-[9px] text-slate-400">({totalOtHours} hrs @ ₹{otRate}/hr)</span>
                  </div>
                  <span className="font-bold text-slate-900 self-center">₹{otPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deductions Side */}
          <div>
            <div className="bg-slate-100 px-3.5 py-1.5 font-black uppercase text-[10px] text-slate-800 tracking-wider flex justify-between border-b border-slate-300">
              <span>Deductions</span>
              <span>Amount (₹)</span>
            </div>
            <div className="p-3 space-y-1.5 divide-y divide-slate-100 text-[11px]">
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Provident Fund (PF)</span>
                <span className="font-bold text-slate-900">₹{pfEmployee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600">ESI (Health Insurance)</span>
                <span className="font-bold text-slate-900">₹{esiEmployee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-600">Labour Welfare Fund (LWF)</span>
                <span className="font-bold text-slate-900">₹{lwfEmployee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals Row */}
        <div className="grid grid-cols-2 divide-x divide-slate-300 border-t border-slate-300 bg-slate-50 font-black text-[11px]">
          <div className="px-3.5 py-2 flex justify-between text-emerald-900">
            <span>Gross Earnings</span>
            <span>₹{grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="px-3.5 py-2 flex justify-between text-rose-900">
            <span>Total Deductions</span>
            <span>₹{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Net Salary Payable Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 shadow-xs">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-widest text-teal-400">
            Net Salary Payable
          </span>
          <p className="text-xs font-semibold text-slate-300 italic mt-0.5">
            {numberToWordsINR(netPay)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ₹{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Footer and Signatures */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px]">
        <div>
          <div className="h-9 flex items-end justify-center">
            <div className="border-b border-dashed border-slate-400 w-44"></div>
          </div>
          <span className="block font-bold text-slate-700 mt-1 uppercase">Employee Signature</span>
          <span className="text-[9px] text-slate-400">Acknowledgment of Receipt</span>
        </div>

        <div>
          <div className="h-9 flex items-end justify-center">
            <div className="border-b border-dashed border-slate-400 w-44"></div>
          </div>
          <span className="block font-bold text-slate-700 mt-1 uppercase">For {companyName}</span>
          <span className="text-[9px] text-slate-400">Authorized Signatory / Seal</span>
        </div>
      </div>

      <p className="text-center text-[8px] text-slate-400 italic pt-1">
        This is a computer-generated salary slip prepared in accordance with the enterprise payroll policies.
      </p>
    </div>
  )
}

export function SalarySlipDialog({
  data,
  items,
  open,
  onOpenChange,
  month,
  companyName
}: SalarySlipDialogProps) {
  // Determine if in Batch Mode
  const isBatch = Array.isArray(items) && items.length > 0
  const activeItems = isBatch ? items : (data ? [data] : [])
  const [activeTab, setActiveTab] = React.useState<number>(0) // for previewing in UI
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)

  if (!open || activeItems.length === 0) return null

  const displayMonth = getFormattedMonthYear(month || (activeItems[0] as any)?.month)
  const resolvedCompany = companyName || activeItems[0]?.companyName || "GOEL ENTERPRISES"

  // 1. Download official vector PDF generated by @react-pdf/renderer
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true)
      const empName = !isBatch 
        ? (activeItems[0]?.employeeName || "Employee").replace(/\s+/g, "_") 
        : resolvedCompany.replace(/\s+/g, "_")
      const filename = `Payslip_${empName}_${month || "Monthly"}.pdf`
      await downloadPayslipPdf(activeItems, filename, month, resolvedCompany)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // 2. Print directly via @react-pdf/renderer
  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true)
      await printPayslipPdf(activeItems, month, resolvedCompany)
    } catch (err) {
      console.error("PDF print failed:", err)
      // Fallback to iframe print
      handleIframePrint()
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // 3. Robust iframe print fallback (never prints blank pages)
  const handleIframePrint = () => {
    const printArea = document.querySelector(".printable-payslip-area")
    if (!printArea) {
      window.print()
      return
    }
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: white; color: #0f172a; padding: 10px; }
            .payslip-page { page-break-after: always; break-after: page; margin-bottom: 20px; padding: 25px; border: 1px solid #cbd5e1; border-radius: 12px; }
            .payslip-page:last-child { page-break-after: auto; break-after: auto; margin-bottom: 0; }
            @media print {
              body { padding: 0; }
              .payslip-page { border: none; padding: 12mm 10mm; margin-bottom: 0; }
            }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
        </body>
      </html>
    `)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 2000)
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[880px] max-h-[96vh] flex flex-col p-0 overflow-hidden border-none rounded-2xl shadow-2xl bg-slate-100 print:shadow-none print:max-h-none print:w-full print:p-0">
        <DialogTitle className="sr-only">
          {isBatch ? `Company Salary Slips (${activeItems.length})` : "Employee Salary Slip"}
        </DialogTitle>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-payslip-area, .printable-payslip-area * {
                visibility: visible !important;
              }
              .printable-payslip-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              .payslip-page {
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 auto !important;
                padding: 12mm 10mm !important;
                border: none !important;
                box-shadow: none !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              .payslip-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            }
          `
        }} />

        {/* Actions bar - hidden during print */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-teal-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                {isBatch ? `Company All Salary Slips (${activeItems.length} Employees)` : "Official Salary Slip"}
              </span>
              <span className="text-[10px] text-slate-400 ml-2">&bull; {displayMonth}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg gap-1.5 text-xs border border-slate-700 shadow-xs"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
              ) : (
                <Download className="h-3.5 w-3.5 text-teal-400" />
              )}
              Download PDF
            </Button>

            <Button
              size="sm"
              disabled={isGeneratingPdf}
              onClick={handlePrintPdf}
              className="h-8 px-3.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold rounded-lg gap-1.5 text-xs shadow"
            >
              <Printer className="h-3.5 w-3.5" />
              {isBatch ? `Print All Slips (${activeItems.length})` : "Print Slip"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Batch mode selector bar if multiple employees */}
        {isBatch && activeItems.length > 1 && (
          <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs print:hidden shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Preview Employee:</span>
              {activeItems.map((emp, idx) => (
                <button
                  key={emp.employeeId}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    activeTab === idx
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {emp.employeeName}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-teal-600 font-bold uppercase shrink-0 ml-3 hidden sm:block">
              &bull; Printing will print all {activeItems.length} slips automatically
            </div>
          </div>
        )}

        {/* Printable Payslips Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible bg-slate-100">
          <div className="printable-payslip-area space-y-6 print:space-y-0">
            {isBatch ? (
              // In UI: show selected employee or all; in Print: show all sequential pages
              activeItems.map((emp, idx) => (
                <div
                  key={emp.employeeId}
                  className={`${idx !== activeTab ? "hidden print:block" : "block"}`}
                >
                  <SinglePayslipCard
                    item={emp}
                    month={month}
                    defaultCompany={companyName}
                  />
                </div>
              ))
            ) : (
              <SinglePayslipCard
                item={activeItems[0]}
                month={month}
                defaultCompany={companyName}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
