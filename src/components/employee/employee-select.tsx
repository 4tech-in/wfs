"use client"

import * as React from "react"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { useEmployeesDropdownInfiniteQuery } from "@/hooks/queries/use-employees-query"
import { useDebounce } from "@/hooks/use-debounce"
import { EmployeeDropdownItem } from "@/types/employee"

interface EmployeeSelectProps {
  value?: string
  onValueChange: (value: string, employee: EmployeeDropdownItem) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function EmployeeSelect({
  value,
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
    { search: debouncedSearch, limit: 10 },
    hasBeenOpened || !!value
  )

  const allEmployees = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? []
  }, [data])

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
