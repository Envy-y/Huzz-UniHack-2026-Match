'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Home, Search, PlusCircle, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/match', label: 'Find Match', icon: Search },
  { href: '/create', label: 'Create', icon: PlusCircle },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold transition-all duration-200 hover:scale-105 group"
          >
            <span className="text-2xl group-hover:animate-float">🏸</span>
            <span className="bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
              Match
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'gap-2 transition-all duration-200',
                      isActive
                        ? 'bg-mint-50 text-mint-700 font-semibold'
                        : 'text-gray-600 hover:text-mint-600'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Sign out */}
            <div className="ml-2 pl-2 border-l border-gray-200">
              <Button
                variant="ghost"
                onClick={signOut}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              onClick={signOut}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 w-full',
                    isActive
                      ? 'bg-mint-50 text-mint-700'
                      : 'text-gray-600 hover:text-mint-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
