import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Location } from '@prisma/client'

export type AvailabilitySlot = {
  locationId: string
  date: string // 'YYYY-MM-DD'
  courtNumber: number
  startTime: string // 'HH:MM'
  endTime: string
  available: boolean
}

export async function scrapeAvailability(
  location: Location,
  startDate: string,
  _numDays: number
): Promise<AvailabilitySlot[]> {
  if (!location.location_scrape_link) return []

  let html: string
  try {
    const response = await axios.get(location.location_scrape_link, {
      timeout: 10_000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HuzzBot/1.0)' },
    })
    html = response.data
  } catch {
    // Site unreachable or JS-rendered — caller falls back to avl.csv
    console.warn(`Scrape failed for ${location.location_name}`)
    return []
  }

  const $ = cheerio.load(html)
  const slots: AvailabilitySlot[] = []

  // NOTE: Selector logic is site-specific and must be adapted per venue.
  // The structure below is a generic placeholder — update per actual site HTML.
  $('[data-court]').each((_i, el) => {
    const courtNumber = Number($(el).attr('data-court'))
    const timeText = $(el).attr('data-time') ?? ''
    const [startTime, endTime] = timeText.split('-')
    const available = !$(el).hasClass('booked')

    slots.push({
      locationId: location.location_id,
      date: startDate,
      courtNumber,
      startTime: startTime?.trim() ?? '',
      endTime: endTime?.trim() ?? '',
      available,
    })
  })

  return slots
}
