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
import { CreateAssetDto } from "@/types/asset"
import { Employee } from "@/types/employee"

import { Textarea } from "@/components/ui/textarea"
import { EmployeeSelect } from "@/components/employee/employee-select"

const PREDEFINED_TYPES = ["Laptop", "Vehicle", "Mobile Device", "Office Equipment", "Safety Gear", "Specialized Tool", "Uniform", "Electronics"];

const formSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  type: z.string().min(1, "Asset type is required"),
  otherType: z.string().optional(),
  serialNumber: z.string().min(2, "Serial number is required"),
  issuedTo: z.string().optional(),
  issuedDate: z.string().optional(),
  status: z.enum(["In Stock", "Issued", "Returned", "Under Maintenance", "Damaged"] as const),
  // maintenanceDueDate: z.string().min(1, "Maintenance date is required"),
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
});

export interface AssetFormValues {
  name: string;
  type: string;
  otherType?: string;
  serialNumber: string;
  issuedTo?: string;
  issuedDate?: string;
  status: "In Stock" | "Issued" | "Returned" | "Under Maintenance" | "Damaged";
  // maintenanceDueDate: string;
  maintenanceDueDate?: string;
  extraNote?: string;
  setReminder: boolean;
  reminderFrequency: ReminderFrequency;
  reminderInterval?: string;
  reminderStartDate?: string;
  reminderTime: string;
  recipientEmails?: string;
}

interface AssetFormProps {
  initialValues?: Partial<CreateAssetDto>
  initialReminder?: { frequency: ReminderFrequency; time: string; enabled: boolean; startDate?: string; interval?: number; recipientEmails?: string[] }
  onSubmit: (data: AssetFormValues) => void
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
  const [now] = React.useState(() => Date.now())

  const defaultValues = React.useMemo(() => {
    const assetType = initialValues?.type || "Laptop";
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
      maintenanceDueDate: initialValues?.maintenanceDueDate ? initialValues.maintenanceDueDate.split('T')[0] : new Date(now + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      extraNote: initialValues?.extraNote || "",
      setReminder: !!initialReminder?.enabled,
      reminderFrequency: (initialReminder?.frequency as ReminderFrequency) || "monthly",
      reminderInterval: initialReminder?.interval ? String(initialReminder.interval) : "30",
      reminderStartDate: initialReminder?.startDate ? initialReminder.startDate.split('T')[0] : (initialValues?.maintenanceDueDate ? initialValues.maintenanceDueDate.split('T')[0] : new Date().toISOString().split('T')[0]),
      reminderTime: initialReminder?.time || "09:00",
      recipientEmails: initialReminder?.recipientEmails?.join(", ") || "",
    } as AssetFormValues;
  }, [initialValues, now, initialReminder])

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as DefaultValues<AssetFormValues>,
  })

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

  // Re-sync form if initialValues change (important for edit mode)
  React.useEffect(() => {
    if (initialValues) {
      form.reset(defaultValues)
    }
  }, [initialValues, defaultValues, form])

  const handleSubmit = (data: AssetFormValues) => {
    // Determine the actual type to send to backend
    const actualType = data.type === "Other" ? data.otherType : data.type;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { otherType, ...restOfData } = data;

    // Convert dates to ISO format for backend if needed
    const payload = {
      ...restOfData,
      type: actualType as string,
      issuedDate: data.issuedDate ? new Date(data.issuedDate).toISOString() : undefined,
      // maintenanceDueDate: new Date(data.maintenanceDueDate).toISOString(),
    }
    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                  <Input placeholder="MacBook Pro / Dell Latitude" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
        </div>

        {selectedType === "Other" && (
          <FormField
            control={form.control}
            name="otherType"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                <FormLabel>Specify Other Type</FormLabel>
                <FormControl>
                  <Input placeholder="E.g. Drone, Server, Furniture" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number / ID</FormLabel>
                <FormControl>
                  <Input placeholder="SN12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issuedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issued To (Employee)</FormLabel>
                <FormControl>
                  <EmployeeSelect 
                    value={field.value} 
                    onValueChange={(val) => field.onChange(val)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issuedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Current Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

        {/* <FormField
          control={form.control}
          name="maintenanceDueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next Maintenance Due</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <FormField
            control={form.control}
            name="setReminder"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-1">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-semibold text-slate-800">Set Maintenance Reminder</FormLabel>
                  <p className="text-[12px] text-slate-500">Enable automatic alerts for this asset&apos;s maintenance.</p>
                </div>
                <FormControl>
                  <Input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 w-fit"
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
                      <FormLabel>Next Maintenance Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white" />
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
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
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
                        <FormLabel>Interval (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white" placeholder="30" />
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
                      <FormLabel>Alert Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="bg-white" />
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
                    <FormLabel>Recipient Emails (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com, manager@example.com" {...field} className="bg-white" />
                    </FormControl>
                    <p className="text-[10px] text-slate-400">Multiple emails should be separated by commas.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="extraNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Extra Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about the asset..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" className="bg-[#1e293b] hover:bg-[#334155] text-white" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update Asset" : "Add Asset"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
