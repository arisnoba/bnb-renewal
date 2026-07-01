import { cn } from '@/utilities/ui'

type HeroMosaicDimProps = {
  className?: string
}

export function HeroMosaicDim({ className }: HeroMosaicDimProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.65)_100%)]',
        className,
      )}
    />
  )
}
