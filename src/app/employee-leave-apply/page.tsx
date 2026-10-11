"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar as CalendarIcon,
  User,
  FileText,
  Send,
  ChevronLeft,
  CheckCircle2,
  Building2,
  Printer,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useDepartmentsQuery } from "@/hooks/queries/use-org";
import { EmployeeSelect } from "@/components/employee/employee-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

const leaveFormSchema = z.object({
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
  name: z.string().min(2, "Name is required"),
  leaveType: z.string().min(1, "Leave type is required"),
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Please provide a reason (min 5 chars)"),
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

export default function ApplyForLeavePage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [docId] = React.useState(() =>
    Math.random().toString(36).substring(7).toUpperCase(),
  );
  const router = useRouter();

  const { data: deptsData, isLoading: isDeptsLoading } = useDepartmentsQuery();
  const departments = deptsData?.data?.filter((d) => d.isActive !== false) || [];

  const [selectedDeptId, setSelectedDeptId] = React.useState<string>("all");

  const [selectedUserObjId, setSelectedUserObjId] = React.useState<string>("");

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      departmentId: "",
      departmentName: "",
      employeeId: "",
      name: "",
      leaveType: "Casual",
      fromDate: new Date().toISOString().substring(0, 10),
      toDate: new Date().toISOString().substring(0, 10),
      reason: "",
    },
  });

  const [submittedData, setSubmittedData] =
    React.useState<LeaveFormValues | null>(null);

  const onSubmit = async (values: LeaveFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        employeeId: values.employeeId,
        name: values.name,
        fromDate: values.fromDate,
        toDate: values.toDate,
        leaveType: values.leaveType || "Casual",
        reason: values.reason,
      };

      await apiClient.post("/leave", payload);
      toast.success("Leave application submitted successfully!");
      setSubmittedData(values);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to submit leave application";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate leave days for print format
  const leaveDays = React.useMemo(() => {
    const from = submittedData?.fromDate ? new Date(submittedData.fromDate) : null;
    const to = submittedData?.toDate ? new Date(submittedData.toDate) : null;
    if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
      const diff = differenceInCalendarDays(to, from) + 1;
      return diff > 0 ? diff : 1;
    }
    return 1;
  }, [submittedData]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col items-center p-6 md:p-10">
      {/* Header */}
      <div className="w-full max-w-md md:max-w-xl flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white shadow-sm hover:bg-slate-50 transition-colors h-10 w-10"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <h1 className="text-xl md:text-2xl font-black italic text-slate-900 tracking-tight">
          Apply for Leave
        </h1>
        <div className="w-10" />
      </div>

      <Card className="w-full max-w-md md:max-w-xl border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden mb-10 shrink-0">
        <div className="bg-gradient-to-br from-[#2eb88a] to-[#1e8a66] p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="h-14 w-14 md:h-16 md:w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg shrink-0">
              <CalendarIcon className="h-7 w-7 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight">
                Leave Request
              </h2>
              <p className="text-emerald-50/80 text-xs md:text-sm font-medium mt-1 max-w-[240px] md:max-w-sm">
                Submit your time-off request for approval.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Department Selection */}
              <div className="space-y-1.5">
                <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                  <Building2 className="h-3 w-3 text-[#2eb88a]" />
                  Department
                </FormLabel>
                <Select
                  value={selectedDeptId}
                  onValueChange={(val) => {
                    setSelectedDeptId(val);
                    if (val === "all") {
                      form.setValue("departmentId", "");
                      form.setValue("departmentName", "");
                    } else {
                      const dept = departments.find((d: any) => d._id === val);
                      form.setValue("departmentId", val);
                      form.setValue("departmentName", dept?.name || "");
                    }
                    // Clear employee when department changes
                    setSelectedUserObjId("");
                    form.setValue("employeeId", "");
                    form.setValue("name", "");
                  }}
                  disabled={isDeptsLoading}
                >
                  <SelectTrigger className="w-full rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-base transition-all text-slate-800">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-60">
                    <SelectItem value="all" className="font-bold py-2.5">
                      All Departments
                    </SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem
                        key={dept._id}
                        value={dept._id}
                        className="font-medium py-2.5"
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Selection */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-[#2eb88a]" />
                      Select Employee
                    </FormLabel>
                    <FormControl>
                      <EmployeeSelect
                        departmentId={selectedDeptId === "all" ? undefined : selectedDeptId}
                        value={selectedUserObjId}
                        placeholder={
                          selectedDeptId === "all"
                            ? "Search employee by name or ID..."
                            : "Search employee in selected department..."
                        }
                        onValueChange={(selectedId, employee) => {
                          setSelectedUserObjId(selectedId);
                          field.onChange(employee.employeeId);
                          form.setValue("name", employee.name);
                          if (employee.departmentName) {
                            form.setValue("departmentName", employee.departmentName);
                          }
                        }}
                        className="rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 font-bold text-base focus:border-[#2eb88a] focus:ring-[#2eb88a]/10"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />

              {/* Employee ID and Full Name Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Employee ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. EMP-001"
                          {...field}
                          value={field.value ?? ""}
                          className="rounded-xl border-slate-100 bg-slate-50/50 h-11 px-4 font-bold text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Ramesh Kumar"
                          {...field}
                          value={field.value ?? ""}
                          className="rounded-xl border-slate-100 bg-slate-50/50 h-11 px-4 font-bold text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Leave Type
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-base transition-all text-slate-800">
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="Casual" className="font-bold py-2.5">
                          Casual Leave
                        </SelectItem>
                        <SelectItem value="Sick" className="font-bold py-2.5">
                          Sick Leave
                        </SelectItem>
                        <SelectItem value="Paid" className="font-bold py-2.5">
                          Paid Leave
                        </SelectItem>
                        <SelectItem value="Unpaid" className="font-bold py-2.5">
                          Unpaid Leave
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        From Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-left",
                                !field.value && "text-muted-foreground",
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
                        <PopoverContent
                          className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? format(date, "yyyy-MM-dd") : "",
                              )
                            }
                            disabled={(date) => date < new Date("1900-01-01")}
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
                  name="toDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        To Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-left",
                                !field.value && "text-muted-foreground",
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
                        <PopoverContent
                          className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? format(date, "yyyy-MM-dd") : "",
                              )
                            }
                            disabled={(date) => {
                              const fromDate = form.getValues("fromDate");
                              if (date < new Date("1900-01-01")) return true;
                              if (fromDate) {
                                const from = new Date(fromDate);
                                from.setHours(0, 0, 0, 0);
                                date.setHours(0, 0, 0, 0);
                                return date < from;
                              }
                              return false;
                            }}
                            initialFocus
                            className="rounded-2xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                      <FileText className="h-3 w-3 text-[#2eb88a]" />
                      Reason for Leave
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Why are you taking leave?"
                        {...field}
                        value={field.value ?? ""}
                        className="rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-base transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading || !!submittedData}
                className={cn(
                  "w-full h-14 md:h-16 rounded-2xl font-black text-base text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2",
                  submittedData
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-[#2eb88a] hover:bg-[#259b74] shadow-emerald-500/20",
                )}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : submittedData ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Application Submitted
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>

              {submittedData && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-emerald-800 leading-tight">
                      Your request has been recorded. Please print or download the official form below.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                    >
                      <Printer className="h-4 w-4" />
                      Print Leave Application
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSubmittedData(null);
                        setSelectedUserObjId("");
                        form.reset();
                      }}
                      className="flex-1 border-slate-200 text-slate-600 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Apply New
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </Card>

      {/* Official Leave Application Printable Area - Hidden from Screen */}
      <div className="hidden print:block fixed inset-0 bg-white p-12 z-[100] text-black">
        <div className="max-w-2xl mx-auto border-[1.5px] border-slate-400 p-8 rounded-none bg-white font-serif leading-relaxed text-slate-900">
          {/* Header with Logo */}
          <div className="mb-6">
            <div className="relative w-48 h-16 mb-2">
              <Image
                src="/logo_ge.png"
                alt="GOEL ENTERPRISES"
                width={190}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold tracking-wider text-center uppercase border-b-2 border-black pb-2 mt-4 font-sans">
              LEAVE APPLICATION
            </h1>
          </div>

          {/* Salutation & Body */}
          <div className="space-y-4 text-sm mt-4">
            <p className="font-bold">Dear Sir,</p>
            <p className="leading-relaxed">
              I am writing this application to request your approval for{" "}
              <span className="inline-block border-b border-black font-bold px-4 text-center min-w-[60px]">
                {leaveDays}
              </span>{" "}
              days of leave.
            </p>

            {/* Reason for leave */}
            <div className="pt-2">
              <p className="font-bold uppercase tracking-wider text-xs mb-1">
                REASON FOR LEAVE:
              </p>
              <div className="border-b border-black py-1 min-h-[24px] font-medium italic">
                {submittedData?.reason || ""}
              </div>
              <div className="border-b border-black min-h-[20px] mt-1"></div>
            </div>

            {/* Leave Details */}
            <div className="pt-3 space-y-2">
              <p className="font-bold uppercase tracking-wider text-xs mb-2">
                LEAVE DETAILS:
              </p>
              <div className="flex items-center text-sm">
                <span className="font-bold w-40">Start Date of Leave:</span>
                <span className="border-b border-black flex-1 pb-0.5 font-medium">
                  {submittedData?.fromDate
                    ? format(new Date(submittedData.fromDate), "dd-MM-yyyy")
                    : ""}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-bold w-40">End Date of Leave:</span>
                <span className="border-b border-black flex-1 pb-0.5 font-medium">
                  {submittedData?.toDate
                    ? format(new Date(submittedData.toDate), "dd-MM-yyyy")
                    : ""}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-bold w-40">Date of Joining:</span>
                <span className="border-b border-black flex-1 pb-0.5 font-medium">
                  {submittedData?.toDate
                    ? (() => {
                        const nextDay = new Date(submittedData.toDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        return format(nextDay, "dd-MM-yyyy");
                      })()
                    : ""}
                </span>
              </div>
            </div>

            <p className="text-xs pt-1">
              I look forward to your approval and thank you for your consideration.
            </p>

            {/* Employee Details */}
            <div className="pt-3 space-y-2">
              <p className="font-bold uppercase tracking-wider text-xs mb-2">
                EMPLOYEE DETAILS:
              </p>
              <div className="flex items-center text-sm">
                <span className="font-bold w-52">Name of Employee:</span>
                <span className="border-b border-black flex-1 pb-0.5 font-medium">
                  {submittedData?.name} {submittedData?.employeeId ? `(${submittedData.employeeId})` : ""}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-bold w-52">Department:</span>
                <span className="border-b border-black flex-1 pb-0.5 font-medium">
                  {submittedData?.departmentName || "—"}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-bold w-52">Date:</span>
                <span className="border-b border-black flex-1 pb-0.5 font-medium">
                  {format(new Date(), "dd-MM-yyyy")}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-bold w-52">Immediate Supervisor / In-charge:</span>
                <span className="border-b border-black flex-1 pb-0.5"></span>
              </div>
            </div>

            {/* For Office Use Only */}
            <div className="pt-6 text-center">
              <p className="font-bold uppercase tracking-wider text-xs mb-6">
                FOR OFFICE USE ONLY
              </p>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider pt-8 px-4">
                <span>DEPT HEAD</span>
                <span>HR</span>
                <span>DIRECTOR</span>
                <span>PLANT HEAD</span>
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="pt-12 text-[10px] text-slate-600 flex justify-between items-end border-t border-slate-200 mt-8">
              <div className="space-y-0.5">
                <p>Doc: F-130-09</p>
                <p>Issue: 1.0</p>
                <p>Date: 16-08-2024</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p>Prepared By: HR</p>
                <p>Approved By: PROPRIETOR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-10 text-center shrink-0">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Powered by GOEL ENTERPRISES • v1.0
        </p>
      </div>
    </div>
  );
}

