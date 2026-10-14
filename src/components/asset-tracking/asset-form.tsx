"use client"

import * as React from "react"
import { useForm, useWatch, DefaultValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ReminderFrequency } from "@/types/reminder"
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
import { Badge } from "@/components/ui/badge"
import { CreateAssetDto } from "@/types/asset"
import { Employee } from "@/types/employee"
import { Textarea } from "@/components/ui/textarea"
import { EmployeeSelect } from "@/components/employee/employee-select"
import { EmployeeMultiSelect } from "@/components/employee/employee-multi-select"
import { Check, X, Shirt, Users, Sparkles, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const PREDEFINED_TYPES = [
  "Laptop",
  "Vehicle",
  "Mobile Device",
  "Office Equipment",
  "Safety Gear",
  "Specialized Tool",
  "Uniform",
  "Electronics",
];

export const UNIFORM_OPTIONS = [
  "Uniform tshirt",
  "Uniform sweater",
  "Uniform jackets",
  "Saftey shoes",
  "Id card",
] as const;

const formSchema = z.object({
  name: z.string().optional(),
  type: z.string().min(1, "Asset type is required"),
  otherType: z.string().optional(),
  serialNumber: z.string().optional(),
  issuedTo: z.string().optional(),
  issuedDate: z.string().optional(),
  status: z.enum(["In Stock", "Issued", "Returned", "Under Maintenance", "Damaged"] as const),
  maintenanceDueDate: z.string().optional(),
  extraNote: z.string().optional(),
  setReminder: z.boolean(),
  reminderFrequency: z.enum(["once", "daily", "weekly", "monthly", "yearly", "custom"]),
  reminderInterval: z.string().optional().refine(val => !val || !isNaN(parseInt(val)), "Must be a number"),
  reminderStartDate: z.string().optional(),
  reminderTime: z.string(),
  recipientEmails: z.string().optional(),
}).refine((data) => {
  if (data.type === "Other" && (!data.otherType || data.otherType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify the other asset type",
  path: ["otherType"]
}).refine((data) => {
  if (data.type !== "Uniform" && (!data.name || data.name.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "Asset name is required",
  path: ["name"]
});

export type AssetFormValues = z.infer<typeof formSchema>;

interface AssetFormProps {
  initialValues?: Partial<CreateAssetDto>
  initialReminder?: { frequency: ReminderFrequency; time: string; enabled: boolean; startDate?: string; interval?: number; recipientEmails?: string[] }
  onSubmit: (data: AssetFormValues | AssetFormValues[]) => void
  isLoading?: boolean
  isEdit?: boolean
}

export function AssetForm({ 
  initialValues, 
  initialReminder,
  onSubmit, 
  isLoading,
  isEdit = false 
}: AssetFormProps) {
  // Uniform multi-select state (default: all 5 selected)
  const [selectedUniforms, setSelectedUniforms] = React.useState<string[]>([...UNIFORM_OPTIONS])
  const [uniformError, setUniformError] = React.useState<string | null>(null)

  // Multiple employees selection state (used in add mode)
  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>(() => {
    if (initialValues?.issuedTo) {
      if (typeof initialValues.issuedTo === "object" && initialValues.issuedTo !== null) {
        const id = (initialValues.issuedTo as Employee)._id || (initialValues.issuedTo as Employee).id
        return id ? [id] : []
      }
      return [initialValues.issuedTo]
    }
    return []
  })

  const defaultValues = React.useMemo(() => {
    const assetType = initialValues?.type || "Uniform";
    const isPredefined = assetType ? PREDEFINED_TYPES.includes(assetType) : false;
    
    return {
      name: initialValues?.name || "",
      type: isPredefined ? (assetType as string) : "Other",
      otherType: isPredefined ? "" : assetType,
      serialNumber: initialValues?.serialNumber || "",
      issuedTo: typeof initialValues?.issuedTo === "object" && initialValues.issuedTo !== null
        ? (initialValues.issuedTo as Employee)._id || (initialValues.issuedTo as Employee).id || ""
        : initialValues?.issuedTo || "",
      issuedDate: initialValues?.issuedDate ? initialValues.issuedDate.split('T')[0] : "",
      status: initialValues?.status || "In Stock",
      maintenanceDueDate: initialValues?.maintenanceDueDate ? initialValues.maintenanceDueDate.split('T')[0] : "",
      extraNote: initialValues?.extraNote || "",
      setReminder: !!initialReminder?.enabled,
      reminderFrequency: (initialReminder?.frequency as ReminderFrequency) || "monthly",
      reminderInterval: initialReminder?.interval ? String(initialReminder.interval) : "30",
      reminderStartDate: initialReminder?.startDate ? initialReminder.startDate.split('T')[0] : (initialValues?.maintenanceDueDate ? initialValues.maintenanceDueDate.split('T')[0] : ""),
      reminderTime: initialReminder?.time || "09:00",
      recipientEmails: initialReminder?.recipientEmails?.join(", ") || "",
    } as AssetFormValues;
  }, [initialValues, initialReminder])

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as DefaultValues<AssetFormValues>,
  })

  // Safely populate default dates post-mount on the client to avoid SSR hydration divergence
  React.useEffect(() => {
    if (!form.getValues("maintenanceDueDate") && !initialValues?.maintenanceDueDate) {
      const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      form.setValue("maintenanceDueDate", futureDate, { shouldDirty: false })
    }
    if (!form.getValues("reminderStartDate") && !initialReminder?.startDate) {
      const today = new Date().toISOString().split('T')[0]
      form.setValue("reminderStartDate", today, { shouldDirty: false })
    }
  }, [form, initialValues?.maintenanceDueDate, initialReminder?.startDate])

  const selectedType = useWatch({
    control: form.control,
    name: "type",
  })

  const setReminder = useWatch({
    control: form.control,
    name: "setReminder",
  })

  const reminderFrequency = useWatch({
    control: form.control,
    name: "reminderFrequency",
  })

  // Guard against infinite re-syncing on initialValues object reference changes
  const prevAssetIdRef = React.useRef<string | undefined>(
    (initialValues as any)?._id || (initialValues as any)?.id
  )

  React.useEffect(() => {
    const currentId = (initialValues as any)?._id || (initialValues as any)?.id
    if (initialValues && currentId !== prevAssetIdRef.current) {
      prevAssetIdRef.current = currentId
      form.reset(defaultValues)
      if (initialValues.name && UNIFORM_OPTIONS.includes(initialValues.name as any)) {
        setSelectedUniforms([initialValues.name])
      }
      if (initialValues.issuedTo) {
        const id = typeof initialValues.issuedTo === "object"
          ? (initialValues.issuedTo as Employee)._id || (initialValues.issuedTo as Employee).id
          : initialValues.issuedTo
        if (id) setSelectedEmployees([id])
      }
    }
  }, [initialValues, defaultValues, form])

  const toggleUniformOption = (option: string) => {
    setSelectedUniforms((prev) => {
      const exists = prev.includes(option)
      const next = exists ? prev.filter((item) => item !== option) : [...prev, option]
      if (next.length > 0) setUniformError(null)
      return next
    })
  }

  const handleSelectAllUniforms = () => {
    setSelectedUniforms([...UNIFORM_OPTIONS])
    setUniformError(null)
  }

  const handleClearAllUniforms = () => {
    setSelectedUniforms([])
  }

  // Dynamic Batch Calculation Summary
  const calculationSummary = React.useMemo(() => {
    if (isEdit) return null

    if (selectedType === "Uniform") {
      const itemsCount = selectedUniforms.length
      const empCount = selectedEmployees.length

      if (itemsCount > 0 && empCount > 0) {
        const total = itemsCount * empCount
        return {
          total,
          text: `${itemsCount} Uniform Items × ${empCount} Employees = ${total} Total Assets`,
          subtext: `Each employee will receive their own set of ${itemsCount} individual asset records.`,
        }
      }

      if (itemsCount > 1 && empCount === 0) {
        return {
          total: itemsCount,
          text: `${itemsCount} Uniform Items will be created in inventory`,
          subtext: "Items will be added as unassigned stock ready for future allocation.",
        }
      }
    } else if (selectedEmployees.length > 1) {
      const total = selectedEmployees.length
      return {
        total,
        text: `${total} Assets will be generated (1 for each selected employee)`,
        subtext: "Each employee will be assigned a distinct asset record.",
      }
    }

    return null
  }, [isEdit, selectedType, selectedUniforms.length, selectedEmployees.length])

  // Dynamic Submit Button Label
  const submitButtonLabel = React.useMemo(() => {
    if (isLoading) return "Saving..."
    if (isEdit) return "Update Asset"
    if (calculationSummary && calculationSummary.total > 1) {
      return `Add ${calculationSummary.total} Assets`
    }
    return "Add Asset"
  }, [isLoading, isEdit, calculationSummary])

  const handleSubmit = (data: AssetFormValues) => {
    const actualType = data.type === "Other" ? data.otherType : data.type;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { otherType, ...restOfData } = data;

    const baseSerial = (data.serialNumber || "").trim();

    // 1. Uniform Case
    if (actualType === "Uniform") {
      if (selectedUniforms.length === 0) {
        setUniformError("Please select at least one uniform item");
        return;
      }
      setUniformError(null);

      // In edit mode with single asset, just update that single item
      if (isEdit) {
        const payload: AssetFormValues = {
          ...restOfData,
          name: selectedUniforms[0] || data.name || "Uniform",
          type: "Uniform",
          issuedTo: selectedEmployees[0] || data.issuedTo || undefined,
          serialNumber: baseSerial || `UNF-${Date.now().toString().slice(-6)}`,
          issuedDate: data.issuedDate ? new Date(data.issuedDate).toISOString() : undefined,
        };
        onSubmit(payload);
        return;
      }

      const itemsToCreate: AssetFormValues[] = [];
      const empList = selectedEmployees.length > 0 ? selectedEmployees : [undefined];

      empList.forEach((empId, empIdx) => {
        selectedUniforms.forEach((uniformItem, itemIdx) => {
          let serialSuffix = baseSerial;
          if (baseSerial) {
            serialSuffix = empList.length > 1 || selectedUniforms.length > 1
              ? `${baseSerial}-${empIdx + 1}.${itemIdx + 1}`
              : baseSerial;
          } else {
            serialSuffix = `UNF-${Date.now().toString().slice(-5)}${empIdx}${itemIdx}`;
          }

          itemsToCreate.push({
            ...restOfData,
            name: uniformItem,
            type: "Uniform",
            issuedTo: empId || undefined,
            status: empId ? "Issued" : (data.status || "In Stock"),
            serialNumber: serialSuffix,
            issuedDate: data.issuedDate
              ? new Date(data.issuedDate).toISOString()
              : (empId ? new Date().toISOString() : undefined),
          });
        });
      });

      onSubmit(itemsToCreate.length === 1 ? itemsToCreate[0] : itemsToCreate);
      return;
    }

    // 2. Non-Uniform Type with multiple employees selected in Add mode
    if (!isEdit && selectedEmployees.length > 1) {
      const itemsToCreate: AssetFormValues[] = selectedEmployees.map((empId, empIdx) => {
        const serialSuffix = baseSerial
          ? `${baseSerial}-${empIdx + 1}`
          : `${actualType?.slice(0, 3).toUpperCase() || "AST"}-${Date.now().toString().slice(-5)}${empIdx}`;

        return {
          ...restOfData,
          name: data.name || "Asset",
          type: actualType as string,
          issuedTo: empId,
          status: "Issued",
          serialNumber: serialSuffix,
          issuedDate: data.issuedDate ? new Date(data.issuedDate).toISOString() : new Date().toISOString(),
        };
      });

      onSubmit(itemsToCreate);
      return;
    }

    // 3. Standard single asset
    const singleIssuedTo = selectedEmployees.length === 1 ? selectedEmployees[0] : (data.issuedTo || undefined);
    const payload = {
      ...restOfData,
      name: data.name || "Asset",
      type: actualType as string,
      issuedTo: singleIssuedTo,
      serialNumber: baseSerial || `${actualType?.slice(0, 3).toUpperCase() || "AST"}-${Date.now().toString().slice(-6)}`,
      issuedDate: data.issuedDate ? new Date(data.issuedDate).toISOString() : undefined,
    };
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" suppressHydrationWarning>
        {/* ROW 1: Asset Type & Serial Number (Balanced 2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-700">Asset Type *</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val)
                    if (val === "Uniform" && selectedUniforms.length === 0) {
                      setSelectedUniforms([...UNIFORM_OPTIONS])
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PREDEFINED_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-bold text-slate-700">
                    Serial Number / ID
                  </FormLabel>
                  {selectedType === "Uniform" && (
                    <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                  )}
                </div>
                <FormControl>
                  <Input
                    placeholder={
                      selectedType === "Uniform"
                        ? "Auto-generated if left blank"
                        : "e.g. SN12345678"
                    }
                    className="h-10 rounded-xl border-slate-200 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* If 'Other' type selected */}
        {selectedType === "Other" && (
          <FormField
            control={form.control}
            name="otherType"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                <FormLabel className="text-xs font-bold text-slate-700">Specify Other Asset Type *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Drone, Server, Specialized Tool" className="h-10 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* ROW 2: Asset Name (Text Box) OR Dedicated Uniform Selection Grid */}
        {selectedType === "Uniform" ? (
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100/80 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Shirt className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Uniform Items to Generate *
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select the uniform pieces to issue.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] font-bold px-2 py-0.5",
                    selectedUniforms.length > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  )}
                >
                  {selectedUniforms.length}/{UNIFORM_OPTIONS.length} Selected
                </Badge>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllUniforms}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllUniforms}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of 5 uniform items with clean toggle cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {UNIFORM_OPTIONS.map((item) => {
                const isSelected = selectedUniforms.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleUniformOption(item)}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs text-left",
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-300 shadow-2xs font-bold text-emerald-900 ring-1 ring-emerald-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-600 font-medium"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-all",
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                )
              })}
            </div>

            {uniformError && (
              <p className="text-xs font-semibold text-rose-500 mt-1">{uniformError}</p>
            )}
          </div>
        ) : (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-700">Asset Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. MacBook Pro 16 / Dell Latitude 5420"
                    className="h-10 rounded-xl border-slate-200 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* ROW 3: Issued To (Employees) */}
        {isEdit ? (
          <FormField
            control={form.control}
            name="issuedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-700">Issued To (Employee)</FormLabel>
                <FormControl>
                  <EmployeeSelect 
                    value={field.value} 
                    onValueChange={(val) => {
                      field.onChange(val)
                      if (val) setSelectedEmployees([val])
                      else setSelectedEmployees([])
                    }} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Issued To (Assign to Employees)
              </FormLabel>
              {selectedEmployees.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {selectedEmployees.length} Employee{selectedEmployees.length > 1 ? "s" : ""} Selected
                </Badge>
              )}
            </div>
            <EmployeeMultiSelect
              values={selectedEmployees}
              onValuesChange={(vals) => {
                setSelectedEmployees(vals)
                form.setValue("issuedTo", vals[0] || "")
              }}
              placeholder="Search and select employee(s)... (leave empty for stock inventory)"
            />
          </div>
        )}

        {/* ROW 4: Issue Date & Current Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issuedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-700">Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" className="h-10 rounded-xl border-slate-200 bg-white" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-slate-700">Current Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dynamic Summary Banner when multiple items/users are selected */}
        {calculationSummary && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {calculationSummary.text}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {calculationSummary.subtext}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white border-none text-[11px] font-bold shrink-0">
              {calculationSummary.total} Total
            </Badge>
          </div>
        )}

        {/* Maintenance Reminder */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
          <FormField
            control={form.control}
            name="setReminder"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-1">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold text-slate-800">Set Maintenance Reminder</FormLabel>
                  <p className="text-[11px] text-slate-500">Enable automatic alerts for this asset&apos;s maintenance schedule.</p>
                </div>
                <FormControl>
                  <Input 
                    type="checkbox" 
                    className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 w-fit cursor-pointer"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {setReminder && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reminderStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Next Maintenance Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-10 rounded-xl bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reminderFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-xl bg-white">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {reminderFrequency === "custom" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FormField
                    control={form.control}
                    name="reminderInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700">Interval (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="h-10 rounded-xl bg-white" placeholder="30" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Alert Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="h-10 rounded-xl bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="recipientEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">Recipient Emails (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com, manager@example.com" {...field} className="h-10 rounded-xl bg-white" />
                    </FormControl>
                    <p className="text-[10px] text-slate-400">Multiple emails should be separated by commas.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Extra Note */}
        <FormField
          control={form.control}
          name="extraNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-700">Extra Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about the asset..." 
                  className="rounded-xl resize-none border-slate-200" 
                  rows={2}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="submit"
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            disabled={isLoading}
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{submitButtonLabel}</span>
          </Button>
        </div>
      </form>
    </Form>
  )
}
