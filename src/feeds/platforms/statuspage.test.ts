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
    it('should return the incident history hint for the RSS feed of a status page', () => {
      const value = 'https://example.statuspage.io/history.rss'
      const expected: DiscoverUriHint = {
        key: 'statuspage:history',
        label: 'Incident history',
        format: 'rss',
      }

      expect(statuspageHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return the RSS feed of a status page as itself', async () => {
      const value = 'https://example.statuspage.io/history.rss'
      const hint: DiscoverUriHint = {
        key: 'statuspage:history',
        label: 'Incident history',
        format: 'rss',
      }
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
