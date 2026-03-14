import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  title: string
  subtitle: string
  action?: { label: string; href: string }
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-32 h-32 mx-auto mb-4 opacity-60">
        <Image src="/broken-racquet.svg" alt="No lobbies" width={128} height={128} />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{subtitle}</p>
      {action && (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
