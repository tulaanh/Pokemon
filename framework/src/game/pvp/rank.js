// Bậc PvP luôn được suy ra từ ELO hiện tại, không lưu bản sao trong state.
export const PVP_RANKS = [
  { minElo: 0, name: 'Tân Binh', shortName: 'Tân Binh', icon: '◉', image: '/images/pvp/ranks/rookie.svg', tone: 'slate' },
  { minElo: 1100, name: 'Poké Ball', shortName: 'Poké Ball', icon: '●', image: '/images/pvp/ranks/poke-ball.svg', tone: 'red' },
  { minElo: 1300, name: 'Great Ball', shortName: 'Great Ball', icon: '◆', image: '/images/pvp/ranks/great-ball.svg', tone: 'blue' },
  { minElo: 1500, name: 'Ultra Ball', shortName: 'Ultra Ball', icon: '★', image: '/images/pvp/ranks/ultra-ball.svg', tone: 'amber' },
  { minElo: 1800, name: 'Master Ball', shortName: 'Master Ball', icon: '✦', image: '/images/pvp/ranks/master-ball.svg', tone: 'violet' },
]

export function getPvpRank(elo) {
  const value = Number(elo) || 0
  return [...PVP_RANKS].reverse().find((rank) => value >= rank.minElo) || PVP_RANKS[0]
}

export function getPvpRankFromElo(elo) {
  return getPvpRank(elo)
}