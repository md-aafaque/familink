"use client";

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

import { cn } from "@/lib/cn"

const toastVariants = cva(
  "relative flex items-start gap-3 w-80 rounded-xl border p-4 shadow-lg backdrop-blur-sm",
  {
    variants: {
      variant: {
        success:
          "bg-white border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
        error:
          "bg-white border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
        warning:
          "bg-white border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
        info:
          "bg-white border-orange-200 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-100",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const iconColors = {
  success: "text-green-500 dark:text-green-400",
  error: "text-red-500 dark:text-red-400",
  warning: "text-amber-500 dark:text-amber-400",
  info: "text-orange-500 dark:text-orange-400",
}

export interface ToastProps
  extends VariantProps<typeof toastVariants> {
  message: string
  onDismiss: () => void
  className?: string
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "info", message, onDismiss }, ref) => {
    const Icon = iconMap[variant ?? "info"]

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: 100, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={cn(toastVariants({ variant }), className)}
        role="alert"
      >
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconColors[variant ?? "info"])} />
        <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast, toastVariants }
