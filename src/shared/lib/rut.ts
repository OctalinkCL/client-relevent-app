/**
 * Valida un RUT chileno en formato 12345678-9
 */
export function validateRut(rut: string): boolean {
  const clean = rut.replace(/\./g, '').replace(/-/g, '')
  if (clean.length < 2) return false

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1).toUpperCase()

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)

  return dv === expected
}

/**
 * Formatea un RUT al formato estándar: 12.345.678-9
 */
export function formatRut(rut: string): string {
  const clean = rut.replace(/\./g, '').replace(/-/g, '').replace(/\s/g, '')
  if (clean.length < 2) return rut

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}
