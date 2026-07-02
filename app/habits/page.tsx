import { CalendarCheck, Flame, Sprout, TrendingUp } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function HabitsPage() {
  return (
    <PagePlaceholder
      icon={Sprout}
      eyebrow="Habits"
      title="Small steps, compounding results"
      description="Build routines that stick and watch small wins add up over time. Track streaks, visualize consistency, and stay motivated without pressure."
      highlights={[
        {
          icon: Flame,
          title: 'Streaks',
          description:
            'Keep the chain going with gentle nudges and satisfying momentum.',
        },
        {
          icon: CalendarCheck,
          title: 'Daily check-ins',
          description:
            'A quick, calming ritual to mark progress and reflect on your day.',
        },
        {
          icon: TrendingUp,
          title: 'Progress trends',
          description:
            'See consistency over weeks and months with clear, honest insights.',
        },
      ]}
    />
  )
}
