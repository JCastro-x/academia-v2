import { describe, expect, it } from 'vitest'
import { hasPushSubscriptionMismatch } from './supabase.js'

describe('push subscription reconciliation', () => {
  it('flags a missing or mismatched entry for the active browser subscription', () => {
    const activeSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/example',
      keys: {
        p256dh: 'p256dh-active',
        auth: 'auth-active',
      },
    }

    expect(hasPushSubscriptionMismatch(activeSubscription, [])).toBe(true)
    expect(hasPushSubscriptionMismatch(activeSubscription, [{
      endpoint: 'https://fcm.googleapis.com/fcm/send/other',
      p256dh: 'other-p256dh',
      auth: 'other-auth',
      is_active: true,
    }])).toBe(true)
    expect(hasPushSubscriptionMismatch(activeSubscription, [{
      endpoint: 'https://fcm.googleapis.com/fcm/send/example',
      p256dh: 'p256dh-active',
      auth: 'auth-active',
      is_active: true,
    }])).toBe(false)
  })
})
