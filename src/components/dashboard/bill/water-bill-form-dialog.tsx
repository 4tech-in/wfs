"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  CloudUpload, 
  X, 
  Plus, 
  Droplets, 
  Building2, 
  Calendar as CalendarIcon, 
  History,
  Zap,
  Gauge
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useUpdateDocMutation, useUploadDocMutation } from "@/hooks/queries/use-doc-center"
import { useSavedBillAccounts } from "@/hooks/use-saved-bill-accounts"
import { SavedAccountField } from "./saved-account-field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format, parseISO, isValid } from "date-fns"
import { WaterBillMetadata } from "@/types/water-bill"

const waterBillSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  billFrom: z.string().optional(),
  billTo: z.string().optional(),
  isFromAverage: z.boolean().optional(),
  isToAverage: z.boolean().optional(),
  connectionSize: z.string().optional(),
  billPeriod: z.string().optional(),
  unit: z.string().optional(),
  totalAmount: z.string().optional().refine(v => !v || parseFloat(v) >= 0, "Cannot be negative"),
  paidUnitRate: z.string().optional().refine(v => !v || parseFloat(v) >= 0, "Cannot be negative"),
  unitRemarks: z.string().optional(),
  remarks: z.string().optional(),
  files: z.array(z.instanceof(File)).optional(),
})

type WaterBillFormValues = z.infer<typeof waterBillSchema>

interface WaterBillFormDialogProps {
  trigger?: React.ReactNode
  defaultAccountName?: string
  defaultAccountNumber?: string
  initialData?: WaterBillMetadata
  recordId?: string
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputClass =
  "rounded-xl border border-slate-200 focus-visible:ring-blue-500 h-11 font-medium text-sm transition-all"

const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-tight mb-1"

// Blocks negative numbers and 'e' in number inputs
const blockNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "e" || e.key === "E") {
    e.preventDefault()
  }
}

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-5 mt-2">
      <span className="text-blue-500">{icon}</span>
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    </div>
  )
}

