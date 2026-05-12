import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Users, Eye, Crown } from 'lucide-react'

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
    color: 'text-blue-600',
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to view the family tree',
    icon: Eye,
    color: 'text-green-600',
  },
}

export function InvitationCard({
  invitation,
  onAccept,
  onCancel,
  submitting,
  error,
}: InvitationCardProps) {
  const role = roleConfig[invitation.invitationType]
  const Icon = role.icon
  const expirationDate = new Date(invitation.expiresAt).toLocaleDateString()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          You're invited!
        </CardTitle>
        <CardDescription>
          Join the family tree
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tree Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {invitation.treeName}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-4 w-4 ${role.color}`} />
            <span className="text-sm font-medium text-gray-700">
              {role.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
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
            className="w-full"
            size="lg"
          >
            {submitting ? 'Processing...' : 'Accept Invitation'}
          </Button>

          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
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