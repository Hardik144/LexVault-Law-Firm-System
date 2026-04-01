import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Edit2, Trash2, Shield } from 'lucide-react'
import api from '../utils/api'
import {
  PageHeader, SearchInput, RoleBadge, Spinner,
  EmptyState, Alert, Modal, ConfirmDialog
} from '../components/ui'
import { format } from 'date-fns'

const ROLES = ['ADMIN', 'JUDGE', 'LAWYER', 'CLERK']

function UserModal({ open, onClose, user: editUser, onSaved }) {
  const isEdit = !!editUser
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CLERK' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editUser) setForm({ name: editUser.name, email: editUser.email, password: '', role: editUser.role })
    else setForm({ name: '', email: '', password: '', role: 'CLERK' })
    setError('')
  }, [editUser, open])

  const handleSave = async () => {
    if (!form.name || !form.email) return setError('Name and email are required.')
    if (!isEdit && !form.password) return setError('Password is required for new users.')
    setLoading(true); setError('')
    try {
      const payload = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password
      let result
      if (isEdit) {
        const { data } = await api.put(`/users/${editUser.id}`, payload)
        result = data.user
      } else {
        const { data } = await api.post('/users', { ...payload, password: form.password })
        result = data.user
      }
      onSaved(result, isEdit)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Create User'} maxWidth="max-w-md">
      <div className="space-y-4">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div>
          <label className="label">Full Name *</label>
          <input className="input" placeholder="John Doe" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email Address *</label>
          <input type="email" className="input" placeholder="user@lawfirm.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input type="password" className="input" placeholder="••••••••" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size={14} /> : <Shield size={14} />}
            {isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [alert, setAlert] = useState({ type: '', message: '' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const { data } = await api.get('/users', { params })
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }, [search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSaved = (user, isEdit) => {
    if (isEdit) {
      setUsers(p => p.map(u => u.id === user.id ? user : u))
      setAlert({ type: 'success', message: 'User updated successfully.' })
    } else {
      setUsers(p => [user, ...p])
      setAlert({ type: 'success', message: 'User created successfully.' })
    }
    setTimeout(() => setAlert({ type: '', message: '' }), 3000)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.delete(`/users/${deleteTarget.id}`)
      setUsers(p => p.filter(u => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      setAlert({ type: 'success', message: 'User deleted.' })
      setTimeout(() => setAlert({ type: '', message: '' }), 3000)
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Delete failed.' })
    } finally { setDeleteLoading(false) }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${total} user${total !== 1 ? 's' : ''} total`}
        actions={
          <button className="btn-primary" onClick={() => { setEditUser(null); setShowModal(true) }}>
            <Plus size={14} /> Add User
          </button>
        }
      />

      {alert.message && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
        <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Spinner size={24} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5}>
                <EmptyState icon={Users} title="No users found" subtitle="Create the first user to get started." />
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="table-row-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditUser(u); setShowModal(true) }}
                      className="text-gray-400 hover:text-brand-500 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditUser(null) }}
        user={editUser}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
