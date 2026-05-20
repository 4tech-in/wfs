"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { ChevronsUpDown, Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useAttendancePoliciesQuery } from "@/hooks/queries/use-attendance-policies"
import { useCompanyDropdownQuery } from "@/hooks/queries/use-company"
import { employeeService } from "@/services/employee-service"
import { AssignRosterDto, AttendancePolicyUser } from "@/types/roster"
import { CompanyListItem } from "@/types/company"
import { EmployeeDropdownItem } from "@/types/employee"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

const formSchema = z.object({
  companyId: z.string().optional(),
  employeeIds: z.array(z.string()).min(1, "Select at least one employee"),
  shiftId: z.string().min(1, "Select a shift"),
  startDate: z.string().min(1, "Select start date"),
  endDate: z.string().min(1, "Select end date"),
  is24HourShift: z.boolean(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

interface RoasterFormProps {
  onSubmit: (data: AssignRosterDto & { is24HourShift: boolean }) => void
  isLoading?: boolean
  initialValues?: {
    employeeIds: string[]
    shiftId: string
    startDate: string
    endDate: string
    companyId?: string
    is24HourShift?: boolean
  }
  initialEmployees?: AttendancePolicyUser[]
}

export function RoasterForm({ onSubmit, isLoading, initialValues, initialEmployees }: RoasterFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      companyId: "",
      employeeIds: [],
      shiftId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      is24HourShift: false,
    },
  })

  const selectedCompanyId = useWatch({
    control: form.control,
    name: "companyId",
    defaultValue: ""
  })

  const selectedEmployeeIds = useWatch({
    control: form.control,
    name: "employeeIds",
    defaultValue: []
  })

  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const { 
    data: employeesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isLoadingEmployees
  } = useEmployeesDropdownInfiniteQuery({ 
    search: debouncedSearchTerm,
    companyId: selectedCompanyId
  })

  const { data: policiesData } = useAttendancePoliciesQuery()
  const { data: companiesData } = useCompanyDropdownQuery()
  const [isSelectingAll, setIsSelectingAll] = React.useState(false)

  const allEmployees = React.useMemo(() => {
    return employeesData?.pages.flatMap(page => page.data) || []
  }, [employeesData])

  // Persistent mapping for selected employee names to prevent loss when filtering
  const [selectedEmployeesMap, setSelectedEmployeesMap] = React.useState<Record<string, AttendancePolicyUser | EmployeeDropdownItem>>(() => {
    const initialMap: Record<string, AttendancePolicyUser | EmployeeDropdownItem> = {}
    if (initialEmployees) {
      initialEmployees.forEach(emp => {
        const id = emp._id
        initialMap[id] = emp
      })
    }
    return initialMap
  })

  // Reset form and selection map when initialValues change (i.e., when editing a different row)
  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        is24HourShift: false,
        ...initialValues
      })
    } else {
      form.reset({
        companyId: "",
        employeeIds: [],
        shiftId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        is24HourShift: false,
      })
    }

    const initialMap: Record<string, AttendancePolicyUser | EmployeeDropdownItem> = {}
    if (initialEmployees) {
      initialEmployees.forEach(emp => {
        const id = emp._id
        initialMap[id] = emp
      })
    }
    setSelectedEmployeesMap(initialMap)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, initialEmployees])

  React.useEffect(() => {
    setSelectedEmployeesMap(prev => {
      const newMap = { ...prev }
      let changed = false
      allEmployees.forEach(emp => {
        const id = emp._id
        if (selectedEmployeeIds.includes(id) && !newMap[id]) {
          newMap[id] = emp
          changed = true
        }
      })
      return changed ? newMap : prev
    })
  }, [allEmployees, selectedEmployeeIds])

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 40 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  const toggleEmployee = (id: string) => {
    const current = form.getValues("employeeIds")
    if (current.includes(id)) {
      form.setValue("employeeIds", current.filter(itemId => itemId !== id))
    } else {
      form.setValue("employeeIds", [...current, id])
    }
  }

  const removeEmployee = (id: string) => {
    form.setValue("employeeIds", (selectedEmployeeIds || []).filter(itemId => itemId !== id))
  }

  const handleSelectAll = async () => {
    try {
      setIsSelectingAll(true)
      // Fetch all employees for the selected company with a large limit
      const response = await employeeService.getDropdown({ 
        companyId: selectedCompanyId,
        limit: 1000 
      })
      
      if (response?.data) {
        const allIds = response.data.map(emp => emp._id)
        form.setValue("employeeIds", allIds)
        
        // Update selection map
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Selection */}
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Company (Optional)</FormLabel>
              <Select 
                onValueChange={(val) => {
                  field.onChange(val)
                  // Clear employees when company changes
                  form.setValue("employeeIds", [])
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select a company to filter employees" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg font-medium text-slate-500">All Companies</SelectItem>
                  {companiesData?.data?.map((company: CompanyListItem) => (
                    <SelectItem key={company._id} value={company._id} className="rounded-lg">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Multi-select Employees */}
        <FormField
          control={form.control}
          name="employeeIds"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Select Employees</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] max-h-[100px] overflow-y-auto p-2 border rounded-xl bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
                {selectedEmployeeIds.length === 0 && (
                  <span className="text-slate-400 text-sm py-1 px-2">No employees selected</span>
                )}
                {selectedEmployeeIds.map((id) => {
                  const emp = allEmployees.find(e => e._id === id) || selectedEmployeesMap[id]
                  return (
                    <Badge 
                      key={id} 
                      variant="secondary" 
                      className="bg-white border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1 py-1 px-2 rounded-lg"
                    >
                      {emp?.name || id}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
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
                    className="w-full justify-between rounded-xl border-slate-200"
                  >
                    <span className="truncate">
                      {selectedEmployeeIds.length === 0 
                        ? "Select Employees" 
                        : selectedEmployeeIds.length === 1 
                          ? (allEmployees.find(e => e._id === selectedEmployeeIds[0])?.name || selectedEmployeesMap[selectedEmployeeIds[0]]?.name || "1 employee selected")
                          : `${selectedEmployeeIds.length} employees selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) p-0 rounded-xl" align="start">
                  <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      placeholder="Search employee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 border-none focus-visible:ring-0 px-0 rounded-none bg-transparent"
                    />
                  </div>
                  <div
                    className="h-48 overflow-y-auto p-1"
                    onScroll={handleScroll}
                  >
                      <div className="flex items-center justify-between border-b px-1 py-1 mb-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md flex-1 font-semibold"
                          onClick={handleSelectAll}
                          disabled={isSelectingAll}
                        >
                          {isSelectingAll ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Select All Employees {selectedCompanyId && selectedCompanyId !== "all" ? "of Company" : ""}
                        </Button>
                      </div>

                    {allEmployees.map((employee) => (
                      <div
                        key={employee._id}
                        className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        onClick={() => toggleEmployee(employee._id)}
                      >
                        <Checkbox 
                          checked={selectedEmployeeIds.includes(employee._id)}
                          onCheckedChange={() => toggleEmployee(employee._id)}
                          className="rounded-md"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{employee.name || "Unnamed"}</span>
                          <span className="text-xs text-slate-500">
                            {('employeeObjId' in employee) 
                              ? (employee as AttendancePolicyUser).employeeObjId?.employeeId 
                              : (employee as EmployeeDropdownItem).employeeId} 
                            {" | "} {employee.uniqueId}
                          </span>
                        </div>
                      </div>
                    ))}

                    {isFetchingNextPage && (
                      <div className="py-2 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </div>
                    )}

                    {allEmployees.length === 0 && !isLoadingEmployees && (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No employees found
                      </div>
                    )}

                    {isLoadingEmployees && allEmployees.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Shift Selection */}
        <FormField
          control={form.control}
          name="shiftId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Shift</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select a shift" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  {policiesData?.policies.map((policy) => (
                    <SelectItem key={policy._id} value={policy._id} className="rounded-lg">
                      {policy.name} ({policy.shiftInTime} - {policy.shiftOutTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal rounded-xl border-slate-200",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal rounded-xl border-slate-200",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 24-Hour Shift Policy */}
        <FormField
          control={form.control}
          name="is24HourShift"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200/80 p-4 bg-white shadow-sm transition-all hover:bg-slate-50/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="rounded-md border-slate-300 text-emerald-600 focus-visible:ring-emerald-500 data-[state=checked]:bg-[#2eb88a] data-[state=checked]:border-[#2eb88a]"
                />
              </FormControl>
              <div 
                className="space-y-1 leading-none cursor-pointer select-none flex-1" 
                onClick={() => field.onChange(!field.value)}
              >
                <FormLabel className="text-sm font-semibold text-slate-900 cursor-pointer">
                  24 Hours Shift
                </FormLabel>
                <p className="text-xs text-slate-500 font-medium">
                  Apply a continuous 24-hour shift policy to the selected employees.
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-[#2eb88a] hover:bg-[#259b74] text-white rounded-xl h-11 shadow-sm transition-all active:scale-95"
          disabled={isLoading}
        >
          {isLoading ? "Assigning..." : "Assign Roster"}
        </Button>
      </form>
    </Form>
  )
}