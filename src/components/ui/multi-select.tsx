"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selectedValues: string[]
  onToggle: (value: string) => void
  placeholder?: string
  className?: string
  unitLabel?: string
}

export function MultiSelect({
  options,
  selectedValues,
  onToggle,
  placeholder = "Select options...",
  className,
  unitLabel = "Selected",
}: MultiSelectProps) {
  const selectedLabel = React.useMemo(() => {
    if (selectedValues.length === 0) return placeholder
    if (selectedValues.includes("overall")) {
      return options.find(o => o.value === "overall")?.label || "Overall"
    }
    if (selectedValues.length === 1) {
      return options.find((o) => o.value === selectedValues[0])?.label
    }
    return `${selectedValues.length} ${unitLabel}`
  }, [selectedValues, options, placeholder, unitLabel])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between h-9 text-[11px] font-semibold rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all",
            className
          )}
        >
          <span className="truncate max-w-[120px]">
            {selectedLabel}
          </span>
          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 rounded-xl border-slate-100 shadow-xl" align="end">
        <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center space-x-2.5 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group",
                selectedValues.includes(option.value) && "bg-emerald-50/50 hover:bg-emerald-50"
              )}
              onClick={() => onToggle(option.value)}
            >
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
                className="pointer-events-none"
              />
              <span className={cn(
                "text-xs font-semibold transition-colors",
                selectedValues.includes(option.value) ? "text-emerald-700" : "text-slate-700"
              )}>
                {option.label}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
