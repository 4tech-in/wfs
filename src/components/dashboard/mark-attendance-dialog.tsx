"use client"

import * as React from "react"
import { CalendarIcon, Loader2, X, ClipboardCheck, Clock } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, setHours, setMinutes, setSeconds } from "date-fns"

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
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useCompanyDropdownInfiniteQuery } from "@/hooks/queries/use-company"
import { useMarkManualAttendanceMutation } from "@/hooks/queries/use-attendance"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { EmployeeDropdownItem } from "@/types/employee"
import { CompanyListItem } from "@/types/company"
import { ManualAttendanceStatus, ManualAttendanceInitialData } from "@/types/attendance"

const attendanceSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  employeeId: z.string().min(1, "Employee is required"),
  date: z.any().refine((val) => val instanceof Date, "Date is required"),
  status: z.string().min(1, "Status is required"),
  punchInHour: z.string().optional(),
  punchInMinute: z.string().optional(),
  punchInPeriod: z.string().optional(),
  punchOutHour: z.string().optional(),
  punchOutMinute: z.string().optional(),
  punchOutPeriod: z.string().optional(),
})

type AttendanceFormValues = z.infer<typeof attendanceSchema>

const STATUS_OPTIONS: { label: string; value: ManualAttendanceStatus }[] = [
  { label: "Present", value: "Present" },
  { label: "Absent", value: "Absent" },
  { label: "Half Day", value: "Half-Day" },
  { label: "Weekly Off", value: "WeeklyOff" },
  { label: "Holiday", value: "Holiday" },
]

const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))
const PERIODS = ["AM", "PM"]

interface MarkManualAttendanceDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: ManualAttendanceInitialData;
}

