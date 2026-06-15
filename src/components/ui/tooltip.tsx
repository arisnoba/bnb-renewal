'use client'

import { cn } from '@/utilities/ui'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

const TooltipProvider: React.FC<
  React.ComponentProps<typeof TooltipPrimitive.Provider>
> = (props) => {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />
}

const Tooltip: React.FC<React.ComponentProps<typeof TooltipPrimitive.Root>> = (props) => {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

const TooltipTrigger: React.FC<
  React.ComponentProps<typeof TooltipPrimitive.Trigger>
> = (props) => {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

const TooltipContent: React.FC<
  React.ComponentProps<typeof TooltipPrimitive.Content>
> = ({ children, className, sideOffset = 6, ...props }) => {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'z-50 max-w-[min(280px,calc(100vw-32px))] rounded-md bg-neutral-950 px-3 py-2 type-caption-m font-semibold leading-[1.45] text-white shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
          className,
        )}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-neutral-950" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
