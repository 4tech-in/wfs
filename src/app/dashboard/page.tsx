"use client"

import {
  Plus,
  Upload,
  ArrowRight,
  AlertCircle,
  ClipboardCheck,
  Bell,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { AttendanceUploadDialog } from "@/components/dashboard/attendance-upload-dialog"
import { MarkLeaveDialog } from "@/components/dashboard/mark-leave-dialog"
import { MarkManualAttendanceDialog } from "@/components/dashboard/mark-attendance-dialog"
import { authStorage } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, eachDayOfInterval, startOfWeek, endOfWeek, subDays, differenceInDays, startOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { useQueries } from "@tanstack/react-query"
import { attendanceService } from "@/services/attendance-service"
import { QUERY_KEYS } from "@/constants/query-keys"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { DateRange } from "react-day-picker"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { Employee, EmployeeStatus } from "@/types/employee"
import { ExpandedStatCard } from "@/components/dashboard/ExpandedStatCard"
import { useDataTable } from "@/hooks/use-data-table"
import { useAttendanceWithSummaryQuery, useAttendanceDashboardCountQuery } from "@/hooks/queries/use-attendance"
import { AttendanceTable } from "@/app/dashboard/attendance/attendance-table"
import { EditEmployeeDialog, RegisterEmployeeDialog } from "@/components/employee/employee-dialogs"
import { DeleteEmployeeDialog } from "@/components/employee/delete-employee-dialog"
import { useEmployeeStatsQuery } from "@/hooks/queries/use-employees-query"
import { useRemindersQuery } from "@/hooks/queries/use-reminders"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { useState, useMemo } from "react"
import { MultiSelect } from "@/components/ui/multi-select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

// Mock data removed in favor of real API data


export default function DashboardPage() {
  const router = useRouter()
  const [selectedStat, setSelectedStat] = useState<EmployeeStatus | "all" | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null)
  const user = authStorage.getUser()
  const isHr = user?.role === "hr"

  const [selectedPreset, setSelectedPreset] = useState("this_week")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: new Date()
  })

  const presetLabels: Record<string, string> = {
    this_week: "This Week's Attendance",
    last_week: "Last Week's Attendance",
    this_month: "This Month's Attendance",
    last_month: "Last Month's Attendance",
    custom: "Custom Range Attendance",
  }
  
  // New Stats and Company State
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(["overall"])
  const { data: statsData } = useEmployeeStatsQuery()
  const { data: remindersData } = useRemindersQuery({ limit: 4 })
  const { data: companiesData } = useCompanyDropdownQuery()
  const [activityCompanyId, setActivityCompanyId] = useState<string>("all")
  const [attendanceGraphCompanyId, setAttendanceGraphCompanyId] = useState<string>("all")

  const getRangeFromPreset = (preset: string) => {
    const now = new Date()
    switch (preset) {
      case "this_week":
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: now
        }
      case "last_week":
        const lastWeek = subDays(now, 7)
        return {
          from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          to: endOfWeek(lastWeek, { weekStartsOn: 1 })
        }
      case "this_month":
        return {
          from: startOfMonth(now),
          to: now
        }
      case "last_month":
        const lastMonth = subMonths(now, 1)
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        }
      default:
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: now
        }
    }
  }

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    if (preset !== "custom") {
      const range = getRangeFromPreset(preset)
      setDateRange(range)
    }
  }

  const graphRange = dateRange

  const {
    pagination,
    onPaginationChange,
    apiParams,
  } = useDataTable({
    storageKey: "dashboard-employees",
  })

  const today = format(new Date(), "yyyy-MM-dd")

  const { data: attendanceData, isLoading: isAttendanceLoading } = useAttendanceWithSummaryQuery(
    today,
    today,
    apiParams.page,
    apiParams.limit as number,
    undefined,
    activityCompanyId === "all" ? undefined : activityCompanyId,
    { staleTime: 60000 }
  )

  const { data: dashboardCount, isLoading: isDashboardCountLoading } = useAttendanceDashboardCountQuery({
    staleTime: 60000
  })

  const { data: attendanceGraphData, isLoading: isAttendanceGraphLoading } = useAttendanceWithSummaryQuery(
    today,
    today,
    1,
    1,
    undefined,
    attendanceGraphCompanyId === "all" ? undefined : attendanceGraphCompanyId,
    { staleTime: 60000 }
  )

  const attendanceList = attendanceData?.data || []
  const dashboardStats = dashboardCount || attendanceData?.summary

  // Graph Data Fetching (Parallel requests for each day in range)
  const daysInRange = useMemo(() => {
    if (!graphRange?.from || !graphRange?.to) return []
    const days = eachDayOfInterval({ start: graphRange.from, end: graphRange.to })
    // Limit to 31 days for performance
    return days.slice(0, 31)
  }, [graphRange])

  const dailyStatsQueries = useQueries({
    queries: daysInRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd")
      return {
        queryKey: QUERY_KEYS.attendance.withSummary({ startDate: dateStr, endDate: dateStr, page: 1, limit: 1 }),
        queryFn: () => attendanceService.getWithSummary(dateStr, dateStr, 1, 1),
        staleTime: 60000,
      }
    })
  })

  const isGraphLoading = dailyStatsQueries.some(q => q.isLoading)
  const graphData = daysInRange.map((date, index) => {
    const summary = dailyStatsQueries[index].data?.summary
    return {
      day: format(date, "EEE dd"), // Show day and date (e.g. Mon 20)
      present: summary?.present ?? 0,
      onLeave: summary?.onLeave ?? 0,
      absent: summary?.absent ?? 0,
    }
  })

  const statsConfig = {
    all: { title: "Total Labor Force", color: { bg: "bg-[#f1f5f9]", text: "text-slate-900", titleText: "text-slate-500" } },
    present: { title: "Present", color: { bg: "bg-[#f0f9f1]", text: "text-slate-900", titleText: "text-emerald-700" } },
    absent: { title: "Absentees", color: { bg: "bg-white", text: "text-slate-900", titleText: "text-slate-600" } },
    "on-leave": { title: "On Leave", color: { bg: "bg-[#f0fdfa]", text: "text-slate-900", titleText: "text-[#0d9488]" } },
    "not-marked": { title: "Attendance Not Marked", color: { bg: "bg-[#0a3622]", text: "text-white", titleText: "text-emerald-400" } },
  }

  const currentStats = useMemo(() => {
    if (!statsData?.data) return null
    if (selectedCompanyIds.includes("overall")) return statsData.data.overall

    const selectedCompanies = statsData.data.companyWise.filter(c => 
      selectedCompanyIds.includes(c.companyId)
    )
    
    if (selectedCompanies.length === 0) return { totalUsers: 0, male: 0, female: 0, other: 0 }

    return selectedCompanies.reduce((acc, curr) => ({
      totalUsers: acc.totalUsers + curr.totalUsers,
      male: acc.male + curr.male,
      female: acc.female + curr.female,
      other: acc.other + curr.other,
    }), { totalUsers: 0, male: 0, female: 0, other: 0 })
  }, [selectedCompanyIds, statsData])

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds(prev => {
      if (id === "overall") return ["overall"]
      const newIds = prev.filter(i => i !== "overall")
      if (newIds.includes(id)) {
        const filtered = newIds.filter(i => i !== id)
        return filtered.length === 0 ? ["overall"] : filtered
      } else {
        return [...newIds, id]
      }
    })
  }

  const handleGenderClick = (genderId?: string) => {
    const params = new URLSearchParams()
    if (genderId && (genderId === 'male' || genderId === 'female')) {
      params.set('gender', genderId)
    }
    
    const companyIds = selectedCompanyIds.filter(id => id !== 'overall')
    if (companyIds.length > 0) {
      params.set('companyId', companyIds[0])
    }
    
    router.push(`/dashboard/employee?${params.toString()}`)
  }

  // Derive Display Data for Gender Distribution
  const genderDistributionData = useMemo(() => {
    if (!currentStats) return []
    
    const { male = 0, female = 0, other = 0, totalUsers = 0 } = currentStats
    const total = totalUsers || 1

    return [
      { 
        name: "Male", 
        value: Math.round((male / total) * 100), 
        count: male, 
        color: "#0f172a", // Slate 900
        id: "male"
      },
      { 
        name: "Female", 
        value: Math.round((female / total) * 100), 
        count: female, 
        color: "#2dd4bf", // Teal 400
        id: "female"
      },
      { 
        name: "Other", 
        value: Math.round((other / total) * 100), 
        count: other, 
        color: "#94a3b8", // Slate 400
        id: "other"
      }
    ]
  }, [currentStats])

  // Derive Display Data for Attendance Distribution
  const attendanceDistributionData = useMemo(() => {
    const summary = attendanceGraphData?.summary
    if (!summary) return []
    
    const { present = 0, absent = 0, onLeave = 0, notMarked = 0, totalUsers = 0 } = summary
    const total = totalUsers || 1

    return [
      { 
        name: "Present", 
        value: Math.round((present / total) * 100), 
        count: present, 
        color: "#10b981", // Emerald 500
        id: "present"
      },
      { 
        name: "Absent", 
        value: Math.round((absent / total) * 100), 
        count: absent, 
        color: "#f43f5e", // Rose 500
        id: "absent"
      },
      { 
        name: "On Leave", 
        value: Math.round((onLeave / total) * 100), 
        count: onLeave, 
        color: "#06b6d4", // Cyan 500
        id: "on-leave"
      },
      { 
        name: "Not Marked", 
        value: Math.round((notMarked / total) * 100), 
        count: notMarked, 
        color: "#94a3b8", // Slate 400
        id: "not-marked"
      }
    ]
  }, [attendanceGraphData])

  return (
    <div className="flex flex-col gap-6 p-2 md:p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">HR Command Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">
            Real-time overview of workforce attendance and operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isHr && (
            <MarkLeaveDialog
              trigger={
                <Button variant="outline" className="border-gray-200 text-slate-700 bg-white hover:bg-gray-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                  <Plus className="h-4 w-4" />
                  <span className="font-semibold text-sm">Mark Leave</span>
                </Button>
              }
            />
          )}
          <MarkManualAttendanceDialog
            trigger={
              <Button variant="outline" className="border-gray-200 text-slate-700 bg-white hover:bg-gray-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                <ClipboardCheck className="h-4 w-4" />
                <span className="font-semibold text-sm">Mark Attendance</span>
              </Button>
            }
          />
          <AttendanceUploadDialog
            trigger={
              <Button
                variant="outline"
                className="border-gray-200 text-slate-700 bg-white hover:bg-gray-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Upload className="h-4 w-4" />
                <span className="font-semibold text-sm">Upload Attendance</span>
              </Button>
            }
          />
          <RegisterEmployeeDialog
            trigger={
              <Button className="bg-[#2dd4bf] hover:bg-[#26bba8] text-white font-bold text-sm flex gap-2 h-10 px-5 rounded-xl border-none shadow-sm transition-all active:scale-95">
                <Plus className="h-4 w-4" />
                <span>New Employee</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 relative">
        <AnimatePresence>
          {selectedStat && (
            <ExpandedStatCard
              category={selectedStat}
              title={statsConfig[selectedStat].title}
              onClose={() => setSelectedStat(null)}
              colorScheme={statsConfig[selectedStat].color}
            />
          )}
        </AnimatePresence>

        <motion.div
          layoutId="card-all"
          onClick={() => setSelectedStat("all")}
          className="cursor-pointer"
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
        >
          <Card className="border-none shadow-none bg-[#f1f5f9] rounded-[20px] overflow-hidden min-h-[130px] flex flex-col justify-between p-4 px-5 hover:bg-slate-200/50">
            <div className="space-y-2">
              <motion.h3 layoutId="title-all" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Labor Force</motion.h3>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {isDashboardCountLoading ? "..." : (dashboardCount?.totalUsers ?? 0)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Click to view</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          layoutId="card-present"
          onClick={() => setSelectedStat("present")}
          className="cursor-pointer"
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
        >
          <Card className="border-none shadow-none bg-[#f0f9f1] rounded-[20px] overflow-hidden min-h-[130px] flex flex-col justify-between p-4 px-5 hover:bg-emerald-100/50">
            <div className="space-y-2">
              <motion.h3 layoutId="title-present" className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Processed Present</motion.h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {isDashboardCountLoading ? "..." : (dashboardStats?.present ?? 0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employees</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          layoutId="card-absent"
          onClick={() => setSelectedStat("absent")}
          className="cursor-pointer"
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
        >
          <Card className="border-none bg-white border border-gray-100 rounded-[20px] overflow-hidden min-h-[130px] ring-1 ring-gray-100 flex flex-col justify-between p-4 px-5 shadow-sm hover:bg-slate-50">
            <div className="space-y-2">
              <motion.h3 layoutId="title-absent" className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Absentees</motion.h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {isDashboardCountLoading ? "..." : (dashboardStats?.absent ?? 0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employees</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          layoutId="card-on-leave"
          onClick={() => setSelectedStat("on-leave")}
          className="cursor-pointer"
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
        >
          <Card className="border-none shadow-none bg-[#f0fdfa] rounded-[20px] overflow-hidden min-h-[130px] flex flex-col justify-between p-4 px-5 hover:bg-teal-100/50">
            <div className="space-y-2">
              <motion.h3 layoutId="title-on-leave" className="text-[11px] font-bold text-[#0d9488] uppercase tracking-wider">On Leave</motion.h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {isDashboardCountLoading ? "..." : (dashboardStats?.onLeave ?? 0)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employees</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Not Marked */}
        <motion.div
          layoutId="card-not-marked"
          onClick={() => setSelectedStat("not-marked")}
          className="cursor-pointer"
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
        >
          <Card className="border-none shadow-none bg-[#0a3622] rounded-[20px] overflow-hidden min-h-[130px] flex flex-col justify-between p-4 px-5 hover:bg-[#0d4d31]">
            <div className="space-y-2">
              <motion.h3 layoutId="title-not-marked" className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Not Marked</motion.h3>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {isDashboardCountLoading ? "..." : (dashboardStats?.notMarked ?? 0)}
                </span>
                <span className="text-[10px] font-bold text-white/60 uppercase">Employees</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly Attendance */}
        <Card className="lg:col-span-2 border-none ring-1 ring-gray-100 shadow-none rounded-[28px] p-8 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 italic font-heading">
                {presetLabels[selectedPreset] || "Attendance"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedPreset === "custom" && (
                <DatePickerWithRange 
                  date={dateRange} 
                  setDate={setDateRange}
                  disabled={{ after: new Date() }}
                />
              )}
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-xs text-slate-700 focus:ring-emerald-500/10">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="this_week" className="text-xs font-semibold">This Week</SelectItem>
                  <SelectItem value="last_week" className="text-xs font-semibold">Last Week</SelectItem>
                  <SelectItem value="this_month" className="text-xs font-semibold">This Month</SelectItem>
                  <SelectItem value="last_month" className="text-xs font-semibold">Last Month</SelectItem>
                  <SelectItem value="custom" className="text-xs font-semibold">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {isGraphLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <BarChart data={graphData} margin={{ top: 0, right: 0, left: -20, bottom: 30 }} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                    tickFormatter={(val) => `${val}`}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="present" fill="#86efac" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="onLeave" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#0f4c3c" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-8 mt-10 px-4">
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-3 rounded-full bg-[#86efac]" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Present</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-3 rounded-full bg-[#2dd4bf]" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">On Leave</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-3 rounded-full bg-[#0f4c3c]" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Absent</span>
            </div>
          </div>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-none ring-1 ring-gray-100 shadow-none rounded-[28px] p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-heading">Gender Distribution</h3>
            </div>
            <MultiSelect
              options={[
                { label: "All Companies", value: "overall" },
                ...(statsData?.data.companyWise
                  .filter(company => company.companyName !== "No Company")
                  .map(company => ({
                    label: company.companyName,
                    value: company.companyId
                  })) || [])
              ]}
              selectedValues={selectedCompanyIds}
              onToggle={toggleCompany}
              placeholder="Select Company"
              className="w-[180px]"
            />
          </div>
          <p className="text-xs font-semibold text-slate-400 mb-8">Gender-wise breakdown of employees.</p>

          <div className="flex-1 relative min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
                  cornerRadius={6}
                >
                  {genderDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900">
                {currentStats?.totalUsers ?? 0}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {genderDistributionData.map((item, index) => (
              <div 
                key={`legend-${index}`} 
                onClick={() => handleGenderClick(item.id)}
                className="flex items-center justify-between group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-7 w-12 flex items-center justify-center rounded-lg text-[11px] font-black text-white shadow-sm" style={{ backgroundColor: item.color }}>
                    {item.value}%
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{item.count}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Employees</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => handleGenderClick()}
            className="w-full mt-6 bg-slate-50 border border-slate-100 text-slate-500 font-black text-[10px] h-10 shadow-none hover:bg-slate-100 hover:text-slate-700 rounded-xl group transition-all uppercase tracking-wider"
          >
            See More
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </Card>
      </div>

      {/* Detailed Data Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Attendance Activity Table */}
        <Card className="lg:col-span-2 border-none ring-1 ring-gray-100 shadow-none rounded-[28px] overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-8 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-slate-900 font-heading">Recent Attendance Activity</h3>
              <p className="text-xs font-semibold text-slate-400">Real-time log of employee punch-in and punch-out activities.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={activityCompanyId} onValueChange={setActivityCompanyId}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-xs text-slate-700 focus:ring-emerald-500/10">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all" className="text-xs font-semibold">All Companies</SelectItem>
                  {companiesData?.data?.map((company: { _id: string; name: string }) => (
                    <SelectItem key={company._id} value={company._id} className="text-xs font-semibold">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AttendanceTable
            data={attendanceList}
            isLoading={isAttendanceLoading}
            totalItems={attendanceData?.total || 0}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            selectedDate={today}
          />

          <EditEmployeeDialog
            employee={editingEmployee}
            open={!!editingEmployee}
            onOpenChange={(open) => !open && setEditingEmployee(null)}
          />

          <DeleteEmployeeDialog
            employeeId={deletingEmployeeId}
            open={!!deletingEmployeeId}
            onOpenChange={(open) => !open && setDeletingEmployeeId(null)}
          />
        </Card>

        {/* Side Column with Attendance and Alerts */}
        <div className="flex flex-col gap-4">
          {/* Attendance Distribution */}
          <Card className="border-none ring-1 ring-gray-100 shadow-none rounded-[28px] p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-heading">Attendance Distribution</h3>
              </div>
              <Select value={attendanceGraphCompanyId} onValueChange={setAttendanceGraphCompanyId}>
                <SelectTrigger className="w-[150px] h-9 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-[10px] text-slate-700 focus:ring-emerald-500/10">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all" className="text-[10px] font-semibold">All Companies</SelectItem>
                  {companiesData?.data?.map((company: { _id: string; name: string }) => (
                    <SelectItem key={company._id} value={company._id} className="text-[10px] font-semibold">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative min-h-[150px]">
              {isAttendanceGraphLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        animationBegin={200}
                        animationDuration={1500}
                        cornerRadius={4}
                      >
                        {attendanceDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-900">
                      {attendanceGraphData?.summary?.totalUsers ?? 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {attendanceDistributionData.map((item, index) => (
                <div 
                  key={`legend-${index}`} 
                  className="flex items-center justify-between group hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-bold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-800">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Event and Alerts */}
          <Card className="border-none ring-1 ring-gray-100 shadow-none rounded-[28px] flex flex-col p-6 bg-white overflow-hidden flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 font-heading">Event and Alerts</h3>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>

            <div className="flex-1 space-y-4 relative overflow-hidden">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-50" />
              {remindersData?.data?.slice(0, 3).map((reminder) => {
                const targetDate = new Date(reminder.nextOccurrence || reminder.startDate);
                const today = startOfDay(new Date());
                const diff = differenceInDays(startOfDay(targetDate), today);
                
                let statusColor = "bg-emerald-500";
                if (diff === 0) statusColor = "bg-amber-500";
                else if (diff < 0) statusColor = "bg-rose-500";

                return (
                  <div key={reminder._id} className="relative pl-10 flex flex-col gap-0.5 group cursor-pointer">
                    <div className={`absolute left-0 top-0 h-8 w-8 rounded-full bg-teal-50 border-4 border-white flex items-center justify-center z-10 shadow-sm group-hover:scale-105 transition-transform`}>
                      <Bell className="h-3 w-3 text-teal-500" />
                    </div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-[12px] font-bold text-slate-900 line-clamp-1">{reminder.title}</h4>
                      <div className={`h-1.5 w-1.5 rounded-full ${statusColor} mt-1`} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{reminder.time} | {reminder.description?.split(' | ')[0]}</p>
                  </div>
                );
              })}
            </div>

            <Button 
              onClick={() => router.push("/dashboard/reminders")}
              className="w-full mt-4 bg-slate-50 border border-slate-100 text-slate-500 font-black text-[10px] h-10 shadow-none hover:bg-slate-100 hover:text-slate-700 rounded-xl group transition-all uppercase tracking-wider"
            >
              All Alerts
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}