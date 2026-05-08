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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface DeleteEmployeeDialogProps {
  userIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteEmployeeDialog({ userIds, open, onOpenChange }: DeleteEmployeeDialogProps) {
  const [companyExitDate, setCompanyExitDate] = React.useState<Date>(new Date())
  const { mutate: deleteEmployees, isPending } = useDeleteMultipleEmployeesMutation()

  const onDelete = () => {
    if (userIds.length === 0) return
    
    deleteEmployees({
      userIds,
      companyExitDate: format(companyExitDate, "yyyy-MM-dd"),
    }, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
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
      </AlertDialogContent>
    </AlertDialog>
  )
}
