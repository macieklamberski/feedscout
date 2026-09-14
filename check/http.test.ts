import { describe, expect, it } from 'bun:test'
import { isChallengePage, walledStatuses } from './http.js'

describe('isChallengePage', () => {
  it('should detect an Anubis challenge', () => {
    expect(isChallengePage('<div id="anubis_base_prefix"></div>')).toBe(true)
  })

  it('should detect a Cloudflare interstitial', () => {
    expect(isChallengePage('window._cf_chl_opt = {}')).toBe(true)
  })

  it('should pass a real page through', () => {
    expect(isChallengePage('<html><body>Recent entries</body></html>')).toBe(false)
  })
})

describe('walledStatuses', () => {
  it('should hold a refusal but not a missing page', () => {
    expect(walledStatuses.has(403)).toBe(true)
    expect(walledStatuses.has(404)).toBe(false)
  })
})
