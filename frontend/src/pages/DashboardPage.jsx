import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, FileText, Users, Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import { StatCard, PageHeader, StatusBadge, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )

  const stats = data?.stats || {}

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Cases"     value={stats.totalCases}     icon={FolderOpen}  color="text-brand-500"  bg="bg-brand-50" />
        <StatCard label="Active Cases"    value={stats.activeCases}    icon={TrendingUp}  color="text-green-500"  bg="bg-green-50" />
        <StatCard label="Pending Cases"   value={stats.pendingCases}   icon={Clock}       color="text-yellow-500" bg="bg-yellow-50" />
        <StatCard label="Documents"       value={stats.totalDocuments} icon={FileText}    color="text-purple-500" bg="bg-purple-50" />
        {isAdmin && (
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="text-red-500" bg="bg-red-50" />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Cases</h2>
            <Link to="/cases" className="text-brand-500 hover:text-brand-600 text-xs font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentCases?.length === 0 ? (
              <div className="p-5 text-center text-gray-400 text-sm">No cases found</div>
            ) : data?.recentCases?.map(c => (
              <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">{c.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{c.caseNumber}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-gray-400">{format(new Date(c.updatedAt), 'MMM d')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity (admin only) */}
        {isAdmin && (
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Recent Activity</h2>
              <Link to="/audit" className="text-brand-500 hover:text-brand-600 text-xs font-medium">View logs →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {data?.recentLogs?.length === 0 ? (
                <div className="p-5 text-center text-gray-400 text-sm">No activity yet</div>
              ) : data?.recentLogs?.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-4">
                  <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity size={12} className="text-brand-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{log.user?.name}</span>
                      {' '}<span className="text-gray-500">{log.action.toLowerCase().replace('_', ' ')}</span>
                      {log.case && <span className="text-gray-500"> on <span className="font-mono text-xs">{log.case.caseNumber}</span></span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions for non-admins */}
        {!isAdmin && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/cases" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">
                <FolderOpen size={16} className="text-brand-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">View My Cases</div>
                  <div className="text-xs text-gray-500">Browse and manage assigned cases</div>
                </div>
              </Link>
              <Link to="/documents" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all">
                <FileText size={16} className="text-brand-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Upload Document</div>
                  <div className="text-xs text-gray-500">Add files to a case</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
