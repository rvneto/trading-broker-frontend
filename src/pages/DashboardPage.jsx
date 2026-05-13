import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import usePageTitle from '../hooks/usePageTitle'
import { getWallet, getPositions } from '../services/walletService'
import { formatBRL, formatPercent, formatDate } from '../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const weekDays = {
  pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Hoje'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
}

const mockChartData = (lang) =>
  weekDays[lang] ? weekDays[lang].map((day, i) => ({
    day,
    value: 34000 + Math.round(Math.sin(i) * 3000 + i * 800),
  })) : []

export default function DashboardPage() {
  usePageTitle('dashboard.title')
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => getWallet(userId),
    enabled: !!userId,
  })

  const { data: positions, isLoading: loadingPositions } = useQuery({
    queryKey: ['positions', userId],
    queryFn: () => getPositions(userId),
    enabled: !!userId,
  })

  const balance = wallet?.balance ?? 0
  const totalPositionsValue = positions?.reduce(
    (acc, p) => acc + (p.currentPrice ?? p.averagePrice) * p.quantity, 0
  ) ?? 0
  const totalPatrimony = balance + totalPositionsValue
  const totalPnl = positions?.reduce(
    (acc, p) => acc + ((p.currentPrice ?? p.averagePrice) - p.averagePrice) * p.quantity, 0
  ) ?? 0
  const pnlPercent = totalPositionsValue > 0 ? (totalPnl / (totalPositionsValue - totalPnl)) * 100 : 0

  const chartData = mockChartData(i18n.language)

  const StatCard = ({ label, value, sub, gold, green, red }) => (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
      <div className="text-xs text-[#6b6b6b] mb-2">{label}</div>
      <div className={`text-xl font-medium ${gold ? 'text-[#d4a017]' : green ? 'text-green-400' : red ? 'text-red-400' : 'text-[#f5f0e0]'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#6b6b6b] mt-1">{sub}</div>}
    </div>
  )

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#1a1500] border border-[#d4a017] rounded-lg px-3 py-1.5">
          <p className="text-[#d4a017] text-xs font-medium">{formatBRL(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[#f5f0e0] text-lg font-medium mb-0.5">{t('dashboard.title')}</h1>
        <p className="text-[#6b6b6b] text-xs">{formatDate(i18n.language)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label={t('dashboard.balance')}
          value={loadingWallet ? '...' : formatBRL(balance)}
          sub={t('dashboard.balance_sub')}
          gold
        />
        <StatCard
          label={t('dashboard.patrimony')}
          value={loadingWallet || loadingPositions ? '...' : formatBRL(totalPatrimony)}
          sub={t('dashboard.patrimony_sub')}
        />
        <StatCard
          label="P&L total"
          value={loadingPositions ? '...' : formatBRL(totalPnl)}
          sub={loadingPositions ? '' : formatPercent(pnlPercent)}
          green={totalPnl >= 0}
          red={totalPnl < 0}
        />
        <StatCard
          label={t('dashboard.open_orders')}
          value={t('dashboard.coming_soon')}
          sub={t('dashboard.pending')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-[#f5f0e0]">{t('dashboard.patrimony_chart')}</span>
            <span className="text-xs text-[#d4a017]">7 {i18n.language === 'pt' ? 'dias' : 'days'}</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === chartData.length - 1 ? '#d4a017' : '#1a1500'}
                    stroke={i === chartData.length - 1 ? '#d4a017' : '#d4a017'}
                    strokeWidth={i === chartData.length - 1 ? 0 : 1.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-[#f5f0e0]">{t('dashboard.positions')}</span>
            <button
              onClick={() => navigate('/wallet')}
              className="text-xs text-[#d4a017] hover:opacity-80 transition-opacity"
            >
              {t('dashboard.see_all')} →
            </button>
          </div>

          {loadingPositions ? (
            <div className="text-[#6b6b6b] text-xs">{t('dashboard.loading')}</div>
          ) : !positions?.length ? (
            <div className="text-[#6b6b6b] text-xs">{t('dashboard.no_positions')}</div>
          ) : (
            positions.slice(0, 4).map((p) => {
              const current = p.currentPrice ?? p.averagePrice
              const pnlPct = ((current - p.averagePrice) / p.averagePrice) * 100
              const isUp = pnlPct >= 0
              return (
                <div key={p.ticker} className="flex justify-between items-center py-2 border-b border-[#1a1a1a] last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#f5f0e0]">{p.ticker}</div>
                    <div className="text-xs text-[#6b6b6b]">{p.quantity} {i18n.language === 'pt' ? 'cotas' : 'shares'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#f5f0e0]">{formatBRL(current)}</div>
                    <div className={`text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(pnlPct)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
