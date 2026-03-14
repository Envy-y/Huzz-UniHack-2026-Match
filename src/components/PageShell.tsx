import { ReactNode } from 'react'

type PageShellProps = {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#f0fafa]">
      <main>{children}</main>
    </div>
  )
}
