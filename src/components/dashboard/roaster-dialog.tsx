"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RoasterForm } from "./roaster-form"
import { useAssignAttendancePolicyMutation, useAssign24HourPolicyMutation } from "@/hooks/queries/use-roster"
import { AssignRosterDto, AttendancePolicyUser } from "@/types/roster"

interface RoasterDialogProps {
  trigger?: React.ReactNode
  initialValues?: {
    employeeIds: string[]
    shiftId: string
    startDate: string
    endDate: string
    companyId?: string
    is24HourShift?: boolean
  }
  title?: string
  description?: string
  initialEmployees?: AttendancePolicyUser[]
}

export function RoasterDialog({ trigger, initialValues, title, description, initialEmployees }: RoasterDialogProps) {
  const [open, setOpen] = React.useState(false)
  const assignMutation = useAssignAttendancePolicyMutation()
  const assign24HourMutation = useAssign24HourPolicyMutation()

  const onSubmit = async (data: AssignRosterDto & { is24HourShift: boolean }) => {
    try {
      await assignMutation.mutateAsync({
        userIds: data.employeeIds,
        attendancePolicyId: data.shiftId,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      await assign24HourMutation.mutateAsync({
        userIds: data.employeeIds,
        is24HourShift: !!data.is24HourShift,
      })
      setOpen(false)
    } catch {
      // Error handled by mutation toast or service
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#2eb88a] hover:bg-[#259b74] text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm transition-all active:scale-95 border-none">
            <Plus className="h-4 w-4" />
            Assign Roster
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 italic font-heading">
            {title || "Assign Roster"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            {description || "Select employees, a shift, and a date range to assign a roster."}
          </DialogDescription>
        </DialogHeader>
        <RoasterForm 
          onSubmit={onSubmit} 
          isLoading={assignMutation.isPending || assign24HourMutation.isPending} 
          initialValues={initialValues}
          initialEmployees={initialEmployees}
        />
      </DialogContent>
    </Dialog>
  )
}
