"use client"

import * as React from "react"
import { CalendarIcon, Loader2, X, ClipboardCheck, Clock } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, setHours, setMinutes, setSeconds, addMinutes } from "date-fns"

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
import { Input } from "@/components/ui/input"
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
  punchOutDate: z.any().optional(),
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

const PERIODS = ["AM", "PM"]

interface MarkManualAttendanceDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: ManualAttendanceInitialData;
}

const getTimeParts = (isoString: string | undefined | null) => {
  if (!isoString) return null;
  try {
    let timePart = "";
    if (isoString.includes('T')) {
      timePart = isoString.split('T')[1].substring(0, 5);
    } else if (isoString.includes(':')) {
      timePart = isoString.substring(0, 5);
    }
    
    if (!timePart) return null;
    
    const [h, m] = timePart.split(':').map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = (h % 12 || 12).toString().padStart(2, "0");
    const displayMinute = m.toString().padStart(2, "0");
    
    return { hour: displayHour, minute: displayMinute, period };
  } catch {
    return null;
  }
};

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

  const inParts = getTimeParts(initialData?.punchIn);
  const outParts = getTimeParts(initialData?.punchOut);


  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      companyId: initialData?.companyId || "",
      employeeId: initialData?.employeeId || "",
      date: initialData?.date || new Date(),
      status: initialData?.status || "Present",
      punchInHour: inParts?.hour || "09",
      punchInMinute: inParts?.minute || "00",
      punchInPeriod: inParts?.period || "AM",
      punchOutDate: initialData?.punchOut ? new Date(initialData.punchOut) : (initialData?.date || new Date()),
      punchOutHour: outParts?.hour || "06",
      punchOutMinute: outParts?.minute || "00",
      punchOutPeriod: outParts?.period || "PM",
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
    { search: debouncedEmployeeSearch, ...(selectedCompanyId ? { companyId: selectedCompanyId } : {}) },
    open
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
          punchIn = addMinutes(punchInDate, 330).toISOString()
        }
        if (punchOutHour && punchOutMinute && values.punchOutPeriod) {
          let h = parseInt(punchOutHour)
          if (values.punchOutPeriod === "PM" && h < 12) h += 12
          if (values.punchOutPeriod === "AM" && h === 12) h = 0

          const punchOutDateVal = values.punchOutDate || date
          const punchOutDate = setSeconds(setMinutes(setHours(new Date(punchOutDateVal), h), parseInt(punchOutMinute)), 0)
          punchOut = addMinutes(punchOutDate, 330).toISOString()
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
      const inParts = getTimeParts(initialData.punchIn);
      const outParts = getTimeParts(initialData.punchOut);
      
      form.reset({
        companyId: initialData.companyId || "",
        employeeId: initialData.employeeId || "",
        date: initialData.date || new Date(),
        status: initialData.status || "Present",
        punchInHour: inParts?.hour || "09",
        punchInMinute: inParts?.minute || "00",
        punchInPeriod: inParts?.period || "AM",
        punchOutDate: initialData.punchOut ? new Date(initialData.punchOut) : (initialData.date || new Date()),
        punchOutHour: outParts?.hour || "06",
        punchOutMinute: outParts?.minute || "00",
        punchOutPeriod: outParts?.period || "PM",
      })
    }
  }, [initialData, open, form])

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
                        onValueChange={(val) => {
                          field.onChange(val)
                          if (!initialData) {
                            form.setValue("employeeId", "")
                          }
                        }}
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
                        onValueChange={(val, item) => {
                          field.onChange(val)
                          const itemWithCompany = item as EmployeeDropdownItem & {
                            companyId?: string
                            company?: string | { _id: string }
                          }
                          const empCompanyId =
                            itemWithCompany.companyId ||
                            (typeof itemWithCompany.company === "object"
                              ? itemWithCompany.company?._id
                              : itemWithCompany.company)
                          if (empCompanyId && typeof empCompanyId === "string") {
                            form.setValue("companyId", empCompanyId)
                          }
                        }}
                        items={employeeList}
                        loadMore={fetchNextEmployees}
                        hasNextPage={!!hasNextEmployees}
                        isFetchingNextPage={isFetchingNextEmployees}
                        isLoading={isLoadingEmployees}
                        onSearchChange={setEmployeeSearch}
                        placeholder="Select employee"
                        getLabel={(emp: EmployeeDropdownItem) => `${emp.name} (${emp.employeeId})`}
                        getValue={(emp: EmployeeDropdownItem) => emp._id}
                        renderItem={(emp: EmployeeDropdownItem) => (
                          <div className="flex flex-col gap-0.5 w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-slate-700 italic">{emp.name}</span>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">ID: {emp.employeeId}</span>
                            </div>
                            {emp.uniqueId && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Punch ID: {emp.uniqueId}</span>
                            )}
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
                  
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="h-10 w-full pl-3 text-left font-normal rounded-lg border-slate-200 bg-slate-50/50 text-slate-400 text-xs cursor-not-allowed select-none"
                  >
                    {form.getValues("date") ? format(form.getValues("date"), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}
                    <CalendarIcon className="ml-auto h-3 w-3 opacity-30" />
                  </Button>

                  <div className="flex items-center gap-1.5 h-10 rounded-lg border border-slate-200 bg-white/50 px-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <FormField
                      control={form.control}
                      name="punchInHour"
                      render={({ field }) => (
                        <Input
                          type="text"
                          maxLength={2}
                          placeholder="HH"
                          className="w-8 border-none bg-transparent p-0 text-center text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 shadow-none h-auto"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "")
                            if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 12)) {
                              field.onChange(val)
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value
                            if (val && val.length === 1) {
                              field.onChange(val.padStart(2, "0"))
                            }
                          }}
                        />
                      )}
                    />
                    <span className="text-slate-400 font-bold select-none">:</span>
                    <FormField
                      control={form.control}
                      name="punchInMinute"
                      render={({ field }) => (
                        <Input
                          type="text"
                          maxLength={2}
                          placeholder="MM"
                          className="w-8 border-none bg-transparent p-0 text-center text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 shadow-none h-auto"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "")
                            if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                              field.onChange(val)
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value
                            if (val && val.length === 1) {
                              field.onChange(val.padStart(2, "0"))
                            } else if (val === "") {
                              field.onChange("00")
                            }
                          }}
                        />
                      )}
                    />
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                    <FormField
                      control={form.control}
                      name="punchInPeriod"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 text-xs font-bold text-slate-600 w-[45px] shadow-none select-none">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent className="min-w-[70px] rounded-xl border-slate-100 shadow-xl">
                            {PERIODS.map(p => <SelectItem key={p} value={p} className="rounded-lg">{p}</SelectItem>)}
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
                  
                  <FormField
                    control={form.control}
                    name="punchOutDate"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-10 w-full pl-3 text-left font-normal rounded-lg border-slate-200 bg-white/50 hover:bg-white transition-all text-xs",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "dd MMM yyyy") : <span>Pick date</span>}
                              <CalendarIcon className="ml-auto h-3 w-3 text-slate-400" />
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
                    )}
                  />

                  <div className="flex items-center gap-1.5 h-10 rounded-lg border border-slate-200 bg-white/50 px-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <FormField
                      control={form.control}
                      name="punchOutHour"
                      render={({ field }) => (
                        <Input
                          type="text"
                          maxLength={2}
                          placeholder="HH"
                          className="w-8 border-none bg-transparent p-0 text-center text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 shadow-none h-auto"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "")
                            if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 12)) {
                              field.onChange(val)
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value
                            if (val && val.length === 1) {
                              field.onChange(val.padStart(2, "0"))
                            }
                          }}
                        />
                      )}
                    />
                    <span className="text-slate-400 font-bold select-none">:</span>
                    <FormField
                      control={form.control}
                      name="punchOutMinute"
                      render={({ field }) => (
                        <Input
                          type="text"
                          maxLength={2}
                          placeholder="MM"
                          className="w-8 border-none bg-transparent p-0 text-center text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 shadow-none h-auto"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "")
                            if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                              field.onChange(val)
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value
                            if (val && val.length === 1) {
                              field.onChange(val.padStart(2, "0"))
                            } else if (val === "") {
                              field.onChange("00")
                            }
                          }}
                        />
                      )}
                    />
                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                    <FormField
                      control={form.control}
                      name="punchOutPeriod"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 text-xs font-bold text-slate-600 w-[45px] shadow-none select-none">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent className="min-w-[70px] rounded-xl border-slate-100 shadow-xl">
                            {PERIODS.map(p => <SelectItem key={p} value={p} className="rounded-lg">{p}</SelectItem>)}
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
