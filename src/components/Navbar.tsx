'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { NotificationDrawer } from '@/components/NotificationDrawer'

const navItems = [
  { href: '/',        label: 'Home',       icon: Home       },
  { href: '/match',   label: 'Find Match', icon: Search     },
  { href: '/create',  label: 'Create',     icon: PlusCircle },
  { href: '/profile', label: 'Profile',    icon: User       },
]


export function Navbar() {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: notifs = [] } = trpc.notifications.list.useQuery(undefined, { refetchInterval: 30000 })
  const unreadCount = notifs.filter((n: any) => !n.is_read).length

  return (
    <>
      {/* ── Top header ── */}
      <div
        className="sticky top-0 z-50"
        style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
      >
        <div className="flex h-[81px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/match_logo.png" alt="Match logo" className="h-[24px] w-[24px]" />
            <span className="font-serif font-black text-[24px] text-white tracking-[-0.5px]">
              Match<span className="opacity-55">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Search className="h-[17px] w-[17px] text-white" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Bell className="h-[17px] w-[17px] text-white" strokeWidth={2.5} />
              <span className={cn('absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#30d5c8]', unreadCount === 0 && 'hidden')} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom tab bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 shadow-lg">
        <div className="flex h-[72px] pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <Icon
                  className={cn('h-[26px] w-[26px] transition-colors duration-200', isActive ? 'text-mint-500' : 'text-gray-300')}
                  strokeWidth={1.8}
                />
                {isActive && <span className="w-1 h-1 rounded-full bg-mint-500" />}
              </Link>
            )
          })}
        </div>
      </div>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  )
}
