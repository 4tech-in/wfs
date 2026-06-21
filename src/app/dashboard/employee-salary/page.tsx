"use client"

import * as React from "react"
import { useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useCompanyDropdownInfiniteQuery } from "@/hooks/queries/use-company"
import { useCreateSalaryMutation, useSalariesQuery, useDeleteSalaryMutation, useUpdateSalaryMutation } from "@/hooks/queries/use-salary"
import { SalaryType, SalaryPayload, SalaryListItem } from "@/types/salary"
import { EmployeeDropdownItem } from "@/types/employee"
import { CompanyListItem } from "@/types/company"
import { Building2, Banknote, User, Loader2, Save, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { cn } from "@/lib/utils"
import { PaginationState } from "@tanstack/react-table"
import { SalaryTable } from "./salary-table"
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
    const [selectedCompany, setSelectedCompany] = React.useState<{ id: string, name: string } | null>(null)
    const [companySearchTerm, setCompanySearchTerm] = React.useState("")
    const [selectedEmployee, setSelectedEmployee] = React.useState<{ id: string, name: string } | null>(null)
    const [salaryType, setSalaryType] = React.useState<SalaryType>("monthly")
    const [rate, setRate] = React.useState<string>("")
    const [searchTerm, setSearchTerm] = React.useState("")
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

    const {
        data: employeeData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isEmployeesLoading,
    } = useEmployeesDropdownInfiniteQuery({ 
        search: searchTerm,
        companyId: selectedCompany?.id 
    })

    const { data: salaryListData, isLoading: isSalaryLoading } = useSalariesQuery(
        pagination.pageIndex + 1,
        pagination.pageSize
    )

    const createSalaryMutation = useCreateSalaryMutation()
    const updateSalaryMutation = useUpdateSalaryMutation()
    const deleteSalaryMutation = useDeleteSalaryMutation()

    const allEmployees = employeeData?.pages.flatMap(page => page.data) || []
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
        setSelectedEmployee({ id: emp._id, name: emp.otherName || emp.name })
        
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
        if (!selectedEmployee || !rate) return

        const payload: SalaryPayload = {
            userId: selectedEmployee.id,
            hourly: salaryType === "hourly",
            monthly: salaryType === "monthly",
            daily: salaryType === "daily",
            monthlySalary: salaryType === "monthly" ? Number(rate) : undefined,
            hourlyRate: salaryType === "hourly" ? Number(rate) : undefined,
            dailyRate: salaryType === "daily" ? Number(rate) : undefined,
        }

        if (editingSalary) {
            updateSalaryMutation.mutate({ userId: editingSalary, data: payload }, {
                onSuccess: () => {
                    handleCloseDialog()
                }
            })
        } else {
            createSalaryMutation.mutate(payload, {
                onSuccess: () => {
                    handleCloseDialog()
                }
            })
        }
    }

    const handleCloseDialog = () => {
        setRate("")
        setSelectedEmployee(null)
        setSelectedCompany(null)
        setEditingSalary(null)
        setSalaryType("monthly")
        setOpen(false)
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Employee Salary</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        View and manage employee compensation rates.
                    </p>
                </div>

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
                    <DialogContent className="sm:max-w-[500px] border-none shadow-2xl p-0 gap-0 rounded-[28px] overflow-hidden">
                        <DialogHeader className="bg-slate-50/80 p-8 border-b border-slate-100">
                            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-indigo-500" />
                                {editingSalary ? "Update Compensation" : "Compensation Setup"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                {editingSalary 
                                    ? `Modify existing rates for ${selectedEmployee?.name}.` 
                                    : "Configure Monthly, Hourly, or Daily rates for an employee."}
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
                                            setSelectedEmployee(null); // Reset employee when company changes
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
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    Select Employee
                                </Label>
                                <InfiniteScrollSelect
                                    key={selectedCompany?.id} // Force re-render when company changes
                                    value={selectedEmployee?.id}
                                    onValueChange={(val, item: EmployeeDropdownItem) => setSelectedEmployee({ id: val, name: item.otherName || item.name })}
                                    items={allEmployees}
                                    loadMore={fetchNextPage}
                                    hasNextPage={!!hasNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
                                    isLoading={isEmployeesLoading}
                                    getLabel={(item: EmployeeDropdownItem) => `[${item.employeeId}] ${item.otherName || item.name}`}
                                    getValue={(item: EmployeeDropdownItem) => item._id}
                                    placeholder={selectedCompany ? "Search in company..." : "Search by name or ID..."}
                                    onSearchChange={setSearchTerm}
                                    className="h-12 rounded-xl border-slate-200"
                                    disabled={!!editingSalary || (!selectedCompany && !editingSalary)}
                                />
                                {!selectedCompany && !editingSalary && (
                                    <p className="text-[10px] text-amber-500 font-bold uppercase italic mt-1">
                                        Please select a company first.
                                    </p>
                                )}
                                {editingSalary && (
                                    <p className="text-[10px] text-indigo-500 font-bold uppercase italic mt-1">
                                        Employee cannot be changed during update.
                                    </p>
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
                                disabled={!selectedEmployee || !rate || createSalaryMutation.isPending || updateSalaryMutation.isPending}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-md shadow-lg shadow-indigo-600/20 transition-all active:scale-95 gap-2"
                            >
                                {createSalaryMutation.isPending || updateSalaryMutation.isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {createSalaryMutation.isPending || updateSalaryMutation.isPending 
                                    ? "Saving..." 
                                    : (editingSalary ? "Update Compensation" : "Save Compensation")}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
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
        </div>
    )
}