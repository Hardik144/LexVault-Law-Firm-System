import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FolderOpen, FileText, Users,
  ClipboardList, BarChart2, LogOut, Scale, ChevronRight, Shield
} from 'lucide-react'

const ROLE_COLORS = {
  ADMIN: 'bg-red-100 text-red-700',
  JUDGE: 'bg-purple-100 text-purple-700',
  LAWYER: 'bg-blue-100 text-blue-700',
  CLERK: 'bg-gray-100 text-gray-700',
}

export default function Layout() {
  const { user, logout, isAdmin, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/cases', icon: FolderOpen, label: 'Cases' },
    { to: '/documents', icon: FileText, label: 'Documents' },
    { to: '/users', icon: Users, label: 'Users', guard: isAdmin },
    { to: '/audit', icon: ClipboardList, label: 'Audit Logs', guard: isAdmin },
    { to: '/reports', icon: BarChart2, label: 'Reports', guard: hasRole('ADMIN', 'JUDGE') },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Scale size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight">LexVault</div>
            <div className="text-gray-500 text-xs">Case Management</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, guard, exact }) => {
            if (guard === false) return null
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <span className={`badge text-xs ${ROLE_COLORS[user?.role]}`}>{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Shield size={14} className="text-brand-500" />
            <span className="ml-1">Secure Case Management Portal</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>System Online</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
