import { Bell, Palette, Settings, ShieldCheck } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function SettingsPage() {
  return (
    <PagePlaceholder
      icon={Settings}
      eyebrow="Settings"
      title="Make Aura truly yours"
      description="Tune every detail to match the way you think and work. Personalize appearance, manage your profile, and control notifications with ease."
      highlights={[
        {
          icon: Palette,
          title: 'Appearance',
          description:
            'Choose light or dark, and refine the look until it feels like home.',
        },
        {
          icon: Bell,
          title: 'Notifications',
          description:
            'Decide exactly what deserves your attention and when to hear about it.',
        },
        {
          icon: ShieldCheck,
          title: 'Privacy & data',
          description:
            'Stay in full control of your information with transparent settings.',
        },
      ]}
    />
  )
}
