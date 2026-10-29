"use client"

import * as React from "react"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { useEmployeeQuery, useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useDebounce } from "@/hooks/use-debounce"
import { EmployeeDropdownItem } from "@/types/employee"

interface EmployeeSelectProps {
  value?: string
  departmentId?: string
  onValueChange: (value: string, employee: EmployeeDropdownItem) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function EmployeeSelect({
  value,
  departmentId,
  onValueChange,
  placeholder = "Search employee...",
  className,
  disabled,
}: EmployeeSelectProps) {
  const [search, setSearch] = React.useState("")
  const [hasBeenOpened, setHasBeenOpened] = React.useState(false)
  const debouncedSearch = useDebounce(search, 500)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useEmployeesDropdownInfiniteQuery(
    { search: debouncedSearch, departmentId: departmentId || undefined, limit: 10 },
    hasBeenOpened || !!value
  )

  const { data: selectedEmployeeData } = useEmployeeQuery(value || null)

  const selectedEmployee = React.useMemo<EmployeeDropdownItem | null>(() => {
    if (!value || !selectedEmployeeData) return null

    const selectedId = selectedEmployeeData._id || selectedEmployeeData.id
    if (!selectedId) return null

    return {
      _id: selectedId,
      name: selectedEmployeeData.name,
      otherName: selectedEmployeeData.otherName,
      uniqueId: selectedEmployeeData.uniqueId,
      employeeId:
        selectedEmployeeData.employeeObjId?.employeeId ||
        selectedEmployeeData.employeeId ||
        String(selectedEmployeeData.uniqueId || ""),
    }
  }, [selectedEmployeeData, value])

  const allEmployees = React.useMemo(() => {
    const employees = data?.pages.flatMap((page) => page.data) ?? []
    if (!selectedEmployee || employees.some((employee) => employee._id === selectedEmployee._id)) {
      return employees
    }
    return [selectedEmployee, ...employees]
  }, [data, selectedEmployee])

  return (
    <InfiniteScrollSelect<EmployeeDropdownItem>
      value={value}
      onValueChange={onValueChange}
      items={allEmployees}
      loadMore={fetchNextPage}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      placeholder={placeholder}
      searchPlaceholder="Type employee name..."
      onSearchChange={setSearch}
      onOpenChange={(open) => open && setHasBeenOpened(true)}
      getLabel={(emp) =>
        `${emp.name}${emp.otherName ? ` (${emp.otherName})` : ""} · ${emp.employeeId}`
      }
      getValue={(emp) => emp._id}
      className={className}
      disabled={disabled}
    />
  )
}
