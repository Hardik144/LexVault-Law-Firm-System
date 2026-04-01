import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, Lock, ChevronRight, Filter } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader, StatusBadge, SearchInput, Modal, Alert, Spinner, EmptyState } from '../components/ui'
import { format } from 'date-fns'

const STATUSES = ['', 'DRAFT', 'PENDING', 'ACTIVE', 'ON_HOLD', 'CLOSED']

function NewCaseModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'DRAFT', judgeId: '', isRestricted: false, lawyerIds: [] })
  const [judges, setJudges] = useState([])
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      api.get('/users/by-role/JUDGE').then(r => setJudges(r.data.users))
      api.get('/users/by-role/LAWYER').then(r => setLawyers(r.data.users))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required.')
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/cases', form)
      onCreated(data.case)
      onClose()
      setForm({ title: '', description: '', status: 'DRAFT', judgeId: '', isRestricted: false, lawyerIds: [] })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create case.')
    } finally {
      setLoading(false)
    }
  }

  const toggleLawyer = (id) => setForm(p => ({
    ...p,
    lawyerIds: p.lawyerIds.includes(id) ? p.lawyerIds.filter(x => x !== id) : [...p.lawyerIds, id]
  }))

  return (
    <Modal open={open} onClose={onClose} title="New Case" maxWidth="max-w-lg">
      <div className="space-y-4">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div>
          <label className="label">Case Title *</label>
          <input className="input" placeholder="e.g. Smith vs. Johnson" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Brief case description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign Judge</label>
            <select className="input" value={form.judgeId} onChange={e => setForm(p => ({ ...p, judgeId: e.target.value }))}>
              <option value="">— None —</option>
              {judges.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Assign Lawyers</label>
          <div className="border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
            {lawyers.length === 0 ? <p className="text-gray-400 text-xs p-1">No lawyers found</p> : lawyers.map(l => (
              <label key={l.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={form.lawyerIds.includes(l.id)} onChange={() => toggleLawyer(l.id)} className="rounded" />
                <span className="text-sm text-gray-700">{l.name}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isRestricted} onChange={e => setForm(p => ({ ...p, isRestricted: e.target.checked }))} className="rounded" />
          <span className="text-sm text-gray-700">Mark as restricted case</span>
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size={14} /> : <Plus size={14} />}
            Create Case
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function CasesPage() {
  const { hasRole } = useAuth()
  const [cases, setCases] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showNew, setShowNew] = useState(false)

  const fetchCases = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (search) params.search = search
      if (status) params.status = status
      const { data } = await api.get('/cases', { params })
      setCases(data.cases)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => { fetchCases() }, [fetchCases])

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle={`${total} case${total !== 1 ? 's' : ''} total`}
        actions={hasRole('ADMIN', 'CLERK', 'JUDGE') && (
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={14} /> New Case
          </button>
        )}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search cases..." />
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case Number</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Docs</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><Spinner size={24} /></td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={FolderOpen} title="No cases found" subtitle="Try changing your search or filters." />
              </td></tr>
            ) : cases.map(c => (
              <tr key={c.id} className="table-row-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{c.caseNumber}</span>
                    {c.isRestricted && <Lock size={10} className="text-red-400" />}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-gray-500">{c.judge?.name || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-500">{c._count?.documents ?? 0}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(c.updatedAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <Link to={`/cases/${c.id}`} className="text-brand-500 hover:text-brand-600">
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewCaseModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(c) => setCases(p => [c, ...p])}
      />
    </div>
  )
}
