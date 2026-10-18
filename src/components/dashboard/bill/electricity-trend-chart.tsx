"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import type { ApexOptions } from "apexcharts"
import { Activity, Building2, SlidersHorizontal } from "lucide-react"
import { useDocCenterQuery } from "@/hooks/queries/use-doc-center"
import { ElectricityBillMetadata } from "@/types/electricity-bill"

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

type MetricKey = "unitPriceBasic" | "unitKwh" | "unitKvah" | "paidAmount"

const METRICS: Record<MetricKey, { label: string; color: string; currency: boolean }> = {
  unitPriceBasic: { label: "Unit Price", color: "#2563eb", currency: true },
  unitKwh: { label: "Units Consumed (kWh)", color: "#0891b2", currency: false },
  unitKvah: { label: "Units Consumed (kVAh)", color: "#7c3aed", currency: false },
  paidAmount: { label: "Total Amount Paid", color: "#059669", currency: true },
}

const parseValue = (value: unknown) => {
  const parsed = Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : 0
}

const monthKey = (metadata: ElectricityBillMetadata, createdAt: string) => {
  const rawDate = metadata.billFrom || metadata.paidOn || createdAt
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

const formatMonth = (key: string) => {
  const [year, month] = key.split("-").map(Number)
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1))
}

export function ElectricityTrendChart({ currentAccountName }: { currentAccountName?: string }) {
  const [metric, setMetric] = React.useState<MetricKey>("unitPriceBasic")
  const [account, setAccount] = React.useState(currentAccountName || "all")
  const { data, isLoading } = useDocCenterQuery({
    documentType: "Electricity",
    page: 1,
    limit: 5000,
    sortBy: "createdAt",
    sortOrder: "asc",
  })

  const bills = React.useMemo(
    () => (data?.data ?? []).map((bill) => ({
      ...bill,
      metadata: (bill.metadata || {}) as ElectricityBillMetadata,
    })),
    [data]
  )

  const accounts = React.useMemo(
    () => Array.from(new Set(bills.map((bill) => bill.metadata.accountName).filter(Boolean))).sort(),
    [bills]
  )

  const trend = React.useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>()

    bills.forEach((bill) => {
      if (account !== "all" && bill.metadata.accountName !== account) return
      const key = monthKey(bill.metadata, bill.createdAt)
      if (!key) return

      const rawValue = metric === "paidAmount"
        ? bill.metadata.paidAmount || bill.metadata.totalAmount
        : bill.metadata[metric]
      const value = parseValue(rawValue)
      const current = grouped.get(key) || { total: 0, count: 0 }
      grouped.set(key, { total: current.total + value, count: current.count + 1 })
    })

    const sortedKeys = Array.from(grouped.keys()).sort()
    const latestKey = sortedKeys.at(-1)
    if (!latestKey) return { points: [], recordedMonthCount: 0 }

    const [latestYear, latestMonth] = latestKey.split("-").map(Number)
    const timeline = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(latestYear, latestMonth - 1 - (11 - index), 1)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    })

    return {
      recordedMonthCount: grouped.size,
      points: timeline.map((key) => {
        const value = grouped.get(key)
        return {
        label: formatMonth(key),
          value: value
            ? metric === "unitPriceBasic" ? value.total / value.count : value.total
            : 0,
          hasBill: Boolean(value),
        }
      }),
    }
  }, [account, bills, metric])

  const points = trend.points

  const metricConfig = METRICS[metric]
  const formatter = React.useCallback(
    (value: number) => metricConfig.currency
      ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
      : value.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
    [metricConfig.currency]
  )

  const options = React.useMemo<ApexOptions>(() => ({
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    colors: [metricConfig.color],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 95, 100] },
    },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    xaxis: {
      categories: points.map((point) => point.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b", fontWeight: 600 } },
    },
    yaxis: {
      labels: { formatter, style: { colors: ["#64748b"], fontWeight: 600 } },
    },
    tooltip: { y: { formatter } },
    markers: {
      size: 0,
      hover: { size: 6 },
      discrete: points.flatMap((point, index) => point.hasBill ? [{
        seriesIndex: 0,
        dataPointIndex: index,
        fillColor: metricConfig.color,
        strokeColor: "#ffffff",
        size: 5,
      }] : []),
    },
    noData: { text: "No trend data available", align: "center", verticalAlign: "middle" },
  }), [formatter, metricConfig.color, points])

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Electricity Bill Trends</h2>
            <p className="text-xs font-medium text-slate-500">Monthly account performance · Last 12 months</p>
            {trend.recordedMonthCount === 1 && (
              <p className="mt-1 text-[10px] font-bold text-amber-600">Only one billed month exists; months without bills are shown as zero.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={account} onChange={(event) => setAccount(event.target.value)} className="h-11 min-w-52 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-bold text-slate-700 outline-none focus:border-blue-400">
              <option value="all">All Accounts</option>
              {accounts.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={metric} onChange={(event) => setMetric(event.target.value as MetricKey)} className="h-11 min-w-56 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-bold text-slate-700 outline-none focus:border-blue-400">
              {Object.entries(METRICS).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 min-h-[340px]">
        {isLoading ? (
          <div className="flex h-[340px] items-center justify-center text-sm font-bold text-slate-400">Loading trend data...</div>
        ) : points.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">No trend data for this selection</div>
        ) : (
          <ApexChart
            type="area"
            height={340}
            options={options}
            series={[{ name: metricConfig.label, data: points.map((point) => Number(point.value.toFixed(2))) }]}
          />
        )}
      </div>
    </section>
  )
}
