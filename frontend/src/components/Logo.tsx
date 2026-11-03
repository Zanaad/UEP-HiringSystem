import { Link } from 'react-router-dom'
import { cn } from './ui/utils'

const sizes = {
  sm: { box: 'size-8 rounded-lg text-lg', text: 'text-lg' },
  md: { box: 'size-10 rounded-xl text-xl', text: 'text-xl' },
  lg: { box: 'size-12 rounded-xl text-2xl', text: 'text-2xl font-bold' },
}

export default function Logo({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      <span className={cn('bg-primary flex items-center justify-center font-bold text-white', sizes[size].box)}>H</span>
      <span className={sizes[size].text}>HirePrep</span>
    </Link>
  )
}
