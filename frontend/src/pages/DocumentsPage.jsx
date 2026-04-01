import { useState, useEffect } from 'react'
import { FileText, Upload, Download, Trash2, Plus } from 'lucide-react'
import api from '../utils/api'
import { PageHeader, SearchInput, Spinner, EmptyState, Alert, Modal } from '../components/ui'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const DOC_TYPES = ['EVIDENCE','ORDER','PLEADING','MOTION','BRIEF','CONTRACT','OTHER']

function UploadModal({ open, onClose, onUploaded }) {
  const [cases, setCases] = useState([])
  const [form, setForm] = useState({ caseId: '', type: 'OTHER' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      api.get('/cases', { params: { limit: 100 } }).then(r => setCases(r.data.cases))
    }
  }, [open])

  const handleUpload = async () => {
    if (!file) return setError('Please select a file.')
    if (!form.caseId) return setError('Please select a case.')
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('caseId', form.caseId)
      fd.append('type', form.type)
      const { data } = await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploaded(data.document)
      onClose()
      setFile(null)
      setForm({ caseId: '', type: 'OTHER' })
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document" maxWidth="max-w-md">
      <div className="space-y-4">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div>
          <label className="label">Case *</label>
          <select className="input" value={form.caseId} onChange={e => setForm(p => ({ ...p, caseId: e.target.value }))}>
            <option value="">— Select a case —</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Document Type</label>
          <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">File *</label>
          <input
            type="file"
            className="input py-1.5"
            onChange={e => setFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
          />
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              {file.name} — {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleUpload} disabled={loading}>
            {loading ? <Spinner size={14} /> : <Upload size={14} />}
            Upload
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState('')

  useEffect(() => {
    api.get('/cases', { params: { limit: 100 } }).then(r => setCases(r.data.cases))
  }, [])

  useEffect(() => {
    if (!selectedCase) {
      // Load recent docs from all accessible cases
      if (cases.length > 0) {
        const fetches = cases.slice(0, 10).map(c => api.get(`/documents/case/${c.id}`).then(r => r.data.documents))
        Promise.all(fetches)
          .then(results => {
            const all = results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setDocuments(all)
          })
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    } else {
      setLoading(true)
      api.get(`/documents/case/${selectedCase}`)
        .then(r => setDocuments(r.data.documents))
        .finally(() => setLoading(false))
    }
  }, [selectedCase, cases])

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${docId}`)
      setDocuments(p => p.filter(d => d.id !== docId))
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.')
    }
  }

  const filtered = documents.filter(d =>
    !search || d.originalName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${filtered.length} document${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <button className="btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={14} /> Upload Document
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search documents..." />
        <select
          className="input w-auto"
          value={selectedCase}
          onChange={e => setSelectedCase(e.target.value)}
        >
          <option value="">All Cases</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Filename</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded by</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Size</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center"><Spinner size={24} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState icon={FileText} title="No documents found" subtitle="Upload your first document to get started." />
              </td></tr>
            ) : filtered.map(doc => (
              <tr key={doc.id} className="table-row-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate max-w-xs">{doc.originalName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-purple-50 text-purple-700">{doc.type}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {doc.caseId?.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 text-gray-500">{doc.uploadedBy?.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">v{doc.version}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {doc.size < 1024 * 1024
                    ? `${(doc.size / 1024).toFixed(1)} KB`
                    : `${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/documents/download/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-500 hover:text-brand-600 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    {(user?.role === 'ADMIN' || doc.uploadedById === user?.id) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={doc => setDocuments(p => [doc, ...p])}
      />
    </div>
  )
}
