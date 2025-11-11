"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/OptimizedAuthContext"
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner"
import type { Profile, UserRole } from "@/types/database"
import { getRoleDisplayName } from "@/lib/role-utils"

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('normal_user')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/admin/login')
        return
      }
      fetchUsers()
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    // Apply filters
    let filtered = users

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(query) ||
        u.business_name?.toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }, [users, roleFilter, searchQuery])

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

  const handleToggleBan = async (user: Profile) => {
    if (!supabase) return

    const confirmMessage = user.is_banned
      ? `Are you sure you want to UNBAN ${user.email}?`
      : `Are you sure you want to BAN ${user.email}? They will lose all access to the platform.`

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('id', user.id)

      if (error) {
        console.error('Error toggling ban status:', error)
        alert('Failed to update ban status. Please try again.')
        return
      }

      await fetchUsers()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleDeleteUser = async (user: Profile) => {
    if (!supabase) return

    const confirmMessage = `Are you sure you want to DELETE ${user.email}? This action CANNOT be undone!`
    if (!confirm(confirmMessage)) return

    try {
      // Deleting from profiles will cascade to auth.users due to foreign key
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user. Please try again.')
        return
      }

      await fetchUsers()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'importer':
        return 'bg-blue-100 text-blue-800'
      case 'wholesaler':
        return 'bg-green-100 text-green-800'
      case 'retailer':
        return 'bg-yellow-100 text-yellow-800'
      case 'normal_user':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return <AuthLoadingSpinner />
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

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by email or business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="importer">Importer</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="retailer">Retailer</option>
            <option value="normal_user">Normal User</option>
          </select>
        </div>
        <p className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {filteredUsers.length === 0 ? (
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
                    Status
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${user.is_banned ? 'bg-red-50' : ''}`}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.business_name || '-'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      {user.is_banned ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
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
                            className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm min-h-[40px]"
                          >
                            <option value="normal_user">Normal User</option>
                            <option value="retailer">Retailer</option>
                            <option value="wholesaler">Wholesaler</option>
                            <option value="importer">Importer</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={handleSaveRole}
                            className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 min-h-[40px]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-300 min-h-[40px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRole(user)}
                            className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 min-h-[40px]"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm min-h-[40px] ${
                              user.is_banned
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {user.is_banned ? 'Unban' : 'Ban'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="px-2 sm:px-3 py-1 bg-gray-800 text-white rounded-lg text-xs sm:text-sm hover:bg-gray-900 min-h-[40px]"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`border border-gray-200 rounded-lg p-4 space-y-3 ${
                  user.is_banned ? 'bg-red-50' : 'bg-white'
                }`}
              >
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {user.is_banned ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  {editingUser?.id === user.id ? (
                    <div className="space-y-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px]"
                      >
                        <option value="normal_user">Normal User</option>
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
                    <div className="space-y-2">
                      <button
                        onClick={() => handleEditRole(user)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 min-h-[44px]"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleToggleBan(user)}
                        className={`w-full px-3 py-2 rounded-lg text-sm min-h-[44px] ${
                          user.is_banned
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {user.is_banned ? 'Unban User' : 'Ban User'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 min-h-[44px]"
                      >
                        Delete User
                      </button>
                    </div>
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
