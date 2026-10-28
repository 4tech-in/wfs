"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Droplets, 
  Building2, 
  Calendar, 
  FileText, 
  CreditCard, 
  History,
  Info,
  User,
  ArrowLeft,
  Download,
  Share2,
  Trash2,
  Printer,
  Plus,
  Pencil
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { WaterBillFormDialog } from "@/components/dashboard/bill/water-bill-form-dialog"
import { ElectricityBillFormDialog } from "@/components/dashboard/bill/electricity-bill-form-dialog"
import { ElectricityTrendChart } from "@/components/dashboard/bill/electricity-trend-chart"
import { useSingleDocQuery, useDeleteDocMutation } from "@/hooks/queries/use-doc-center"
import { WaterBillRecord, WaterBillMetadata } from "@/types/water-bill"
import { ElectricityBillMetadata } from "@/types/electricity-bill"
import { cn } from "@/lib/utils"
import { format, parseISO, isValid } from "date-fns"
import { toast } from "sonner"

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—"
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return "—"
    return format(date, "dd MMM yyyy")
  } catch {
    return "—"
  }
}

const formatCurrency = (amount?: string | number) => {
  if (amount === undefined || amount === null || amount === "") return "—"
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num)
}

function safeParse(val: string | number | undefined | null) {
  const num = parseFloat(String(val ?? ""))
  return isNaN(num) ? 0 : num
}

// ── UI Components ─────────────────────────────────────────────────────────────

function InfoBlock({ label, value, icon, highlight, subValue }: { 
  label: string; 
  value?: string; 
  icon?: React.ReactNode; 
  highlight?: "blue" | "green" | "amber" | "red";
  subValue?: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</span>}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="flex flex-col">
        <span className={cn(
          "text-base font-bold tracking-tight",
          highlight === "blue" ? "text-blue-600" :
          highlight === "green" ? "text-emerald-600" :
          highlight === "amber" ? "text-amber-600" :
          highlight === "red" ? "text-rose-600" :
          "text-slate-700"
        )}>
          {value || "—"}
        </span>
        {subValue && <span className="text-[10px] font-bold text-slate-400 mt-0.5">{subValue}</span>}
      </div>
    </div>
  )
}

function StatCard({ label, value, prefix, highlight }: { 
  label: string; 
  value?: string; 
  prefix?: string; 
  highlight?: "blue" | "green" | "amber"
}) {
  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all duration-300",
      highlight === "blue" ? "bg-blue-50/50 border-blue-100 hover:bg-blue-50" :
      highlight === "green" ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50" :
      highlight === "amber" ? "bg-amber-50/50 border-amber-100 hover:bg-amber-50" :
      "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
    )}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{label}</p>
      <p className={cn(
        "text-3xl font-black flex items-baseline gap-1.5",
        highlight === "blue" ? "text-blue-700" :
        highlight === "green" ? "text-emerald-700" :
        highlight === "amber" ? "text-amber-700" :
        "text-slate-800"
      )}>
        {prefix && <span className="text-xl font-bold opacity-40">{prefix}</span>}
        {value || "0.00"}
      </p>
    </div>
  )
}

