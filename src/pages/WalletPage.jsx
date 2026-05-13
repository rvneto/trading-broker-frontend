import usePageTitle from '../hooks/usePageTitle'

export default function WalletPage() {
  usePageTitle('wallet.title')
  return (
    <div className="p-6">
      <h1 className="text-[#f5f0e0] text-xl font-medium mb-1">Carteira</h1>
      <p className="text-[#6b6b6b] text-sm">Em construção...</p>
    </div>
  )
}
