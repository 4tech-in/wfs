"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash, Bell, Clock, Calendar, CheckCircle } from "lucide-react"
import { Reminder } from "@/types/reminder"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useDeleteReminderMutation, useUpdateReminderMutation } from "@/hooks/queries/use-reminders"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface ReminderTableProps {
  data: Reminder[]
  isLoading: boolean
}

export function ReminderTable({ data, isLoading }: ReminderTableProps) {
  const deleteMutation = useDeleteReminderMutation()
  const updateMutation = useUpdateReminderMutation()

  const columns: ColumnDef<Reminder>[] = [
    {
      id: "done",
      header: "Mark",
      cell: ({ row }) => {
        const reminder = row.original
        
        return (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-full transition-all",
              reminder.enabled 
                ? "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50" 
                : "text-emerald-500 bg-emerald-50/50"
            )}
            onClick={() => {
              if (reminder.enabled) {
                updateMutation.mutate({ id: reminder._id, data: { action: 'done' } })
              }
            }}
            disabled={!reminder.enabled || updateMutation.isPending}
            title={reminder.enabled ? "Mark as Done" : "Completed"}
          >
            <CheckCircle className={cn("h-5 w-5", !reminder.enabled && "fill-emerald-500 text-white")} />
          </Button>
        )
      }
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-700">{row.original.title}</span>
            {row.original.description && (
              <span className="text-[10px] text-slate-400 font-medium line-clamp-1 italic">
                {row.original.description.split(' | ')[0]}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 font-bold uppercase text-[10px] tracking-widest">
          {row.original.frequency}
        </Badge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Next Occurrence",
      cell: ({ row }) => {
        const date = row.original.nextOccurrence || row.original.startDate
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
              <Calendar className="h-3 w-3 text-slate-400" />
              {format(new Date(date), "PPP")}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
              <Clock className="h-3 w-3" />
              {row.original.time}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => {
        const reminder = row.original
        const isCompleted = !reminder.enabled && reminder.frequency === "once"
        
        if (isCompleted) {
          return (
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold uppercase text-[10px] tracking-widest" variant="outline">
              Completed
            </Badge>
          )
        }

        return (
          <div className="flex items-center gap-3">
            <Switch 
              checked={reminder.enabled}
              onCheckedChange={() => updateMutation.mutate({ 
                id: reminder._id, 
                data: { enabled: !reminder.enabled } 
              })}
              disabled={updateMutation.isPending}
            />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest leading-none transition-colors",
              reminder.enabled ? "text-emerald-600" : "text-slate-400"
            )}>
              {reminder.enabled ? "Active" : "Paused"}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const reminder = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2">
              <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1.5">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              {reminder.enabled && (
                <DropdownMenuItem
                  className="px-3 py-2 cursor-pointer font-bold focus:bg-emerald-50 focus:text-emerald-600 rounded-xl"
                  onClick={() => {
                    updateMutation.mutate({ id: reminder._id, data: { action: 'done' } })
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  Mark as Done
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="px-3 py-2 text-rose-600 cursor-pointer font-bold focus:bg-rose-50 focus:text-rose-600 rounded-xl"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this reminder?")) {
                    deleteMutation.mutate(reminder._id)
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      isLoading={isLoading}
      searchKey="title"
    />
  )
}