// ── Charge Field ──────────────────────────────────────────────────────────────
function ChargeField({
  name,
  label,
  control,
  highlight,
  disabled,
  prefix = "₹",
}: {
  name: keyof WaterBillFormValues
  label: string
  control: ReturnType<typeof useForm<WaterBillFormValues>>["control"]
  highlight?: "blue" | "green" | "amber"
  disabled?: boolean
  prefix?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={cn(labelClass, disabled && "opacity-50")}>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{prefix}</span>
              <Input
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                {...field}
                disabled={disabled}
                onKeyDown={blockNegativeKeys}
                value={(field.value as string) ?? ""}
                className={cn(
                  inputClass,
                  "pl-7",
                  highlight === "blue" && "bg-blue-50/50 border-blue-200 text-blue-700 font-bold",
                  highlight === "green" && "bg-emerald-50/50 border-emerald-200 text-emerald-700 font-bold",
                  highlight === "amber" && "bg-amber-50/50 border-amber-200 text-amber-700 font-bold"
                )}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── Date Picker Field ─────────────────────────────────────────────────────────
function DatePickerField({
  name,
  label,
  control,
  placeholder = "Pick a date",
  className,
  disabled,
}: {
  name: keyof WaterBillFormValues
  label: string
  control: ReturnType<typeof useForm<WaterBillFormValues>>["control"]
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className={cn(labelClass, disabled && "opacity-50")}>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  disabled={disabled}
                  className={cn(
                    "w-full pl-3 text-left font-normal h-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-colors",
                    !field.value && "text-muted-foreground",
                    className
                  )}
                >
                  {field.value && isValid(parseISO(field.value as string)) ? (
                    format(parseISO(field.value as string), "PPP")
                  ) : (
                    <span className="text-sm">{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={field.value && isValid(parseISO(field.value as string)) ? parseISO(field.value as string) : undefined}
                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                startMonth={new Date(2000, 0)}
                endMonth={new Date(new Date().getFullYear() + 5, 0)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Helper to safely parse strings to numbers (Clamped to 0)
const safeParse = (val: string | number | undefined | null) => {
  if (val === undefined || val === null || val === "") return 0;
  const parsed = parseFloat(String(val))
  return Math.max(0, isNaN(parsed) ? 0 : parsed)
}

// ── Main Dialog ───────────────────────────────────────────────────────────────
export function WaterBillFormDialog({
  trigger,
  defaultAccountName = "",
  defaultAccountNumber = "",
  initialData,
  recordId,
}: WaterBillFormDialogProps) {
  const [open, setOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadDocMutation()
  const updateMutation = useUpdateDocMutation()
  const isEditing = Boolean(recordId)
  const {
    accountNames,
    saveAccountName,
    saveAccount,
    getAccountNumbers,
  } = useSavedBillAccounts()

  const form = useForm<WaterBillFormValues>({
    resolver: zodResolver(waterBillSchema),
    defaultValues: {
      accountName: initialData?.accountName || defaultAccountName,
      accountNumber: initialData?.accountNumber || defaultAccountNumber,
      billFrom: isEditing ? String(initialData?.billFrom ?? "") : "",
      billTo: isEditing ? String(initialData?.billTo ?? "") : "",
      isFromAverage: isEditing ? Boolean(initialData?.isFromAverage) : false,
      isToAverage: isEditing ? Boolean(initialData?.isToAverage) : false,
      connectionSize: isEditing ? String(initialData?.connectionSize ?? "") : "",
      billPeriod: isEditing ? String(initialData?.billPeriod ?? "") : "",
      unit: isEditing ? String(initialData?.unit ?? "") : "",
      totalAmount: isEditing ? String(initialData?.totalAmount ?? "") : "",
      paidUnitRate: isEditing ? String(initialData?.paidUnitRate ?? "") : "",
      unitRemarks: isEditing ? String(initialData?.unitRemarks ?? "") : "",
      remarks: isEditing ? String(initialData?.remarks ?? "") : "",
      files: [],
    },
  })

  // Destructure watched values for reactivity
  const watchedAccountName = useWatch({ control: form.control, name: "accountName" })
  const watchedUnit = useWatch({ control: form.control, name: "unit" })
  const watchedTotal = useWatch({ control: form.control, name: "totalAmount" })
  const watchedIsFromAvg = useWatch({ control: form.control, name: "isFromAverage" })
  const watchedIsToAvg = useWatch({ control: form.control, name: "isToAverage" })
  const watchedFiles = useWatch({ control: form.control, name: "files" })

  const selectedFiles = watchedFiles ?? []
  const linkedAccountNumbers = getAccountNumbers(watchedAccountName || "")

  const lastCalcPaidRateRef = React.useRef<string>("")

  // Auto-calculate Effective Rate (UNIT in Totals Section) = Total / UNIT
  React.useEffect(() => {
    const total = safeParse(watchedTotal)
    const u = safeParse(watchedUnit)

    if (u > 0 && total > 0) {
      const calculated = (total / u).toFixed(4)
      if (calculated !== lastCalcPaidRateRef.current) {
        form.setValue("paidUnitRate", calculated)
        lastCalcPaidRateRef.current = calculated
      }
    } else {
      if (lastCalcPaidRateRef.current !== "0.0000") {
        form.setValue("paidUnitRate", "0.0000")
        lastCalcPaidRateRef.current = "0.0000"
      }
    }
  }, [watchedTotal, watchedUnit, form])

  const onSubmit = async (values: WaterBillFormValues) => {
    try {
      const { files, accountName: acctName, accountNumber, ...restMeta } = values
      
      // Ensure booleans are actually booleans
      const metadata = {
        ...restMeta,
        accountName: acctName,
        accountNumber,
        isFromAverage: String(restMeta.isFromAverage) === "true",
        isToAverage: String(restMeta.isToAverage) === "true",
      }

      const title = `Water Bill – ${acctName || "Account"} – ${
        values.billFrom || new Date().toLocaleDateString("en-IN")
      }`
      const data = {
        title,
        documentType: "Water",
        files: files && files.length > 0 ? files : [],
        metadata,
      }
      if (recordId) {
        await updateMutation.mutateAsync({ id: recordId, data })
      } else {
        await uploadMutation.mutateAsync(data)
      }
      saveAccount(acctName, accountNumber)
      toast.success(recordId ? "Water bill updated successfully!" : "Water bill saved successfully!")
      setOpen(false)
      form.reset(recordId ? values : undefined)
    } catch {
      toast.error("Failed to save water bill")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length > 0) {
      const current = form.getValues("files") ?? []
      form.setValue("files", [...current, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    const current = form.getValues("files") ?? []
    form.setValue(
      "files",
      current.filter((_, i) => i !== index)
    )
  }

  const setFullAverage = () => {
    form.setValue("isFromAverage", true)
    form.setValue("isToAverage", true)
    form.setValue("billFrom", "")
    form.setValue("billTo", "")
  }

  const saveDropdownValue = (value: string, save: (value: string) => boolean, label: string) => {
    if (save(value)) toast.success(`${label} saved`)
    else toast.error(`Enter ${label.toLowerCase()}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Water Bill
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[850px] p-0 max-h-[95vh] overflow-hidden flex flex-col rounded-2xl border-none shadow-2xl">
        <div className="bg-slate-900 px-8 py-6">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl font-black">
              <Droplets className="h-5 w-5 text-blue-400" />
              {isEditing ? "Edit Water Bill" : "Water Bill Entry"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm font-medium">
              Fill in all fields from the water bill. Fields with * are required.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 py-8 space-y-10">
              {/* Account Section */}
              <section>
                <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Account Info" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Account Name *</FormLabel>
                        <SavedAccountField
                          value={field.value ?? ""}
                          options={accountNames}
                          placeholder="e.g. Main Office"
                          inputClassName={inputClass}
                          onChange={(value) => {
                            field.onChange(value)
                            const numbers = getAccountNumbers(value)
                            form.setValue("accountNumber", numbers.length === 1 ? numbers[0] : "", {
                              shouldValidate: false,
                            })
                            form.clearErrors("accountNumber")
                          }}
                          onSave={(value) => saveDropdownValue(value, saveAccountName, "Account name")}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Connection ID *</FormLabel>
                        <SavedAccountField
                          value={field.value ?? ""}
                          options={linkedAccountNumbers}
                          placeholder="e.g. WC-0012"
                          inputClassName={inputClass}
                          disabled={!watchedAccountName?.trim()}
                          onChange={field.onChange}
                          onSave={(value) => {
                            if (saveAccount(watchedAccountName || "", value)) {
                              toast.success("Connection ID saved")
                            } else {
                              toast.error("Select or enter an account name first")
                            }
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Dates & Period Section */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <SectionTitle icon={<CalendarIcon className="h-4 w-4" />} title="Dates & Period" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={setFullAverage}
                    className="h-8 text-[10px] font-black uppercase tracking-widest border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg flex items-center gap-1.5"
                  >
                    <Zap className="h-3 w-3" />
                    Mark Full Average
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="space-y-3">
                    <DatePickerField 
                      control={form.control} 
                      name="billFrom" 
                      label="Bill From" 
                      placeholder="Start" 
                      disabled={watchedIsFromAvg}
                    />
                    <FormField
                      control={form.control}
                      name="isFromAverage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm transition-colors hover:bg-amber-100">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-[10px] font-black text-amber-700 uppercase tracking-tighter cursor-pointer">
                            Avg From
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <DatePickerField 
                      control={form.control} 
                      name="billTo" 
                      label="Bill To" 
                      placeholder="End" 
                      disabled={watchedIsToAvg}
                    />
                     <FormField
                      control={form.control}
                      name="isToAverage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm transition-colors hover:bg-amber-100">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-[10px] font-black text-amber-700 uppercase tracking-tighter cursor-pointer">
                            Avg To
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sub-section for Consumption Details */}
                <div className="mt-8">
                  <SectionTitle icon={<Gauge className="h-4 w-4" />} title="Consumption Details" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="connectionSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Conn. Size</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g. 15mm' {...field} value={field.value ?? ""} className={inputClass} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Bill Period (Months)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder='0' 
                              {...field} 
                              onKeyDown={blockNegativeKeys}
                              value={field.value ?? ""} 
                              className={inputClass} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>UNIT</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              onKeyDown={blockNegativeKeys}
                              placeholder="0" 
                              {...field} 
                              value={field.value ?? ""} 
                              className={cn(inputClass, "font-black text-blue-600 bg-blue-50/30")} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Totals Section */}
              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <SectionTitle icon={<History className="h-4 w-4" />} title="Final Totals & Payment" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <ChargeField control={form.control} name="totalAmount" label="Total Amount" highlight="blue" />
                  <ChargeField control={form.control} name="paidUnitRate" label="UNIT" highlight="amber" prefix="₹" />
                </div>
              </section>

              {/* Upload & Remarks */}
              <section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div>
                    <FormLabel className={labelClass}>Attach Document</FormLabel>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" multiple />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <CloudUpload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Click to upload bill</p>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-500" onClick={() => removeFile(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Remarks / Notes</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Add notes..."
                            {...field}
                            value={field.value ?? ""}
                            className="w-full h-[100px] rounded-xl border border-slate-200 p-4 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} className="font-bold text-slate-500">
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={uploadMutation.isPending || updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8"
          >
            {(uploadMutation.isPending || updateMutation.isPending)
              ? (isEditing ? "Updating..." : "Saving...")
              : (isEditing ? "Update Water Bill" : "Save Water Bill")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