export function MarkManualAttendanceDialog({ 
  trigger, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  initialData
}: MarkManualAttendanceDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen
  const [companySearch, setCompanySearch] = React.useState("")
  const [employeeSearch, setEmployeeSearch] = React.useState("")
  
  const debouncedCompanySearch = useDebounce(companySearch, 300)
  const debouncedEmployeeSearch = useDebounce(employeeSearch, 300)

  const {
    data: companyData,
    fetchNextPage: fetchNextCompanies,
    hasNextPage: hasNextCompanies,
    isFetchingNextPage: isFetchingNextCompanies,
    isLoading: isLoadingCompanies
  } = useCompanyDropdownInfiniteQuery({ search: debouncedCompanySearch })

  const companiesList = React.useMemo(() =>
    companyData?.pages.flatMap((page) => page.data) || [],
    [companyData]
  )

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      companyId: initialData?.companyId || "",
      employeeId: initialData?.employeeId || "",
      date: initialData?.date || new Date(),
      status: initialData?.status || "Present",
      punchInHour: initialData?.punchIn ? format(new Date(initialData.punchIn), "hh") : "09",
      punchInMinute: initialData?.punchIn ? format(new Date(initialData.punchIn), "mm") : "00",
      punchInPeriod: initialData?.punchIn ? format(new Date(initialData.punchIn), "aa") : "AM",
      punchOutHour: initialData?.punchOut ? format(new Date(initialData.punchOut), "hh") : "06",
      punchOutMinute: initialData?.punchOut ? format(new Date(initialData.punchOut), "mm") : "00",
      punchOutPeriod: initialData?.punchOut ? format(new Date(initialData.punchOut), "aa") : "PM",
    },
  })

  const selectedCompanyId = useWatch({
    control: form.control,
    name: "companyId",
    defaultValue: ""
  })

  const {
    data: employeeData,
    fetchNextPage: fetchNextEmployees,
    hasNextPage: hasNextEmployees,
    isFetchingNextPage: isFetchingNextEmployees,
    isLoading: isLoadingEmployees
  } = useEmployeesDropdownInfiniteQuery(
    { search: debouncedEmployeeSearch, companyId: selectedCompanyId },
    open && !!selectedCompanyId
  )

  const employeeList = React.useMemo(() =>
    employeeData?.pages.flatMap((page) => page.data) || [],
    [employeeData]
  )

  const markManualAttendanceMutation = useMarkManualAttendanceMutation()

  const onSubmit = async (values: AttendanceFormValues) => {
    try {
      const { date, punchInHour, punchInMinute, punchOutHour, punchOutMinute } = values
      
      let punchIn: string | null = null
      let punchOut: string | null = null

      if (values.status === "Present" || values.status === "Half-Day") {
        if (punchInHour && punchInMinute && values.punchInPeriod) {
          let h = parseInt(punchInHour)
          if (values.punchInPeriod === "PM" && h < 12) h += 12
          if (values.punchInPeriod === "AM" && h === 12) h = 0
          
          const punchInDate = setSeconds(setMinutes(setHours(new Date(date), h), parseInt(punchInMinute)), 0)
          punchIn = punchInDate.toISOString()
        }
        if (punchOutHour && punchOutMinute && values.punchOutPeriod) {
          let h = parseInt(punchOutHour)
          if (values.punchOutPeriod === "PM" && h < 12) h += 12
          if (values.punchOutPeriod === "AM" && h === 12) h = 0

          const punchOutDate = setSeconds(setMinutes(setHours(new Date(date), h), parseInt(punchOutMinute)), 0)
          punchOut = punchOutDate.toISOString()
        }
      }

      await markManualAttendanceMutation.mutateAsync({
        userId: values.employeeId,
        date: format(date, "yyyy-MM-dd"),
        status: values.status as ManualAttendanceStatus,
        punchIn,
        punchOut,
      })
      
      setOpen(false)
      form.reset()
    } catch {
      // Error handled in service via toast
    }
  }

  // Pre-fill form when initialData changes
  React.useEffect(() => {
    if (initialData && open) {
      form.reset({
        companyId: initialData.companyId || "",
        employeeId: initialData.employeeId || "",
        date: initialData.date || new Date(),
        status: initialData.status || "Present",
        punchInHour: initialData.punchIn ? format(new Date(initialData.punchIn), "hh") : "09",
        punchInMinute: initialData.punchIn ? format(new Date(initialData.punchIn), "mm") : "00",
        punchInPeriod: initialData.punchIn ? format(new Date(initialData.punchIn), "aa") : "AM",
        punchOutHour: initialData.punchOut ? format(new Date(initialData.punchOut), "hh") : "06",
        punchOutMinute: initialData.punchOut ? format(new Date(initialData.punchOut), "mm") : "00",
        punchOutPeriod: initialData.punchOut ? format(new Date(initialData.punchOut), "aa") : "PM",
      })
    }
  }, [initialData, open, form])

  // Clear employee when company changes if not from initialData
  React.useEffect(() => {
    if (selectedCompanyId && !initialData) {
      form.setValue("employeeId", "")
    }
  }, [selectedCompanyId, form, initialData])

  const status = useWatch({
    control: form.control,
    name: "status",
    defaultValue: "Present"
  })

  const isStatusProvidingTimes = status === "Present" || status === "Half-Day"

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) form.reset()
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-[28px] bg-white/95 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-rose-500/5 pointer-events-none" />
        
        <DialogHeader className="p-8 pb-0 relative z-10">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-all p-2 rounded-xl hover:bg-slate-50 pointer-events-auto z-50"
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 italic font-heading">
            Mark Manual Attendance
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium pt-1">
            Manually record attendance logs for employees.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Company</FormLabel>
                    <FormControl>
                      <InfiniteScrollSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        items={companiesList}
                        loadMore={fetchNextCompanies}
                        hasNextPage={!!hasNextCompanies}
                        isFetchingNextPage={isFetchingNextCompanies}
                        isLoading={isLoadingCompanies}
                        onSearchChange={setCompanySearch}
                        placeholder="Select company"
                        getLabel={(c: CompanyListItem) => c.name}
                        getValue={(c: CompanyListItem) => c._id}
                        className="h-12 rounded-xl border-slate-200 bg-white/50 focus:ring-indigo-500/20"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Employee</FormLabel>
                    <FormControl>
                      <InfiniteScrollSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        items={employeeList}
                        loadMore={fetchNextEmployees}
                        hasNextPage={!!hasNextEmployees}
                        isFetchingNextPage={isFetchingNextEmployees}
                        isLoading={isLoadingEmployees}
                        onSearchChange={setEmployeeSearch}
                        placeholder={selectedCompanyId ? "Select employee" : "Select company first"}
                        disabled={!selectedCompanyId}
                        getLabel={(emp: EmployeeDropdownItem) => emp.name}
                        getValue={(emp: EmployeeDropdownItem) => emp._id}
                        renderItem={(emp: EmployeeDropdownItem) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-700 italic">{emp.name}</span>
                          </div>
                        )}
                        className="h-12 rounded-xl border-slate-200 bg-white/50 focus:ring-indigo-500/20"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                            variant={"outline"}
                            className={cn(
                              "h-12 pl-3 text-left font-normal rounded-xl border-slate-200 bg-white/50 hover:bg-white transition-all",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white/50 focus:ring-indigo-500/20">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="rounded-lg focus:bg-indigo-50 italic font-bold text-slate-700">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            </div>

            {isStatusProvidingTimes && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Punch In
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="punchInHour"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white/50">
                            <SelectValue placeholder="Hr" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {HOURS_12.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="punchInMinute"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white/50 w-[70px]">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="punchInPeriod"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white/50 w-[70px]">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Punch Out
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="punchOutHour"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white/50">
                            <SelectValue placeholder="Hr" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {HOURS_12.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="punchOutMinute"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white/50 w-[70px]">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="punchOutPeriod"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white/50 w-[70px]">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={markManualAttendanceMutation.isPending}
                className="text-slate-400 font-bold hover:bg-slate-50 transition-all px-6 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={markManualAttendanceMutation.isPending}
                className={cn(
                  "px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20",
                  "bg-indigo-600 hover:bg-indigo-700 text-white scale-105"
                )}
              >
                {markManualAttendanceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Mark Attendance
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
