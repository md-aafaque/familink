import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface SignupFormData {
  name: string
  email: string
  password: string
}

interface UseSignupReturn {
  formData: SignupFormData
  setFormData: (data: SignupFormData) => void
  handleSignup: (token: string, treeName: string) => Promise<void>
  submitting: boolean
  error: string | null
}

export function useSignup(): UseSignupReturn {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async (token: string, treeName: string) => {
    setSubmitting(true)
    setError(null)

    try {
      const response = await api.post('/auth/signup-with-invitation', {
        token,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        name: formData.name,
      })

      // Signup successful
      alert(`Account created successfully! ${response.data.message}`)
      router.push('/login')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formData,
    setFormData,
    handleSignup,
    submitting,
    error,
  }
}