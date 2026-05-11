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
  onAdd: (data: AssetFormValues) => void
}

export function AddAssetDialog({ open, onOpenChange, onAdd }: AddAssetDialogProps) {
  const onSubmit = (data: AssetFormValues) => {
    onAdd(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <AssetForm onSubmit={onSubmit} />
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

  const onSubmit = (data: AssetFormValues) => {
    onUpdate((asset._id || asset.id) as string, data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Asset Information</DialogTitle>
        </DialogHeader>
        <AssetForm
          initialValues={asset}
          initialReminder={initialReminder}
          onSubmit={onSubmit}
          isEdit={true}
        />
      </DialogContent>
    </Dialog>
  )
}
