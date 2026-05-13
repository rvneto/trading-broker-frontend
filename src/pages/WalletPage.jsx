import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import useAuthStore from '../store/authStore'
import usePageTitle from '../hooks/usePageTitle'
import { getWalletSummary, getPositions, getTransactions } from '../services/walletService'
import { formatBRL, formatPercent } from '../utils/format'

const COLORS = ['#d4a017', '#4ade80', '#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

const TX_FILTERS = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'RESERVE', 'SETTLEMENT', 'REFUND']

const txStyle = {
  DEPOSIT:    { cls: 'bg-green-950 text-green-400 border-green-900',   group: 'DEPOSIT' },
  WITHDRAWAL: { cls: 'bg-red-950 text-red-400 border-red-900',         group: 'WITHDRAWAL' },
  RESERVE:    { cls: 'bg-yellow-950 text-yellow-400 border-yellow-800', group: 'RESERVE' },
  SETTLEMENT: { cls: 'bg-blue-950 text-blue-400 border-blue-900',      group: 'SETTLEMENT' },
  REFUND:     { cls: 'bg-purple-950 text-purple-400 border-purple-900', group: 'REFUND' },
}

const txAmountColor = (type) => {
  if (type === 'DEPOSIT' || type === 'REFUND') return 'text-green-400'
  if (type === 'WITHDRAWAL' || type === 'SETTLEMENT') return 'text-red-400'
  return 'text-yellow-400'
}

const txSign = (type) => {
  if (type === 'DEPOSIT' || type === 'REFUND') return '+'
  return '-'
}

export default function WalletPage() {
  usePageTitle('wallet.title')
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [txFilter, setTxFilter] = useState('ALL')
  const [txSort, setTxSort] = useState('desc')

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['wallet-summary', userId],
    queryFn: () => getWalletSummary(userId),
    enabled: !!userId,
    retry: false,
  })

  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ['positions', userId],
    queryFn: () => getPositions(userId),
    enabled: !!userId,
    retry: false,
  })

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => getTransactions(userId),
    enabled: !!userId,
    retry: false,
  })

  const balance = summary?.availableBalance ?? 0
  const positionsValue = summary?.positionsValue ?? 0
  const totalEquity = summary?.totalEquity ?? 0

  const enriched = useMemo(() =>
    positions.map((p) => {
      const current = p.currentPrice ?? p.averagePrice
      const totalValue = current * p.quantity
      const pnl = (current - p.averagePrice) * p.quantity
      const pnlPct = ((current - p.averagePrice) / p.averagePrice) * 100
      return { ...p, current, totalValue, pnl, pnlPct }
    }), [positions])

  const totalPnl = enriched.reduce((acc, p) => acc + p.pnl, 0)
  const totalPnlPct = positionsValue > 0 ? (totalPnl / (positionsValue - totalPnl)) * 100 : 0

  const pieData = useMemo(() => {
    const items = enriched.map((p) => ({ name: p.ticker, value: p.totalValue }))
    if (balance > 0) items.unshift({ name: t('dashboard.balance'), value: balance })
    return items
  }, [enriched, balance, t])

  const filteredTx = useMemo(() => {
    let list = txFilter === 'ALL' ? transactions : transactions.filter((tx) => tx.transactionType === txFilter)
    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt), db = new Date(b.createdAt)
      return txSort === 'desc' ? db - da : da - db
    })
  }, [transactions, txFilter, txSort])

  const formatDateTime = (iso) => {
    if (!iso) return '—'
    return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso))
  }

  const txDescription = (tx) => {
    if (tx.transactionType === 'DEPOSIT') return t('wallet.tx_deposit')
    if (tx.transactionType === 'WITHDRAWAL') return t('wallet.tx_withdrawal')
    if (tx.orderId) return `${t(`wallet.tx_${tx.transactionType.toLowerCase()}`)} — ${t('wallet.tx_order')} #${tx.orderId}`
    return t(`wallet.tx_${tx.transactionType.toLowerCase()}`)
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const pct = totalEquity > 0 ? ((payload[0].value / totalEquity) * 100).toFixed(1) : '0'
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
        <StatCard label={t('dashboard.balance')} value={formatBRL(balance)} sub={t('dashboard.balance_sub')} gold loading={loadingSummary} />
        <StatCard label={t('wallet.positions_value')} value={formatBRL(positionsValue)} sub={t('wallet.invested')} loading={loadingSummary} />
        <StatCard label={t('dashboard.patrimony')} value={formatBRL(totalEquity)} sub={t('dashboard.patrimony_sub')} loading={loadingSummary} />
        <StatCard label="P&L total" value={formatBRL(totalPnl)} sub={formatPercent(totalPnlPct)} green={totalPnl >= 0} red={totalPnl < 0} loading={loadingPositions} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4 mb-4">
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
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${p.pnlPct >= 0 ? 'bg-green-950 text-green-400 border-green-900' : 'bg-red-950 text-red-400 border-red-900'}`}>
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
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => {
                  const pct = totalEquity > 0 ? ((item.value / totalEquity) * 100).toFixed(1) : '0'
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

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <span className="text-sm font-medium text-[#f5f0e0]">{t('wallet.tx_history')}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTxSort(txSort === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#d4a017] border border-[#2a2a2a] hover:border-[#d4a017] rounded-lg px-2.5 py-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={txSort === 'desc'
                  ? "M3 4h13M3 8h9M3 12h5m10 4l-4-4m4 4l4-4"
                  : "M3 4h13M3 8h9M3 12h5m10-4l-4 4m4-4l4 4"} />
              </svg>
              {txSort === 'desc' ? t('wallet.sort_newest') : t('wallet.sort_oldest')}
            </button>
            <div className="flex gap-1.5 flex-wrap">
              {TX_FILTERS.map((f) => (
                <button key={f} onClick={() => setTxFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    txFilter === f
                      ? 'border-[#d4a017] text-[#d4a017] bg-[#1a1500]'
                      : 'border-[#2a2a2a] text-[#6b6b6b] hover:border-[#444]'
                  }`}>
                  {f === 'ALL' ? t('orders.filter_all') : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingTx ? (
          <div className="text-[#6b6b6b] text-xs py-4">{t('dashboard.loading')}</div>
        ) : filteredTx.length === 0 ? (
          <div className="text-[#6b6b6b] text-xs py-4">{t('wallet.no_transactions')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.tx_type')}</th>
                  <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.tx_desc')}</th>
                  <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.tx_amount')}</th>
                  <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('wallet.tx_date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => {
                  const st = txStyle[tx.transactionType] || txStyle.DEPOSIT
                  const color = txAmountColor(tx.transactionType)
                  const sign = txSign(tx.transactionType)
                  return (
                    <tr key={tx.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
                      <td className="py-2.5 px-2">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-[#6b6b6b]">{txDescription(tx)}</td>
                      <td className={`py-2.5 px-2 text-right font-medium ${color}`}>
                        {sign}{formatBRL(Math.abs(tx.amount))}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#6b6b6b]">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
