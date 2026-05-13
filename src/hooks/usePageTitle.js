import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function usePageTitle(key) {
  const { t } = useTranslation()
  useEffect(() => {
    const el = document.getElementById('page-title')
    if (el) el.textContent = t(key)
    document.title = `${t(key)} — My Broker B3`
  }, [key, t])
}
