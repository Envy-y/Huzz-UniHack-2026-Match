'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Home, Search, PlusCircle, User, LogOut, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',        label: 'Home',       icon: Home       },
  { href: '/match',   label: 'Find Match', icon: Search     },
  { href: '/create',  label: 'Create',     icon: PlusCircle },
  { href: '/profile', label: 'Profile',    icon: User       },
]

function ShuttlecockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="25" rx="5" ry="4" fill="rgba(255,255,255,0.9)" />
      <ellipse cx="16" cy="23.5" rx="4" ry="2.5" fill="rgba(255,255,255,0.7)" />
      <line x1="16" y1="22" x2="10" y2="8"  stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="16" y1="22" x2="13" y2="7"  stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="6"  stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="16" y1="22" x2="19" y2="7"  stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="16" y1="22" x2="22" y2="8"  stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10 8 Q13 5 16 6 Q19 5 22 8" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" fill="rgba(255,255,255,0.18)" strokeLinecap="round" />
      <path d="M11.5 13 Q13.5 11 16 12 Q18.5 11 20.5 13" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── Desktop: white glass sticky navbar ── */}
      <nav className="hidden md:block sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:scale-105 group">
              <span className="text-2xl group-hover:animate-float">🏸</span>
              <span className="font-serif font-black text-xl bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
                Match.
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn('gap-2 transition-all duration-200', isActive ? 'bg-mint-50 text-mint-700 font-semibold' : 'text-gray-600 hover:text-mint-600')}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
              <div className="ml-2 pl-2 border-l border-gray-200">
                <Button variant="ghost" onClick={signOut} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile: mint header (§5) ── */}
      <div
        className="md:hidden sticky top-0 z-50"
        style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ShuttlecockIcon />
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
              className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Bell className="h-[17px] w-[17px] text-white" strokeWidth={2.5} />
              <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#30d5c8]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile: icon-only bottom tab bar (§8) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 shadow-lg">
        <div className="grid grid-cols-4 h-[72px] pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1"
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
    </>
  )
}
