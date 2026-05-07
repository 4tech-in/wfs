"use client"

import * as React from "react"
import { RefreshCw, Plus, ClipboardList, Clock, CheckCircle2, XCircle, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkLeaveDialog } from "@/components/dashboard/mark-leave-dialog"
import { useLeavesQuery } from "@/hooks/queries/use-leave"
import { PaginationState } from "@tanstack/react-table"
import { LeaveTable } from "./leave-table"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react"
import { authStorage } from "@/lib/auth"
import {
    WhatsappShareButton,
    WhatsappIcon,
    TelegramShareButton,
    TelegramIcon,
} from 'next-share'

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export default function LeaveManagement() {
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const [currentDate, setCurrentDate] = React.useState(new Date())
    const user = authStorage.getUser()
    const isHr = user?.role === "hr"

    const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const yearStr = currentDate.getFullYear().toString()

    const [shareUrl, setShareUrl] = React.useState("")

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            setShareUrl(`${window.location.origin}/employee-leave-apply`)
        }
    }, [])

    const { data, isLoading, refetch, isFetching } = useLeavesQuery(
        pagination.pageIndex + 1,
        pagination.pageSize,
        monthStr,
        yearStr
    )

    const leaves = data?.data || []

    // Simple stats calculation for the current view
    const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        approved: leaves.filter(l => l.status === 'Approved').length,
        rejected: leaves.filter(l => l.status === 'Rejected').length,
    }

    return (
        <div className="flex flex-col gap-8 p-2 md:p-8 bg-slate-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold tracking-tight italic font-heading text-[#2eb88a]">Leave Management</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Oversee employee leave applications, approvals, and history.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        <div className="flex items-center divide-x divide-slate-100">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-2 text-sm font-bold text-slate-700 hover:text-[#2eb88a] transition-colors flex items-center gap-1 group outline-none whitespace-nowrap">
                                        {months[currentDate.getMonth()]}
                                        <ChevronDown className="h-3 w-3 text-slate-300 group-hover:text-[#2eb88a] transition-colors" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-64 overflow-y-auto rounded-xl border-slate-100 shadow-xl">
                                    {months.map((month, idx) => (
                                        <DropdownMenuItem
                                            key={month}
                                            onClick={() => {
                                                const newDate = new Date(currentDate)
                                                newDate.setMonth(idx)
                                                setCurrentDate(newDate)
                                            }}
                                            className="rounded-lg focus:bg-teal-50 font-medium"
                                        >
                                            {month}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-2 text-sm font-bold text-slate-700 hover:text-[#2eb88a] transition-colors flex items-center gap-1 group outline-none">
                                        {currentDate.getFullYear()}
                                        <ChevronDown className="h-3 w-3 text-slate-300 group-hover:text-[#2eb88a] transition-colors" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-h-64 overflow-y-auto rounded-xl border-slate-100 shadow-xl">
                                    {(() => {
                                        const currentYear = new Date().getFullYear();
                                        const years = [];
                                        for (let i = currentYear - 10; i <= currentYear + 1; i++) {
                                            years.push(i);
                                        }
                                        return years;
                                    })().reverse().map((year) => (
                                        <DropdownMenuItem
                                            key={year}
                                            onClick={() => {
                                                const newDate = new Date(currentDate)
                                                newDate.setFullYear(year)
                                                setCurrentDate(newDate)
                                            }}
                                            className="rounded-lg focus:bg-teal-50 font-medium"
                                        >
                                            {year}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isLoading || isFetching}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 h-10 w-10 rounded-xl shadow-sm transition-all active:scale-95 border-none bg-white p-0"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex gap-2 h-10 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                            >
                                <Share2 className="h-4 w-4" />
                                <span className="font-bold text-sm">Share Leave Apply Link</span>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-2 rounded-xl border-slate-100 shadow-xl min-w-[200px] flex flex-col gap-1">
                            <div className="px-2 py-1.5 mb-1">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Platform</p>
                            </div>

                            <DropdownMenuItem asChild>
                                <WhatsappShareButton
                                    url={shareUrl}
                                    title={'Apply for leave at Goyal Enterprises:'}
                                    separator=" "
                                >
                                    <div className="flex items-center gap-3 px-2 py-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors w-full outline-none">
                                        <WhatsappIcon size={24} round />
                                        <span className="text-sm font-bold text-slate-700">WhatsApp</span>
                                    </div>
                                </WhatsappShareButton>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <TelegramShareButton
                                    url={shareUrl}
                                    title={'Apply for leave at Goyal Enterprises:'}
                                >
                                    <div className="flex items-center gap-3 px-2 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors w-full outline-none">
                                        <TelegramIcon size={24} round />
                                        <span className="text-sm font-bold text-slate-700">Telegram</span>
                                    </div>
                                </TelegramShareButton>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    if (shareUrl) {
                                        navigator.clipboard.writeText(shareUrl)
                                        toast.success("Link copied to clipboard!")
                                    }
                                }}
                                className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border-t border-slate-50 mt-1 outline-none"
                            >
                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Share2 className="h-3 w-3 text-slate-500" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Copy Link</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {!isHr && (
                        <MarkLeaveDialog
                            trigger={
                                <Button variant="outline" className="border-gray-200 text-slate-100 bg-[#2dd4bf] hover:bg-[#26bba8] flex gap-2 h-10 px-6 rounded-xl border-none shadow-lg shadow-teal-500/10 transition-all active:scale-95">
                                    <Plus className="h-4 w-4" />
                                    <span className="font-bold text-sm">Mark Leave</span>
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Applied", value: stats.total, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((stat) => (
                    <Card key={stat.label} className="p-4 border-none shadow-sm flex items-center gap-4">
                        <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900 text-center">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <LeaveTable
                data={leaves}
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalItems={data?.total}
            />
        </div>
    )
}