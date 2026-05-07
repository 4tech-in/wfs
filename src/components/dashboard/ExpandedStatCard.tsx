"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmployeeStatus } from "@/types/employee"
import { useDataTable } from "@/hooks/use-data-table"
import { useAttendanceWithSummaryQuery } from "@/hooks/queries/use-attendance"
import { format } from "date-fns"
import { useEmployeesQuery } from "@/hooks/queries/use-employees-query"
import { AttendanceTable } from "@/app/dashboard/attendance/attendance-table"
import { EmployeeTable } from "@/app/dashboard/employee/employee-table"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ExpandedStatCardProps {
  category: EmployeeStatus | "all"
  title: string
  onClose: () => void
  colorScheme: {
    bg: string
    text: string
    titleText: string
  }
}

export function ExpandedStatCard({ 
  category, 
  title, 
  onClose,
  colorScheme,
}: ExpandedStatCardProps) {
  const isEmployeeView = category === "all";
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
  const { data: companiesData } = useCompanyDropdownQuery()

  // Mapping categories to attendance statuses
  const categoryToStatus: Record<string, string | undefined> = {
    present: "Present",
    absent: "Absent",
    "on-leave": "On Leave",
    "not-marked": "Not Marked",
  }

  // Local data fetching for the expanded view
  const {
    pagination,
    onPaginationChange,
    onSortingChange,
    search,
    onSearchChange,
    apiParams,
  } = useDataTable({
    storageKey: `expanded-stat-${category}`,
    initialPageSize: 10,
  })

  // Attendance Query (for specific statuses)
  // Enabled only when NOT in the full employee master view
  const today = format(new Date(), "yyyy-MM-dd")
  const { data: attendanceData, isLoading: isAttendanceLoading } = useAttendanceWithSummaryQuery(
    today,
    today,
    apiParams.page, 
    10, // Force limit 10 to override any cached values
    isEmployeeView ? undefined : categoryToStatus[category],
    selectedCompanyId === "all" ? undefined : selectedCompanyId,
    apiParams.search,
    { 
      staleTime: 60000,
      enabled: !isEmployeeView
    }
  )

  // Employee Query (for "Total Labor Force" / category "all")
  // Enabled only when in the full employee master view
  const { data: employeeData, isLoading: isEmployeeLoading } = useEmployeesQuery(
    isEmployeeView 
      ? { ...apiParams, limit: 10, companyId: selectedCompanyId === "all" ? undefined : selectedCompanyId } 
      : { limit: 10 },
    { 
      staleTime: 60000,
      enabled: isEmployeeView
    }
  )

  const isLoading = isEmployeeView ? isEmployeeLoading : isAttendanceLoading;
  const dataList = isEmployeeView ? (employeeData?.data || []) : (attendanceData?.data || []);
  const totalItems = isEmployeeView ? (employeeData?.pagination?.total || 0) : (attendanceData?.total || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${category}`}
        className={`w-full max-w-6xl max-h-[90vh] ${colorScheme.bg} rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative border-none`}
        onClick={(e) => e.stopPropagation()}
        transition={{ 
          type: "spring", 
          damping: 30, 
          stiffness: 300,
          mass: 0.8
        }}
        style={{ willChange: "transform, opacity" }}
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-black/5">
          <div className="space-y-1">
            <motion.h3 
              layoutId={`title-${category}`}
              className={`text-xs font-bold ${colorScheme.titleText} uppercase tracking-widest`}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h3>
            <motion.h2 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-3xl font-extrabold ${colorScheme.text} tracking-tight`}
            >
              Detailed Report
            </motion.h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className={`w-[200px] h-10 rounded-xl bg-white/50 border-black/5 ${colorScheme.text} font-bold text-xs shadow-sm backdrop-blur-sm focus:ring-black/5`}>
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-black/5 shadow-2xl">
                <SelectItem value="all" className="text-xs font-bold">All Companies</SelectItem>
                {companiesData?.data?.map((company: { _id: string; name: string }) => (
                  <SelectItem key={company._id} value={company._id} className="text-xs font-bold">
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className={`rounded-full hover:bg-black/5 transition-colors ${colorScheme.text}`}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content Area - Delayed fade in to prevent lag during expansion */}
        <motion.div 
          className="flex-1 overflow-y-auto p-4 md:p-6 bg-white/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
           {isEmployeeView ? (
             <EmployeeTable 
               data={employeeData?.data || []} 
               isLoading={isLoading}
               totalItems={totalItems}
               pageCount={employeeData?.pagination?.totalPages || 0}
               pagination={{ ...pagination, pageSize: 10 }}
               onPaginationChange={onPaginationChange}
               onSortingChange={onSortingChange}
               search={search}
               onSearchChange={onSearchChange}
               showActions={false}
               hideSearch={true}
               isDashboardView={true}
             />
           ) : (
             <AttendanceTable 
               data={attendanceData?.data || []} 
               isLoading={isLoading}
               totalItems={totalItems}
               pagination={{ ...pagination, pageSize: 10 }}
               onPaginationChange={onPaginationChange}
               hideSearch={true}
             />
           )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="p-6 bg-white/30 backdrop-blur-md border-t border-black/5 flex justify-between items-center px-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`text-sm font-bold ${colorScheme.text} opacity-70`}>
            Showing <span className={`font-extrabold opacity-100`}>{dataList.length}</span> of <span className={`font-extrabold opacity-100`}>{totalItems}</span> records for <span className={`capitalize font-extrabold opacity-100`}>{category === "all" ? "Whole Workforce" : category.replace("-", " ")}</span>
          </div>
          <Button 
            onClick={onClose}
            className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl px-6 h-11 transition-transform active:scale-95"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
