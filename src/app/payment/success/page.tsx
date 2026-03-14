'use client'

import { PageShell } from '@/components/PageShell'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  return (
    <PageShell>
      <div className="max-w-lg mx-auto px-4 py-16 w-full flex flex-col items-center text-center gap-6">

        {/* Shuttlecock icon with ping */}
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-[#30d5c8]/15 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-2 rounded-full bg-[#30d5c8]/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
          <div className="animate-float relative z-10">
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="25" rx="5" ry="4" fill="#14b8a6" opacity="0.9" />
              <ellipse cx="16" cy="23.5" rx="4" ry="2.5" fill="#30d5c8" opacity="0.7" />
              <line x1="16" y1="22" x2="10" y2="8"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="16" y1="22" x2="13" y2="7"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="16" y1="22" x2="16" y2="6"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="16" y1="22" x2="19" y2="7"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="16" y1="22" x2="22" y2="8"  stroke="#0d9488" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M10 8 Q13 5 16 6 Q19 5 22 8" stroke="#14b8a6" strokeWidth="1.4" fill="rgba(48,213,200,0.18)" strokeLinecap="round" />
              <path d="M11.5 13 Q13.5 11 16 12 Q18.5 11 20.5 13" stroke="#30d5c8" strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-[26px] font-extrabold text-[#0d3d3a]">You're all set!</h1>
          <p className="text-[14px] text-[#888] mt-2 leading-relaxed">
            Payment confirmed. Your court is booked.<br />See you on the court!
          </p>
        </div>

        <div className="w-full bg-white rounded-[18px] border border-[rgba(48,213,200,0.20)] shadow-[0_2px_12px_rgba(48,213,200,0.08)] p-5">
          <p className="text-[12px] font-extrabold text-[#30d5c8] uppercase tracking-wider mb-1">What&apos;s next?</p>
          <p className="text-[13px] text-[#666] leading-relaxed">
            Head to the venue at your scheduled time. A confirmation summary has been saved to your match history.
          </p>
        </div>

        <Link
          href="/"
          className="w-full rounded-2xl py-[14px] text-[15px] font-extrabold text-white text-center transition-all duration-150 active:scale-[0.97]"
          style={{ background: 'linear-gradient(90deg, #30d5c8 0%, #1ab5aa 100%)' }}
        >
          Back to Home
        </Link>
      </div>
    </PageShell>
  )
}
