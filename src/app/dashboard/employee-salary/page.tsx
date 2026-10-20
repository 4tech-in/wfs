"use client"

import * as React from "react"
import { useCompanyDropdownInfiniteQuery } from "@/hooks/queries/use-company"
import { useCreateSalaryMutation, useSalariesQuery, useDeleteSalaryMutation, useUpdateSalaryMutation } from "@/hooks/queries/use-salary"
import { SalaryType, SalaryPayload, SalaryListItem } from "@/types/salary"
import { EmployeeDropdownItem } from "@/types/employee"
import { CompanyListItem } from "@/types/company"
import { Building2, Banknote, User, Loader2, Save, Plus, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { EmployeeMultiSelect } from "@/components/employee/employee-multi-select"
import { cn } from "@/lib/utils"
import { PaginationState } from "@tanstack/react-table"
import { SalaryTable } from "./salary-table"
import { CalculateAllSalaryDialog } from "./calculate-all-salary-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function EmployeeSalaryPage() {
    const [open, setOpen] = React.useState(false)
    const [calculateAllOpen, setCalculateAllOpen] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState<{ id: string, name: string } | null>(null)
    const [companySearchTerm, setCompanySearchTerm] = React.useState("")
    const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([])
    const [, setSelectedEmployees] = React.useState<EmployeeDropdownItem[]>([])
    const [editingEmployee, setEditingEmployee] = React.useState<{ id: string, name: string, employeeId?: string } | null>(null)
    const [salaryType, setSalaryType] = React.useState<SalaryType>("monthly")
    const [rate, setRate] = React.useState<string>("")
    const [editingSalary, setEditingSalary] = React.useState<string | null>(null)
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const {
        data: companyData,
        fetchNextPage: fetchNextCompanies,
        hasNextPage: hasMoreCompanies,
        isFetchingNextPage: isFetchingMoreCompanies,
        isLoading: isCompaniesLoading,
    } = useCompanyDropdownInfiniteQuery({ search: companySearchTerm })

    const { data: salaryListData, isLoading: isSalaryLoading } = useSalariesQuery(
        pagination.pageIndex + 1,
        pagination.pageSize
    )

    const createSalaryMutation = useCreateSalaryMutation()
    const updateSalaryMutation = useUpdateSalaryMutation()
    const deleteSalaryMutation = useDeleteSalaryMutation()

    const allCompanies = companyData?.pages.flatMap(page => page.data) || []

    const handleDelete = (userId: string) => {
        if (window.confirm("Are you sure you want to delete this salary configuration?")) {
            deleteSalaryMutation.mutate(userId)
        }
    }

    const handleEdit = (item: SalaryListItem) => {
        const emp = item.user || item.userId
        if (!emp) return

        setEditingSalary(emp._id)
        setEditingEmployee({
            id: emp._id,
            name: emp.otherName || emp.name,
            employeeId: emp.employeeId,
        })
        setSelectedEmployeeIds([emp._id])
        
        let type: SalaryType = "monthly"
        let rateValue = ""
        
        if (item.hourly) {
            type = "hourly"
            rateValue = item.hourlyRate?.toString() || ""
        } else if (item.daily) {
            type = "daily"
            rateValue = item.dailyRate?.toString() || ""
        } else {
            type = "monthly"
            rateValue = item.monthlySalary?.toString() || ""
        }
        
        setSalaryType(type)
        setRate(rateValue)
        setOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (editingSalary) {
            if (!rate) return

            const payload: SalaryPayload = {
                userId: editingSalary,
                hourly: salaryType === "hourly",
                monthly: salaryType === "monthly",
                daily: salaryType === "daily",
                monthlySalary: salaryType === "monthly" ? Number(rate) : undefined,
                hourlyRate: salaryType === "hourly" ? Number(rate) : undefined,
                dailyRate: salaryType === "daily" ? Number(rate) : undefined,
            }

            updateSalaryMutation.mutate({ userId: editingSalary, data: payload }, {
                onSuccess: () => {
                    handleCloseDialog()
                }
            })
        } else {
            if (selectedEmployeeIds.length === 0 || !rate) return

            const payload: SalaryPayload = {
                userIds: selectedEmployeeIds,
                userId: selectedEmployeeIds[0],
                hourly: salaryType === "hourly",
                monthly: salaryType === "monthly",
                daily: salaryType === "daily",
                monthlySalary: salaryType === "monthly" ? Number(rate) : undefined,
                hourlyRate: salaryType === "hourly" ? Number(rate) : undefined,
                dailyRate: salaryType === "daily" ? Number(rate) : undefined,
            }

            createSalaryMutation.mutate(payload, {
                onSuccess: () => {
                    handleCloseDialog()
                }
            })
        }
    }

    const handleCloseDialog = () => {
        setRate("")
        setSelectedEmployeeIds([])
        setSelectedEmployees([])
        setSelectedCompany(null)
        setEditingSalary(null)
        setEditingEmployee(null)
        setSalaryType("monthly")
        setOpen(false)
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Employee Salary</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        View and manage employee compensation rates.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setCalculateAllOpen(true)}
                        className="h-11 px-5 rounded-xl border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 font-bold shadow-sm transition-all active:scale-95 gap-2"
                    >
                        <Calculator className="h-4 w-4 text-indigo-600" />
                        Calculate All Salaries
                    </Button>

                    <Dialog 
                        open={open} 
                        onOpenChange={(isOpen) => {
                            if (!isOpen) handleCloseDialog()
                            else setOpen(isOpen)
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button 
                                onClick={() => {
                                    handleCloseDialog()
                                    setOpen(true)
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Set Employee Salary
                            </Button>
                        </DialogTrigger>
                    <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 gap-0 rounded-[28px]">
                        <DialogHeader className="bg-slate-50/80 p-8 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
                            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-indigo-500" />
                                {editingSalary ? "Update Compensation" : "Compensation Setup"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                {editingSalary 
                                    ? `Modify existing rates for ${editingEmployee?.name || "employee"}.` 
                                    : "Configure Monthly, Hourly, or Daily rates for one or multiple employees."}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Company Selection */}
                            {!editingSalary && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        Select Company
                                    </Label>
                                    <InfiniteScrollSelect
                                        value={selectedCompany?.id}
                                        onValueChange={(val, item: CompanyListItem) => {
                                            setSelectedCompany({ id: val, name: item.name });
                                            setSelectedEmployeeIds([]);
                                            setSelectedEmployees([]);
                                        }}
                                        items={allCompanies}
                                        loadMore={fetchNextCompanies}
                                        hasNextPage={!!hasMoreCompanies}
                                        isFetchingNextPage={isFetchingMoreCompanies}
                                        isLoading={isCompaniesLoading}
                                        getLabel={(item: CompanyListItem) => `${item.name}`}
                                        getValue={(item: CompanyListItem) => item._id}
                                        placeholder="Filter by company..."
                                        onSearchChange={setCompanySearchTerm}
                                        className="h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                            )}

                            {/* Employee Selection */}
                            <div className="space-y-3">
                                {editingSalary ? (
                                    <>
                                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            Employee
                                        </Label>
                                        <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium">
                                            <User className="h-4 w-4 text-indigo-500 shrink-0" />
                                            <span className="font-semibold text-slate-800">{editingEmployee?.name}</span>
                                            {editingEmployee?.employeeId && (
                                                <span className="font-mono text-xs bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                                                    {editingEmployee.employeeId}
                                                </span>
                                            )}
                                            <span className="ml-auto text-[11px] text-indigo-600 font-semibold uppercase tracking-wider">
                                                Editing
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase italic mt-1">
                                            Employee cannot be changed during update.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                Select Employee(s)
                                            </Label>
                                            {selectedEmployeeIds.length > 0 && (
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                                    {selectedEmployeeIds.length} selected
                                                </span>
                                            )}
                                        </div>
                                        <EmployeeMultiSelect
                                            key={selectedCompany?.id || "no-company"}
                                            companyId={selectedCompany?.id}
                                            values={selectedEmployeeIds}
                                            onValuesChange={(vals, emps) => {
                                                setSelectedEmployeeIds(vals)
                                                setSelectedEmployees(emps)
                                            }}
                                            colorTheme="indigo"
                                            placeholder={selectedCompany ? "Search and select employee(s)..." : "Please select a company first..."}
                                            disabled={!selectedCompany}
                                            className="h-12 rounded-xl border-slate-200"
                                        />
                                        {!selectedCompany && (
                                            <p className="text-[10px] text-amber-500 font-bold uppercase italic mt-1">
                                                Please select a company first.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Salary Type Selection */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Salary Type</Label>
                                <div className="flex p-1 bg-slate-100 rounded-2xl w-full gap-1">
                                    {[
                                        { id: "monthly", label: "Monthly" },
                                        { id: "hourly", label: "Hourly" },
                                        { id: "daily", label: "Daily" },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => {
                                                setSalaryType(type.id as SalaryType)
                                                setRate("")
                                            }}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200",
                                                salaryType === type.id
                                                    ? "bg-white text-indigo-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rate Input */}
                            <div className="space-y-3">
                                <Label htmlFor="rate" className="text-sm font-bold text-slate-700">
                                    {salaryType.charAt(0).toUpperCase() + salaryType.slice(1)} Rate
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-indigo-500 transition-colors">
                                        ₹
                                    </div>
                                    <Input
                                        id="rate"
                                        type="number"
                                        min={0}
                                        placeholder={`Enter ${salaryType} rate...`}
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        className="pl-10 h-14 rounded-2xl border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    (editingSalary ? !rate : selectedEmployeeIds.length === 0 || !rate) ||
                                    createSalaryMutation.isPending || 
                                    updateSalaryMutation.isPending
                                }
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-md shadow-lg shadow-indigo-600/20 transition-all active:scale-95 gap-2"
                            >
                                {createSalaryMutation.isPending || updateSalaryMutation.isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {createSalaryMutation.isPending || updateSalaryMutation.isPending 
                                    ? "Saving..." 
                                    : (editingSalary 
                                        ? "Update Compensation" 
                                        : selectedEmployeeIds.length > 1
                                            ? `Save Compensation (${selectedEmployeeIds.length} Employees)`
                                            : "Save Compensation")}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* Salary List Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-indigo-500" />
                        Salary Configurations
                    </h2>
                </div>

                <SalaryTable
                    data={salaryListData?.data || []}
                    isLoading={isSalaryLoading}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    totalItems={salaryListData?.pagination?.total}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                />
            </div>

            <CalculateAllSalaryDialog
                open={calculateAllOpen}
                onOpenChange={setCalculateAllOpen}
            />
        </div>
    )
}