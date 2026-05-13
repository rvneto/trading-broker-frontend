import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import useAuthStore from '../store/authStore'
import usePageTitle from '../hooks/usePageTitle'
import { getWallet, getPositions } from '../services/walletService'
import { formatBRL, formatPercent } from '../utils/format'

const COLORS = ['#d4a017', '#4ade80', '#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

export default function WalletPage() {
  usePageTitle('wallet.title')
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => getWallet(userId),
    enabled: !!userId,
  })

  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ['positions', userId],
    queryFn: () => getPositions(userId),
    enabled: !!userId,
  })

  const balance = wallet?.balance ?? 0

  const enriched = useMemo(() =>
    positions.map((p) => {
      const current = p.currentPrice ?? p.averagePrice
      const totalValue = current * p.quantity
      const pnl = (current - p.averagePrice) * p.quantity
      const pnlPct = ((current - p.averagePrice) / p.averagePrice) * 100
      return { ...p, current, totalValue, pnl, pnlPct }
    }), [positions])

  const totalPositionsValue = enriched.reduce((acc, p) => acc + p.totalValue, 0)
  const totalPatrimony = balance + totalPositionsValue
  const totalPnl = enriched.reduce((acc, p) => acc + p.pnl, 0)
  const totalPnlPct = totalPositionsValue > 0
    ? (totalPnl / (totalPositionsValue - totalPnl)) * 100
    : 0

  const pieData = useMemo(() => {
    const items = enriched.map((p) => ({
      name: p.ticker,
      value: p.totalValue,
    }))
    if (balance > 0) items.unshift({ name: t('dashboard.balance'), value: balance })
    return items
  }, [enriched, balance, t])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const pct = totalPatrimony > 0
        ? ((payload[0].value / totalPatrimony) * 100).toFixed(1)
        : '0'
      return (
        <div className="bg-[#1a1500] border border-[#d4a017] rounded-lg px-3 py-1.5">
          <p className="text-[#d4a017] text-xs font-medium">{payload[0].name}</p>
          <p className="text-[#f5f0e0] text-xs">{formatBRL(payload[0].value)} — {pct}%</p>
        </div>
      )
    }
    return null
  }

  const StatCard = ({ label, value, sub, gold, green, red, loading }) => (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
      <div className="text-xs text-[#6b6b6b] mb-2">{label}</div>
      <div className={`text-lg font-medium ${gold ? 'text-[#d4a017]' : green ? 'text-green-400' : red ? 'text-red-400' : 'text-[#f5f0e0]'}`}>
        {loading ? '...' : value}
      </div>
      {sub && <div className="text-xs text-[#6b6b6b] mt-1">{sub}</div>}
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[#f5f0e0] text-lg font-medium mb-0.5">{t('wallet.title')}</h1>
        <p className="text-[#6b6b6b] text-xs">{t('wallet.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label={t('dashboard.balance')}
          value={formatBRL(balance)}
          sub={t('dashboard.balance_sub')}
          gold
          loading={loadingWallet}
        />
        <StatCard
          label={t('wallet.positions_value')}
          value={formatBRL(totalPositionsValue)}
          sub={t('wallet.invested')}
          loading={loadingPositions}
        />
        <StatCard
          label={t('dashboard.patrimony')}
          value={formatBRL(totalPatrimony)}
          sub={t('dashboard.patrimony_sub')}
          loading={loadingWallet || loadingPositions}
        />
        <StatCard
          label="P&L total"
          value={formatBRL(totalPnl)}
          sub={formatPercent(totalPnlPct)}
          green={totalPnl >= 0}
          red={totalPnl < 0}
          loading={loadingPositions}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4">

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-sm font-medium text-[#f5f0e0] mb-4">{t('wallet.open_positions')}</div>

          {loadingPositions ? (
            <div className="text-[#6b6b6b] text-xs py-4">{t('dashboard.loading')}</div>
          ) : enriched.length === 0 ? (
            <div className="text-[#6b6b6b] text-xs py-4">{t('wallet.no_positions')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.asset')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.quantity')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.avg_price')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.current_price')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.total_value')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.pnl')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.pnl')} %</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((p) => (
                    <tr key={p.ticker} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-[#f5f0e0] text-sm">{p.ticker}</div>
                        {p.name && <div className="text-[#6b6b6b] text-xs mt-0.5">{p.name}</div>}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{p.quantity}</td>
                      <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{formatBRL(p.averagePrice)}</td>
                      <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{formatBRL(p.current)}</td>
                      <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{formatBRL(p.totalValue)}</td>
                      <td className={`py-2.5 px-2 text-right font-medium ${p.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {p.pnl >= 0 ? '+' : ''}{formatBRL(p.pnl)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                          p.pnlPct >= 0
                            ? 'bg-green-950 text-green-400 border-green-900'
                            : 'bg-red-950 text-red-400 border-red-900'
                        }`}>
                          {formatPercent(p.pnlPct)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-sm font-medium text-[#f5f0e0] mb-4">{t('wallet.distribution')}</div>

          {pieData.length === 0 ? (
            <div className="text-[#6b6b6b] text-xs">{t('wallet.no_positions')}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => {
                  const pct = totalPatrimony > 0
                    ? ((item.value / totalPatrimony) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-[#8a8a8a]">{item.name}</span>
                      </div>
                      <span className="text-xs text-[#f5f0e0]">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
