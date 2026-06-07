"use client"

/**
 * Calendar - wrapper around react-day-picker v9.
 *
 * v9 broke the v8 classNames schema completely. Every key was renamed
 * (`row` → `week`, `head_row` → `weekdays`, `cell` → `day`, `day` → `day_button`,
 *  `caption` → `month_caption`, `table` → `month_grid`, `nav_button_*`
 *  → `button_previous` / `button_next`, components.IconLeft/Right →
 *  components.Chevron, etc.). The previous file still used v8 keys, so
 *  v9 ignored them all and fell back to its default layout - which in a
 *  width-constrained popover collapsed the grid into a single column.
 *
 * This rewrite uses the v9 schema and keeps the visual identical to
 * shadcn's original calendar.
 */

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

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
      // `relative` on the root so the absolutely-positioned <Nav> can anchor
      // to it. In v9 the Nav is rendered as a SIBLING of <Months> at the
      // root level (not inside <Month>), so we have to position it from
      // here - not from `month`.
      className={cn("p-3 relative", className)}
      classNames={{
        // Multi-month container - flex column on mobile, row on sm+.
        months: "flex flex-col sm:flex-row gap-4",
        // One month panel.
        month: "flex flex-col gap-4",
        // The "May 2026" header above the grid.
        month_caption: "flex justify-center pt-1 relative items-center h-7",
        caption_label: "text-sm font-medium",
        // Prev/next nav floats on the same row as the caption - pinned to
        // the root's horizontal padding, vertically aligned to the caption
        // row (which starts at top-3 = 12px because root has `p-3`).
        // pointer-events-none on the wrapper so the empty space between
        // the chevrons doesn't intercept clicks on cells underneath.
        nav: "absolute top-3 left-3 right-3 h-7 flex items-center justify-between z-10 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        // The 7-column grid that holds the weekday header + week rows.
        month_grid: "w-full border-collapse",
        // Weekday header row + cells (Su Mo Tu …).
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        // Body - each `week` is one row of 7 `day` cells.
        weeks: "flex flex-col gap-1 mt-2",
        week: "flex w-full",
        // Each calendar cell (the outer <td>).
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        // The clickable button inside each cell.
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        // State modifiers - v9 applies these directly (no `day_` prefix).
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        // v9 consolidates IconLeft/IconRight into a single Chevron
        // component that receives `orientation` (left/right/up/down).
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
          }
          return <ChevronRight className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
