"use client"

import * as React from "react"
import { Fuel, Plus, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FuelTable } from "@/components/fuel/fuel-table"
import { AddFuelDialog, AddCardBalanceDialog, RechargeHistoryDialog } from "@/components/fuel/fuel-dialogs"
import { useDebounce } from "@/hooks/use-debounce"
import { PaginationState } from "@tanstack/react-table"
import { FuelFormValues } from "@/components/fuel/fuel-dialogs"
import { useFuelCardStatsQuery, useFuelExpensesQuery, useDeleteFuelMutation } from "@/hooks/queries/use-fuel"
import { useVehiclesInfiniteQuery } from "@/hooks/queries/use-vehicles"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { Vehicle } from "@/types/vehicle"
import { FuelRecord } from "@/types/fuel"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
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

export default function FuelExpensePage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isBalanceOpen, setIsBalanceOpen] = React.useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [editingRecharge, setEditingRecharge] = React.useState<{ _id: string; amount: number; note?: string } | null>(null)
  const [editingFuel, setEditingFuel] = React.useState<FuelRecord | null>(null)
  const [initialValues, setInitialValues] = React.useState<Partial<FuelFormValues> | undefined>()
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useDebounce(searchTerm, 400)
  const [selectedVehicleNo, setSelectedVehicleNo] = React.useState<string | undefined>()
  const [vehicleSearch, setVehicleSearch] = React.useState("")
  const debouncedVehicleSearch = useDebounce(vehicleSearch, 400)
  const [deletingFuelId, setDeletingFuelId] = React.useState<string | null>(null)

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

  const { data, isLoading } = useFuelExpensesQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: selectedVehicleNo || debouncedSearch || undefined,
    sortBy: "createdAt",
    sortOrder: "desc"
  })

  const { data: stats, isLoading: isStatsLoading } = useFuelCardStatsQuery()
  const deleteMutation = useDeleteFuelMutation()

  const expenses = data?.data || []
  const total = data?.pagination?.total || 0

  const handleOpenChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) setInitialValues(undefined)
  }

  return (
    <div className="flex flex-col gap-8 p-2 md:p-8 bg-slate-50/30 min-h-screen">
      {/* Header & Stats Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-1.5 flex-1">
          <h1 className="text-3xl font-bold tracking-tight italic font-heading text-[#2eb88a]">
            Fuel Management
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-sm">
            Manage fuel records and card balances for your entire fleet.
          </p>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <Link href="/dashboard/fuel-expenses/vehicles">
              <Button 
                variant="outline"
                className="border-[#2eb88a] text-[#2eb88a] hover:bg-emerald-50 rounded-xl px-6"
              >
                <Car className="mr-2 h-5 w-5" /> Vehicle Master
              </Button>
            </Link>
            <Button 
              onClick={() => setIsBalanceOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200/50 rounded-xl px-8"
            >
              <Wallet className="mr-2 h-5 w-5" /> Add Card Balance
            </Button>
            <Button 
              onClick={() => setIsAddOpen(true)}
              className="bg-[#2eb88a] hover:bg-[#26a67a] text-white shadow-lg shadow-emerald-200/50 rounded-xl px-8"
            >
              <Plus className="mr-2 h-5 w-5" /> Log Fuel Expense
            </Button>
          </div>
        </div>

        {/* Premium Card - Shifted to Right Top */}
        <div className="w-full lg:max-w-xl">
          <Card className="overflow-hidden border-none shadow-2xl rounded-[32px] bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 relative group min-h-[220px] flex flex-col justify-between">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-emerald-500/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Petro Card Live Balance</p>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight italic font-heading">
                    ₹ {isStatsLoading ? "..." : (stats?.remaining ?? 0).toLocaleString()}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsBalanceOpen(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-0 h-auto"
                    >
                      <Wallet className="mr-1.5 h-3 w-3" /> Recharge Card
                    </Button>
                    <span className="text-white/20 text-xs">|</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsHistoryOpen(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-0 h-auto"
                    >
                      History
                    </Button>
                  </div>
                </div>
                <div className="bg-white/10 p-5 rounded-[24px] backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Fuel className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mt-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-emerald-500/10">
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Added</p>
                  </div>
                  <p className="text-xl font-black text-white italic">₹ {isStatsLoading ? "..." : (stats?.totalAdded ?? 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-rose-500/10">
                      <ArrowDownRight className="h-3 w-3 text-rose-400" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Expended</p>
                  </div>
                  <p className="text-xl font-black text-rose-400 italic">₹ {isStatsLoading ? "..." : (stats?.totalExpended ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-8 z-10 opacity-20 pointer-events-none select-none">
              <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none">PetroCard</h3>
            </div>
          </Card>
        </div>
      </div>

      {/* Table */}
      <FuelTable
        data={expenses}
        isLoading={isLoading}
        totalItems={total}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchValue={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val)
          setPagination((p) => ({ ...p, pageIndex: 0 }))
        }}
        onEdit={(record) => {
          setEditingFuel(record)
        }}
        onDelete={(id) => {
          setDeletingFuelId(id)
        }}
        filterNode={
          <div className="flex items-center gap-2">
            <div className="w-[240px]">
              <InfiniteScrollSelect<Vehicle>
                value={selectedVehicleNo}
                onValueChange={(val, item) => {
                  setSelectedVehicleNo(item.vehicleNo)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
                items={vehicles}
                loadMore={fetchNextVehicles}
                hasNextPage={hasNextVehicles}
                isFetchingNextPage={isFetchingNextVehicles}
                isLoading={isVehiclesLoading}
                placeholder="Filter by vehicle..."
                searchPlaceholder="Search vehicle..."
                onSearchChange={setVehicleSearch}
                getLabel={(item) => `${item.vehicleNo} (${item.vehicleCode})`}
                getValue={(item) => item.vehicleNo}
                className="h-9"
              />
            </div>
            {selectedVehicleNo && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedVehicleNo(undefined)}
                className="text-slate-500 hover:text-rose-500 h-9"
              >
                Clear
              </Button>
            )}
          </div>
        }
      />

      <AddFuelDialog
        open={isAddOpen || !!editingFuel}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingFuel(null)
          } else {
            setIsAddOpen(true)
          }
        }}
        editId={editingFuel?._id}
        initialValues={editingFuel ? {
          fillingDate: editingFuel.fillingDate ? new Date(editingFuel.fillingDate).toISOString().substring(0, 10) : "",
          vehicleId: typeof editingFuel.vehicleId === 'object' && editingFuel.vehicleId !== null ? (editingFuel.vehicleId as any)._id : String(editingFuel.vehicleId || ""),
          odometer: String(editingFuel.odometer),
          fuelType: editingFuel.fuelType || "Diesel",
          ratePerLtr: String(editingFuel.ratePerLtr),
          totalAmount: String(editingFuel.totalAmount),
          average: editingFuel.average ? String(editingFuel.average) : "",
          totalFuel: editingFuel.totalFuel ? String(editingFuel.totalFuel) : "",
          images: [],
        } : undefined}
      />

      <AddCardBalanceDialog
        open={isBalanceOpen || !!editingRecharge}
        onOpenChange={(open) => {
          if (!open) {
            setIsBalanceOpen(false)
            setEditingRecharge(null)
          } else {
            setIsBalanceOpen(true)
          }
        }}
        editId={editingRecharge?._id}
        initialValues={editingRecharge ? { amount: editingRecharge.amount, note: editingRecharge.note } : undefined}
      />

      <RechargeHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        onEditClick={(recharge) => {
          setIsHistoryOpen(false)
          setEditingRecharge(recharge)
        }}
      />

      <AlertDialog open={!!deletingFuelId} onOpenChange={(open) => !open && setDeletingFuelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fuel record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFuelId) {
                  deleteMutation.mutate(deletingFuelId)
                  setDeletingFuelId(null)
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}