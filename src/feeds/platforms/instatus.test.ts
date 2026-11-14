import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  type InstatusUrl,
  instatusHandler,
  isInstatusHeaders,
  isInstatusHtml,
  parseInstatusUrl,
} from './instatus.js'

const instatusHtml = `
  <div class="custom-html-above-header"></div>
  <div class="custom-html-below-footer"></div>
`
const footerOnlyHtml = `
  <div class="custom-html-below-footer"></div>
`
const otherHtml = `
  <a href="https://instatus.com">Powered by Instatus</a>
`
const instatusHeaders = new Headers({ 'x-matched-path': '/[lang]/[url]/[type]/[userId]' })
const incidentHeaders = new Headers({ 'x-matched-path': '/[lang]/[url]/[type]/[userId]/[id]' })
const otherHeaders = new Headers({ 'x-matched-path': '/[slug]' })

describe('parseInstatusUrl', () => {
  it('should return the status page with its language', () => {
    const expected: InstatusUrl = { kind: 'status', language: 'zh-tw' }

    expect(parseInstatusUrl('https://status.example.com/zh-tw')).toEqual(expected)
  })

  it('should return the status page without a language for a script code', () => {
    const expected: InstatusUrl = { kind: 'status' }

    expect(parseInstatusUrl('https://status.example.com/zh-hant')).toEqual(expected)
  })

  it('should return the status page without a language for the root', () => {
    const expected: InstatusUrl = { kind: 'status' }

    expect(parseInstatusUrl('https://status.example.com/')).toEqual(expected)
  })

  it('should return the status page without a language for another path', () => {
    const expected: InstatusUrl = { kind: 'status' }

    expect(parseInstatusUrl('https://status.example.com/history')).toEqual(expected)
  })
})

describe('isInstatusHtml', () => {
  it('should return true for the custom HTML slots of the page template', () => {
    expect(isInstatusHtml(instatusHtml)).toBe(true)
  })

  it('should return false for one slot alone', () => {
    expect(isInstatusHtml(footerOnlyHtml)).toBe(false)
  })

  it('should return false for a page that only mentions the platform', () => {
    expect(isInstatusHtml(otherHtml)).toBe(false)
  })
})

describe('isInstatusHeaders', () => {
  it('should return true for the status page route', () => {
    expect(isInstatusHeaders(instatusHeaders)).toBe(true)
  })

  it('should return true for a route nested under the status page', () => {
    expect(isInstatusHeaders(incidentHeaders)).toBe(true)
  })

  it('should return false for another route', () => {
    expect(isInstatusHeaders(otherHeaders)).toBe(false)
  })

  it('should return false without the header', () => {
    expect(isInstatusHeaders(new Headers())).toBe(false)
  })
})

describe('instatusHandler', () => {
  describe('match', () => {
    it('should match a status page by its content', () => {
      expect(instatusHandler.match('https://status.example.com/', instatusHtml)).toBe(true)
    })

    it('should match a status page by its headers', () => {
      const value = instatusHandler.match('https://status.example.com/', '', instatusHeaders)

      expect(value).toBe(true)
    })

    it('should not match another status page', () => {
      const value = instatusHandler.match('https://status.example.com/', otherHtml, otherHeaders)

      expect(value).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(instatusHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the incident history feeds', () => {
      const value = 'https://status.example.com/default/cmsg8106700fq1aoau4cl0ddt'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://status.example.com/history.rss',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'rss' },
        },
        {
          uri: 'https://status.example.com/history.atom',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'atom' },
        },
      ]

      expect(instatusHandler.resolve(value)).toEqual(expected)
    })

    it('should return the translated incident history feeds', () => {
      const value = 'https://status.example.com/zh-tw/history/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://status.example.com/zh-tw/history.rss',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'rss' },
        },
        {
          uri: 'https://status.example.com/zh-tw/history.atom',
          hint: { key: 'instatus:history', label: 'Incident history', format: 'atom' },
        },
      ]

      expect(instatusHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.instatus.com/history.rss',
        { key: 'instatus:history', label: 'Incident history', format: 'rss' },
      ],
      [
        'https://example.instatus.com/history.atom',
        { key: 'instatus:history', label: 'Incident history', format: 'atom' },
      ],
      [
        'https://example.instatus.com/en-us/history.rss',
        { key: 'instatus:history', label: 'Incident history', format: 'rss' },
      ],
      [
        'https://example.instatus.com/de/history.atom',
        { key: 'instatus:history', label: 'Incident history', format: 'atom' },
      ],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(instatusHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed with www before the status subdomain', () => {
      const value = 'https://www.example.instatus.com/history.rss'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a page on a status subdomain', () => {
      const value = 'https://example.instatus.com/history'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed under a segment that is not a language', () => {
      const value = 'https://example.instatus.com/incidents/history.rss'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://status.example.com/history.rss'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://instatus.com/history.rss'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.instatus.com/history.rss'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.instatus.com/history.rss'

      expect(instatusHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriEntry['hint']]> = [
      [
        'https://example.instatus.com/history.rss',
        { key: 'instatus:history', label: 'Incident history', format: 'rss' },
      ],
      [
        'https://example.instatus.com/history.atom',
        { key: 'instatus:history', label: 'Incident history', format: 'atom' },
      ],
      [
        'https://example.instatus.com/en-us/history.rss',
        { key: 'instatus:history', label: 'Incident history', format: 'rss' },
      ],
      [
        'https://example.instatus.com/en-us/history.atom',
        { key: 'instatus:history', label: 'Incident history', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [instatusHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
