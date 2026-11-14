import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type GcsWebUrl, gcsWebHandler, isGcsWebPage, parseGcsWebUrl } from './gcsWeb.js'

const siteHtml = `
  <link
    rel="stylesheet"
    media="all"
    href="/sites/g/files/knoqqb12345/files/css/css_abc.css?delta=0&amp;language=en&amp;theme=nir_pid1234"
  >
`

describe('isGcsWebPage', () => {
  const url = 'https://investors.example.com/news'

  it('should return true for the site files path', () => {
    expect(isGcsWebPage(url, siteHtml)).toBe(true)
  })

  it('should return true for the site theme path', () => {
    const value =
      '<img src="/sites/g/files/knoqqb12345/themes/site/nir_pid1234/dist/images/logo.svg" alt="logo"/>'

    expect(isGcsWebPage(url, value)).toBe(true)
  })

  it('should return true for the site files path on the page host', () => {
    const value =
      '<link rel="stylesheet" href="https://investors.example.com/sites/g/files/knoqqb12345/files/css/css_abc.css">'

    expect(isGcsWebPage(url, value)).toBe(true)
  })

  it('should return false for the site files path on another host', () => {
    const value = '<img src="https://ir.example.net/sites/g/files/knoqqb12345/files/logo.png">'

    expect(isGcsWebPage(url, value)).toBe(false)
  })

  it('should return false for the site files path outside an asset attribute', () => {
    const value = '<p>/sites/g/files/knoqqb12345/files/logo.png</p>'

    expect(isGcsWebPage(url, value)).toBe(false)
  })

  it('should return false for another site factory files path', () => {
    const value = '<link rel="stylesheet" href="/sites/g/files/abcdef123/files/css/css_abc.css">'

    expect(isGcsWebPage(url, value)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isGcsWebPage(url, '')).toBe(false)
  })
})

