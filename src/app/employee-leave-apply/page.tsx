"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, User, FileText, Send, ChevronLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const leaveFormSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Please provide a reason (min 5 chars)"),
})

type LeaveFormValues = z.infer<typeof leaveFormSchema>

export default function ApplyForLeavePage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      employeeId: "",
      fromDate: new Date().toISOString().substring(0, 10),
      toDate: new Date().toISOString().substring(0, 10),
      reason: "",
    },
  })

  const [submittedData, setSubmittedData] = React.useState<LeaveFormValues | null>(null)

  const onSubmit = async (values: LeaveFormValues) => {
    setIsLoading(true)
    try {
      const payload = {
        employeeId: values.employeeId,
        fromDate: values.fromDate,
        toDate: values.toDate,
        leaveType: "Sick",
        reason: values.reason,
      }

      await apiClient.post("/leave", payload)
      toast.success("Leave application submitted successfully!")
      setSubmittedData(values)
      // form.reset() // Don't reset yet so we can show the summary
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string };
      const msg = err?.data?.message || err?.message || "Failed to submit leave application"
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

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
        <h1 className="text-xl md:text-2xl font-black italic text-slate-900 tracking-tight">Apply for Leave</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <Card className="w-full max-w-md md:max-w-xl border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden mb-10 shrink-0">
        <div className="bg-gradient-to-br from-[#2eb88a] to-[#1e8a66] p-6 md:p-8 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="h-14 w-14 md:h-16 md:w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg shrink-0">
              <CalendarIcon className="h-7 w-7 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight">Leave Request</h2>
              <p className="text-emerald-50/80 text-xs md:text-sm font-medium mt-1 max-w-[240px] md:max-w-sm">Submit your time-off request for approval.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-[#2eb88a]" />
                      Employee ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. EMP-001"
                        {...field}
                        className="rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-base transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">From Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-left",
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
                        <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
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
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">To Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full rounded-xl border-slate-100 bg-slate-50/50 h-12 md:h-14 px-5 focus:border-[#2eb88a] focus:ring-[#2eb88a]/10 font-bold text-left",
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
                        <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            disabled={(date) => {
                              const fromDate = form.getValues("fromDate");
                              return date < new Date("1900-01-01") || (!!fromDate && date < new Date(fromDate));
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
                      Reason
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Why are you taking leave?"
                        {...field}
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
                  submittedData ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-[#2eb88a] hover:bg-[#259b74] shadow-emerald-500/20"
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
                      Your request has been recorded. Please download the form for your records.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Print Form
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSubmittedData(null)
                        form.reset()
                      }}
                      className="flex-1 border-slate-200 text-slate-600 h-12 rounded-xl font-bold"
                    >
                      Apply New
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </Card>

      {/* Printable Area - Hidden from Screen */}
      <div className="hidden print:block fixed inset-0 bg-white p-10 z-[100]">
        <div className="max-w-3xl mx-auto border-[3px] border-slate-900 p-10 rounded-none bg-white">
          <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-8 mb-8">
            <div>
              <p className="text-[10px] font-black text-[#2eb88a] uppercase tracking-[0.3em] mb-1">Goyal Enterprises</p>
              <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Leave Application Form</h1>
              <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs">GOEL ENTERPRISES • Employee Management System</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Date</p>
              <p className="text-lg font-black italic text-slate-900">{format(new Date(), "dd MMM yyyy")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Employee ID</p>
                <p className="text-xl font-bold text-slate-900 border-b-2 border-slate-100 pb-2">{submittedData?.employeeId}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">From Date</p>
                  <p className="text-lg font-bold text-slate-900 border-b-2 border-slate-100 pb-2">{submittedData?.fromDate ? format(new Date(submittedData.fromDate), "dd MMM yyyy") : "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">To Date</p>
                  <p className="text-lg font-bold text-slate-900 border-b-2 border-slate-100 pb-2">{submittedData?.toDate ? format(new Date(submittedData.toDate), "dd MMM yyyy") : "-"}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Status</p>
              <div className="bg-white px-4 py-2 rounded-lg border-2 border-slate-900 font-black italic text-slate-900 uppercase">
                Pending Approval
              </div>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Reason for Leave</p>
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 min-h-[60px] flex items-center">
              <p className="text-slate-800 font-bold italic text-xl uppercase tracking-tight">{submittedData?.reason}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-2 italic">Leave Type: Sick</p>
          </div>

          <div className="grid grid-cols-2 gap-20 pt-10 mt-10 border-t-2 border-slate-100 border-dashed">
            <div className="text-center">
              <div className="h-px bg-slate-900 w-full mb-3" />
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Employee Signature</p>
            </div>
            <div className="text-center">
              <div className="h-px bg-slate-900 w-full mb-3" />
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Authorized Signature</p>
            </div>
          </div>

          <div className="mt-20 pt-10 text-center border-t-2 border-slate-100">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
              Form Generated via GOEL ENTERPRISES Cloud Terminal • Internal Document ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="pb-10 text-center shrink-0">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Powered by GOEL ENTERPRISES • v1.0
        </p>
      </div>
    </div>
  )
}