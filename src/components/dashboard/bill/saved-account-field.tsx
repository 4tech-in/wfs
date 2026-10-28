"use client"

import * as React from "react"
import { Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SavedAccountFieldProps {
  value: string
  options: string[]
  placeholder: string
  inputClassName?: string
  disabled?: boolean
  onChange: (value: string) => void
  onSave: (value: string) => void
}

export function SavedAccountField({
  value,
  options,
  placeholder,
  inputClassName,
  disabled = false,
  onChange,
  onSave,
}: SavedAccountFieldProps) {
  const [isAdding, setIsAdding] = React.useState(() => Boolean(value) && !options.includes(value))
  const showInput = isAdding && !options.includes(value)

  return (
    <div className="space-y-2">
      <select
        disabled={disabled}
        value={showInput ? "__add__" : value}
        onChange={(event) => {
          if (event.target.value === "__add__") {
            onChange("")
            setIsAdding(true)
            return
          }
          onChange(event.target.value)
          setIsAdding(false)
        }}
        className={cn(inputClassName, "w-full bg-white px-3")}
      >
        <option value="">Select saved value</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        <option value="__add__">＋ Add new...</option>
      </select>

      {showInput && (
        <div className="flex gap-2">
          <Input
            autoFocus
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={inputClassName}
          />
          <Button
            type="button"
            disabled={disabled}
            variant="outline"
            size="icon"
            title="Save value"
            onClick={() => {
              if (!value.trim()) return
              onSave(value)
              setIsAdding(false)
            }}
          >
            {value.trim() ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