function DetailRowSmall({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{label}</span>
      <span className="text-sm text-slate-700 font-bold">{value || "—"}</span>
    </div>
  )
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function BillDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const { data: billData, isLoading } = useSingleDocQuery(id)
  const deleteMutation = useDeleteDocMutation()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Bill Details...</p>
      </div>
    )
  }

  if (!billData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
           <Droplets className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Bill Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">The record you are looking for doesn&apos;t exist or has been removed.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const bill = {
    ...billData,
    metadata: (billData.metadata || {}) as WaterBillMetadata
  } as WaterBillRecord

  const meta = bill.metadata
  const isPaid = safeParse(meta?.paidAmount) >= safeParse(meta?.totalAmount)
  const isAnyAvg = String(meta?.isFromAverage) === "true" || String(meta?.isToAverage) === "true"

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this bill record?")) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success("Bill record deleted")
        router.push("/dashboard/Bill")
      } catch {
        toast.error("Failed to delete record")
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/Bill")}
          className="text-slate-500 hover:text-blue-600 font-bold group px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Bills
        </Button>
        
        <div className="flex items-center gap-2">
          {billData.documentType === "Electricity" ? (
            <>
              <ElectricityBillFormDialog
                recordId={id}
                initialData={meta as ElectricityBillMetadata}
                trigger={
                  <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Bill
                  </Button>
                }
              />
              <ElectricityBillFormDialog
                initialData={meta as ElectricityBillMetadata}
                trigger={
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/20">
                    <Plus className="mr-2 h-4 w-4" /> Create Next Bill
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <WaterBillFormDialog
                recordId={id}
                initialData={meta}
                trigger={
                  <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Bill
                  </Button>
                }
              />
              <WaterBillFormDialog
                initialData={meta}
                trigger={
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">
                    <Plus className="mr-2 h-4 w-4" /> Create Next Bill
                  </Button>
                }
              />
            </>
          )}
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200" title="Print Bill">
            <Printer className="h-4 w-4 text-slate-500" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200" title="Share">
            <Share2 className="h-4 w-4 text-slate-500" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl border-rose-100 hover:bg-rose-50 text-rose-500" 
            onClick={handleDelete}
            title="Delete Record"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-slate-900 px-10 py-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 border border-blue-400/20">
                <Droplets className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">{bill.title}</h1>
                   <div className={cn(
                      "px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                      isPaid 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" 
                        : "bg-rose-500/20 text-rose-400 border-rose-500/20"
                    )}>
                      {isPaid ? "PAID" : "PENDING"}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold uppercase tracking-widest">{meta?.accountName || "Main Account"}</span>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <div className="flex items-center gap-2 text-blue-400">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Connection ID</span>
                    <span className="text-xs font-black tracking-widest">{meta?.accountNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col items-end">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill Amount</p>
               <p className="text-4xl font-black text-white">{formatCurrency(meta?.totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-10 space-y-12">
          
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Bill Amount" value={meta?.totalAmount} prefix="₹" highlight="blue" />
            <StatCard label="Amount Paid" value={meta?.paidAmount} prefix="₹" highlight={isPaid ? "green" : "blue"} />
            <StatCard label="Pending Balance" value={String(safeParse(meta?.totalAmount) - safeParse(meta?.paidAmount))} prefix="₹" highlight={isPaid ? undefined : "amber"} />
            <StatCard label="Unit Rate" value={meta?.paidUnitRate} prefix="₹" highlight="amber" />
          </div>

          {/* Average Billing Notice */}
          {isAnyAvg && (
            <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 shadow-sm">
                <Info className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Average Billing Active</h4>
                <p className="text-xs font-medium text-amber-700/80 leading-relaxed mt-1">
                  Consumption readings for this period were calculated based on historical averages rather than a physical meter reading.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Details */}
            <div className="space-y-12">
              {/* Account & Duration */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Connection Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <InfoBlock label="Account Holder" value={meta?.accountName} />
                  <InfoBlock label="Account No" value={meta?.accountNumber} highlight="blue" />
                  <InfoBlock label="Bill Duration" value={meta?.billPeriod ? `${meta.billPeriod} Months` : "—"} />
                  <InfoBlock label="Pipe Size" value={meta?.connectionSize} />
                </div>
              </div>

              {/* Consumption Data */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <History className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Meter Readings</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <InfoBlock label="Old Reading" value={meta?.oldReading} />
                  <InfoBlock label="New Reading" value={meta?.newReading} />
                  <InfoBlock label="Units Consumed" value={meta?.unit} highlight="blue" />
                  <InfoBlock label="Actual Reading" value={meta?.actualReading} highlight="amber" subValue="Field Verified" />
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Bill Schedule</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <InfoBlock label="Bill Date" value={formatDate(meta?.billDate)} />
                  <InfoBlock label="Payment Due" value={formatDate(meta?.dueDate)} highlight="red" />
                  <InfoBlock 
                    label="Service Start" 
                    value={(String(meta?.isFromAverage) === "true") ? "Billed on Average" : formatDate(meta?.billFrom)} 
                    highlight={(String(meta?.isFromAverage) === "true") ? "amber" : undefined}
                  />
                  <InfoBlock 
                    label="Service End" 
                    value={(String(meta?.isToAverage) === "true") ? "Billed on Average" : formatDate(meta?.billTo)} 
                    highlight={(String(meta?.isToAverage) === "true") ? "amber" : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Financials */}
            <div className="space-y-8">
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Financial Breakdown</h3>
                </div>
                
                <div className="space-y-2 mb-10">
                  <DetailRowSmall label="Water Consumption Charges" value={formatCurrency(meta?.currentWaterCharges)} />
                  <DetailRowSmall label="Maintenance Charges" value={formatCurrency(meta?.maintenanceCharges)} />
                  <DetailRowSmall label="Sewerage Cess" value={formatCurrency(meta?.sewerageCess)} />
                  <DetailRowSmall label="Meter Rental" value={formatCurrency(meta?.meterRentals)} />
                  <DetailRowSmall label="Garbage Collection" value={formatCurrency(meta?.garbageCharges)} />
                  <DetailRowSmall label="MC Tax" value={formatCurrency(meta?.mcTax)} />
                  <DetailRowSmall label="Sundry / Other Charges" value={formatCurrency(meta?.sundryCharges)} />
                  <DetailRowSmall label="Outstanding Arrears" value={formatCurrency(meta?.arrears)} />
                </div>

                <div className="pt-6 border-t border-slate-200 space-y-2 mb-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Late Payment Surcharge</span>
                    <span className="text-sm font-bold text-rose-500">+{formatCurrency(meta?.latePaymentSurcharge)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Previous Adjustments</span>
                    <span className="text-sm font-bold text-blue-500">-{formatCurrency(meta?.adjPrevBill)}</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Payable</span>
                    <span className="text-3xl font-black text-slate-900">{formatCurrency(meta?.totalAmount)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Paid on Date</span>
                    <span className="text-sm font-bold text-slate-600">{formatDate(meta?.paidOn)}</span>
                  </div>
                </div>
              </div>

              {/* Remarks Box */}
              {meta?.remarks && (
                <div className="p-8 rounded-3xl bg-indigo-50/30 border border-indigo-100 flex flex-col gap-3">
                   <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Administrative Remarks</p>
                   </div>
                   <p className="text-sm font-medium text-slate-600 italic leading-relaxed">&quot;{meta.remarks}&quot;</p>
                </div>
              )}
            </div>
          </div>

          {billData.documentType === "Electricity" && (
            <ElectricityTrendChart currentAccountName={meta?.accountName} />
          )}

          {/* Files Section */}
          {bill.files && bill.files.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Attached Bill Documents</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bill.files.length} Files Attached</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bill.files.map((file, idx) => {
                  const fileName = file.split("/").pop() || `Bill_Document_${idx + 1}`
                  const apiBase = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/api$/, "");
                  const fileUrl = `${apiBase}${file}`
                  return (
                    <a
                      key={idx}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors border border-slate-100">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-700 truncate max-w-[140px]">{fileName}</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">PDF/Image</span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                        <Download className="h-4 w-4" />
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer Timeline */}
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400">
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
              <div className="h-12 w-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm overflow-hidden">
                <User className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-slate-400">Recorded By</p>
                <p className="text-sm font-black text-slate-700">{bill.createdBy?.name || "Administrator"}</p>
                <p className="text-[10px] font-bold text-slate-400">{bill.createdBy?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-10">
               <div className="flex flex-col items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-slate-400">Entry Date</p>
                  <p className="text-sm font-bold text-slate-600">{formatDate(bill.createdAt)}</p>
               </div>
               <div className="flex flex-col items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-slate-400">Last Modified</p>
                  <p className="text-sm font-bold text-slate-600">{formatDate(bill.updatedAt)}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
