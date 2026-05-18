'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardHome() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const rolePath: Record<string, string> = {
        ADMIN: '/dashboard/admin',
        SHOP_OWNER: '/dashboard/shop_owner',
        CUSTOMER: '/dashboard/customer',
      }
      router.push(rolePath[user.role] ?? '/login')
    }
  }, [isAuthenticated, isLoading, user, router])

  return null
}
