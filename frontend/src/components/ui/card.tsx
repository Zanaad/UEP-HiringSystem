import type { ComponentProps } from 'react'
import { cn } from './utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('grid gap-1.5 px-6 pt-6 [.border-b]:pb-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h4'>) {
  return <h4 data-slot="card-title" className={cn('leading-none', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6 [&:last-child]:pb-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="card-footer" className={cn('flex items-center px-6 pb-6 [.border-t]:pt-6', className)} {...props} />
  )
}
