"use client"

import * as React from "react"
import { PaginationState } from "@tanstack/react-table"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoasterDialog } from "@/components/dashboard/roaster-dialog"
import { RoasterTable } from "./roaster-table"
import { useAssignAttendancePolicyQuery } from "@/hooks/queries/use-roster"

export default function RoasterPage() {
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const { data, isLoading, refetch, isFetching } = useAssignAttendancePolicyQuery(
        pagination.pageIndex + 1,
        pagination.pageSize
    )

    return (
        <div className="flex flex-col gap-6 p-2 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic font-heading">Roster Management</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        View and manage employee shifts and schedules.
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                    <RoasterDialog />
                </div>
            </div>

            <RoasterTable 
                data={data?.data || []} 
                isLoading={isLoading}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalItems={data?.pagination?.total}
                pageCount={data?.pagination?.totalPages}
            />
        </div>
    )
}