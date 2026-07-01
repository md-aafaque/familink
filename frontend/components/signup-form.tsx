"use client";

import { useLanguage } from './providers/LanguageProvider'
import SurfaceDecorations from './shared/SurfaceDecorations'
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
  const { t } = useLanguage()
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const roleLabels = {
    admin: t('signupForm.role.admin'),
    member: t('signupForm.role.member'),
    viewer: t('signupForm.role.viewer'),
  }

  return (
    <Card className="w-full max-w-md mx-auto relative overflow-hidden" style={{ backgroundColor: '#FFFDF5' }}>
      <SurfaceDecorations density="light" />
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-[#1E293B]">
          {t('signupForm.title')}
        </CardTitle>
        <CardDescription>
          {t('signupForm.subtitle').replace('{treeName}', treeName).replace('{role}', roleLabels[invitationType])}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t('signupForm.fullName')} <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder={t('signupForm.fullNamePlaceholder')}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('signupForm.email')} <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
              placeholder={t('signupForm.emailPlaceholder')}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('signupForm.password')} <span className="text-red-500">*</span></Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
              placeholder={t('signupForm.passwordPlaceholder')}
              minLength={6}
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white shadow-[3px_3px_0px_rgba(15,23,42,0.15)] hover:shadow-[5px_5px_0px_rgba(15,23,42,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
            size="lg"
          >
            {submitting ? t('signupForm.creating') : t('signupForm.submit')}
          </Button>
        </form>

        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full mt-4"
          disabled={submitting}
        >
          {t('common.back')}
        </Button>
      </CardContent>
    </Card>
  )
}