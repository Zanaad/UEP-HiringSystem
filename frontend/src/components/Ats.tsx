import { AlertCircle, CheckCircle2, Star, XCircle } from 'lucide-react'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { cn } from './ui/utils'
import type { AtsResult, Verdict } from '../services/applications.service'

const VERDICTS: Record<Verdict, { label: string; badge: string; text: string; bar: string; Icon: typeof Star }> = {
  strong: { label: 'Strong Match', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600', bar: 'bg-emerald-500', Icon: Star },
  good: { label: 'Good Match', badge: 'bg-blue-100 text-blue-700', text: 'text-primary', bar: 'bg-primary', Icon: CheckCircle2 },
  fair: { label: 'Fair Match', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-500', bar: 'bg-orange-400', Icon: AlertCircle },
  weak: { label: 'Weak Match', badge: 'bg-red-100 text-red-700', text: 'text-red-500', bar: 'bg-red-400', Icon: XCircle },
}

export function MatchBadge({ ats, size = 'md' }: { ats: AtsResult; size?: 'sm' | 'md' }) {
  const { label, badge, text, Icon } = VERDICTS[ats.verdict]
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Badge className={badge}>
        <Icon size={11} />
        {label}
      </Badge>
      <span className={cn('font-bold', text, size === 'sm' ? 'text-sm' : 'text-xl')}>{ats.overall}%</span>
    </div>
  )
}

export function MatchBar({ ats, className }: { ats: AtsResult; className?: string }) {
  return <Progress value={ats.overall} className={className} barClassName={VERDICTS[ats.verdict].bar} />
}

export function ScoreBreakdown({ ats }: { ats: AtsResult }) {
  const rows = [
    { label: 'Skills', value: ats.skills_score, weight: '50%' },
    { label: 'Experience', value: ats.experience_score, weight: '25%' },
    { label: 'Education', value: ats.education_score, weight: '15%' },
    { label: 'Location', value: ats.location_score, weight: '10%' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(({ label, value, weight }) => (
        <div key={label} className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1.5 flex justify-between text-xs text-gray-500">
            <span>
              {label} <span className="text-gray-400">· {weight}</span>
            </span>
            <span className="font-semibold text-gray-700">{value}%</span>
          </div>
          <Progress value={value} className="h-1.5" />
        </div>
      ))}
    </div>
  )
}

export function SkillChips({ matched, missing }: { matched: string[]; missing: string[] }) {
  if (matched.length === 0 && missing.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {matched.map((skill) => (
        <span key={skill} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
          <CheckCircle2 size={10} />
          {skill}
        </span>
      ))}
      {missing.map((skill) => (
        <span key={skill} className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
          <XCircle size={10} />
          {skill}
        </span>
      ))}
    </div>
  )
}
