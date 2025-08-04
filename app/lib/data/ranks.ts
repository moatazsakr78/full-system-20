export interface Rank {
  id: string
  name: string
  icon: string
  order: number
}

export const ranks: Rank[] = [
  {
    id: 'bronze',
    name: 'برونزي (Bronze)',
    icon: '/assets/ranks/bronze.ico',
    order: 1
  },
  {
    id: 'silver',
    name: 'فضي (Silver)',
    icon: '/assets/ranks/silver.ico',
    order: 2
  },
  {
    id: 'gold',
    name: 'ذهبي (Gold)',
    icon: '/assets/ranks/gold.ico',
    order: 3
  },
  {
    id: 'plat',
    name: 'بلاتيني (Platinum)',
    icon: '/assets/ranks/plat.ico',
    order: 4
  },
  {
    id: 'diamond',
    name: 'ماسي (Diamond)',
    icon: '/assets/ranks/diamond.ico',
    order: 5
  },
  {
    id: 'ascendent',
    name: 'صاعد (Ascendent)',
    icon: '/assets/ranks/ascendent.ico',
    order: 6
  },
  {
    id: 'immortal',
    name: 'خالد (Immortal)',
    icon: '/assets/ranks/immortal.ico',
    order: 7
  },
  {
    id: 'radiant',
    name: 'مشع (Radiant)',
    icon: '/assets/ranks/radiant.ico',
    order: 8
  }
]