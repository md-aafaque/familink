import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface InvitationData {
  token: string
  treeId: string
  treeName: string
  invitationType: 'admin' | 'member' | 'viewer'
  expiresAt: string
  createdAt: string
}

interface UseInvitationReturn {
  invitation: InvitationData | null
  loading: boolean
  error: string | null
  handleAccept: () => Promise<{ action: string } | undefined>
  submitting: boolean
}

export function useInvitation(token: string): UseInvitationReturn {
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await api.get(`/invitations/${token}`)
        setInvitation(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchInvitation()
    }
  }, [token])

  const handleAccept = async () => {
    if (!invitation) return

    setSubmitting(true)
    try {
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
        return { action: 'signup_required' }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    invitation,
    loading,
    error,
    handleAccept,
    submitting,
  }
}