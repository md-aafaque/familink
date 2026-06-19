"use client";

import { useLanguage } from './providers/LanguageProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorCardProps {
  error: string
  onGoHome: () => void
}

export function ErrorCard({ error, onGoHome }: ErrorCardProps) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-red-600">
              {t('errorCard.title')}
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center">
            <Button onClick={onGoHome} className="w-full">
              {t('errorCard.goHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}