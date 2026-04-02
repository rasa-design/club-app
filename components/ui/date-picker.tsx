'use client'

import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DatePicker({
  value,
  onChange,
  placeholder = '日付を選択',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selected && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {selected ? format(selected, 'yyyy年M月d日', { locale: ja }) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),360px)] p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          locale={ja}
          captionLayout="dropdown"
          className="[--cell-size:--spacing(11)] w-full p-3"
        />
      </PopoverContent>
    </Popover>
  )
}
