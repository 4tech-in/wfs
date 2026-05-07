"use client"

import * as React from "react"
import { RefreshCw, Upload, Plus, CalendarIcon, ClipboardCheck, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AttendanceUploadDialog } from "@/components/dashboard/attendance-upload-dialog"
import { MarkLeaveDialog } from "@/components/dashboard/mark-leave-dialog"
import { MarkMultipleAttendanceDialog } from "@/components/dashboard/mark-multiple-attendance-dialog"
import { MarkManualAttendanceDialog } from "@/components/dashboard/mark-attendance-dialog"
import { authStorage } from "@/lib/auth"
import { useAttendanceWithSummaryQuery } from "@/hooks/queries/use-attendance"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { PaginationState } from "@tanstack/react-table"
import { ManualAttendanceInitialData } from "@/types/attendance"
import { AttendanceTable } from "./attendance-table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
// Remove DateRange import
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
    Users, 
    UserCheck, 
    UserX, 
    UserMinus, 
    AlertTriangle 
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AttendancePage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <AttendanceContent />
        </React.Suspense>
    )
}

function AttendanceContent() {
    const searchParams = useSearchParams()
    const urlCompanyId = searchParams.get("companyId")
    const urlStatus = searchParams.get("status")
    const urlDate = searchParams.get("date")

    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const [date, setDate] = React.useState<Date>(urlDate ? new Date(urlDate) : new Date())
    const [status, setStatus] = React.useState<string | undefined>(urlStatus || undefined)
    const [companyId, setCompanyId] = React.useState<string>(urlCompanyId || "all")
    const [search, setSearch] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [manualAttendance, setManualAttendance] = React.useState<{
        open: boolean;
        initialData?: ManualAttendanceInitialData;
    }>({ open: false })

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const user = authStorage.getUser()
    const isHr = user?.role === "hr"

    const { data, isLoading, refetch, isFetching } = useAttendanceWithSummaryQuery(
        date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        pagination.pageIndex + 1,
        pagination.pageSize,
        status,
        companyId === "all" ? undefined : companyId,
        debouncedSearch
    )

    const handleStatusFilter = (newStatus: string | undefined) => {
        if (status === newStatus) {
            setStatus(undefined)
        } else {
            setStatus(newStatus)
        }
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }

    return (
        <div className="flex flex-col gap-6 p-2 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight italic font-heading text-emerald-600">Attendance Log</h1>
                </div>
                <div className="flex flex-wrap items-end gap-3 px-1">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                        <Label className="text-[10px] uppercase font-black text-slate-400 ml-1">Search Employee</Label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Name or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 pl-9 pr-4 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 font-medium text-xs transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] uppercase font-black text-slate-400 ml-1">Company</Label>
                        <CompanySelect 
                            value={companyId} 
                            onValueChange={(val) => {
                                setCompanyId(val)
                                setPagination(prev => ({ ...prev, pageIndex: 0 }))
                            }} 
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] uppercase font-black text-slate-400 ml-1">Daily Log</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[180px] h-10 pl-3 text-left font-semibold text-xs rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                                    {date ? format(date, "dd MMM yyyy") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-2xl" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => {
                                        if (d) {
                                            setDate(d)
                                            setPagination(prev => ({ ...prev, pageIndex: 0 }))
                                        }
                                    }}
                                    initialFocus
                                    className="rounded-2xl"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isLoading || isFetching}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 h-10 w-10 rounded-xl shadow-sm transition-all active:scale-95 bg-white border"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    </Button>
                    
                    {!isHr && (
                        <MarkLeaveDialog
                            trigger={
                                <Button variant="outline" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                                    <Plus className="h-4 w-4" />
                                    <span className="font-semibold text-sm">Mark Leave</span>
                                </Button>
                            }
                        />
                    )}

                    <MarkManualAttendanceDialog
                        open={manualAttendance.open}
                        onOpenChange={(open) => setManualAttendance(prev => ({ ...prev, open }))}
                        initialData={manualAttendance.initialData}
                        trigger={
                            <Button variant="outline" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                                <ClipboardCheck className="h-4 w-4" />
                                <span className="font-semibold text-sm">Mark Attendance</span>
                            </Button>
                        }
                    />

                    {!isHr && (
                        <MarkMultipleAttendanceDialog
                            trigger={
                                <Button variant="outline" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                                    <UserCheck className="h-4 w-4" />
                                    <span className="font-semibold text-sm">Mark Multiple</span>
                                </Button>
                            }
                        />
                    )}

                    <AttendanceUploadDialog
                        trigger={
                            <Button
                                variant="outline"
                                className="border-none text-white bg-emerald-500 hover:bg-emerald-600 flex gap-2 h-10 px-5 rounded-xl shadow-sm transition-all active:scale-95"
                            >
                                <Upload className="h-4 w-4" />
                                <span className="font-bold text-sm">Bulk Import</span>
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Attendance Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Labor", value: data?.summary?.totalUsers ?? 0, icon: Users, color: "text-slate-600", bg: "bg-slate-50", status: undefined },
                    { label: "Present", value: data?.summary?.present ?? 0, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", status: "Present" },
                    { label: "Absent", value: data?.summary?.absent ?? 0, icon: UserX, color: "text-rose-600", bg: "bg-rose-50", status: "Absent" },
                    { label: "On Leave", value: data?.summary?.onLeave ?? 0, icon: UserMinus, color: "text-amber-600", bg: "bg-amber-50", status: "On Leave" },
                    { label: "Not Marked", value: data?.summary?.notMarked ?? 0, icon: AlertTriangle, color: "text-emerald-300", bg: "bg-[#0a3622]", status: "Not Marked" },
                ].map((stat) => {
                    const isActive = status === stat.status;
                    return (
                        <Card 
                            key={stat.label} 
                            onClick={() => handleStatusFilter(stat.status)}
                            className={cn(
                                "p-5 border-none shadow-sm flex flex-col justify-between min-h-[120px] rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                                stat.label === 'Not Marked' ? 'bg-[#0a3622]' : 'bg-white',
                                isActive && "ring-2 ring-emerald-500 ring-offset-2"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    stat.label === 'Not Marked' ? 'text-emerald-500/70' : 'text-slate-400',
                                    isActive && "text-emerald-600"
                                )}>
                                    {stat.label}
                                </p>
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    stat.label === 'Not Marked' ? 'bg-emerald-500/10' : stat.bg,
                                    isActive && "bg-emerald-500 text-white"
                                )}>
                                    <stat.icon className={cn(
                                        "h-4 w-4 transition-colors",
                                        stat.label === 'Not Marked' ? 'text-emerald-500' : stat.color,
                                        isActive && "text-white"
                                    )} />
                                </div>
                            </div>
                            <p className={cn(
                                "text-3xl font-black tracking-tight",
                                stat.label === 'Not Marked' ? 'text-white' : 'text-slate-900'
                            )}>
                                {stat.value}
                            </p>
                        </Card>
                    );
                })}
            </div>

            <AttendanceTable
                data={data?.data || []}
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalItems={data?.total}
                selectedDate={date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
                onMarkManual={(initialData) => setManualAttendance({ open: true, initialData })}
            />
        </div>
    )
}

function CompanySelect({ value, onValueChange }: { value: string, onValueChange: (val: string) => void }) {
    const { data: companyData, isLoading } = useCompanyDropdownQuery()
    const companies = companyData?.data || []

    return (
        <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white shadow-sm font-semibold text-xs text-slate-700 focus:ring-emerald-500/10">
                <SelectValue placeholder="Select Company" />
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
    )
}