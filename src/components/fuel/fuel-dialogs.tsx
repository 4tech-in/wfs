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
import { Upload, X, FileImage, CalendarIcon, Edit2, Trash2 } from "lucide-react"
import { useAddFuelMutation, useAddCardBalanceMutation, useUpdateCardBalanceMutation, useFuelCardsQuery, useDeleteCardBalanceMutation, useUpdateFuelMutation } from "@/hooks/queries/use-fuel"
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
  prevOdometer: z.string().optional(),
  fuelType: z.string().min(1, "Fuel type is required"),
  ratePerLtr: z.string().min(1, "Rate per litre is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  totalAmount: z.string().min(1, "Total amount is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  images: z.array(z.instanceof(File)).optional(),
  average: z.string().optional(),
  totalFuel: z.string().min(1, "Total fuel is required").refine(val => !isNaN(parseFloat(val)), "Must be a number"),
})

export type FuelFormValues = z.infer<typeof fuelFormSchema>

interface AddFuelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd?: () => void
  initialValues?: Partial<FuelFormValues>
  editId?: string
}

export function AddFuelDialog({ open, onOpenChange, onAdd, initialValues, editId }: AddFuelDialogProps) {
  const createMutation = useAddFuelMutation()
  const updateMutation = useUpdateFuelMutation()
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
      prevOdometer: "",
      fuelType: "Diesel",
      ratePerLtr: "",
      totalAmount: "",
      images: [],
      average: "",
      totalFuel: "",
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
  const images = form.watch("images")
  const selectedVehicleId = form.watch("vehicleId")
  const odometerVal = form.watch("odometer")
  const prevOdometerVal = form.watch("prevOdometer")
  const ratePerLtrVal = form.watch("ratePerLtr")
  const totalAmountVal = form.watch("totalAmount")
  const totalFuelVal = form.watch("totalFuel")
  const [isFetchingPrevOdo, setIsFetchingPrevOdo] = React.useState(false)

  // Derived calculated values
  const parsedOdo = parseFloat(odometerVal || "0")
  const parsedPrev = parseFloat(prevOdometerVal || "0")
  const parsedTotalFuel = parseFloat(totalFuelVal || "0")
  const displayAverage = parsedTotalFuel > 0 && parsedOdo > parsedPrev && prevOdometerVal !== "" && prevOdometerVal !== undefined ? ((parsedOdo - parsedPrev) / parsedTotalFuel).toFixed(2) : ""

  // Auto-calculate totalAmount based on ratePerLtr and totalFuel
  React.useEffect(() => {
    const rate = parseFloat(ratePerLtrVal || "0")
    const litres = parseFloat(totalFuelVal || "0")
    if (rate > 0 && litres > 0) {
      form.setValue("totalAmount", (rate * litres).toFixed(2))
    }
  }, [ratePerLtrVal, totalFuelVal, form])

  // Fetch previous odometer when vehicle changes
  React.useEffect(() => {
    const fetchPrevOdometer = async () => {
      if (selectedVehicleId && !editId) {
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
              form.setValue("prevOdometer", res.data[0].odometer.toString())
            } else {
              form.setValue("prevOdometer", "")
            }
          } catch (error) {
            console.error("Failed to fetch prev odometer:", error)
            form.setValue("prevOdometer", "")
          } finally {
            setIsFetchingPrevOdo(false)
          }
        }
      } else if (!selectedVehicleId) {
        form.setValue("prevOdometer", "")
      }
    }

    fetchPrevOdometer()
  }, [selectedVehicleId, vehicles, form, editId])

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
      const payload = {
        fillingDate: data.fillingDate,
        vehicleId: data.vehicleId,
        odometer: parseFloat(data.odometer),
        fuelType: data.fuelType,
        ratePerLtr: parseFloat(data.ratePerLtr),
        totalAmount: parseFloat(data.totalAmount),
        totalFuel: parseFloat(data.totalFuel || "0"),
        images: data.images || [],
      }

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }

      form.reset()
      onOpenChange(false)
      onAdd?.()
    } catch {
      // Error handled by service toast
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Fuel Expense" : "Log Fuel Expense"}</DialogTitle>
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
              </div>              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prevOdometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500">Previous Odometer</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          disabled 
                          placeholder={isFetchingPrevOdo ? "Fetching..." : "No previous record"}
                          className="bg-slate-50/50 border-slate-200 text-slate-500 font-medium cursor-not-allowed" 
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="odometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Odometer Reading</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter current reading" 
                          {...field} 
                          onWheel={(e) => e.currentTarget.blur()}
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
                  name="ratePerLtr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Per Litre</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="96.00" 
                          {...field} 
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="3500.00" 
                          {...field} 
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalFuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Fuel (L)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter total fuel" 
                          {...field} 
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <label className="text-sm font-medium text-slate-500">Average (km/L)</label>
                  <Input 
                    type="text" 
                    value={displayAverage}
                    readOnly
                    placeholder="Auto calculated"
                    className="bg-slate-50/50 border-slate-200 text-slate-500 font-medium cursor-not-allowed mt-2" 
                  />
                </div>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : (editId ? "Update Entry" : "Save Entry")}
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
  editId?: string
  initialValues?: { amount: number; note?: string }
}

export function AddCardBalanceDialog({ open, onOpenChange, onSuccess, editId, initialValues }: AddCardBalanceDialogProps) {
  const addBalanceMutation = useAddCardBalanceMutation()
  const updateBalanceMutation = useUpdateCardBalanceMutation()
  
  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceFormSchema),
    defaultValues: {
      amount: "",
      note: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        amount: initialValues?.amount !== undefined ? String(initialValues.amount) : "",
        note: initialValues?.note || "",
      })
    }
  }, [open, initialValues, form])

  const onSubmit = async (data: BalanceFormValues) => {
    try {
      if (editId) {
        await updateBalanceMutation.mutateAsync({
          id: editId,
          data: {
            amount: parseFloat(data.amount),
            note: data.note,
          }
        })
      } else {
        await addBalanceMutation.mutateAsync({
          amount: parseFloat(data.amount),
          note: data.note,
        })
      }
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled by service toast
    }
  }

  const isPending = addBalanceMutation.isPending || updateBalanceMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit PetroCard Balance" : "Add PetroCard Balance"}</DialogTitle>
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
                disabled={isPending}
                className="bg-[#2eb88a] hover:bg-[#26a67a] text-white"
              >
                {isPending ? "Saving..." : (editId ? "Update Balance" : "Add Balance")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface RechargeHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick: (recharge: { _id: string; amount: number; note?: string }) => void
}

export function RechargeHistoryDialog({ open, onOpenChange, onEditClick }: RechargeHistoryDialogProps) {
  const { data: historyData, isLoading } = useFuelCardsQuery({ limit: 100 })
  const deleteMutation = useDeleteCardBalanceMutation()

  const list = historyData?.data || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recharge History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2eb88a]"></div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              No recharge history found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {list.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between py-3.5 group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        ₹ {item.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {format(new Date(item.createdAt), "dd MMM yyyy")}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-slate-500 italic max-w-[320px] truncate">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-90 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-[#2eb88a] hover:bg-emerald-50 rounded-lg"
                      onClick={() => onEditClick(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this recharge entry?")) {
                          deleteMutation.mutate(item._id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
