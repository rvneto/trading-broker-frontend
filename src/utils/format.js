export const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)

export const formatPercent = (value) => {
  const signal = value >= 0 ? '+' : ''
  return `${signal}${Number(value ?? 0).toFixed(2)}%`
}

export const formatDate = (locale) => {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}
