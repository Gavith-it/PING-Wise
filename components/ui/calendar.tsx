"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 md:p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-2 md:space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-xs md:text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-6 w-6 md:h-7 md:w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-xs"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-0.5 md:space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-500 dark:text-gray-400 rounded-md w-7 h-7 md:w-9 md:h-9 font-normal text-[0.7rem] md:text-[0.8rem] flex items-center justify-center",
        row: "flex w-full mt-1 md:mt-2",
        cell: "h-7 w-7 md:h-9 md:w-9 text-center text-xs md:text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-100/50 dark:bg-gray-800/50 [&:has([aria-selected])]:bg-gray-100 dark:bg-gray-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 md:h-9 md:w-9 p-0 font-normal aria-selected:opacity-100 text-xs md:text-sm"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
        day_today: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50",
        day_outside:
          "day-outside text-gray-500 dark:text-gray-400 opacity-50 aria-selected:bg-gray-100/50 dark:aria-selected:bg-gray-800/50 aria-selected:text-gray-500 dark:aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-gray-500 dark:text-gray-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-gray-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />;
          }
          return <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />;
        },
      }}
      captionLayout="dropdown"
      fromYear={1900}
      toYear={new Date().getFullYear() + 20}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

