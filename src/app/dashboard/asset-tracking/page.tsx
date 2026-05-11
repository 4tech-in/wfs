"use client"

import * as React from "react"
import { Filter, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Asset, AssetType, CreateAssetDto, UpdateAssetDto } from "@/types/asset"
import { AssetTable, getAssetColumns } from "@/components/asset-tracking/asset-table"
import { DataTableExport } from "@/components/ui/data-table-export"
import { AddAssetDialog, EditAssetDialog } from "@/components/asset-tracking/asset-dialogs"
import { AssetFormValues } from "@/components/asset-tracking/asset-form"
import { assetService } from "@/services/asset-service"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useAssetsQuery, useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation } from "@/hooks/queries/use-assets-query"
import { useRemindersQuery, useCreateReminderMutation, useDeleteReminderMutation } from "@/hooks/queries/use-reminders"
import { useDebounce } from "@/hooks/use-debounce"

// Remove unused TODAY constant

export default function AssetTrackingPage() {
    const router = useRouter()
    const [typeFilter, setTypeFilter] = React.useState<AssetType | "All">("All")
    const [searchTerm, setSearchTerm] = React.useState("")
    const debouncedSearch = useDebounce(searchTerm, 500)

    const { data: response, isLoading } = useAssetsQuery({
        search: debouncedSearch,
        type: typeFilter === "All" ? undefined : typeFilter
    })
    const assets = response?.data || []

    const createMutation = useCreateAssetMutation()
    const updateMutation = useUpdateAssetMutation()
    const deleteMutation = useDeleteAssetMutation()
    
    const { data: remindersResponse } = useRemindersQuery({ limit: 10000000 })
    const reminders = remindersResponse?.data || []
    const createReminderMutation = useCreateReminderMutation()
    const deleteReminderMutation = useDeleteReminderMutation()

    const [isIssueOpen, setIsIssueOpen] = React.useState(false)
    const [editingAsset, setEditingAsset] = React.useState<Asset | null>(null)

    const handleAdd = async (data: AssetFormValues) => {
        try {
            const { setReminder, reminderFrequency, reminderTime, reminderStartDate, reminderInterval, recipientEmails, ...assetData } = data
            
            // Convert empty strings to null for optional fields
            const payload = Object.fromEntries(
                Object.entries(assetData).map(([key, value]) => [key, value === "" ? null : value])
            ) as unknown as CreateAssetDto

            const createdAsset = await createMutation.mutateAsync(payload)
            
            if (setReminder && createdAsset) {
                const recipients = recipientEmails?.split(",").map(e => e.trim()).filter(Boolean)
                await createReminderMutation.mutateAsync({
                    title: `Maintenance: ${createdAsset.name}`,
                    description: `Automated maintenance reminder for ${createdAsset.name} (${createdAsset.serialNumber})`,
                    enabled: true,
                    frequency: reminderFrequency,
                    interval: reminderFrequency === "custom" ? (reminderInterval ? parseInt(reminderInterval) : 30) : undefined,
                    startDate: reminderStartDate || new Date().toISOString(),
                    time: reminderTime,
                    recipientEmails: recipients,
                    metadata: { assetId: createdAsset._id || createdAsset.id }
                })
            }
            
            setIsIssueOpen(false)
        } catch {
            // Error is handled by service toast
        }
    }

    const handleUpdate = async (id: string, data: AssetFormValues) => {
        try {
            const { setReminder, reminderFrequency, reminderTime, reminderStartDate, reminderInterval, recipientEmails, ...assetData } = data

            // Convert empty strings to null for optional fields
            const payload = Object.fromEntries(
                Object.entries(assetData).map(([key, value]) => [key, value === "" ? null : value])
            ) as unknown as UpdateAssetDto

            const updatedAsset = await updateMutation.mutateAsync({ id, data: payload })
            
            // Find existing reminder for this asset
            const existingReminder = reminders.find(r => r.metadata?.assetId === id)
            
            if (setReminder) {
                const interval = reminderFrequency === "custom" ? (reminderInterval ? parseInt(reminderInterval) : 30) : undefined;
                const recipients = recipientEmails?.split(",").map(e => e.trim()).filter(Boolean)
                
                // If frequency/time/date/interval/recipients changed or no existing reminder, we update/create
                if (!existingReminder) {
                    await createReminderMutation.mutateAsync({
                        title: `Maintenance: ${updatedAsset.name}`,
                        description: `Automated maintenance reminder for ${updatedAsset.name} (${updatedAsset.serialNumber})`,
                        enabled: true,
                        frequency: reminderFrequency,
                        interval,
                        startDate: reminderStartDate || new Date().toISOString(),
                        time: reminderTime,
                        recipientEmails: recipients,
                        metadata: { assetId: updatedAsset._id || updatedAsset.id }
                    })
                } else if (
                    existingReminder.frequency !== reminderFrequency || 
                    existingReminder.time !== reminderTime || 
                    existingReminder.interval !== interval ||
                    JSON.stringify(existingReminder.recipientEmails || []) !== JSON.stringify(recipients || []) ||
                    (reminderStartDate && existingReminder.startDate.split('T')[0] !== reminderStartDate)
                ) {
                    // Delete and recreate (simplest way to update recurring schedule in this system)
                    await deleteReminderMutation.mutateAsync(existingReminder._id)
                    await createReminderMutation.mutateAsync({
                        title: `Maintenance: ${updatedAsset.name}`,
                        description: `Automated maintenance reminder for ${updatedAsset.name} (${updatedAsset.serialNumber})`,
                        enabled: true,
                        frequency: reminderFrequency,
                        interval,
                        startDate: reminderStartDate || new Date().toISOString(),
                        time: reminderTime,
                        recipientEmails: recipients,
                        metadata: { assetId: updatedAsset._id || updatedAsset.id }
                    })
                }
            } else if (existingReminder) {
                // Delete existing reminder if user unchecked it
                await deleteReminderMutation.mutateAsync(existingReminder._id)
            }

            setEditingAsset(null)
        } catch {
            // Error is handled by service toast
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this asset record?")) {
            try {
                await deleteMutation.mutateAsync(id)
                // Clean up associated reminder
                const existingReminder = reminders.find(r => r.metadata?.assetId === id)
                if (existingReminder) {
                    await deleteReminderMutation.mutateAsync(existingReminder._id)
                }
            } catch {
                // Error is handled by service toast
            }
        }
    }

    const handleFetchAll = async () => {
        const result = await assetService.getAll({
            search: debouncedSearch,
            type: typeFilter === "All" ? undefined : typeFilter,
            limit: 1000 // Fetch all matching data for export
        });

        // Format data for export (flattening and date formatting)
        const formattedData = result.data.map(asset => ({
            ...asset,
            issuedTo: typeof asset.issuedTo === 'object' && asset.issuedTo !== null 
                ? asset.issuedTo.name 
                : asset.issuedTo,
            issuedDate: asset.issuedDate ? new Date(asset.issuedDate).toLocaleDateString() : "-",
            maintenanceDueDate: asset.maintenanceDueDate ? new Date(asset.maintenanceDueDate).toLocaleDateString() : "-"
        }));

        return { data: formattedData as Asset[] };
    };

    const maintenanceAlertsCount = assets.filter(a => {
        if (!a.maintenanceDueDate) return false
        const dueDate = new Date(a.maintenanceDueDate)
        const today = new Date()
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 10 && diffDays >= 0
    }).length

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 border-b-4 border-indigo-500 w-fit pb-1">
                        Asset Inventory & Tracking
                    </h2>
                    <p className="text-sm text-slate-500">
                        Manage company assets, equipment inventory, and monitor maintenance schedules.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DataTableExport
                        columns={getAssetColumns(() => {}, () => {}, () => {})}
                        filename="assets_inventory_report"
                        fetchData={handleFetchAll}
                    />
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-white shadow-lg shadow-indigo-500/20"
                        onClick={() => setIsIssueOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Add New Asset
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
                    <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Available In Stock</span>
                    <span className="text-2xl font-bold text-slate-900">{assets.filter(a => a.status === "In Stock" || !a.issuedTo).length}</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Currently Issued</span>
                    <span className="text-2xl font-bold text-slate-900">{assets.filter(a => a.status === "Issued").length}</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md border-l-4 border-l-orange-500">
                    <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Maint. Alerts (10d)</span>
                    <span className="text-2xl font-bold text-slate-900">{maintenanceAlertsCount}</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assets</span>
                    <span className="text-2xl font-bold text-slate-900">{assets.length}</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-1">
                    <div className="w-full max-w-[240px]">
                        <Select onValueChange={(v) => setTypeFilter(v as AssetType | "All")} defaultValue="All">
                            <SelectTrigger className="bg-slate-50 border-slate-200">
                                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Filter by Asset Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Asset Types</SelectItem>
                                <SelectItem value="Laptop">Laptops</SelectItem>
                                <SelectItem value="Vehicle">Vehicles</SelectItem>
                                <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                                <SelectItem value="Mobile Device">Mobile Devices</SelectItem>
                                <SelectItem value="Safety Gear">Safety Gear</SelectItem>
                                <SelectItem value="Specialized Tool">Specialized Tools</SelectItem>
                                <SelectItem value="Uniform">Uniforms</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm text-slate-400">
                        Showing {assets.length} assets
                    </span>
                </div>
            </div>


            <AssetTable
                data={assets}
                isLoading={isLoading}
                onEdit={setEditingAsset}
                onDelete={handleDelete}
                onViewHistory={(id) => router.push(`/dashboard/asset-tracking/history/${id}`)}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />


            <AddAssetDialog
                open={isIssueOpen}
                onOpenChange={setIsIssueOpen}
                onAdd={handleAdd}
            />

            <EditAssetDialog
                asset={editingAsset}
                open={!!editingAsset}
                onOpenChange={(open) => !open && setEditingAsset(null)}
                onUpdate={handleUpdate}
                initialReminder={reminders.find(r => r.metadata?.assetId === (editingAsset?._id || editingAsset?.id)) ? {
                    frequency: reminders.find(r => r.metadata?.assetId === (editingAsset?._id || editingAsset?.id))?.frequency || "monthly",
                    time: reminders.find(r => r.metadata?.assetId === (editingAsset?._id || editingAsset?.id))?.time || "09:00",
                    startDate: reminders.find(r => r.metadata?.assetId === (editingAsset?._id || editingAsset?.id))?.startDate,
                    interval: reminders.find(r => r.metadata?.assetId === (editingAsset?._id || editingAsset?.id))?.interval,
                    recipientEmails: reminders.find(r => r.metadata?.assetId === (editingAsset?._id || editingAsset?.id))?.recipientEmails,
                    enabled: true
                } : undefined}
            />
        </div>
    )
}