'use client'

import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// inline=true の場合: ボタンタップでカレンダーをその場に展開（ダイアログ内で使用）
// inline=false の場合: Popoverで表示（通常の使用）
export function DatePicker({
  value,
  onChange,
  placeholder = '日付を選択',
  className,
  inline = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inline?: boolean
}) {
  const [open, setOpen] = useState(false)

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  const label = selected ? format(selected, 'yyyy年M月d日', { locale: ja }) : placeholder

  if (inline) {
    return (
      <div className={cn('w-full', className)}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50',
            !selected && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          {selected && (
            <X
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              onClick={e => { e.stopPropagation(); onChange('') }}
            />
          )}
        </button>
        {open && (
          <div className="mt-1 rounded-xl border bg-popover shadow-md overflow-hidden">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={selected}
              locale={ja}
              captionLayout="dropdown"
              className="[--cell-size:--spacing(9)] w-full p-2"
            />
          </div>
        )}
      </div>
    )
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
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),320px)] p-0 overflow-hidden" align="start" side="top" sideOffset={4}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          locale={ja}
          captionLayout="dropdown"
          className="[--cell-size:--spacing(9)] w-full p-2"
        />
      </PopoverContent>
    </Popover>
  )
}
