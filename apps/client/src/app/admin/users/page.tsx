"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { isAdmin } from "@/lib/auth"
import type { Profile, UserRole } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('retailer')

  useEffect(() => {
    checkAuthAndLoadUsers()
  }, [])

  const checkAuthAndLoadUsers = async () => {
    const admin = await isAdmin()
    if (!admin) {
      router.push('/admin/login')
      return
    }

    await fetchUsers()
  }

  const fetchUsers = async () => {
    if (!supabase) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers((data || []) as Profile[])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = (user: Profile) => {
    setEditingUser(user)
    setNewRole(user.role)
  }

  const handleSaveRole = async () => {
    if (!supabase || !editingUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', editingUser.id)

      if (error) {
        console.error('Error updating role:', error)
        alert('Failed to update user role. Please try again.')
        return
      }

      setEditingUser(null)
      await fetchUsers()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Manage Users</h1>
        <Link
          href="/admin/dashboard"
          className="px-3 sm:px-4 py-2 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center sm:justify-start"
        >
          Back to Dashboard
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-gray-500 text-base sm:text-lg">No users found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.business_name || '-'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'importer' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'wholesaler' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      {editingUser?.id === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm min-h-[44px]"
                          >
                            <option value="retailer">Retailer</option>
                            <option value="wholesaler">Wholesaler</option>
                            <option value="importer">Importer</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={handleSaveRole}
                            className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 min-h-[44px]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-300 min-h-[44px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditRole(user)}
                          className="px-2 sm:px-3 py-1 bg-yellow-400 text-black rounded-lg text-xs sm:text-sm hover:bg-yellow-300 min-h-[44px]"
                        >
                          Edit Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 break-words">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Business Name</p>
                  <p className="text-sm text-gray-900">{user.business_name || '-'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'importer' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'wholesaler' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  {editingUser?.id === user.id ? (
                    <div className="space-y-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px]"
                      >
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="importer">Importer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveRole}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 min-h-[44px]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 min-h-[44px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditRole(user)}
                      className="w-full px-3 py-2 bg-yellow-400 text-black rounded-lg text-sm hover:bg-yellow-300 min-h-[44px]"
                    >
                      Edit Role
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

