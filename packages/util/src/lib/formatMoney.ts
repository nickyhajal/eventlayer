export const formatMoney = (
  amount: number,
  decimalCount: number = 2,
  decimal: string = '.',
  thousands: string = ',',
  currencySymbol: string = '$',
) => {
  if (typeof Intl === 'object') {
    let number = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
    if (decimalCount === 0) {
      number = number.replace('.00', '')
    }
    return number
  }
  // fallback if Intl is not present.
  try {
    const negativeSign = amount < 0 ? '-' : ''
    const amountNumber = Math.abs(Number(amount) || 0).toFixed(decimalCount)
    const i = parseInt(amountNumber, 10).toString()
    const j = i.length > 3 ? i.length % 3 : 0
    return (
      currencySymbol +
      negativeSign +
      (j ? i.substr(0, j) + thousands : '') +
      i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thousands}`) +
      (decimalCount
        ? decimal +
          Math.abs(+amountNumber - +i)
            .toFixed(decimalCount)
            .slice(2)
        : '')
    )
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
  return amount
}
