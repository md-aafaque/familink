"use client";

import { useLanguage } from './providers/LanguageProvider'
import { Card, CardContent } from '@/components/ui/card'

export function LoadingCard() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loadingCard.title')}</p>
        </CardContent>
      </Card>
    </div>
  )
}