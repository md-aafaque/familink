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
  
  const roleConfig = {
    admin: {
      label: 'Administrator',
      description: 'Full access to manage the family tree',
      icon: Crown,
      color: 'text-purple-600',
    },
    member: {
      label: 'Member',
      description: 'Can create and edit family relationships',
      icon: Users,
      color: theme.colors.accent,
    },
    viewer: {
      label: 'Viewer',
      description: 'Read-only access to view the family tree',
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
          You're invited!
        </CardTitle>
        <CardDescription className={theme.colors.textMuted}>
          Join the family tree
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tree Info */}
        <div className={cn("rounded-lg p-4 border", theme.colors.primaryMuted, theme.colors.border)}>
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
            <span>Expires on {expirationDate}</span>
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
            {submitting ? 'Processing...' : 'Accept Invitation'}
          </Button>

          <Button
            onClick={onCancel}
            variant="outline"
            className={cn("w-full", theme.colors.bg, theme.colors.text, theme.colors.border)}
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Don't have an account? You'll be asked to create one on the next step.
        </p>
      </CardContent>
    </Card>
  )
}
