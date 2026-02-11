import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-white dark:bg-neutral-900 group/calendar p-4 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent rounded-2xl",
        String.raw`rtl:**:[.rdp-button_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 px-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "h-9 w-9 select-none p-0 aria-disabled:opacity-50 rounded-xl transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "h-9 w-9 select-none p-0 aria-disabled:opacity-50 rounded-xl transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-4",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "border-neutral-200 dark:border-neutral-700 shadow-xs relative rounded-xl border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-white dark:bg-neutral-900 absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-semibold text-sm text-neutral-900 dark:text-white",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-neutral-500 dark:[&>svg]:text-neutral-400 flex h-9 items-center gap-1 rounded-xl pl-3 pr-2 text-sm [&>svg]:size-4",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-neutral-500 dark:text-neutral-400 flex-1 select-none rounded-md text-[0.8rem] font-medium",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-neutral-400 dark:text-neutral-500 select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center first:[&[data-selected=true]_button]:rounded-l-xl last:[&[data-selected=true]_button]:rounded-r-xl",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent text-white rounded-xl",
          defaultClassNames.range_start
        ),
        range_middle: cn("bg-accent/80 dark:bg-accent/60 text-white", defaultClassNames.range_middle),
        range_end: cn(
          "bg-accent text-white rounded-xl",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-semibold [&[data-selected=true]]:bg-accent [&[data-selected=true]]:text-white",
          defaultClassNames.today
        ),
        outside: cn(
          "text-neutral-200 dark:text-neutral-700 aria-selected:text-neutral-200 dark:aria-selected:text-neutral-700",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-neutral-200 dark:text-neutral-700 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // Base styles - ensure proper text color in both modes
        "flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none transition-all duration-200",
        // Default state - explicit colors
        "text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800",
        // Selected single day
        "data-[selected-single=true]:bg-gradient-to-br data-[selected-single=true]:from-accent-500 data-[selected-single=true]:to-accent-600 data-[selected-single=true]:text-white data-[selected-single=true]:font-semibold data-[selected-single=true]:shadow-md data-[selected-single=true]:shadow-accent-500/20 data-[selected-single=true]:hover:from-accent-600 data-[selected-single=true]:hover:to-accent-700",
        // Range styles
        "data-[range-middle=true]:bg-accent/80 dark:data-[range-middle=true]:bg-accent/60 data-[range-middle=true]:text-white data-[range-middle=true]:hover:bg-accent dark:data-[range-middle=true]:hover:bg-accent/70",
        "data-[range-start=true]:bg-gradient-to-br data-[range-start=true]:from-accent-500 data-[range-start=true]:to-accent-600 data-[range-start=true]:text-white data-[range-start=true]:font-semibold data-[range-start=true]:rounded-l-xl data-[range-start=true]:hover:from-accent-600 data-[range-start=true]:hover:to-accent-700",
        "data-[range-end=true]:bg-gradient-to-br data-[range-end=true]:from-accent-500 data-[range-end=true]:to-accent-600 data-[range-end=true]:text-white data-[range-end=true]:font-semibold data-[range-end=true]:rounded-r-xl data-[range-end=true]:hover:from-accent-600 data-[range-end=true]:hover:to-accent-700",
        // Focus ring
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-accent-500/50",
        // Text size - ensure visibility
        "[&>span]:text-sm [&>span]:opacity-100 [&>span]:text-inherit",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
