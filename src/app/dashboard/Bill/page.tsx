"use client"

import * as React from "react"
import {
  Droplets,
  Search,
  X,
  Building2,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocCenterQuery } from "@/hooks/queries/use-doc-center"
import { useDeleteDocMutation } from "@/hooks/queries/use-doc-center"
import { docCenterService } from "@/services/doc-center-service"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import { WaterBillFormDialog } from "@/components/dashboard/bill/water-bill-form-dialog"
import { WaterBillTable } from "@/components/dashboard/bill/water-bill-table"
import { WaterBillRecord, WaterBillMetadata } from "@/types/water-bill"
import { ElectricityBillRecord, ElectricityBillMetadata } from "@/types/electricity-bill"
import { ElectricityBillFormDialog } from "@/components/dashboard/bill/electricity-bill-form-dialog"
import { ElectricityBillTable } from "@/components/dashboard/bill/electricity-bill-table"
import { DocumentItem } from "@/types/doc-center"
import { DataTableExport } from "@/components/ui/data-table-export"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

// ── Stat Card ─────────────────────────────────────────────────────────────────


// ── Account Tab ───────────────────────────────────────────────────────────────
interface AccountTabProps {
  name: string
  count: number
  active: boolean
  onClick: () => void
}

function AccountTab({ name, count, active, onClick }: AccountTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
      }`}
    >
      <Building2 className="h-4 w-4 shrink-0" />
      <span className="truncate max-w-[120px]">{name}</span>
      <span
        className={`ml-1 text-xs font-black rounded-full px-2 py-0.5 ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function asWaterBill(doc: DocumentItem): WaterBillRecord {
  return {
    ...doc,
    documentType: "Water",
    metadata: (doc.metadata || {}) as WaterBillMetadata,
  }
}

