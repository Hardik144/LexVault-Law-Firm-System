import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckSquare, MessageSquare, Download, Trash2, Plus, Send, Lock } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, RoleBadge, TaskStatusBadge, Spinner, Alert, Modal } from '../components/ui'
import { format } from 'date-fns'

const TABS = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
]

function UploadDocModal({ open, onClose, caseId, onUploaded }) {
  const [file, setFile] = useState(null)
  const [type, setType] = useState('OTHER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async () => {
    if (!file) return setError('Please select a file.')
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('caseId', caseId)
      fd.append('type', type)
      const { data } = await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUploaded(data.document)
      onClose()
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Document" maxWidth="max-w-md">
      <div className="space-y-4">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div>
          <label className="label">Document Type</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            {['EVIDENCE','ORDER','PLEADING','MOTION','BRIEF','CONTRACT','OTHER'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">File</label>
          <input type="file" className="input py-1.5" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx" />
          {file && <p className="text-xs text-gray-500 mt-1">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleUpload} disabled={loading}>
            {loading ? <Spinner size={14} /> : null} Upload
          </button>
        </div>
      </div>
    </Modal>
  )
}

function AddTaskModal({ open, onClose, caseId, onAdded }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'TODO', dueDate: '' })
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/tasks', { ...form, caseId, dueDate: form.dueDate || null })
      onAdded(data.task)
      onClose()
      setForm({ title: '', description: '', status: 'TODO', dueDate: '' })
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Task" maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="label">Task Title *</label>
          <input className="input" placeholder="e.g. File initial pleadings" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {['TODO', 'IN_PROGRESS', 'DONE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd} disabled={loading}>
            {loading ? <Spinner size={14} /> : <Plus size={14} />} Add Task
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function CaseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('documents')
  const [showUpload, setShowUpload] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [comment, setComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    api.get(`/cases/${id}`)
      .then(r => setCaseData(r.data.case))
      .catch(err => setError(err.response?.data?.error || 'Failed to load case.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = (docId, name) => {
    window.open(`/api/documents/download/${docId}`, '_blank')
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${docId}`)
      setCaseData(p => ({ ...p, documents: p.documents.filter(d => d.id !== docId) }))
    } catch (err) { alert(err.response?.data?.error || 'Delete failed.') }
  }

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status })
      setCaseData(p => ({ ...p, tasks: p.tasks.map(t => t.id === taskId ? data.task : t) }))
    } catch (err) { console.error(err) }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setCaseData(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== taskId) }))
    } catch (err) { console.error(err) }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setCommentLoading(true)
    try {
      const { data } = await api.post('/comments', { caseId: id, content: comment })
      setCaseData(p => ({ ...p, comments: [data.comment, ...p.comments] }))
      setComment('')
    } catch (err) { console.error(err) } finally { setCommentLoading(false) }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`)
      setCaseData(p => ({ ...p, comments: p.comments.filter(c => c.id !== commentId) }))
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
  if (error) return <div className="p-6"><Alert type="error" message={error} /></div>
  if (!caseData) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link to="/cases" className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft size={18} /></Link>
        <div className="text-gray-400 text-sm">/</div>
        <span className="text-sm text-gray-500">Cases</span>
        <div className="text-gray-400 text-sm">/</div>
        <span className="text-sm font-medium text-gray-900 font-mono">{caseData.caseNumber}</span>
      </div>

      {/* Case header */}
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-gray-900">{caseData.title}</h1>
              {caseData.isRestricted && (
                <span className="flex items-center gap-1 badge bg-red-100 text-red-700"><Lock size={10} /> Restricted</span>
              )}
            </div>
            <div className="font-mono text-xs text-gray-400">{caseData.caseNumber}</div>
          </div>
          <StatusBadge status={caseData.status} />
        </div>
        {caseData.description && <p className="text-sm text-gray-600 mb-4">{caseData.description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-1">Judge</div>
            <div className="text-sm font-medium text-gray-900">{caseData.judge?.name || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Created by</div>
            <div className="text-sm font-medium text-gray-900">{caseData.creator?.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Assigned Lawyers</div>
            <div className="flex flex-wrap gap-1">
              {caseData.assignments?.filter(a => a.role === 'LAWYER').map(a => (
                <span key={a.id} className="badge bg-blue-50 text-blue-700 text-xs">{a.user.name}</span>
              ))}
              {caseData.assignments?.filter(a => a.role === 'LAWYER').length === 0 && <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Created</div>
            <div className="text-sm text-gray-700">{format(new Date(caseData.createdAt), 'MMM d, yyyy')}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setActiveTab(tid)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tid
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
            <span className="text-xs font-mono text-gray-400">
              {tid === 'documents' ? caseData.documents?.length :
               tid === 'tasks' ? caseData.tasks?.length :
               caseData.comments?.length}
            </span>
          </button>
        ))}
      </div>

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Documents</h3>
            <button className="btn-primary text-xs py-1.5" onClick={() => setShowUpload(true)}>
              <Plus size={12} /> Upload
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded by</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {caseData.documents?.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">No documents uploaded yet</td></tr>
              ) : caseData.documents?.map(doc => (
                <tr key={doc.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900 truncate max-w-xs">{doc.originalName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge bg-purple-50 text-purple-700">{doc.type}</span></td>
                  <td className="px-4 py-3 text-gray-500">{doc.uploadedBy?.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">v{doc.version}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDownload(doc.id, doc.originalName)} className="text-brand-500 hover:text-brand-600 transition-colors">
                        <Download size={14} />
                      </button>
                      {(user?.role === 'ADMIN' || doc.uploadedById === user?.id) && (
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-400 hover:text-red-600 transition-colors">
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
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Tasks</h3>
            <button className="btn-primary text-xs py-1.5" onClick={() => setShowAddTask(true)}>
              <Plus size={12} /> Add Task
            </button>
          </div>
          {['TODO', 'IN_PROGRESS', 'DONE'].map(statusGroup => {
            const groupTasks = caseData.tasks?.filter(t => t.status === statusGroup) || []
            return (
              <div key={statusGroup} className="border-b border-gray-100 last:border-0">
                <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                  <TaskStatusBadge status={statusGroup} />
                  <span className="text-xs text-gray-400">{groupTasks.length}</span>
                </div>
                {groupTasks.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">No tasks</div>
                ) : groupTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>}
                      {task.assignedTo && <div className="text-xs text-gray-400 mt-0.5">→ {task.assignedTo.name}</div>}
                      {task.dueDate && <div className="text-xs text-orange-500 mt-0.5">Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</div>}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"
                        value={task.status}
                        onChange={e => handleUpdateTaskStatus(task.id, e.target.value)}
                      >
                        {['TODO', 'IN_PROGRESS', 'DONE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Discussion tab */}
      {activeTab === 'discussion' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Discussion</h3>
          </div>
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button className="btn-primary px-3" onClick={handleAddComment} disabled={commentLoading || !comment.trim()}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {caseData.comments?.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No comments yet</div>
            ) : caseData.comments?.map(c => (
              <div key={c.id} className="flex gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                  {c.author?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{c.author?.name}</span>
                    <RoleBadge role={c.author?.role} />
                    <span className="text-xs text-gray-400 ml-auto">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
                {(c.authorId === user?.id || user?.role === 'ADMIN') && (
                  <button onClick={() => handleDeleteComment(c.id)} className="text-red-300 hover:text-red-500 flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <UploadDocModal open={showUpload} onClose={() => setShowUpload(false)} caseId={id} onUploaded={doc => setCaseData(p => ({ ...p, documents: [doc, ...p.documents] }))} />
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} caseId={id} onAdded={task => setCaseData(p => ({ ...p, tasks: [task, ...p.tasks] }))} />
    </div>
  )
}
