import { describe, expect, it } from 'bun:test'
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
  })
})
