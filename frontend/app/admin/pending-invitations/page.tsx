'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import AnimatedButton from '@/components/AnimatedButton'
import AnimatedCard from '@/components/AnimatedCard'
import Header from '@/components/Header'
import { Check, X, Clock } from 'lucide-react'

interface AccessRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  invitationType: string
  createdAt: number
  status: string
  upgradeFrom?: string
}

export default function PendingInvitationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const treeId = searchParams.get('treeId')

  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})
  const [showRejectionForm, setShowRejectionForm] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (!treeId) {
      router.push('/admin')
      return
    }

    const fetchRequests = async () => {
      try {
        setLoading(true)
        const accessToken = localStorage.getItem('accessToken')
        const response = await api.get(`/trees/${treeId}/access-requests`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        setRequests(response.data.pendingRequests || [])
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load pending requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [treeId, router])

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId)
      const accessToken = localStorage.getItem('accessToken')
      
      await api.post(
        `/trees/${treeId}/access-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      // Remove from list
      setRequests(requests.filter(r => r.id !== requestId))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId)
      const accessToken = localStorage.getItem('accessToken')
      
      await api.post(
        `/trees/${treeId}/access-requests/${requestId}/reject`,
        { reason: rejectionReason[requestId] || 'Request rejected by admin' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      // Remove from list
      setRequests(requests.filter(r => r.id !== requestId))
      setShowRejectionForm({ ...showRejectionForm, [requestId]: false })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'member':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pending requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Pending Invitations
          </h1>
          <p className="text-gray-600">
            Review and approve new members and viewers requesting access
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <AnimatedCard>
            <div className="text-center py-12">
              <Check className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                All Caught Up!
              </h2>
              <p className="text-gray-600">
                No pending invitations at this time.
              </p>
            </div>
          </AnimatedCard>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <AnimatedCard key={request.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {request.userName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(request.invitationType)}`}>
                          {request.invitationType.charAt(0).toUpperCase() + request.invitationType.slice(1)}
                        </span>
                        {request.upgradeFrom && (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 font-medium">
                            Upgrade from {request.upgradeFrom}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{request.userEmail}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Requested on {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  {showRejectionForm[request.id] && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for rejection (optional):
                      </label>
                      <textarea
                        value={rejectionReason[request.id] || ''}
                        onChange={(e) => setRejectionReason({ ...rejectionReason, [request.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        placeholder="User will be notified of this reason..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <AnimatedButton
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {processingId === request.id ? 'Approving...' : 'Approve'}
                    </AnimatedButton>

                    {!showRejectionForm[request.id] ? (
                      <AnimatedButton
                        onClick={() => setShowRejectionForm({ ...showRejectionForm, [request.id]: true })}
                        variant="secondary"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </AnimatedButton>
                    ) : (
                      <>
                        <AnimatedButton
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          variant="danger"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          {processingId === request.id ? 'Rejecting...' : 'Confirm Reject'}
                        </AnimatedButton>
                        <button
                          onClick={() => setShowRejectionForm({ ...showRejectionForm, [request.id]: false })}
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        <div className="mt-8">
          <AnimatedButton
            onClick={() => router.back()}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Back to Admin
          </AnimatedButton>
        </div>
      </div>
    </div>
  )
}
