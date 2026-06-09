import { Database, FileText, Handshake, Headset, ShieldCheck, UserCheck } from 'lucide-react'

import { cn } from '@/utilities/ui'

const icons = [Database, FileText, Handshake, ShieldCheck, UserCheck, Headset]

export function LabelingCard({
  description,
  index,
  title,
}: {
  description: string
  index: number
  title: string
}) {
  const Icon = icons[index % icons.length]

  return (
    <section className="rounded-lg border bg-background p-5 shadow-xs">
      <div className="mb-5 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h2 className="text-base font-semibold leading-6 tracking-normal">{title}</h2>
      <p className={cn('mt-2 text-sm leading-6 text-muted-foreground')}>{description}</p>
    </section>
  )
}