describe('parseGcsWebUrl', () => {
  it('should return the site for a company subdomain', () => {
    const expected: GcsWebUrl = { kind: 'site' }

    expect(parseGcsWebUrl('https://example.gcs-web.com/news-releases')).toEqual(expected)
  })

  it('should return undefined for the apex', () => {
    expect(parseGcsWebUrl('https://gcs-web.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseGcsWebUrl('https://www.gcs-web.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseGcsWebUrl('https://www.example.gcs-web.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGcsWebUrl('https://example.com/')).toBeUndefined()
  })
})

describe('gcsWebHandler', () => {
  describe('match', () => {
    it('should match a company subdomain without content', () => {
      expect(gcsWebHandler.match('https://example.gcs-web.com/')).toBe(true)
    })

    it('should match a site on a company domain by the files path', () => {
      expect(gcsWebHandler.match('https://investors.example.com/', siteHtml)).toBe(true)
    })

    it('should not match a page linking the files path on another host', () => {
      const value = '<img src="https://ir.example.net/sites/g/files/knoqqb12345/files/logo.png">'

      expect(gcsWebHandler.match('https://blog.example.org/2024/post', value)).toBe(false)
    })

    it('should not match the www host carrying the marker', () => {
      expect(gcsWebHandler.match('https://www.gcs-web.com/', siteHtml)).toBe(false)
    })

    it('should not match another site', () => {
      expect(gcsWebHandler.match('https://example.com/', '<p>Investors</p>')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the three feeds for a company subdomain', () => {
      const value = 'https://example.gcs-web.com/news-releases'
      const expected = [
        {
          uri: 'https://example.gcs-web.com/rss/news-releases.xml',
          hint: { key: 'gcs-web:news-releases', label: 'News releases' },
        },
        {
          uri: 'https://example.gcs-web.com/rss/sec-filings.xml',
          hint: { key: 'gcs-web:sec-filings', label: 'SEC filings' },
        },
        {
          uri: 'https://example.gcs-web.com/rss/events.xml',
          hint: { key: 'gcs-web:events', label: 'Events' },
        },
      ]

      expect(gcsWebHandler.resolve(value)).toEqual(expected)
    })

    it('should return the three feeds from the origin of a company domain', () => {
      const value = 'https://www.example.com/investors/'
      const expected = [
        {
          uri: 'https://www.example.com/rss/news-releases.xml',
          hint: { key: 'gcs-web:news-releases', label: 'News releases' },
        },
        {
          uri: 'https://www.example.com/rss/sec-filings.xml',
          hint: { key: 'gcs-web:sec-filings', label: 'SEC filings' },
        },
        {
          uri: 'https://www.example.com/rss/events.xml',
          hint: { key: 'gcs-web:events', label: 'Events' },
        },
      ]

      expect(gcsWebHandler.resolve(value)).toEqual(expected)
    })

    it('should return the three feeds over http for a company subdomain', () => {
      const value = 'http://example.gcs-web.com/news-releases'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.gcs-web.com/rss/news-releases.xml',
          hint: { key: 'gcs-web:news-releases', label: 'News releases' },
        },
        {
          uri: 'http://example.gcs-web.com/rss/sec-filings.xml',
          hint: { key: 'gcs-web:sec-filings', label: 'SEC filings' },
        },
        {
          uri: 'http://example.gcs-web.com/rss/events.xml',
          hint: { key: 'gcs-web:events', label: 'Events' },
        },
      ]

      expect(gcsWebHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the news releases hint for the news releases feed', () => {
      const value = 'https://example.gcs-web.com/rss/news-releases.xml'
      const expected: DiscoverUriHint = { key: 'gcs-web:news-releases', label: 'News releases' }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the SEC filings hint for the SEC filings feed', () => {
      const value = 'https://example.gcs-web.com/rss/sec-filings.xml'
      const expected: DiscoverUriHint = { key: 'gcs-web:sec-filings', label: 'SEC filings' }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed', () => {
      const value = 'https://example.gcs-web.com/rss/events.xml'
      const expected: DiscoverUriHint = { key: 'gcs-web:events', label: 'Events' }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed over http', () => {
      const value = 'http://example.gcs-web.com/rss/events.xml'
      const expected: DiscoverUriHint = { key: 'gcs-web:events', label: 'Events' }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the SEC filings group hint for a feed filtered by item count and group', () => {
      const value = 'https://example.gcs-web.com/rss/sec-filings.xml?items=15&sub_group=4'
      const expected: DiscoverUriHint = {
        key: 'gcs-web:sec-filings-group',
        label: 'SEC filings group',
      }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news releases category hint for a feed filtered by category', () => {
      const value =
        'https://example.gcs-web.com/rss/news-releases.xml?category=Corporate%2FFinancial'
      const expected: DiscoverUriHint = {
        key: 'gcs-web:news-releases-category',
        label: 'News releases category',
      }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news releases hint for a feed sized by item count', () => {
      const value = 'https://example.gcs-web.com/rss/news-releases.xml?items=15'
      const expected: DiscoverUriHint = { key: 'gcs-web:news-releases', label: 'News releases' }

      expect(gcsWebHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a news releases page', () => {
      const value = 'https://example.gcs-web.com/news-releases'

      expect(gcsWebHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://gcs-web.com/rss/news-releases.xml'

      expect(gcsWebHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://www.example.gcs-web.com/rss/news-releases.xml'

      expect(gcsWebHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a company domain', () => {
      const value = 'https://investors.example.com/rss/news-releases.xml'

      expect(gcsWebHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.gcs-web.com/rss/news-releases.xml?items=15',
        { key: 'gcs-web:news-releases', label: 'News releases' },
      ],
      [
        'https://example.gcs-web.com/rss/sec-filings.xml',
        { key: 'gcs-web:sec-filings', label: 'SEC filings' },
      ],
      [
        'http://example.gcs-web.com/rss/sec-filings.xml?items=15&sub_group=4',
        { key: 'gcs-web:sec-filings-group', label: 'SEC filings group' },
      ],
      [
        'https://example.gcs-web.com/rss/news-releases.xml?category=Student+Loans&items=15',
        { key: 'gcs-web:news-releases-category', label: 'News releases category' },
      ],
      ['http://example.gcs-web.com/rss/events.xml', { key: 'gcs-web:events', label: 'Events' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [gcsWebHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
