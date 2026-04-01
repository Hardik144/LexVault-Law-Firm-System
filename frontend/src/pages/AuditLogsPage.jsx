import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Download } from 'lucide-react'
import api from '../utils/api'
import { PageHeader, SearchInput, Spinner, EmptyState } from '../components/ui'
import { format } from 'date-fns'

const ACTION_COLORS = {
  UPLOAD:          'bg-green-100 text-green-700',
  DOWNLOAD:        'bg-blue-100 text-blue-700',
  VIEW_DOCUMENTS:  'bg-gray-100 text-gray-600',
  DELETE:          'bg-red-100 text-red-700',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const LIMIT = 30

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (actionFilter) params.action = actionFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      const { data } = await api.get('/audit/logs', { params })
      setLogs(data.logs)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }, [page, actionFilter, dateFrom, dateTo])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle={`${total} log entries`}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          className="input w-auto"
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Actions</option>
          {['UPLOAD','DOWNLOAD','VIEW_DOCUMENTS','DELETE'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">From:</label>
          <input type="date" className="input w-auto" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">To:</label>
          <input type="date" className="input w-auto" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }} />
        </div>
        {(actionFilter || dateFrom || dateTo) && (
          <button
            className="btn-secondary text-xs"
            onClick={() => { setActionFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Document</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><Spinner size={24} /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={ClipboardList} title="No audit logs found" subtitle="Actions will appear here as users interact with the system." />
              </td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="table-row-hover">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                  {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-xs">{log.user?.name}</div>
                  <div className="text-gray-400 text-xs">{log.user?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{log.user?.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {log.case ? (
                    <span className="font-mono text-xs text-gray-500">{log.case.caseNumber}</span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  {log.document ? (
                    <span className="text-xs text-gray-500 truncate max-w-[180px] block">{log.document.originalName}</span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} — {total} total entries
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary text-xs py-1 px-3"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn-secondary text-xs py-1 px-3"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
