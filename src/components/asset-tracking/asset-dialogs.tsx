"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AssetForm, AssetFormValues } from "./asset-form"
import { Asset } from "@/types/asset"
import { ReminderFrequency } from "@/types/reminder"

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: AssetFormValues | AssetFormValues[]) => void
}

export function AddAssetDialog({ open, onOpenChange, onAdd }: AddAssetDialogProps) {
  const onSubmit = (data: AssetFormValues | AssetFormValues[]) => {
    onAdd(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto custom-scrollbar p-6 rounded-[24px] shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900">Add New Asset</DialogTitle>
        </DialogHeader>
        {open && <AssetForm onSubmit={onSubmit} />}
      </DialogContent>
    </Dialog>
  )
}

interface EditAssetDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, data: AssetFormValues) => void
  initialReminder?: { frequency: ReminderFrequency; time: string; enabled: boolean; startDate?: string; interval?: number; recipientEmails?: string[] }
}

export function EditAssetDialog({ asset, open, onOpenChange, onUpdate, initialReminder }: EditAssetDialogProps) {
  if (!asset) return null

  const onSubmit = (data: AssetFormValues | AssetFormValues[]) => {
    const singleData = Array.isArray(data) ? data[0] : data
    onUpdate((asset._id || asset.id) as string, singleData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto custom-scrollbar p-6 rounded-[24px] shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900">Update Asset Information</DialogTitle>
        </DialogHeader>
        {open && (
          <AssetForm
            initialValues={asset}
            initialReminder={initialReminder}
            onSubmit={onSubmit}
            isEdit={true}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
