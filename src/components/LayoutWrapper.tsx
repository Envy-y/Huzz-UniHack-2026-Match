'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show navbar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <>
      {!isAuthPage && <Navbar />}
      <div className={!isAuthPage ? 'pb-20 md:pb-0' : ''}>
        {children}
      </div>
    </>
  )
}
