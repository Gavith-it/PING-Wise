"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  maxDate,
  minDate,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
            !date && "text-gray-500 dark:text-gray-400",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">{date ? format(date, "PPP") : <span className="text-gray-400">{placeholder}</span>}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 rounded-lg max-w-[calc(100vw-2rem)]" 
        align="start" 
        side="bottom"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          disabled={disabled}
          {...(maxDate && { toDate: maxDate })}
          {...(minDate && { fromDate: minDate })}
        />
      </PopoverContent>
    </Popover>
  )
}

