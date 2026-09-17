import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-none outline-none p-[4px] box-border",
      "transition-[background-color,box-shadow] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
      "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600",
      "data-[state=unchecked]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
      "data-[state=checked]:bg-[#fcc603]",
      "data-[state=checked]:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[20px] w-[20px] rounded-full bg-white ring-0",
        "shadow-[0_2px_6px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)]",
        "transition-transform duration-[480ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:scale-[0.90]",
        "data-[state=checked]:translate-x-[22px] data-[state=checked]:scale-[1.30]",
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
