import type { ComponentProps } from 'react'
import { cn } from './utils'

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(
        'border-input bg-input-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-9 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-[3px] disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
