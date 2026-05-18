import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'emerald' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function GradientButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: GradientButtonProps) {
  const baseStyles = 'font-semibold rounded-full transition-all duration-300 hover:shadow-lg'
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  }

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary to-indigo-500 text-white hover:shadow-teal-300/50',
    emerald: 'bg-gradient-to-r from-primary to-indigo-500 text-white hover:shadow-teal-300/50',
    secondary: 'bg-white text-primary dark:text-indigo-400 border-2 border-primary hover:bg-teal-50',
  }

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

