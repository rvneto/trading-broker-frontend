import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/authStore'

const navItems = [
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    to: '/orders',
    labelKey: 'nav.orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    to: '/wallet',
    labelKey: 'nav.wallet',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
]

export default function MainLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const toggleLanguage = () => {
    const next = i18n.language === 'pt' ? 'en' : 'pt'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">

      <header className="h-12 bg-[#111111] border-b border-[#2a2a2a] flex items-center justify-between pr-4 shrink-0">
        <div className="flex items-center h-full">
          <div className="w-14 h-12 border-r border-[#2a2a2a] flex items-center justify-center shrink-0">
            <div className="w-8 h-8 bg-[#d4a017] rounded-lg flex items-center justify-center text-[#0a0a0a] font-semibold text-xs">
              B³
            </div>
          </div>
          <span id="page-title" className="text-[#f5f0e0] font-medium text-sm ml-4" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="text-xs text-[#6b6b6b] hover:text-[#d4a017] border border-[#2a2a2a] hover:border-[#d4a017] rounded-lg px-2.5 py-1 transition-colors"
          >
            {i18n.language === 'pt' ? 'EN' : 'PT'}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#d4a017] flex items-center justify-center text-[#0a0a0a] font-semibold text-xs">
              {initials}
            </div>
            <span className="text-[#8a8a8a] text-xs hidden sm:block">{firstName}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        <nav className="w-14 bg-[#111111] border-r border-[#2a2a2a] flex flex-col items-center py-3 gap-1 shrink-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={t(item.labelKey)}
              className={({ isActive }) =>
                `w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-colors group ${
                  isActive
                    ? 'bg-[#1a1500] text-[#d4a017]'
                    : 'text-[#6b6b6b] hover:bg-[#1a1a1a] hover:text-[#f5f0e0]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon}
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-[#d4a017] mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <div className="flex-1" />

          <button
            onClick={handleLogout}
            title={t('nav.logout')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6b6b6b] hover:bg-[#1a1a1a] hover:text-red-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </nav>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
