'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import AnimatedButton from '@/components/AnimatedButton'
import AnimatedCard from '@/components/AnimatedCard'
import Header from '@/components/Header'

interface InvitationDetails {
  token: string
  treeId: string
  treeName: string
  invitationType: string
  expiresAt: number
}

export default function JoinTreePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'invitation' | 'signup'>('invitation')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/invitations/${token}`)
        setInvitation(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired invitation')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchInvitation()
    }
  }, [token])

  const handleAccept = async () => {
    try {
      setSubmitting(true)
      const accessToken = localStorage.getItem('accessToken')

      if (accessToken) {
        // User is already logged in
        const response = await api.post(`/invitations/${token}/accept`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        if (response.data.success) {
          if (response.data.status === 'pending') {
            setError(null)
            // Show pending approval message
            if (response.data.upgradeFrom) {
              // Role upgrade scenario
              alert(`Request submitted to upgrade from ${response.data.currentRole} to ${response.data.requestedRole}! You will be notified once admin approves.`)
            } else {
              // New to tree scenario
              alert('Request submitted for approval! You will be notified once admin approves.')
            }
            router.push('/dashboard')
          } else {
            // Direct access granted
            router.push(`/tree/${response.data.treeId}`)
          }
        }
      } else {
        // New user - show signup form
        setStep('signup')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)

      const response = await api.post('/auth/signup-with-invitation', {
        token,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        name: formData.name,
      })

      // Signup successful
      setError(null)
      alert(`Account created successfully! ${response.data.message}`)
      router.push('/login')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <AnimatedCard>
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Invitation</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <AnimatedButton onClick={() => router.push('/')} variant="primary">
                Go to Home
              </AnimatedButton>
            </div>
          </AnimatedCard>
        </div>
      </div>
    )
  }

  const expirationDate = new Date(invitation.expiresAt).toLocaleDateString()
  const roleLabel = {
    admin: 'Administrator',
    member: 'Member (Can create and edit)',
    viewer: 'Viewer (Read-only)',
  }[invitation.invitationType]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <AnimatedCard>
          {step === 'invitation' ? (
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  You're invited!
                </h1>
                <p className="text-gray-600">Join the family tree</p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {invitation.treeName}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Your Role:</strong> {roleLabel}
                </p>
                <p className="text-xs text-gray-500">
                  Invitation expires on {expirationDate}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <AnimatedButton
                  onClick={handleAccept}
                  disabled={submitting}
                  variant="primary"
                  className="w-full"
                >
                  {submitting ? 'Processing...' : 'Accept Invitation'}
                </AnimatedButton>

                <AnimatedButton
                  onClick={() => router.push('/')}
                  variant="secondary"
                  className="w-full"
                >
                  Cancel
                </AnimatedButton>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Don't have an account? You'll be asked to create one on the next step.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Create Your Account
                </h1>
                <p className="text-gray-600 text-sm">
                  Join {invitation.treeName} as {invitation.invitationType}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <AnimatedButton
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                  className="w-full"
                >
                  {submitting ? 'Creating account...' : 'Create Account & Join'}
                </AnimatedButton>
              </form>

              <button
                onClick={() => setStep('invitation')}
                className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition"
              >
                Back
              </button>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}
