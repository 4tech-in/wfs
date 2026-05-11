"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  Receipt as ReceiptIcon,
  Upload,
  Paperclip
} from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Reminder } from "@/types/reminder"
import { Asset } from "@/types/asset"

import { useAssetQuery } from "@/hooks/queries/use-assets-query"
import { useRemindersQuery, useUpdateReminderMutation } from "@/hooks/queries/use-reminders"

// Dummy data moved outside component to satisfy React purity rules (impure Date.now())
const DUMMY_ASSETS: Record<string, Partial<Asset>> = {
  "6a00cf282dd7e2ba0031c522": {
    _id: "6a00cf282dd7e2ba0031c522",
    name: "Daikin AC - 1.5 Ton",
    type: "HVAC",
    serialNumber: "DK-AC-992-B",
    status: "In Stock",
    maintenanceFrequency: "quarterly"
  },
  "69dfc5d812d53b3e7c09dc6c": {
    _id: "69dfc5d812d53b3e7c09dc6c",
    name: "LG Inverter AC",
    type: "HVAC",
    serialNumber: "LG-INV-441-X",
    status: "Issued",
    maintenanceFrequency: "quarterly"
  }
}

const getDummyReminders = (id: string): Reminder[] => {
  const referenceTime = 1715446200000 // Fixed timestamp for stability
  return [
    {
      _id: "ac-dummy-1",
      title: "Gas Pressure Check & Refilling",
      description: "Checked R32 gas pressure and topped up to optimal levels. Leakage test performed on copper tubes.",
      enabled: false,
      startDate: new Date(referenceTime - 15 * 24 * 60 * 60 * 1000).toISOString(),
      nextOccurrence: new Date(referenceTime - 15 * 24 * 60 * 60 * 1000).toISOString(),
      time: "11:00",
      frequency: "monthly",
      metadata: { assetId: id, fileRef: "GAS-FILL-882" },
      createdBy: "admin",
      createdAt: new Date(referenceTime).toISOString(),
      updatedAt: new Date(referenceTime).toISOString(),
    },
    {
      _id: "ac-dummy-2",
      title: "Filter & Coil Wet Service",
      description: "Deep cleaning of air filters, evaporator coils, and drainage tray using high-pressure jet.",
      enabled: false,
      startDate: new Date(referenceTime - 45 * 24 * 60 * 60 * 1000).toISOString(),
      nextOccurrence: new Date(referenceTime - 45 * 24 * 60 * 60 * 1000).toISOString(),
      time: "10:30",
      frequency: "monthly",
      metadata: { assetId: id, fileRef: "SVC-LG-001" },
      createdBy: "admin",
      createdAt: new Date(referenceTime).toISOString(),
      updatedAt: new Date(referenceTime).toISOString(),
    },
    {
      _id: "ac-dummy-3",
      title: "Outdoor Unit Compressor Check",
      description: "Amperage check for compressor and cleaning of condenser fins to improve cooling efficiency.",
      enabled: true,
      startDate: new Date(referenceTime + 10 * 24 * 60 * 60 * 1000).toISOString(),
      nextOccurrence: new Date(referenceTime + 10 * 24 * 60 * 60 * 1000).toISOString(),
      time: "16:00",
      frequency: "monthly",
      metadata: { assetId: id },
      createdBy: "admin",
      createdAt: new Date(referenceTime).toISOString(),
      updatedAt: new Date(referenceTime).toISOString(),
    },
    {
      _id: "ac-dummy-4",
      title: "Capacitor & PCB Inspection",
      description: "Routine inspection of electrical components and PCB health check-up.",
      enabled: false,
      startDate: new Date(referenceTime - 90 * 24 * 60 * 60 * 1000).toISOString(),
      nextOccurrence: new Date(referenceTime - 90 * 24 * 60 * 60 * 1000).toISOString(),
      time: "09:00",
      frequency: "monthly",
      metadata: { assetId: id, fileRef: "ELEC-CHK-7" },
      createdBy: "admin",
      createdAt: new Date(referenceTime).toISOString(),
      updatedAt: new Date(referenceTime).toISOString(),
    },
    {
      _id: "ac-dummy-5",
      title: "Remote & Sensor Calibration",
      description: "Replacing batteries and verifying temperature sensor accuracy.",
      enabled: false,
      startDate: new Date(referenceTime - 120 * 24 * 60 * 60 * 1000).toISOString(),
      nextOccurrence: new Date(referenceTime - 120 * 24 * 60 * 60 * 1000).toISOString(),
      time: "14:45",
      frequency: "monthly",
      metadata: { assetId: id, fileRef: "CALIB-99" },
      createdBy: "admin",
      createdAt: new Date(referenceTime).toISOString(),
      updatedAt: new Date(referenceTime).toISOString(),
    }
  ] as Reminder[]
}

export default function AssetMaintenanceHistoryPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [markingDoneId, setMarkingDoneId] = React.useState<string | null>(null)
  const [fromDate, setFromDate] = React.useState<Date | undefined>(undefined)
  const [toDate, setToDate] = React.useState<Date | undefined>(undefined)

  const { data: realAsset, isLoading: isLoadingAsset } = useAssetQuery(id)
  const { data: remindersResponse, isLoading: isLoadingReminders } = useRemindersQuery({ limit: 10000000 })
  const updateMutation = useUpdateReminderMutation()

  const asset = realAsset || DUMMY_ASSETS[id] || {
    _id: id,
    name: "Air Conditioning Unit",
    type: "HVAC",
    serialNumber: "AC-UNKNOWN",
    status: "Issued",
    maintenanceFrequency: "quarterly"
  }

  const reminders = React.useMemo(() => remindersResponse?.data || [], [remindersResponse])
  
  const dummyReminders = React.useMemo(() => getDummyReminders(id), [id])

  const assetReminders = React.useMemo(() => {
    return [...reminders, ...dummyReminders]
      .filter(r => r.metadata?.assetId === id)
      .filter(r => {
        if (!fromDate && !toDate) return true
        const rDate = new Date(r.nextOccurrence || r.startDate)
        const start = fromDate ? startOfDay(fromDate) : new Date(0)
        const end = toDate ? endOfDay(toDate) : new Date(8640000000000000)
        return isWithinInterval(rDate, { start, end })
      })
      .sort((a, b) => new Date(b.nextOccurrence || b.startDate).getTime() - new Date(a.nextOccurrence || a.startDate).getTime())
  }, [reminders, dummyReminders, id, fromDate, toDate])

  const columns: ColumnDef<Reminder>[] = [
    {
      accessorKey: "title",
      header: "Maintenance Task",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-700">{row.original.title}</span>
          <span className="text-[10px] text-slate-400 font-medium italic line-clamp-1">{row.original.description}</span>
        </div>
      )
    },
    {
      id: "date",
      header: "Scheduled Date",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-600">
            {format(new Date(row.original.nextOccurrence || row.original.startDate), "MMM dd, yyyy")}
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{row.original.time}</span>
        </div>
      )
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          className={cn(
            "font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full",
            row.original.enabled 
              ? "bg-amber-50 text-amber-600 border-amber-100" 
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}
          variant="outline"
        >
          {row.original.enabled ? "Scheduled" : "Done"}
        </Badge>
      )
    },
    {
      id: "receipt",
      header: "Receipt / Ref",
      cell: ({ row }) => row.original.metadata?.fileRef ? (
        <div className="flex items-center gap-1.5 text-indigo-600 font-black italic text-[11px]">
          <ReceiptIcon className="h-3.5 w-3.5" />
          {(row.original.metadata?.fileRef as string) || "Ref"}
        </div>
      ) : (
        <span className="text-slate-300 italic text-[10px]">No receipt</span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isMarking = markingDoneId === row.original._id
        if (!row.original.enabled) return (
          <div className="flex justify-center text-emerald-500">
            <CheckCircle className="h-4 w-4" />
          </div>
        )
        
        if (isMarking) {
           return (
             <div className="flex gap-2 items-center justify-end">
               <input 
                 type="file" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={(e) => {
                   const file = e.target.files?.[0]
                   if (file) {
                     setSelectedFile(file)
                   }
                 }}
               />
               <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-9 px-3 rounded-xl border-dashed border-indigo-200 text-[11px] gap-2 transition-all",
                  selectedFile ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "hover:bg-slate-50 text-slate-500"
                )}
                onClick={() => fileInputRef.current?.click()}
               >
                 {selectedFile ? (
                   <>
                     <Paperclip className="h-3.5 w-3.5" />
                     {selectedFile.name.length > 15 ? selectedFile.name.substring(0, 12) + "..." : selectedFile.name}
                   </>
                 ) : (
                   <>
                     <Upload className="h-3.5 w-3.5" />
                     Upload Receipt
                   </>
                 )}
               </Button>
               <Button 
                size="sm" 
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 font-bold text-[11px] rounded-xl shadow-lg shadow-indigo-500/10" 
                onClick={() => handleMarkDone(row.original._id)}
                disabled={updateMutation.isPending || !selectedFile}
               >
                 {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Complete"}
               </Button>
               <Button 
                size="sm" 
                variant="ghost" 
                className="h-9 w-9 p-0 rounded-full text-slate-400" 
                onClick={() => { setMarkingDoneId(null); setSelectedFile(null); }}
               >
                 ✕
               </Button>
             </div>
           )
        }
        
        return (
          <div className="flex justify-end">
            <Button 
              size="sm" 
              variant="ghost"
              className="h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-[11px] gap-1.5"
              onClick={() => setMarkingDoneId(row.original._id)}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Done
            </Button>
          </div>
        )
      }
    }
  ]

  const handleMarkDone = async (reminderId: string) => {
    if (!selectedFile) {
      toast.error("Please upload a receipt")
      return
    }

    try {
      // In a real app, we would upload to S3/Cloudinary here
      // For now, we use the filename as the reference
      await updateMutation.mutateAsync({ 
        id: reminderId, 
        data: { 
          action: 'done',
          metadata: { 
            ...(reminders.find(r => r._id === reminderId)?.metadata || {}),
            fileRef: selectedFile.name,
            uploadDate: new Date().toISOString()
          } 
        } 
      })
      setMarkingDoneId(null)
      setSelectedFile(null)
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoadingAsset || isLoadingReminders) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold text-slate-900">Asset not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-slate-100 h-10 w-10"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Asset Tracking</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-indigo-600">Maintenance History</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 italic font-heading flex items-center gap-3">
            {asset.name}
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 italic font-heading">
            <Clock className="h-5 w-5 text-indigo-500" />
            Maintenance Log
          </h3>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 justify-start text-left font-normal rounded-xl border-slate-200 bg-white shadow-sm",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP") : <span>From</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                <CalendarComponent
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 justify-start text-left font-normal rounded-xl border-slate-200 bg-white shadow-sm",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP") : <span>To</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                <CalendarComponent
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(fromDate || toDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFromDate(undefined); setToDate(undefined); }}
                className="text-slate-400 font-bold hover:bg-slate-50 rounded-xl"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden p-6">
          <DataTable 
            columns={columns}
            data={assetReminders}
            isLoading={isLoadingReminders}
            totalItems={assetReminders.length}
            showSrNo={true}
            hideSearch={true}
          />
        </div>
      </div>
    </div>
  )
}
