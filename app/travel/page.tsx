import { Luggage, MapPin, Plane, Ticket } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function TravelPage() {
  return (
    <PagePlaceholder
      icon={Plane}
      eyebrow="Travel"
      title="Every journey, beautifully organized"
      description="Plan trips and keep every itinerary, booking, and idea in one calm place. From first spark of inspiration to the final boarding pass."
      highlights={[
        {
          icon: MapPin,
          title: 'Itineraries',
          description:
            'Map out each day of your trip with places, times, and notes.',
        },
        {
          icon: Ticket,
          title: 'Bookings',
          description:
            'Keep flights, stays, and reservations together and easy to find.',
        },
        {
          icon: Luggage,
          title: 'Packing lists',
          description:
            'Reusable checklists so you arrive prepared, every single time.',
        },
      ]}
    />
  )
}
