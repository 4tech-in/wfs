import React from "react"
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf 
} from "@react-pdf/renderer"
import { BulkPayrollEmployeeItem, PayrollCalculationResult } from "@/types/salary"

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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    marginBottom: 12,
  },
  companyTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#020617",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 8.5,
    color: "#64748b",
    marginBottom: 1,
  },
  badgePayslip: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  monthTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
    textTransform: "uppercase",
  },
  genText: {
    fontSize: 7.5,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 2,
  },

  // Info Box
  infoBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoCol: {
    width: "25%",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Attendance Section
  sectionHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  attendanceRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 4,
  },
  attendanceTile: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 5,
    alignItems: "center",
  },
  tileLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Tables
  tableContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  tableHeaderCol: {
    width: "50%",
    padding: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tableHeaderColDivider: {
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    textTransform: "uppercase",
  },
  tableBodyRow: {
    flexDirection: "row",
    minHeight: 90,
  },
  tableBodyCol: {
    width: "50%",
    padding: 6,
  },
  tableBodyColDivider: {
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  itemLabel: {
    fontSize: 8,
    color: "#334155",
  },
  itemValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  tableTotalsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
  totalCol: {
    width: "50%",
    padding: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  totalValueEarnings: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#065f46",
  },
  totalValueDeductions: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#9f1239",
  },

  // Net Pay Banner
  netPayBanner: {
    backgroundColor: "#0f172a",
    borderRadius: 6,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  netPayLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#2dd4bf",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  netPayWords: {
    fontSize: 7.5,
    color: "#cbd5e1",
    fontStyle: "italic",
    maxWidth: 320,
  },
  netPayAmount: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  // Signatures
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  signatureBlock: {
    width: "40%",
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    width: "100%",
    marginBottom: 5,
    borderStyle: "dashed",
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    textTransform: "uppercase",
  },
  signatureSubtitle: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 1,
  },
  disclaimerText: {
    fontSize: 6.5,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
})

interface SinglePayslipPageProps {
  item: BulkPayrollEmployeeItem | PayrollCalculationResult
  month?: string
  defaultCompany?: string
}

