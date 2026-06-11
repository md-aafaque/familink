import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SignupFormData {
  name: string
  email: string
  password: string
}

interface SignupFormProps {
  treeName: string
  invitationType: 'admin' | 'member' | 'viewer'
  formData: SignupFormData
  onFormDataChange: (data: SignupFormData) => void
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
  error: string | null
}

const roleLabels = {
  admin: 'Administrator',
  member: 'Member (Can create and edit)',
  viewer: 'Viewer (Read-only)',
}

export function SignupForm({
  treeName,
  invitationType,
  formData,
  onFormDataChange,
  onSubmit,
  onBack,
  submitting,
  error,
}: SignupFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Create Your Account
        </CardTitle>
        <CardDescription>
          Join {treeName} as {roleLabels[invitationType]}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={submitting}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              disabled={submitting}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              disabled={submitting}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? 'Creating account...' : 'Create Account & Join'}
          </Button>
        </form>

        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full mt-4"
          disabled={submitting}
        >
          Back
        </Button>
      </CardContent>
    </Card>
  )
}