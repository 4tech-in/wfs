"use client"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteMultipleEmployeesMutation } from "@/hooks/queries/use-employees-query"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Package, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { assetService } from "@/services/asset-service"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/query-keys"
import { toast } from "sonner"
import { Asset } from "@/types/asset"

interface DeleteEmployeeDialogProps {
  userIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteEmployeeDialog({ userIds, open, onOpenChange }: DeleteEmployeeDialogProps) {
  const [companyExitDate, setCompanyExitDate] = React.useState<Date>(new Date())
  const { mutate: deleteEmployees, isPending } = useDeleteMultipleEmployeesMutation()
  const queryClient = useQueryClient()

  // Assigned assets error resolution state
  const [assignedAssets, setAssignedAssets] = React.useState<Asset[] | null>(null)
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([])
  const [isUnassigning, setIsUnassigning] = React.useState(false)

  // Reset local state when dialog is closed or userIds change
  React.useEffect(() => {
    if (!open) {
      setAssignedAssets(null)
      setSelectedAssetIds([])
      setIsUnassigning(false)
    }
  }, [open, userIds])

  const onDelete = () => {
    if (userIds.length === 0) return
    
    deleteEmployees({
      userIds,
      companyExitDate: format(companyExitDate, "yyyy-MM-dd"),
    }, {
      onSuccess: () => {
        onOpenChange(false)
      },
      onError: (error: unknown) => {
        const err = error as { data?: { assets?: Asset[] } };
        if (err && typeof err === 'object' && err.data && typeof err.data === 'object' && Array.isArray(err.data.assets)) {
          setAssignedAssets(err.data.assets)
          setSelectedAssetIds(err.data.assets.map((a) => a._id || a.id || ""))
        }
      }
    })
  }

  const handleUnassignAndRetry = async () => {
    if (selectedAssetIds.length === 0) {
      toast.error("Please select at least one asset to unassign or return assets manually.")
      return
    }

    setIsUnassigning(true)
    try {
      // Unassign each checked asset using the specific unassign API
      await Promise.all(
        selectedAssetIds.map((id) => assetService.unassign(id))
      )

      toast.success("Assets unassigned successfully.")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets.all })
      
      // Clear assets state and retry deleting
      setAssignedAssets(null)
      setSelectedAssetIds([])
      onDelete()
    } catch (_error: unknown) {
      toast.error("Failed to unassign some assets. Please try again.")
    } finally {
      setIsUnassigning(false)
    }
  }

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    )
  }

  const toggleAllAssets = (checked: boolean) => {
    if (!assignedAssets) return
    if (checked) {
      setSelectedAssetIds(assignedAssets.map((a) => a._id || a.id || ""))
    } else {
      setSelectedAssetIds([])
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("transition-all duration-300", assignedAssets ? "sm:max-w-[500px]" : "sm:max-w-[425px]")}>
        {assignedAssets ? (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <AlertDialogTitle className="text-xl font-bold">
                  Assigned Assets Detected
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-slate-600">
                Cannot delete employee(s) because they still have company assets assigned to them. Select the assets to automatically unassign and return them, then retry the deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Assets List ({assignedAssets.length})
                </span>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all-assets" 
                    checked={selectedAssetIds.length === assignedAssets.length} 
                    onCheckedChange={(checked) => toggleAllAssets(!!checked)}
                  />
                  <Label htmlFor="select-all-assets" className="text-xs font-semibold text-slate-500 cursor-pointer">
                    Select All
                  </Label>
                </div>
              </div>

              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {assignedAssets.map((asset) => {
                  const assetId = asset._id || asset.id || ""
                  const isChecked = selectedAssetIds.includes(assetId)

                  return (
                    <div 
                      key={assetId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                        isChecked 
                          ? "bg-rose-50/50 border-rose-100" 
                          : "bg-white border-slate-100 hover:bg-slate-50/50"
                      )}
                      onClick={() => toggleAssetSelection(assetId)}
                    >
                      <Checkbox 
                        id={`asset-check-${assetId}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleAssetSelection(assetId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {asset.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-medium">
                          <span>Type: <strong className="text-slate-600">{asset.type}</strong></span>
                          <span>•</span>
                          <span>Serial: <strong className="font-mono text-slate-600">{asset.serialNumber}</strong></span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel 
                onClick={() => setAssignedAssets(null)} 
                disabled={isUnassigning} 
                className="rounded-xl border-slate-200 h-11 px-6"
              >
                Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleUnassignAndRetry()
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-6 shadow-sm transition-all"
                disabled={isUnassigning || selectedAssetIds.length === 0}
              >
                {isUnassigning ? "Unassigning..." : "Unassign & Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-slate-900">
                Confirm Termination
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                You are about to delete {userIds.length === 1 ? "this employee" : `${userIds.length} employees`}. 
                This action will mark them as inactive and remove them from the active workforce.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Company Exit Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11 rounded-xl border-slate-200",
                        !companyExitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {companyExitDate ? format(companyExitDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                    <Calendar
                      mode="single"
                      selected={companyExitDate}
                      onSelect={(date) => date && setCompanyExitDate(date)}
                      initialFocus
                      className="rounded-2xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isPending} className="rounded-xl border-slate-200 h-11 px-6">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  onDelete()
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-6 shadow-sm transition-all"
                disabled={isPending || !companyExitDate}
              >
                {isPending ? "Processing..." : userIds.length === 1 ? "Delete Employee" : "Delete Employees"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
