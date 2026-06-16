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
  successMessage: string | null
}

export function useSignup(): UseSignupReturn {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async (token: string, treeName: string) => {
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await api.post('/auth/signup-with-invitation', {
        token,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        name: formData.name,
      })

      // Signup successful
      setSuccessMessage(response.data.message || "Account created successfully!")
      // Delay redirect to allow user to see success message
      setTimeout(() => router.push('/login'), 2000)
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
    successMessage,
  }
}