import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Users, FileText } from 'lucide-react'
import api from '../utils/api'
import { PageHeader, Spinner } from '../components/ui'

const STATUS_COLORS = {
  DRAFT:   { bar: 'bg-gray-400',   label: 'text-gray-600' },
  PENDING: { bar: 'bg-yellow-400', label: 'text-yellow-700' },
  ACTIVE:  { bar: 'bg-green-500',  label: 'text-green-700' },
  ON_HOLD: { bar: 'bg-orange-400', label: 'text-orange-700' },
  CLOSED:  { bar: 'bg-red-400',    label: 'text-red-700' },
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs text-gray-500 font-medium text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-xs font-bold text-gray-700 text-right">{value}</div>
    </div>
  )
}

export default function ReportsPage() {
  const [statusReport, setStatusReport] = useState([])
  const [judgeReport, setJudgeReport] = useState([])
  const [activityReport, setActivityReport] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/cases-by-status'),
      api.get('/reports/cases-by-judge'),
      api.get('/reports/document-activity'),
    ]).then(([s, j, a]) => {
      setStatusReport(s.data.report)
      setJudgeReport(j.data.report)
      setActivityReport(a.data.report)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
  )

  const maxStatusCount = Math.max(...statusReport.map(r => r.count), 1)
  const maxJudgeTotal  = Math.max(...judgeReport.map(r => r.total), 1)
  const maxActivity    = Math.max(...activityReport.map(r => r._count.action), 1)

  const totalCases = statusReport.reduce((sum, r) => sum + r.count, 0)
  const totalDocs  = activityReport.reduce((sum, r) => sum + r._count.action, 0)

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Analytics and case statistics"
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
              <BarChart2 size={18} className="text-brand-500" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Total Cases</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalCases}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Active Cases</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {statusReport.find(r => r.status === 'ACTIVE')?.count ?? 0}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-purple-500" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Document Actions</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalDocs}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cases by Status */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-5">Cases by Status</h2>
          <div className="space-y-3">
            {statusReport.map(r => (
              <HorizontalBar
                key={r.status}
                label={r.status}
                value={r.count}
                max={maxStatusCount}
                color={STATUS_COLORS[r.status]?.bar || 'bg-gray-400'}
              />
            ))}
            {statusReport.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No data available</p>
            )}
          </div>
        </div>

        {/* Document Activity */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-5">Document Activity</h2>
          <div className="space-y-3">
            {activityReport.map(r => (
              <HorizontalBar
                key={r.action}
                label={r.action}
                value={r._count.action}
                max={maxActivity}
                color="bg-brand-500"
              />
            ))}
            {activityReport.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No document activity yet</p>
            )}
          </div>
        </div>

        {/* Cases by Judge */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 text-sm mb-5">Cases by Judge</h2>
          {judgeReport.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No judges assigned to cases</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-lg">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-l-lg">Judge</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Closed</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-r-lg">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {judgeReport.map(r => (
                    <tr key={r.judgeId} className="table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                            {r.judge?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{r.judge}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-900">{r.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-green-100 text-green-700">{r.active}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-red-100 text-red-700">{r.closed}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full transition-all duration-700"
                            style={{ width: `${(r.total / maxJudgeTotal) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
