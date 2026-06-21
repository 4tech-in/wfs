"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { 
  Clock, 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Briefcase,
  Building2,
  Check,
  X,
  MoreHorizontal,
  Trash2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Attendance, UserAttendanceItem, ManualAttendanceInitialData } from "@/types/attendance"
import { format } from "date-fns"
import { PaginationState } from "@tanstack/react-table"
import { useMarkAttendanceMutation } from "@/hooks/queries/use-attendance"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface AttendanceTableProps {
  data: (UserAttendanceItem | Attendance)[]
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  totalItems?: number
  hideSearch?: boolean
  selectedDate?: string
  onMarkManual?: (initialData: ManualAttendanceInitialData) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  isLeaveView?: boolean
}

export function AttendanceTable({ 
  data, 
  isLoading,
  pagination,
  onPaginationChange,
  totalItems,
  hideSearch = false,
  selectedDate = format(new Date(), "yyyy-MM-dd"),
  onMarkManual,
  onDelete,
  showActions = true,
  isLeaveView = false
}: AttendanceTableProps) {
  const markAttendanceMutation = useMarkAttendanceMutation()

  /**
   * Helper to format ISO time to HH:mm exactly as in the string
   */
  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "--:--"
    try {
      // If it's an ISO string (e.g., 2024-05-10T10:30:00Z), extract HH:mm directly
      if (isoString.includes('T')) {
        return isoString.split('T')[1].substring(0, 5)
      }
      // If it's already a time string or similar, just take the first 5 chars
      if (isoString.includes(':')) {
        return isoString.substring(0, 5)
      }
      return isoString
    } catch {
      return "--:--"
    }
  }

  /**
   * Helper to format ISO date to DD MMM YY without timezone shift
   */
  const formatDateLabel = (isoString: string | undefined) => {
    if (!isoString) return "N/A"
    try {
      // Extract YYYY-MM-DD and parse as local date parts to avoid UTC shift
      const datePart = isoString.split('T')[0]
      const [year, month, day] = datePart.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return format(date, "dd MMM yy")
    } catch {
      return isoString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100/50 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            {status}
          </Badge>
        )
      case 'Absent':
        return (
          <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            <XCircle className="h-3 w-3" />
            {status}
          </Badge>
        )
      case 'Late':
      case 'Half-Day':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100/50 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        )
      case 'Not Marked':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        )
      case 'On Leave':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100/50 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            <Calendar className="h-3 w-3" />
            {status}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            {status}
          </Badge>
        )
    }
  }

  const columns = React.useMemo<ColumnDef<UserAttendanceItem | Attendance>[]>(() => {
    const cols: ColumnDef<UserAttendanceItem | Attendance>[] = [
      {
        accessorKey: "userId",
        header: "Employee",
        cell: ({ row }) => {
          const item = row.original;
          const user = 'user' in item ? item.user : item.userId;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 line-clamp-1">
                  {user?.otherName || user?.name || "Unknown"}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                  {user?.employeeId}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const item = row.original;
          const attendance = 'attendance' in item ? item.attendance : item;
          const dateStr = attendance?.date || selectedDate;
          return (
            <div className="flex items-center gap-2 text-slate-600 font-bold whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatDateLabel(dateStr)}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "designation",
        header: "Designation",
        cell: ({ row }) => {
          const item = row.original;
          const user = 'user' in item ? item.user : item.userId;
          return (
            <div className="flex items-center gap-2 text-slate-600 font-bold whitespace-nowrap">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <span>{user?.designation || "N/A"}</span>
            </div>
          )
        },
      },
    ];

    if (isLeaveView) {
      cols.push({
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => {
          const item = row.original;
          const user = 'user' in item ? item.user : item.userId;
          
          interface UserWithDepartment {
            department?: {
              name: string;
            };
            departmentName?: string;
          }
          
          const userWithDept = user as unknown as UserWithDepartment;
          return (
            <div className="flex items-center gap-2 text-slate-600 font-bold whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{userWithDept?.department?.name || userWithDept?.departmentName || "N/A"}</span>
            </div>
          )
        },
      });
    }

    cols.push({
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => {
        const item = row.original;
        const user = 'user' in item ? item.user : item.userId;
        return (
          <div className="flex items-center gap-2 text-slate-600 font-bold whitespace-nowrap">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span>{user?.company?.name || user?.companyName || "N/A"}</span>
          </div>
        )
      },
    });

    if (!isLeaveView) {
      cols.push(
        {
          accessorKey: "punchIn",
          header: "Punch In",
          cell: ({ row }) => {
            const item = row.original;
            const attendance = 'attendance' in item ? item.attendance : item;
            const time = formatTime(attendance?.punchIn);
            const date = attendance?.punchIn?.includes('T') ? formatDateLabel(attendance.punchIn) : null;
            
            return (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{time}</span>
                </div>
                {date && (
                  <span className="text-[9px] text-slate-400 font-medium ml-5.5">
                    {date}
                  </span>
                )}
              </div>
            )
          },
        },
        {
          accessorKey: "punchOut",
          header: "Punch Out",
          cell: ({ row }) => {
            const item = row.original;
            const attendance = 'attendance' in item ? item.attendance : item;
            const time = formatTime(attendance?.punchOut);
            const date = attendance?.punchOut?.includes('T') ? formatDateLabel(attendance.punchOut) : null;

            return (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <Clock className="h-3.5 w-3.5 text-rose-500" />
                  <span>{time}</span>
                </div>
                {date && (
                  <span className="text-[9px] text-slate-400 font-medium ml-5.5">
                    {date}
                  </span>
                )}
              </div>
            )
          },
        },
        {
          accessorKey: "totalWorkedMinutes",
          header: "Duration",
          cell: ({ row }) => {
            const item = row.original;
            const attendance = 'attendance' in item ? item.attendance : item;
            const mins = Math.floor(attendance?.totalWorkedMinutes || 0)
            const hours = Math.floor(mins / 60)
            const remainingMins = mins % 60
            return (
              <span className="font-bold text-slate-700">
                {hours}h {remainingMins}m
              </span>
            )
          },
        },
        {
          accessorKey: "overtimeHours",
          header: "Overtime",
          cell: ({ row }) => {
            const item = row.original;
            const attendance = 'attendance' in item ? item.attendance : item;
            return (
              <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{attendance?.overtimeHours || 0}h</span>
              </div>
            )
          },
        }
      );
    }

    cols.push({
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    });

    if (showActions) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          const user = 'user' in item ? item.user : item.userId;
          const attendance = 'attendance' in item ? item.attendance : item;
          const recordDate = attendance?.date || selectedDate;

          const handleAction = (status: 'Present' | 'Absent') => {
            if (!user?._id) return;
            
            const punchIn = attendance?.punchIn;
            const punchOut = attendance?.punchOut;

            // Special case for Absent: do not send punches
            if (status === 'Absent') {
              markAttendanceMutation.mutate({
                userIds: [user._id],
                date: recordDate,
                status: 'Absent',
                punchIn: null,
                punchOut: null
              });
              return;
            }

            // If punchIn is available but punchOut is not, ask for punch out details via manual dialog
            if (punchIn && !punchOut && onMarkManual) {
              onMarkManual({
                employeeId: user._id,
                companyId: user.company?._id,
                date: new Date(recordDate),
                status: status,
                punchIn: punchIn,
                punchOut: punchOut
              });
              return;
            }

            if (punchIn || punchOut) {
              markAttendanceMutation.mutate({
                userIds: [user._id],
                date: recordDate,
                status: status,
                punchIn,
                punchOut
              });
            } else {
              onMarkManual?.({
                employeeId: user._id,
                companyId: user.company?._id,
                date: new Date(recordDate),
                status: status
              });
            }
          };

          return (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                  <DropdownMenuItem 
                    className="gap-2 font-bold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-lg cursor-pointer"
                    onClick={() => handleAction('Present')}
                  >
                    <Check className="h-4 w-4" />
                    Mark Present
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50 rounded-lg cursor-pointer"
                    onClick={() => handleAction('Absent')}
                  >
                    <X className="h-4 w-4" />
                    Mark Absent
                  </DropdownMenuItem>
                  {onDelete && user?._id && (
                    <DropdownMenuItem 
                      className="gap-2 font-bold text-destructive focus:text-destructive focus:bg-destructive/5 rounded-lg cursor-pointer"
                      onClick={() => onDelete(user._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Employee
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
      })
    }

    return cols;
  }, [selectedDate, isLeaveView, showActions, onMarkManual, onDelete, markAttendanceMutation]);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      totalItems={totalItems}
      showSrNo={true}
      hideSearch={hideSearch}
    />
  )
}
