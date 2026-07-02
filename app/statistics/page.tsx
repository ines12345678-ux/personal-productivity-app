import { Activity, BarChart3, LineChart, PieChart } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function StatisticsPage() {
  return (
    <PagePlaceholder
      icon={BarChart3}
      eyebrow="Statistics"
      title="Reflect on the shape of your life"
      description="Thoughtful insights drawn from everything you track in Aura. See trends across tasks, habits, and finances to make calmer, better decisions."
      highlights={[
        {
          icon: LineChart,
          title: 'Trends over time',
          description:
            'Watch how your focus, consistency, and spending evolve week by week.',
        },
        {
          icon: PieChart,
          title: 'Breakdowns',
          description:
            'Understand where your time and energy actually go with clear visuals.',
        },
        {
          icon: Activity,
          title: 'Weekly reviews',
          description:
            'A gentle summary to help you reflect and reset with intention.',
        },
      ]}
    />
  )
}
