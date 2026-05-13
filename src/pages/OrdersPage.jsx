import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import usePageTitle from '../hooks/usePageTitle'
import { getOrders, createOrder } from '../services/orderService'
import { getAssets } from '../services/assetService'
import { getWallet } from '../services/walletService'
import { formatBRL, formatPercent } from '../utils/format'

const STATUS_FILTERS = ['ALL', 'PENDING', 'EXECUTED', 'REJECTED', 'CANCELLED']

const statusStyle = {
  PENDING:   { label: 'orders.status_pending',   cls: 'bg-yellow-950 text-yellow-400 border-yellow-800' },
  EXECUTED:  { label: 'orders.status_executed',  cls: 'bg-green-950 text-green-400 border-green-800' },
  REJECTED:  { label: 'orders.status_rejected',  cls: 'bg-red-950 text-red-400 border-red-800' },
  CANCELLED: { label: 'orders.status_cancelled', cls: 'bg-zinc-900 text-zinc-400 border-zinc-700' },
}

export default function OrdersPage() {
  usePageTitle('orders.title')
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [side, setSide] = useState('BUY')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: wallet } = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => getWallet(userId),
    enabled: !!userId,
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders', userId],
    queryFn: () => getOrders(userId),
    enabled: !!userId,
  })

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', userId])
      queryClient.invalidateQueries(['wallet', userId])
      setQuantity('')
      setPrice('')
      setSuccessMsg(t('orders.success'))
      setTimeout(() => setSuccessMsg(''), 4000)
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || t('orders.error_generic'))
      setTimeout(() => setErrorMsg(''), 4000)
    },
  })

  const selectedAsset = assets.find((a) => a.ticker === ticker)
  const unitPrice = price ? parseFloat(price.replace(',', '.')) : (selectedAsset?.currentPrice ?? 0)
  const qty = parseInt(quantity) || 0
  const total = unitPrice * qty
  const balance = wallet?.balance ?? 0
  const afterBalance = balance - total
  const insufficient = side === 'BUY' && qty > 0 && total > balance

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ticker || qty <= 0) return
    mutation.mutate({
      userId,
      ticker,
      side,
      quantity: qty,
      price: unitPrice,
    })
  }

  const formatDateTime = (iso) => {
    if (!iso) return '—'
    return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[#f5f0e0] text-lg font-medium mb-0.5">{t('orders.title')}</h1>
        <p className="text-[#6b6b6b] text-xs">{t('orders.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">

        <form onSubmit={handleSubmit} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-sm font-medium text-[#f5f0e0] mb-4">{t('orders.new_order')}</div>

          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 mb-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-[#6b6b6b] mb-0.5">{t('dashboard.balance')}</div>
              <div className="text-base font-medium text-[#d4a017]">{formatBRL(balance)}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>

          <div className="flex bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-0.5 mb-4">
            <button type="button" onClick={() => setSide('BUY')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${side === 'BUY' ? 'bg-green-950 text-green-400 border border-green-900' : 'text-[#6b6b6b] hover:text-[#f5f0e0]'}`}>
              {t('orders.buy')}
            </button>
            <button type="button" onClick={() => setSide('SELL')}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${side === 'SELL' ? 'bg-red-950 text-red-400 border border-red-900' : 'text-[#6b6b6b] hover:text-[#f5f0e0]'}`}>
              {t('orders.sell')}
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1.5">{t('orders.ticker')}</label>
              <select
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value)
                  const asset = assets.find((a) => a.ticker === e.target.value)
                  if (asset?.currentPrice) setPrice(String(asset.currentPrice))
                }}
                required
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f0e0] focus:outline-none focus:border-[#d4a017] transition-colors"
              >
                <option value="">{t('orders.select_asset')}</option>
                {assets.map((a) => (
                  <option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1.5">{t('orders.quantity')}</label>
              <input
                type="number" min="1" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required placeholder="0"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f0e0] placeholder-[#444] focus:outline-none focus:border-[#d4a017] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1.5">{t('orders.price')}</label>
              <input
                type="number" min="0.01" step="0.01" value={price}
                onChange={(e) => setPrice(e.target.value)}
                required placeholder="0,00"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#f5f0e0] placeholder-[#444] focus:outline-none focus:border-[#d4a017] transition-colors"
              />
            </div>
          </div>

          {qty > 0 && unitPrice > 0 && (
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-[#6b6b6b]">
                <span>{t('orders.quantity')}</span><span>{qty}</span>
              </div>
              <div className="flex justify-between text-xs text-[#6b6b6b]">
                <span>{t('orders.price')}</span><span>{formatBRL(unitPrice)}</span>
              </div>
              <div className="border-t border-[#2a2a2a] pt-1.5 flex justify-between text-sm font-medium">
                <span className="text-[#f5f0e0]">{t('orders.total')}</span>
                <span className={insufficient ? 'text-red-400' : 'text-[#d4a017]'}>{formatBRL(total)}</span>
              </div>
              {side === 'BUY' && (
                <div className={`flex justify-between text-xs pt-1 border-t border-[#2a2a2a] ${insufficient ? 'text-red-400' : 'text-green-400'}`}>
                  <span>{t('orders.balance_after')}</span>
                  <span>{formatBRL(afterBalance)}</span>
                </div>
              )}
            </div>
          )}

          {insufficient && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-900 rounded-lg px-3 py-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-red-400 text-xs">{t('orders.insufficient_balance')}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 bg-green-950 border border-green-900 rounded-lg px-3 py-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400 text-xs">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-900 rounded-lg px-3 py-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-red-400 text-xs">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || insufficient || !ticker || qty <= 0}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'BUY'
                ? 'bg-green-950 border border-green-900 text-green-400 hover:bg-green-900'
                : 'bg-red-950 border border-red-900 text-red-400 hover:bg-red-900'
            }`}
          >
            {mutation.isPending
              ? t('orders.sending')
              : side === 'BUY'
                ? t('orders.submit_buy')
                : t('orders.submit_sell')}
          </button>
        </form>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-[#f5f0e0]">{t('orders.history')}</span>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    filter === f
                      ? 'border-[#d4a017] text-[#d4a017] bg-[#1a1500]'
                      : 'border-[#2a2a2a] text-[#6b6b6b] hover:border-[#444]'
                  }`}>
                  {f === 'ALL' ? t('orders.filter_all') : t(statusStyle[f]?.label)}
                </button>
              ))}
            </div>
          </div>

          {loadingOrders ? (
            <div className="text-[#6b6b6b] text-xs py-4">{t('dashboard.loading')}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-[#6b6b6b] text-xs py-4">{t('orders.no_orders')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('orders.ticker')}</th>
                    <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('orders.side')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('orders.quantity')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('orders.price')}</th>
                    <th className="text-right text-[#6b6b6b] font-normal py-2 px-2">{t('orders.total')}</th>
                    <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('orders.status')}</th>
                    <th className="text-left text-[#6b6b6b] font-normal py-2 px-2">{t('orders.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const st = statusStyle[o.status] || statusStyle.PENDING
                    const orderPrice = o.executedPrice ?? o.price ?? 0
                    return (
                      <tr key={o.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
                        <td className="py-2.5 px-2 font-medium text-[#f5f0e0]">{o.ticker}</td>
                        <td className={`py-2.5 px-2 font-medium ${o.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {o.side === 'BUY' ? t('orders.buy') : t('orders.sell')}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{o.quantity}</td>
                        <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{formatBRL(orderPrice)}</td>
                        <td className="py-2.5 px-2 text-right text-[#f5f0e0]">{formatBRL(orderPrice * o.quantity)}</td>
                        <td className="py-2.5 px-2">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>
                            {t(st.label)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-[#6b6b6b]">{formatDateTime(o.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