export function SinglePayslipPdfPage({ item, month, defaultCompany }: SinglePayslipPageProps) {
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
  const basicSalaryPolicy = item.basicSalary ?? 0
  const basic = item.payrollDetails?.basic ?? (item.basePay || 0)
  const hra = item.payrollDetails?.hra ?? 0
  const conveyance = item.payrollDetails?.conveyance ?? 0
  const otPay = item.overtimePay ?? 0
  const grossEarnings = item.grossEarnings ?? (basic + hra + conveyance + otPay)

  // Half-day pay comes from backend
  const halfDaySalary = item.halfDaySalary ?? 0

  const pfEmployee = item.payrollDetails?.pfEmployee ?? 0
  const esiEmployee = item.payrollDetails?.esiEmployee ?? 0
  const lwfEmployee = item.payrollDetails?.lwfEmployee ?? 0
  const totalDeductions = item.totalDeductions ?? (pfEmployee + esiEmployee + lwfEmployee)

  const netPay = item.netPay ?? (grossEarnings - totalDeductions)

  return (
    <Page size="A4" style={styles.page}>
      {/* Header - No Logo as requested */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.companyTitle}>{companyName}</Text>
          <Text style={styles.companySubtitle}>Industrial & Corporate Services • Payroll Division</Text>
          <Text style={styles.companySubtitle}>Official Salary Slip • Regulated Employment Standards</Text>
        </View>
        <View>
          <Text style={styles.badgePayslip}>Payslip</Text>
          <Text style={styles.monthTitle}>{displayMonth}</Text>
          <Text style={styles.genText}>Generated: {new Date().toLocaleDateString("en-IN")}</Text>
        </View>
      </View>

      {/* Employee Details */}
      <View style={styles.infoBox}>
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Employee Name</Text>
            <Text style={styles.infoValue}>{employeeName}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Employee Code</Text>
            <Text style={styles.infoValue}>{employeeCode || "N/A"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Designation</Text>
            <Text style={styles.infoValue}>{designation}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{department}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Date of Joining</Text>
            <Text style={styles.infoValue}>{doj}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Aadhar / Mobile</Text>
            <Text style={styles.infoValue}>{aadharNo !== "N/A" ? aadharNo : mobileNo}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>PF Number</Text>
            <Text style={styles.infoValue}>{pfNo}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>ESI Number</Text>
            <Text style={styles.infoValue}>{esiNo}</Text>
          </View>
        </View>
      </View>

      {/* Attendance Summary */}
      <Text style={styles.sectionHeader}>Attendance & Calendar Summary ({displayMonth})</Text>
      <View style={styles.attendanceRow}>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Cal Days</Text>
          <Text style={styles.tileValue}>{totalCalendarDays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Work Days</Text>
          <Text style={styles.tileValue}>{totalWorkingDays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Present</Text>
          <Text style={styles.tileValue}>{presentDays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Half Day</Text>
          <Text style={styles.tileValue}>{halfDays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Absent</Text>
          <Text style={styles.tileValue}>{absentDays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Paid Sun</Text>
          <Text style={styles.tileValue}>{paidSundays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>Paid Days</Text>
          <Text style={styles.tileValue}>{totalPaidDays}</Text>
        </View>
        <View style={styles.attendanceTile}>
          <Text style={styles.tileLabel}>OT Hours</Text>
          <Text style={styles.tileValue}>{totalOtHours}h</Text>
        </View>
      </View>

      {/* Earnings & Deductions Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          <View style={[styles.tableHeaderCol, styles.tableHeaderColDivider]}>
            <Text style={styles.tableHeaderText}>Earnings</Text>
            <Text style={styles.tableHeaderText}>Amount (₹)</Text>
          </View>
          <View style={styles.tableHeaderCol}>
            <Text style={styles.tableHeaderText}>Deductions</Text>
            <Text style={styles.tableHeaderText}>Amount (₹)</Text>
          </View>
        </View>

        <View style={styles.tableBodyRow}>
          {/* Earnings side */}
          <View style={[styles.tableBodyCol, styles.tableBodyColDivider]}>
            {basicSalaryPolicy > 0 && (
              <View style={styles.itemRow}>
                <Text style={[styles.itemLabel, { color: '#4338ca', fontStyle: 'italic' }]}>Basic Salary (Policy)</Text>
                <Text style={[styles.itemValue, { color: '#3730a3' }]}>₹{basicSalaryPolicy.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Basic Pay</Text>
              <Text style={styles.itemValue}>₹{basic.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            {hra > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>House Rent Allowance (HRA)</Text>
                <Text style={styles.itemValue}>₹{hra.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            {conveyance > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Conveyance Allowance</Text>
                <Text style={styles.itemValue}>₹{conveyance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            {halfDays > 0 && halfDaySalary > 0 && (
              <View style={styles.itemRow}>
                <View>
                  <Text style={[styles.itemLabel, { color: '#92400e' }]}>Half Day Pay ({halfDays} day{halfDays > 1 ? 's' : ''})</Text>
                  <Text style={{ fontSize: 7, color: '#d97706' }}>
                    (₹{basicSalaryPolicy.toLocaleString()} ÷ {(item as any).totalWorkingDays ?? 0} days × 0.5)
                  </Text>
                </View>
                <Text style={[styles.itemValue, { color: '#92400e' }]}>₹{halfDaySalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            {otPay > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Overtime Pay ({totalOtHours}h @ ₹{otRate}/h)</Text>
                <Text style={styles.itemValue}>₹{otPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
          </View>

          {/* Deductions side */}
          <View style={styles.tableBodyCol}>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Provident Fund (PF)</Text>
              <Text style={styles.itemValue}>₹{pfEmployee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>ESI (Health Insurance)</Text>
              <Text style={styles.itemValue}>₹{esiEmployee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Labour Welfare Fund (LWF)</Text>
              <Text style={styles.itemValue}>₹{lwfEmployee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.tableTotalsRow}>
          <View style={[styles.totalCol, styles.tableHeaderColDivider]}>
            <Text style={styles.totalLabel}>Gross Earnings</Text>
            <Text style={styles.totalValueEarnings}>₹{grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.totalCol}>
            <Text style={styles.totalLabel}>Total Deductions</Text>
            <Text style={styles.totalValueDeductions}>₹{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>

      {/* Net Pay Banner */}
      <View style={styles.netPayBanner}>
        <View>
          <Text style={styles.netPayLabel}>Net Salary Payable</Text>
          <Text style={styles.netPayWords}>{numberToWordsINR(netPay)}</Text>
        </View>
        <Text style={styles.netPayAmount}>₹{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      </View>

      {/* Signatures */}
      <View style={styles.signatureRow}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureTitle}>Employee Signature</Text>
          <Text style={styles.signatureSubtitle}>Acknowledgment of Receipt</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureTitle}>For {companyName}</Text>
          <Text style={styles.signatureSubtitle}>Authorized Signatory / Seal</Text>
        </View>
      </View>

      <Text style={styles.disclaimerText}>
        This is a computer-generated salary slip prepared in accordance with the enterprise payroll policies.
      </Text>
    </Page>
  )
}

/**
 * Multi-page or Single-page React-PDF Document
 */
export function PayslipPdfDocument({
  items,
  month,
  defaultCompany,
}: {
  items: (BulkPayrollEmployeeItem | PayrollCalculationResult)[]
  month?: string
  defaultCompany?: string
}) {
  return (
    <Document title={`Payslip_${month || "Report"}`} author="Goel Enterprises" subject="Employee Payslip">
      {items.map((item, index) => (
        <SinglePayslipPdfPage
          key={item.employeeId || index}
          item={item}
          month={month}
          defaultCompany={defaultCompany}
        />
      ))}
    </Document>
  )
}

/**
 * Direct client-side function to generate and download PDF using @react-pdf/renderer
 */
export async function downloadPayslipPdf(
  items: (BulkPayrollEmployeeItem | PayrollCalculationResult)[],
  filename: string,
  month?: string,
  defaultCompany?: string
) {
  const doc = (
    <PayslipPdfDocument
      items={items}
      month={month}
      defaultCompany={defaultCompany}
    />
  )
  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Direct client-side function to open PDF in new tab for direct print
 */
export async function printPayslipPdf(
  items: (BulkPayrollEmployeeItem | PayrollCalculationResult)[],
  month?: string,
  defaultCompany?: string
) {
  const doc = (
    <PayslipPdfDocument
      items={items}
      month={month}
      defaultCompany={defaultCompany}
    />
  )
  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, "_blank")
  if (printWindow) {
    printWindow.focus()
  } else {
    // If popup blocked, create an iframe to print
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    iframe.src = url
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    }
  }
}
