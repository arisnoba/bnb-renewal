import { cn } from '@/utilities/ui'

type HeroMosaicDimProps = {
  className?: string
}

export function HeroMosaicDim({ className }: HeroMosaicDimProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.45)_50%,rgba(0,0,0,1)_100%)]',
        className,
      )}
    />
  )
}
