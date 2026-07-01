"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/cn"

const STORAGE_KEY = "familink-cookie-consent"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setVisible(true)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  function handleDecline() {
    localStorage.setItem(STORAGE_KEY, "declined")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "border-t border-border",
            "bg-[#FFFDF5] dark:bg-gray-950",
            "p-4 sm:p-5"
          )}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              We use essential cookies to provide the best experience. By continuing,
              you agree to our use of cookies.{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={handleDecline}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  "border border-border bg-transparent text-foreground",
                  "hover:bg-muted"
                )}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90"
                )}
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
