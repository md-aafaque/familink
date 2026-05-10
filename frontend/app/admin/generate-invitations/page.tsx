'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import AnimatedButton from '@/components/AnimatedButton'
import AnimatedCard from '@/components/AnimatedCard'
import Header from '@/components/Header'
import { Copy, Check, RefreshCw, ExternalLink } from 'lucide-react'

interface InvitationLink {
  token: string
  invitationType: string
  createdAt: number
  expiresAt: number
  invitationUrl: string
}

export default function GenerateInvitationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const treeId = searchParams.get('treeId')

  const [links, setLinks] = useState<InvitationLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!treeId) {
      router.push('/admin')
      return
    }

    const fetchLinks = async () => {
      try {
        setLoading(true)
        const accessToken = localStorage.getItem('accessToken')
        const response = await api.get(`/trees/${treeId}/invitations`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        setLinks(response.data.activeInvitations || [])
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load invitations')
      } finally {
        setLoading(false)
      }
    }

    fetchLinks()
  }, [treeId, router])

  const generateLink = async (type: 'admin' | 'member' | 'viewer') => {
    try {
      setGenerating(type)
      const accessToken = localStorage.getItem('accessToken')
      
      const response = await api.post(
        `/trees/${treeId}/invitations/generate`,
        { invitationType: type },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      setLinks([response.data, ...links])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate invitation')
    } finally {
      setGenerating(null)
    }
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'admin':
        return 'Create a new admin user account'
      case 'member':
        return 'Add member with creation & editing permissions'
      case 'viewer':
        return 'Add viewer with read-only permissions'
      default:
        return ''
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
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

  const isExpired = (expiresAt: number) => expiresAt < Date.now()

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeRemaining = (expiresAt: number) => {
    const diff = expiresAt - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h remaining`
    return 'Expiring soon'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invitations...</p>
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
            Generate Invitation Links
          </h1>
          <p className="text-gray-600">
            Create shareable invitation links for your family tree. Share on WhatsApp, email, or other platforms.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Generate New Link Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate New Link</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'admin', title: 'Admin Invitation', color: 'border-red-200 bg-red-50' },
              { type: 'member', title: 'Member Invitation', color: 'border-blue-200 bg-blue-50' },
              { type: 'viewer', title: 'Viewer Invitation', color: 'border-gray-200 bg-gray-50' },
            ].map((item) => (
              <AnimatedCard key={item.type}>
                <div className={`border-l-4 p-6 ${item.color}`}>
                  <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {getTypeDescription(item.type)}
                  </p>
                  <AnimatedButton
                    onClick={() => generateLink(item.type as 'admin' | 'member' | 'viewer')}
                    disabled={generating === item.type}
                    variant="primary"
                    className="w-full"
                  >
                    {generating === item.type ? 'Generating...' : 'Generate Link'}
                  </AnimatedButton>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>

        {/* Active Links Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Active Invitation Links ({links.length})
          </h2>

          {links.length === 0 ? (
            <AnimatedCard>
              <div className="text-center py-12 text-gray-500">
                <p>No active invitation links yet. Generate one above to get started!</p>
              </div>
            </AnimatedCard>
          ) : (
            <div className="space-y-4">
              {links.map((link) => (
                <AnimatedCard key={link.token}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeColor(link.invitationType)}`}>
                            {link.invitationType.charAt(0).toUpperCase() + link.invitationType.slice(1)}
                          </span>
                          {isExpired(link.expiresAt) && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Created on {formatDate(link.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isExpired(link.expiresAt) ? 'text-red-600' : 'text-green-600'}`}>
                          {isExpired(link.expiresAt) ? 'Expired' : getTimeRemaining(link.expiresAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {formatDate(link.expiresAt)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Invitation Link:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.invitationUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono text-gray-700"
                        />
                        <button
                          onClick={() => copyToClipboard(link.invitationUrl, link.token)}
                          className="p-2 hover:bg-gray-200 rounded transition"
                          title="Copy to clipboard"
                        >
                          {copiedId === link.token ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <AnimatedButton
                        onClick={() => window.open(link.invitationUrl, '_blank')}
                        variant="secondary"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Test Link
                      </AnimatedButton>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>

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
