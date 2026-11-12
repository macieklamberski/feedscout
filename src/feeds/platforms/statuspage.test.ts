import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isStatuspageHeaders, isStatuspageHtml, statuspageHandler } from './statuspage.js'

const statuspageHtml = `
  <script src="https://dka575ofm4ao0.cloudfront.net/packs/runtime-f8635dba2422c4df0e0e.js"></script>
`
const otherHtml = `
  <div class="statuspage-green">All systems operational</div>
`
const statuspageHeaders = new Headers({ 'x-statuspage-version': '5a16926c8780' })
const otherHeaders = new Headers({ server: 'Vercel' })

describe('isStatuspageHtml', () => {
  it('should return true for the Statuspage asset host', () => {
    expect(isStatuspageHtml(statuspageHtml)).toBe(true)
  })

  it('should return false for another status page', () => {
    expect(isStatuspageHtml(otherHtml)).toBe(false)
  })
})

describe('isStatuspageHeaders', () => {
  it('should return true for the Statuspage version header', () => {
    expect(isStatuspageHeaders(statuspageHeaders)).toBe(true)
  })

  it('should return false for other headers', () => {
    expect(isStatuspageHeaders(otherHeaders)).toBe(false)
  })
})

describe('statuspageHandler', () => {
  describe('match', () => {
    it('should match a status page by its content', () => {
      expect(statuspageHandler.match('https://status.example.com/', statuspageHtml)).toBe(true)
    })

    it('should match a status page by its headers', () => {
      const value = statuspageHandler.match('https://status.example.com/', '', statuspageHeaders)

      expect(value).toBe(true)
    })

    it('should not match another status page', () => {
      const value = statuspageHandler.match('https://status.example.com/', otherHtml, otherHeaders)

      expect(value).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      const value = 'not-a-url'
      const expected: Array<DiscoverUriEntry> = []

      expect(statuspageHandler.resolve(value)).toEqual(expected)
    })

    it('should return the incident history feeds', () => {
      const value = 'https://status.example.com/incidents/abc123def456'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://status.example.com/history.rss',
          hint: { key: 'statuspage:history', label: 'Incident history', format: 'rss' },
        },
        {
          uri: 'https://status.example.com/history.atom',
          hint: { key: 'statuspage:history', label: 'Incident history', format: 'atom' },
        },
      ]

      expect(statuspageHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.statuspage.io/history.rss',
        { key: 'statuspage:history', label: 'Incident history', format: 'rss' },
      ],
      [
        'https://example.statuspage.io/history.atom',
        { key: 'statuspage:history', label: 'Incident history', format: 'atom' },
      ],
      [
        'http://example.statuspage.io/history.rss/',
        { key: 'statuspage:history', label: 'Incident history', format: 'rss' },
      ],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(statuspageHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page on a status page subdomain', () => {
      const value = 'https://example.statuspage.io/incidents/abc123def456'

      expect(statuspageHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://status.example.com/history.rss'

      expect(statuspageHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://statuspage.io/history.rss'

      expect(statuspageHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.statuspage.io/history.atom'

      expect(statuspageHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the history hint for a feed on www in front of a tenant', () => {
      const value = 'https://www.example.statuspage.io/history.rss'
      const expected: DiscoverUriHint = {
        key: 'statuspage:history',
        label: 'Incident history',
        format: 'rss',
      }

      expect(statuspageHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://status.example.statuspage.io/history.rss'

      expect(statuspageHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.statuspage.io/history.rss',
        { key: 'statuspage:history', label: 'Incident history', format: 'rss' },
      ],
      [
        'http://example.statuspage.io/history.atom',
        { key: 'statuspage:history', label: 'Incident history', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [statuspageHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
