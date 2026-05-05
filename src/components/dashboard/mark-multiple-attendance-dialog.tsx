"use client"

import * as React from "react"
import { 
  CalendarIcon, 
  Loader2, 
  X, 
  UserCheck, 
  Search, 
  Check, 
  ChevronsUpDown,
  CheckCircle2
} from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useUpdateMultipleAttendanceMutation } from "@/hooks/queries/use-attendance"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { employeeService } from "@/services/employee-service"
import { CompanyListItem } from "@/types/company"
import { EmployeeDropdownItem } from "@/types/employee"

const multiAttendanceSchema = z.object({
  companyId: z.string().optional(),
  userIds: z.array(z.string()).min(1, "Select at least one employee"),
  date: z.any().refine((val) => val instanceof Date, "Date is required"),
  status: z.string().min(1, "Status is required"),
})

type MultiAttendanceFormValues = z.infer<typeof multiAttendanceSchema>

interface MarkMultipleAttendanceDialogProps {
  trigger?: React.ReactNode
}

const ATTENDANCE_STATUSES = ["Present", "Absent", "On Leave", "Half Day"]

export function MarkMultipleAttendanceDialog({ trigger }: MarkMultipleAttendanceDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedEmployeesMap, setSelectedEmployeesMap] = React.useState<Record<string, EmployeeDropdownItem>>({})
  const [isSelectingAll, setIsSelectingAll] = React.useState(false)

  const updateMutation = useUpdateMultipleAttendanceMutation()
  const { data: companiesData } = useCompanyDropdownQuery()

  const form = useForm<MultiAttendanceFormValues>({
    resolver: zodResolver(multiAttendanceSchema),
    defaultValues: {
      companyId: "all",
      userIds: [],
      date: new Date(),
      status: "Present",
    },
  })

  const selectedCompanyId = useWatch({
    control: form.control,
    name: "companyId",
  })

  const selectedUserIds = useWatch({
    control: form.control,
    name: "userIds",
  })

  const {
    data: employeeData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingEmployees
  } = useEmployeesDropdownInfiniteQuery({ 
    search: debouncedSearch,
    companyId: selectedCompanyId === "all" ? undefined : selectedCompanyId
  }, open)

  const allEmployees = React.useMemo(() =>
    employeeData?.pages.flatMap((page) => page.data) || [],
    [employeeData]
  )

  const handleSelectAll = async () => {
    try {
      setIsSelectingAll(true)
      const response = await employeeService.getDropdown({ 
        companyId: selectedCompanyId === "all" ? undefined : selectedCompanyId,
        limit: 1000 
      })
      
      if (response?.data) {
        const allIds = response.data.map(emp => emp._id)
        form.setValue("userIds", allIds)
        
        setSelectedEmployeesMap(prev => {
          const newMap = { ...prev }
          response.data.forEach(emp => {
            newMap[emp._id] = emp
          })
          return newMap
        })
      }
    } catch (error) {
      console.error("Failed to select all employees:", error)
    } finally {
      setIsSelectingAll(false)
    }
  }

  const onSubmit = async (values: MultiAttendanceFormValues) => {
    try {
      await updateMutation.mutateAsync({
        userIds: values.userIds,
        date: format(values.date, "yyyy-MM-dd"),
        status: values.status,
      })
      setOpen(false)
      form.reset()
      setSelectedEmployeesMap({})
    } catch {
      // Error handled by mutation
    }
  }

  const removeEmployee = (id: string) => {
    form.setValue("userIds", selectedUserIds.filter(itemId => itemId !== id))
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o)
      if (!o) {
        form.reset()
        setSelectedEmployeesMap({})
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex gap-2">
            <UserCheck className="h-4 w-4" />
            Mark Multiple
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white/95 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
        
        <DialogHeader className="p-8 pb-0 relative z-10">
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-all p-2 rounded-xl hover:bg-slate-50 z-50"
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 italic font-heading">
            Mark Multiple Attendance
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium pt-1">
            Bulk update attendance status for a group of employees.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5 relative z-10">
            {/* Company Selection */}
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Company</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue("userIds", [])
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white/50 focus:ring-emerald-500/20">
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all" className="rounded-lg font-bold text-slate-500 italic">All Companies</SelectItem>
                      {companiesData?.data?.map((company: CompanyListItem) => (
                        <SelectItem key={company._id} value={company._id} className="rounded-lg italic font-bold">
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            {/* Employee Multi-select */}
            <FormField
              control={form.control}
              name="userIds"
              render={() => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Employees</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] max-h-[100px] overflow-y-auto p-2 border rounded-xl bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
                    {selectedUserIds.length === 0 && (
                      <span className="text-slate-400 text-[10px] font-bold uppercase py-1 px-2">No employees selected</span>
                    )}
                    {selectedUserIds.map((id) => {
                      const emp = allEmployees.find(e => e._id === id) || selectedEmployeesMap[id]
                      return (
                        <Badge 
                          key={id} 
                          variant="secondary" 
                          className="bg-white border-slate-100 text-slate-700 hover:bg-slate-100 flex items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold"
                        >
                          {emp?.name || "Employee"}
                          <X 
                            className="h-3 w-3 cursor-pointer text-slate-300 hover:text-rose-500" 
                            onClick={() => removeEmployee(id)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-12 w-full justify-between rounded-xl border-slate-200 bg-white/50 hover:bg-white text-xs font-bold text-slate-600 shadow-sm"
                      >
                        <span className="truncate italic">
                          {selectedUserIds.length === 0 
                            ? "Click to select employees..." 
                            : `${selectedUserIds.length} employees selected`}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[436px] p-0 rounded-2xl border-slate-100 shadow-2xl" align="start">
                      <div className="p-2 border-b bg-slate-50/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search employees..."
                            className="pl-9 h-10 border-slate-200 rounded-xl bg-white shadow-sm italic text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div 
                        className="h-48 overflow-y-auto p-1 scrollbar-thin"
                        onScroll={handleScroll}
                      >
                        <div className="flex items-center justify-between border-b px-1 py-1 mb-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md flex-1 font-black uppercase tracking-widest"
                            onClick={handleSelectAll}
                            disabled={isSelectingAll}
                          >
                            {isSelectingAll ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Select All Employees {selectedCompanyId !== "all" ? "of Company" : ""}
                          </Button>
                        </div>

                        {isLoadingEmployees && allEmployees.length === 0 ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                          </div>
                        ) : allEmployees.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-[10px] font-black uppercase">No employees found</div>
                        ) : (
                          allEmployees.map((employee) => (
                            <div
                              key={employee._id}
                              className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                              onClick={() => {
                                const current = selectedUserIds
                                const exists = current.includes(employee._id)
                                if (exists) {
                                  form.setValue("userIds", current.filter(id => id !== employee._id))
                                } else {
                                  form.setValue("userIds", [...current, employee._id])
                                  setSelectedEmployeesMap(prev => ({ ...prev, [employee._id]: employee }))
                                }
                              }}
                            >
                              <Checkbox
                                checked={selectedUserIds.includes(employee._id)}
                                className="rounded-[6px] border-slate-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 italic">{employee.name || "Unnamed"}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {employee.employeeId || "N/A"}</span>
                              </div>
                              {selectedUserIds.includes(employee._id) && (
                                <Check className="ml-auto h-3 w-3 text-emerald-500" />
                              )}
                            </div>
                          ))
                        )}
                        {isFetchingNextPage && (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-300" />
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Date Selection */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-12 pl-3 text-left font-bold text-xs italic rounded-xl border-slate-200 bg-white/50 hover:bg-white transition-all",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd MMM yyyy") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 text-emerald-500" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />

              {/* Status Selection */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white/50 focus:ring-emerald-500/20 text-xs font-bold italic text-slate-700">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {ATTENDANCE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status} className="rounded-lg focus:bg-emerald-50 italic font-bold text-slate-700">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={updateMutation.isPending}
                className="text-slate-400 font-bold hover:bg-slate-50 transition-all px-6 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className={cn(
                  "px-8 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20",
                  "bg-emerald-500 hover:bg-emerald-600 text-white scale-105"
                )}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Update Attendance
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
