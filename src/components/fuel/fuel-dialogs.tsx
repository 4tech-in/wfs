"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, X, FileImage, CalendarIcon } from "lucide-react"
import { useAddFuelMutation, useAddCardBalanceMutation } from "@/hooks/queries/use-fuel"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useVehiclesInfiniteQuery } from "@/hooks/queries/use-vehicles"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { useDebounce } from "@/hooks/use-debounce"
import { Vehicle } from "@/types/vehicle"
import { fuelService } from "@/services/fuel-service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fuelFormSchema = z.object({
  fillingDate: z.string().min(1, "Date is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  odometer: z.string().min(1, "Odometer reading is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  fuelType: z.string().min(1, "Fuel type is required"),
  ratePerLtr: z.string().min(1, "Rate per litre is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  totalAmount: z.string().min(1, "Total amount is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  images: z.array(z.instanceof(File)).optional(),
})

export type FuelFormValues = z.infer<typeof fuelFormSchema>

interface AddFuelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd?: () => void
  initialValues?: Partial<FuelFormValues>
}

export function AddFuelDialog({ open, onOpenChange, onAdd, initialValues }: AddFuelDialogProps) {
  const createMutation = useAddFuelMutation()
  const [vehicleSearch, setVehicleSearch] = React.useState("")
  const debouncedVehicleSearch = useDebounce(vehicleSearch, 400)

  const {
    data: vehicleData,
    fetchNextPage: fetchNextVehicles,
    hasNextPage: hasNextVehicles,
    isFetchingNextPage: isFetchingNextVehicles,
    isLoading: isVehiclesLoading,
  } = useVehiclesInfiniteQuery({
    search: debouncedVehicleSearch,
    limit: 10,
  })

  const vehicles = React.useMemo(
    () => vehicleData?.pages.flatMap((page) => page.data) || [],
    [vehicleData]
  )

  const form = useForm<FuelFormValues>({
    resolver: zodResolver(fuelFormSchema),
    defaultValues: {
      fillingDate: new Date().toISOString().substring(0, 10),
      vehicleId: "",
      odometer: "",
      fuelType: "Diesel",
      ratePerLtr: "",
      totalAmount: "",
      images: [],
      ...initialValues,
    },
  })

  // Update form when initialValues change
  React.useEffect(() => {
    if (open && initialValues) {
      form.reset({
        ...form.getValues(),
        ...initialValues,
      })
    }
  }, [open, initialValues, form])

  // Watch fields for calculations
  const images = useWatch({ control: form.control, name: "images" })
  const selectedVehicleId = useWatch({ control: form.control, name: "vehicleId" })
  const [prevOdometer, setPrevOdometer] = React.useState<number | null>(null)
  const [isFetchingPrevOdo, setIsFetchingPrevOdo] = React.useState(false)

  // Fetch previous odometer when vehicle changes
  React.useEffect(() => {
    const fetchPrevOdometer = async () => {
      if (selectedVehicleId) {
        const vehicle = vehicles.find(v => v._id === selectedVehicleId)
        if (vehicle) {
          setIsFetchingPrevOdo(true)
          try {
            const res = await fuelService.getAll({ 
              search: vehicle.vehicleNo, 
              limit: 1, 
              sortBy: 'createdAt', 
              sortOrder: 'desc' 
            })
            if (res.data.length > 0) {
              setPrevOdometer(res.data[0].odometer)
            } else {
              setPrevOdometer(null)
            }
          } catch (error) {
            console.error("Failed to fetch prev odometer:", error)
            setPrevOdometer(null)
          } finally {
            setIsFetchingPrevOdo(false)
          }
        }
      } else {
        setPrevOdometer(null)
      }
    }

    fetchPrevOdometer()
  }, [selectedVehicleId, vehicles])

  // File handling
  const handleFileDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        const currentFiles = form.getValues("images") || []
        form.setValue("images", [...currentFiles, ...droppedFiles])
      }
    },
    [form]
  )
  const removeFile = (index: number) => {
    const currentFiles = form.getValues("images") || []
    form.setValue("images", currentFiles.filter((_, i) => i !== index))
  }
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files)
      const currentFiles = form.getValues("images") || []
      form.setValue("images", [...currentFiles, ...newFiles])
    }
  }

  const onSubmit = async (data: FuelFormValues) => {
    try {
      await createMutation.mutateAsync({
        fillingDate: data.fillingDate,
        vehicleId: data.vehicleId,
        odometer: parseFloat(data.odometer),
        fuelType: data.fuelType,
        ratePerLtr: parseFloat(data.ratePerLtr),
        totalAmount: parseFloat(data.totalAmount),
        images: data.images || [],
      })

      form.reset()
      onOpenChange(false)
      onAdd?.()
    } catch {
      // Error handled by service toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Log Fuel Expense</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fillingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Filling Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
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
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <InfiniteScrollSelect<Vehicle>
                          value={field.value}
                          onValueChange={(val) => field.onChange(val)}
                          items={vehicles}
                          loadMore={fetchNextVehicles}
                          hasNextPage={hasNextVehicles}
                          isFetchingNextPage={isFetchingNextVehicles}
                          isLoading={isVehiclesLoading}
                          placeholder="Select a vehicle"
                          searchPlaceholder="Search vehicle number or code..."
                          onSearchChange={setVehicleSearch}
                          getLabel={(item) => `${item.vehicleNo} (${item.vehicleCode})`}
                          getValue={(item) => item._id}
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
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="odometer"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Odometer Reading</FormLabel>
                        {selectedVehicleId && (
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            {isFetchingPrevOdo ? "Fetching..." : `Prev: ${prevOdometer || "No record"}`}
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <Input type="number" placeholder="45678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ratePerLtr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Per Litre</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="96.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="3500.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">
                  Receipt / Photos
                </h3>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer relative group"
                >
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Click or drag files here</p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>

                {images && images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {images.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200 group">
                        <FileImage className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(i)
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const balanceFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  note: z.string().optional(),
})

type BalanceFormValues = z.infer<typeof balanceFormSchema>

interface AddCardBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddCardBalanceDialog({ open, onOpenChange, onSuccess }: AddCardBalanceDialogProps) {
  const addBalanceMutation = useAddCardBalanceMutation()
  
  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceFormSchema),
    defaultValues: {
      amount: "",
      note: "",
    },
  })

  const onSubmit = async (data: BalanceFormValues) => {
    try {
      await addBalanceMutation.mutateAsync({
        amount: parseFloat(data.amount),
        note: data.note,
      })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled by service toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add PetroCard Balance</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Monthly budget" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={addBalanceMutation.isPending}
                className="bg-[#2eb88a] hover:bg-[#26a67a] text-white"
              >
                {addBalanceMutation.isPending ? "Adding..." : "Add Balance"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
