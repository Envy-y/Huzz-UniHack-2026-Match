import Stripe from 'stripe'

<<<<<<< HEAD
const key = process.env.STRIPE_SECRET_KEY
export const stripe = key ? new Stripe(key) : null
=======
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}
>>>>>>> 75203b0d24f8fb94272ad97b478df8951c042239
