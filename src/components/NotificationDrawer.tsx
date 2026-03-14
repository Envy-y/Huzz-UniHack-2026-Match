'use client'

import { trpc } from '@/lib/trpc'
import { X, Bell, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type Props = {
  open: boolean
  onClose: () => void
}

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationDrawer({ open, onClose }: Props) {
  const utils = trpc.useUtils()
  const router = useRouter()
  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery(undefined, { enabled: open })

  const respond = trpc.notifications.respond.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  })

  const unread = notifications.filter((n) => !n.is_read)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-sm z-[70] bg-white shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 h-14 flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-white" />
            <span className="text-white font-extrabold text-[16px]">Notifications</span>
            {unread.length > 0 && (
              <span className="bg-white/25 text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                {unread.length}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-56px)] pb-24">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-[14px] bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <Bell className="h-10 w-10 text-gray-200" />
              <p className="text-[14px] font-semibold text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 p-4">
              {notifications.map((n) => (
                <div
                  key={n.notification_id}
                  className={cn(
                    'rounded-[14px] border p-4',
                    n.is_read
                      ? 'bg-white border-gray-100'
                      : 'bg-[#f0fafa] border-[rgba(48,213,200,0.25)]'
                  )}
                >
                  {!n.is_read && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#30d5c8] mb-2" />
                  )}
                  <p className="text-[13px] text-[#333] leading-relaxed mb-1">{n.message}</p>
                  <p className="text-[11px] text-[#aaa] mb-3">{timeAgo(n.created_at)}</p>

                  {!n.is_read && (
                    <div className="flex gap-2">
                      {(n.lobby as any)?.match ? (
                        // Lobby-full notification — Pay Now or Leave
                        <>
                          <button
                            type="button"
                            disabled={respond.isPending}
                            onClick={() => {
                              respond.mutate({ notificationId: n.notification_id, action: 'stay' })
                              onClose()
                              router.push(`/payment?matchId=${(n.lobby as any).match.match_id}`)
                            }}
                            className="flex-1 py-2 rounded-xl text-[13px] font-bold bg-[#30d5c8] text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay Now
                          </button>
                          <button
                            type="button"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ notificationId: n.notification_id, action: 'leave' })}
                            className="flex-1 py-2 rounded-xl text-[13px] font-bold bg-[#ffeaea] text-[#bf1a00] disabled:opacity-50"
                          >
                            Leave
                          </button>
                        </>
                      ) : (
                        // Schedule-change notification — Stay or Leave
                        <>
                          <button
                            type="button"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ notificationId: n.notification_id, action: 'stay' })}
                            className="flex-1 py-2 rounded-xl text-[13px] font-bold bg-[#30d5c8] text-white disabled:opacity-50"
                          >
                            Stay
                          </button>
                          <button
                            type="button"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ notificationId: n.notification_id, action: 'leave' })}
                            className="flex-1 py-2 rounded-xl text-[13px] font-bold bg-[#ffeaea] text-[#bf1a00] disabled:opacity-50"
                          >
                            Leave
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
