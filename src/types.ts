// Primitive domain types — all agents import from here, never redefine locally

export type Day        = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type TimeSlot   = 'M' | 'A' | 'N'
export type GameType   = 'S' | 'D'
export type Objective  = 'Competitive' | 'Social' | 'Casual'
export type LobbyStatus = 'Open' | 'Full' | 'Matched' | 'Cancelled'
export type MatchStatus = 'Confirmed' | 'Played' | 'Cancelled'

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MAX_VENUE_KM = 20
export const SKILL_MIN = 1
export const SKILL_MAX = 5
export const COURT_FEE_CENTS = 2000 // $20.00 AUD per booking
