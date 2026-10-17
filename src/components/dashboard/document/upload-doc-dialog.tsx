"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CloudUpload, Loader2, X, FileText, FileSpreadsheet, Bell, Calendar as CalendarIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useUploadDocMutation } from "@/hooks/queries/use-doc-center"
import { useCreateReminderMutation } from "@/hooks/queries/use-reminders"
import { toast } from "sonner"

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  documentType: z.string().min(1, "Document type is required"),
  customDocumentType: z.string().optional(),
  files: z.array(z.instanceof(File)).min(1, "At least one file is required"),
  // Reminder fields
  enableReminder: z.boolean(),
  expiryDate: z.date().optional(),
  renewalType: z.enum(["daily", "weekly", "monthly", "yearly", "once"]),
}).refine((data) => {
  if (data.documentType === "Other" && (!data.customDocumentType || data.customDocumentType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify the document type",
  path: ["customDocumentType"],
}).refine((data) => {
  if (data.enableReminder && !data.expiryDate) {
    return false;
  }
  return true;
}, {
  message: "Please select an expiry date",
  path: ["expiryDate"],
});

interface UploadDocDialogProps {
  trigger?: React.ReactNode
}

export function UploadDocDialog({ trigger }: UploadDocDialogProps) {
  const [open, setOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadDocMutation()
  const reminderMutation = useCreateReminderMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      documentType: "",
      customDocumentType: "",
      files: [],
      enableReminder: false,
      renewalType: "once",
    },
  })

  const docType = useWatch({ control: form.control, name: "documentType" })
  const selectedFiles = useWatch({ control: form.control, name: "files" }) || []
  const enableReminder = useWatch({ control: form.control, name: "enableReminder" })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const docKey = crypto.randomUUID()

      // 1. Upload Document
      await uploadMutation.mutateAsync({
        title: values.title,
        documentType: values.documentType === "Other" ? values.customDocumentType! : values.documentType,
        files: values.files,
        metadata: {
          docKey,
          description: values.description,
          expiryDate: values.expiryDate?.toISOString(),
          renewalType: values.renewalType,
        }
      })

      // 2. Create Reminder if enabled
      if (values.enableReminder && values.expiryDate) {
        const triggerDate = new Date(values.expiryDate)
        triggerDate.setHours(12, 0, 0, 0) // Normalize to noon to avoid timezone shifts

        await reminderMutation.mutateAsync({
          title: `Renewal: ${values.title}`,
          description: `Reminder for document renewal: ${values.title} | DOC_KEY:${docKey}`,
          startDate: triggerDate.toISOString(),
          time: "09:00",
          frequency: values.renewalType,
          enabled: true,
          metadata: {
            docKey,
            documentTitle: values.title
          }
        })
      }

      toast.success("Document and reminder processed successfully")
      setOpen(false)
      form.reset()
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to process request")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const currentFiles = form.getValues("files") || []
      form.setValue("files", [...currentFiles, ...files])
    }
  }

  const removeFile = (index: number) => {
    const currentFiles = form.getValues("files") || []
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    form.setValue("files", updatedFiles)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="bg-[#2eb88a] hover:bg-[#259b74]">
            <CloudUpload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic">Upload Document</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Add new documents and set renewal reminders.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice #123" {...field} value={field.value || ""} className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document details..." {...field} value={field.value || ""} className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="Bill">Bill</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Picks">Picks</SelectItem>
                        <SelectItem value="Documents">Documents</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {docType === "Other" && (
              <FormField
                control={form.control}
                name="customDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specify Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document type" {...field} className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="files"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Files</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.xlsm,.xlsb,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                        multiple
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center cursor-pointer hover:border-[#2eb88a] hover:bg-emerald-50/50 transition-all"
                      >
                        <CloudUpload className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500 font-bold">
                          Click to select files
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">
                          PDF, DOC, EXCEL, CSV, JPG, PNG (Max 5MB)
                        </p>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-1">
                          {selectedFiles.map((file, index) => {
                            const isSpreadsheet = /\.(xlsx|xls|csv|xlsm|xlsb)$/i.test(file.name);
                            return (
                              <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                                    {isSpreadsheet ? (
                                      <FileSpreadsheet className="h-4 w-4 text-[#2eb88a]" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-[#2eb88a]" />
                                    )}
                                  </div>
                                  <span className="text-xs font-bold truncate text-slate-700">
                                    {file.name}
                                  </span>
                                </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <FormField
                control={form.control}
                name="enableReminder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-[#2eb88a] data-[state=checked]:border-[#2eb88a]"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-500" />
                        Set Renewal Reminder
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {enableReminder && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-bold rounded-xl border-slate-200 h-11",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
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
                                selected={field.value}
                                onSelect={field.onChange}
                                captionLayout="dropdown"
                                startMonth={new Date()}
                                endMonth={new Date(new Date().getFullYear() + 10, 11)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="rounded-2xl"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="renewalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renewal Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              <SelectItem value="once">Once</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={uploadMutation.isPending || reminderMutation.isPending}
                className="font-bold text-slate-500 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2eb88a] hover:bg-[#259b74] rounded-xl font-black italic px-8 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                disabled={uploadMutation.isPending || reminderMutation.isPending || selectedFiles.length === 0}
              >
                {uploadMutation.isPending || reminderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upload Document"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
