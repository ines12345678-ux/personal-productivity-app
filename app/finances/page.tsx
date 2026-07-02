import { PiggyBank, Receipt, Wallet, WalletCards } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function FinancesPage() {
  return (
    <PagePlaceholder
      icon={Wallet}
      eyebrow="Finances"
      title="Understand your money with clarity"
      description="A serene view of your finances without the spreadsheet stress. Track spending, set budgets, and watch your goals get closer every month."
      highlights={[
        {
          icon: Receipt,
          title: 'Effortless tracking',
          description:
            'Log expenses and income quickly, categorized the way you prefer.',
        },
        {
          icon: WalletCards,
          title: 'Budgets',
          description:
            'Set gentle limits by category and stay aware without the anxiety.',
        },
        {
          icon: PiggyBank,
          title: 'Savings goals',
          description:
            'Define what you are working toward and celebrate each milestone.',
        },
      ]}
    />
  )
}
