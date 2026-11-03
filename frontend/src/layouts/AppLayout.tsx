import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Briefcase, LayoutDashboard, LogOut, Menu, Search, Settings, Target, Users, X } from 'lucide-react'
import Logo from '../components/Logo'
import { cn } from '../components/ui/utils'
import { useAuthStore } from '../stores/auth.store'

const navigation = {
  recruiter: [
    { name: 'Dashboard', href: '/recruiter', icon: LayoutDashboard },
    { name: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
    { name: 'Pipeline', href: '/recruiter/pipeline', icon: Users },
    { name: 'Settings', href: '/recruiter/settings', icon: Settings },
  ],
  candidate: [
    { name: 'Dashboard', href: '/candidate', icon: LayoutDashboard },
    { name: 'Find Jobs', href: '/candidate/jobs', icon: Search },
    { name: 'Mock Interviews', href: '/candidate/mock-interviews', icon: Target },
    { name: 'Settings', href: '/candidate/settings', icon: Settings },
  ],
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export default function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [menuOpen, setMenuOpen] = useState(false)

  // RoleGuard guarantees a user; this only satisfies the type checker.
  if (!user) return null

  return (
    <div className="flex h-screen bg-[#fafbfc]">
      <aside
        className={cn(
          'bg-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform md:static md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-6">
          <Logo size="sm" className="text-white" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="text-sidebar-muted hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {navigation[user.role].map(({ name, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === `/${user.role}`}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                )
              }
            >
              <Icon size={20} />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="border-sidebar-border border-t p-4">
          <div className="mb-2 flex items-center gap-3 px-3 py-2">
            <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user.name}</div>
              <div className="text-sidebar-muted text-xs capitalize">{user.role}</div>
            </div>
          </div>
          <Link
            to="/login"
            onClick={logout}
            className="text-sidebar-muted hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-white"
          >
            <LogOut size={18} />
            Log out
          </Link>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Logo size="sm" className="text-gray-900" />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
