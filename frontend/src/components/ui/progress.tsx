import { cn } from './utils'

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-100', className)}
    >
      <div className={cn('bg-primary h-full rounded-full transition-all', barClassName)} style={{ width: `${value}%` }} />
    </div>
  )
}
