export const NIVEIS = [
  { nome: 'Júnior I', xpMin: 0, xpMax: 9 },
  { nome: 'Júnior II', xpMin: 10, xpMax: 24 },
  { nome: 'Júnior III', xpMin: 25, xpMax: 44 },
  { nome: 'Pleno', xpMin: 45, xpMax: Infinity },
]

export function calcularNivel(xp) {
  return NIVEIS.find((n) => xp >= n.xpMin && xp <= n.xpMax) || NIVEIS[0]
}

export function calcularProgresso(xp) {
  const nivel = calcularNivel(xp)
  if (nivel.xpMax === Infinity) return 100
  const range = nivel.xpMax - nivel.xpMin + 1
  const earned = xp - nivel.xpMin
  return Math.round((earned / range) * 100)
}