function asElectricityBill(doc: DocumentItem): ElectricityBillRecord {
  return {
    ...doc,
    documentType: "Electricity",
    metadata: (doc.metadata || {}) as ElectricityBillMetadata,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillPage() {
  const [activeTab, setActiveTab] = React.useState<"Water" | "Electricity">("Water")
  const [search, setSearch] = React.useState("")
  const [accountFilter, setAccountFilter] = React.useState<string>("all")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const debouncedSearch = useDebounce(search, 400)

  // Fetch Water Bills
  const waterQuery = useDocCenterQuery({
    documentType: "Water",
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: activeTab === "Water" ? debouncedSearch : undefined,
  })

  // Fetch Electricity Bills
  const electricityQuery = useDocCenterQuery({
    documentType: "Electricity",
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: activeTab === "Electricity" ? debouncedSearch : undefined,
  })

  const deleteMutation = useDeleteDocMutation()

  const allWaterBills = React.useMemo(
    () => (waterQuery.data?.data ?? []).map(asWaterBill),
    [waterQuery.data]
  )

  const allElectricityBills = React.useMemo(
    () => (electricityQuery.data?.data ?? []).map(asElectricityBill),
    [electricityQuery.data]
  )

  const currentBills = activeTab === "Water" ? allWaterBills : allElectricityBills
  const isLoading = activeTab === "Water" ? waterQuery.isLoading : electricityQuery.isLoading

  const accounts = React.useMemo(() => {
    const names = new Set<string>()
    currentBills.forEach((b) => {
      if (b.metadata?.accountName) names.add(b.metadata.accountName)
    })
    return Array.from(names).sort()
  }, [currentBills])

  const filteredBills = React.useMemo(() => {
    let list = currentBills
    if (accountFilter !== "all") {
      list = list.filter((b) => b.metadata?.accountName === accountFilter) as typeof currentBills
    }
    return list
  }, [currentBills, accountFilter])

  const waterExportColumns: ColumnDef<WaterBillRecord>[] = [
    { accessorKey: "metadata.accountName", header: "Account Name", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.accountName || "N/A" } },
    { accessorKey: "metadata.billDate", header: "Bill Date", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.billDate ? format(new Date(row.metadata.billDate), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.dueDate", header: "Due Date", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.dueDate ? format(new Date(row.metadata.dueDate), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.billFrom", header: "Bill From", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.billFrom ? format(new Date(row.metadata.billFrom), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.billTo", header: "Bill To", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.billTo ? format(new Date(row.metadata.billTo), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.connectionSize", header: "Conn Size", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.connectionSize || "N/A" } },
    { accessorKey: "metadata.oldReading", header: "Old Reading", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.oldReading || "N/A" } },
    { accessorKey: "metadata.newReading", header: "New Reading", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.newReading || "N/A" } },
    { accessorKey: "metadata.unit", header: "Unit", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.unit || "N/A" } },
    { accessorKey: "metadata.costPerUnit", header: "Cost/Unit", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.costPerUnit || "N/A" } },
    { accessorKey: "metadata.currentWaterCharges", header: "Charges", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.currentWaterCharges || "N/A" } },
    { accessorKey: "metadata.maintenanceCharges", header: "Maint.", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.maintenanceCharges || "N/A" } },
    { accessorKey: "metadata.sewerageCess", header: "Sewerage", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.sewerageCess || "N/A" } },
    { accessorKey: "metadata.meterRentals", header: "Meter Rent", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.meterRentals || "N/A" } },
    { accessorKey: "metadata.garbageCharges", header: "Garbage", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.garbageCharges || "N/A" } },
    { accessorKey: "metadata.arrears", header: "Arrears", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.arrears || "N/A" } },
    { accessorKey: "metadata.mcTax", header: "MC Tax", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.mcTax || "N/A" } },
    { accessorKey: "metadata.latePaymentSurcharge", header: "LPS", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.latePaymentSurcharge || "N/A" } },
    { accessorKey: "metadata.totalAmount", header: "Total", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.totalAmount || "N/A" } },
    { accessorKey: "metadata.paidAmount", header: "Paid", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.paidAmount || "N/A" } },
    { accessorKey: "metadata.paidOn", header: "Paid On", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.paidOn ? format(new Date(row.metadata.paidOn), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.remarks", header: "Remarks", meta: { exportValue: (row: WaterBillRecord) => row.metadata?.remarks || "N/A" } },
  ]

  const electricityExportColumns: ColumnDef<ElectricityBillRecord>[] = [
    { accessorKey: "metadata.accountName", header: "Account Name", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.accountName || "N/A" } },
    { accessorKey: "metadata.accountNumber", header: "Account No", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.accountNumber || "N/A" } },
    { accessorKey: "metadata.billDate", header: "Bill Date", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.billDate ? format(new Date(row.metadata.billDate), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.billFrom", header: "Bill From", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.billFrom ? format(new Date(row.metadata.billFrom), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.billTo", header: "Bill To", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.billTo ? format(new Date(row.metadata.billTo), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.unitKwh", header: "kWh", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.unitKwh || "N/A" } },
    { accessorKey: "metadata.unitKvah", header: "kVAh", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.unitKvah || "N/A" } },
    { accessorKey: "metadata.unitPriceBasic", header: "Price Basic", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.unitPriceBasic || "N/A" } },
    { accessorKey: "metadata.consumptionCharges", header: "Consum. Chg", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.consumptionCharges || "N/A" } },
    { accessorKey: "metadata.fppca", header: "FPPCA", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.fppca || "N/A" } },
    { accessorKey: "metadata.ed", header: "ED", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.ed || "N/A" } },
    { accessorKey: "metadata.fixedCharges", header: "Fix Charges", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.fixedCharges || "N/A" } },
    { accessorKey: "metadata.kwhKvahRatio", header: "kWh/kVAh Ratio (Power Factor)", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.kwhKvahRatio ? `${row.metadata.kwhKvahRatio}%` : "N/A" } },
    { accessorKey: "metadata.mcTax", header: "MC Tax", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.mcTax || "N/A" } },
    { accessorKey: "metadata.arrears", header: "Arrears", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.arrears || "N/A" } },
    { accessorKey: "metadata.totalAmount", header: "Total", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.totalAmount || "N/A" } },
    { accessorKey: "metadata.paidAmount", header: "Paid", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.paidAmount || "N/A" } },
    { accessorKey: "metadata.dueDate", header: "Due Date", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.dueDate ? format(new Date(row.metadata.dueDate), "dd MMM yyyy") : "N/A" } },
    { accessorKey: "metadata.remarks", header: "Remarks", meta: { exportValue: (row: ElectricityBillRecord) => row.metadata?.remarks || "N/A" } },
  ]

  const fetchAllBills = async (): Promise<{ data: (WaterBillRecord | ElectricityBillRecord)[] }> => {
    const res = await docCenterService.getAll({
      documentType: activeTab,
      limit: 5000,
      search: debouncedSearch || undefined,
    });
    return { 
      data: activeTab === "Water" 
        ? res.data.map(asWaterBill) 
        : res.data.map(asElectricityBill) 
    };
  };



  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500",
              activeTab === "Water" 
                ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/30" 
                : "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/30"
            )}>
              {activeTab === "Water" ? <Droplets className="h-6 w-6 text-white" /> : <Zap className="h-6 w-6 text-white" />}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">
                Bill Center
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                Management of utility bills &amp; payment history
              </p>
            </div>
          </div>
          
          {/* Main Service Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => { setActiveTab("Water"); setAccountFilter("all"); }}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                activeTab === "Water" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Droplets className="h-4 w-4" />
              Water Bills
            </button>
            <button
              onClick={() => { setActiveTab("Electricity"); setAccountFilter("all"); }}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                activeTab === "Electricity" ? "bg-white text-yellow-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Zap className="h-4 w-4" />
              Electricity Bills
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataTableExport
            columns={(activeTab === "Water" ? waterExportColumns : electricityExportColumns) as ColumnDef<WaterBillRecord | ElectricityBillRecord, unknown>[]}
            fetchData={fetchAllBills}
            filename={`${activeTab}_Bills_Report`}
          />
          {activeTab === "Water" ? (
            <WaterBillFormDialog />
          ) : (
            <ElectricityBillFormDialog />
          )}
        </div>
      </div>



      {/* ── Account Tabs + Search ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAccountFilter("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
              accountFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            All Accounts
          </button>
          {accounts.map((name) => (
            <AccountTab
              key={name}
              name={name}
              count={currentBills.filter((b) => b.metadata?.accountName === name).length}
              active={accountFilter === name}
              onClick={() => setAccountFilter(name)}
            />
          ))}
          
          <div className="ml-auto w-full md:w-80 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder={`Search ${activeTab.toLowerCase()} bills...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-blue-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Content Table ── */}
        <div className="min-h-[400px]">
          {activeTab === "Water" ? (
            <WaterBillTable
              data={filteredBills as WaterBillRecord[]}
              isLoading={isLoading}
              totalItems={waterQuery.data?.pagination?.total || 0}
              pageCount={waterQuery.data?.pagination?.totalPages || 1}
              pagination={pagination}
              onPaginationChange={setPagination}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ) : (
            <ElectricityBillTable
              data={filteredBills as ElectricityBillRecord[]}
              isLoading={isLoading}
              totalItems={electricityQuery.data?.pagination?.total || 0}
              pageCount={electricityQuery.data?.pagination?.totalPages || 1}
              pagination={pagination}
              onPaginationChange={setPagination}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  )
}
