"use client";

import { useLanguage } from './providers/LanguageProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Users, Eye, Crown } from 'lucide-react'
import { useAppTheme } from './providers/ThemeProvider'
import { cn } from '@/lib/cn'

interface InvitationData {
  id: string
  treeId: string
  treeName: string
  invitationType: 'admin' | 'member' | 'viewer'
  expiresAt: string
  createdAt: string
}

interface InvitationCardProps {
  invitation: InvitationData
  onAccept: () => void
  onCancel: () => void
  submitting: boolean
  error: string | null
}

export function InvitationCard({
  invitation,
  onAccept,
  onCancel,
  submitting,
  error,
}: InvitationCardProps) {
  const { theme } = useAppTheme()
  const { t } = useLanguage()
  
  const roleConfig = {
    admin: {
      label: t('invitationCard.role.admin'),
      description: t('invitationCard.role.adminDesc'),
      icon: Crown,
      color: 'text-amber-600 dark:text-amber-400',
    },
    member: {
      label: t('invitationCard.role.member'),
      description: t('invitationCard.role.memberDesc'),
      icon: Users,
      color: theme.colors.accent,
    },
    viewer: {
      label: t('invitationCard.role.viewer'),
      description: t('invitationCard.role.viewerDesc'),
      icon: Eye,
      color: 'text-green-600',
    },
  }

  const role = roleConfig[invitation.invitationType]
  const Icon = role.icon
  const expirationDate = new Date(invitation.expiresAt).toLocaleDateString()

  return (
    <Card className={cn("w-full max-w-md mx-auto", theme.colors.surface, theme.colors.border)}>
      <CardHeader className="text-center">
        <CardTitle className={cn("text-2xl font-bold", theme.colors.text)}>
          {t('invitationCard.title')}
        </CardTitle>
        <CardDescription className={theme.colors.textMuted}>
          {t('invitationCard.subtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tree Info */}
        <div className={cn("rounded-2xl p-4 border-2", theme.colors.primaryMuted, theme.colors.border)}>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>
            {invitation.treeName}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-4 w-4", role.color)} />
            <span className={cn("text-sm font-medium", theme.colors.text)}>
              {role.label}
            </span>
          </div>
          <p className={cn("text-sm mb-3", theme.colors.textMuted)}>
            {role.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{t('invitationCard.expires').replace('{date}', expirationDate)}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onAccept}
            disabled={submitting}
            className={cn("w-full", theme.colors.primary, "text-white")}
            size="lg"
          >
            {submitting ? t('invitationCard.processing') : t('invitationCard.accept')}
          </Button>

          <Button
            onClick={onCancel}
            variant="outline"
            className={cn("w-full", theme.colors.bg, theme.colors.text, theme.colors.border)}
          >
            {t('common.cancel')}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {t('invitationCard.noAccount')}
        </p>
      </CardContent>
    </Card>
  )
}
