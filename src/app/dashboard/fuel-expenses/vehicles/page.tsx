"use client"

import * as React from "react"
import { ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleTable } from "@/components/fuel/vehicle-table"
import { VehicleDialog } from "@/components/fuel/vehicle-dialogs"
import { useDebounce } from "@/hooks/use-debounce"
import { PaginationState } from "@tanstack/react-table"
import { useVehiclesQuery, useDeleteVehicleMutation } from "@/hooks/queries/use-vehicles"
import Link from "next/link"
import { Vehicle } from "@/types/vehicle"

export default function VehicleMasterPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"add" | "edit">("add")
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null)
  
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)

  const { data, isLoading } = useVehiclesQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: "createdAt",
    sortOrder: "desc"
  })

  const deleteMutation = useDeleteVehicleMutation()

  const vehicles = data?.data || []
  const total = data?.pagination?.total || 0

  const handleAdd = () => {
    setDialogMode("add")
    setSelectedVehicle(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setDialogMode("edit")
    setSelectedVehicle(vehicle)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch {
        // Error handled by service toast
      }
    }
  }

  return (
    <div className="flex flex-col gap-8 p-2 md:p-8 bg-slate-50/30 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/fuel-expenses">
          <Button variant="ghost" className="w-fit text-slate-500 hover:text-[#2eb88a] pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Fuel Management
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight italic font-heading text-[#2eb88a]">
              Vehicle Master
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-sm">
              Manage and track your entire fleet details in one place.
            </p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-[#2eb88a] hover:bg-[#26a67a] text-white shadow-lg shadow-emerald-200/50 rounded-xl px-8"
          >
            <Plus className="mr-2 h-5 w-5" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden px-5">
        <VehicleTable
          data={vehicles}
          isLoading={isLoading}
          totalItems={total}
          pagination={pagination}
          onPaginationChange={setPagination}
          searchValue={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <VehicleDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        initialValues={selectedVehicle || undefined}
        vehicleId={selectedVehicle?._id}
      />
    </div>
  )
}
