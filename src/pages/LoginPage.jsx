import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { login, register } from '../services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        const data = await login(email, password)
        setAuth(data.user, data.token)
        navigate('/dashboard')
      } else {
        await register(name, email, password)
        setTab('login')
        setError('')
        setEmail('')
        setPassword('')
        setName('')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-[#d4a017] rounded-lg flex items-center justify-center text-[#0a0a0a] font-medium text-sm">
            B³
          </div>
          <div>
            <div className="text-[#f5f0e0] font-medium text-lg">My Broker B3</div>
            <div className="text-[#6b6b6b] text-xs">Simulador de corretora</div>
          </div>
        </div>

        <div className="w-8 h-0.5 bg-[#d4a017] rounded mx-auto mb-8" />

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-8">

          <div className="flex bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-0.5 mb-6">
            <button
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                tab === 'login'
                  ? 'bg-[#d4a017] text-[#0a0a0a] font-medium'
                  : 'text-[#6b6b6b] hover:text-[#f5f0e0]'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                tab === 'register'
                  ? 'bg-[#d4a017] text-[#0a0a0a] font-medium'
                  : 'text-[#6b6b6b] hover:text-[#f5f0e0]'
              }`}
            >
              Criar conta
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-900 rounded-lg px-3 py-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {tab === 'register' && (
              <div>
                <label className="block text-xs text-[#8a8a8a] mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f0e0] placeholder-[#444] focus:outline-none focus:border-[#d4a017] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f0e0] placeholder-[#444] focus:outline-none focus:border-[#d4a017] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f0e0] placeholder-[#444] focus:outline-none focus:border-[#d4a017] transition-colors"
              />
            </div>

            {tab === 'login' && (
              <div className="text-right">
                <span className="text-xs text-[#d4a017] opacity-80 cursor-pointer hover:opacity-100">
                  Esqueci minha senha
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4a017] hover:bg-[#e8b420] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-medium text-sm py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading
                ? 'Aguarde...'
                : tab === 'login'
                  ? 'Entrar na plataforma'
                  : 'Criar minha conta'}
            </button>

          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-xs text-[#444]">ou</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          <p className="text-center text-xs text-[#555]">
            {tab === 'login' ? (
              <>Não tem conta?{' '}
                <button onClick={() => { setTab('register'); setError('') }} className="text-[#d4a017] hover:opacity-80">
                  Registre-se gratuitamente
                </button>
              </>
            ) : (
              <>Já tem conta?{' '}
                <button onClick={() => { setTab('login'); setError('') }} className="text-[#d4a017] hover:opacity-80">
                  Faça login
                </button>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  )
}
