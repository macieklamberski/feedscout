import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  isZenfolioHeaders,
  isZenfolioHtml,
  parseZenfolioUrl,
  type ZenfolioUrl,
  zenfolioHandler,
} from './zenfolio.js'

const zenfolioHtml = `
  <link
    rel="stylesheet"
    href="https://cdn.zenfolio.com/zf/css/en-US/chrome/macosx/JRSZJJXEH7NK/layout.css"
    type="text/css"
  />
`
const zenfolioHeaders = new Headers({
  'set-cookie': 'zf_5y_visitor=K4ZaOLejE8yhYAsp4EZvFKxELKggAQ-x1LQX2QsES5yX; path=/',
})

describe('isZenfolioHtml', () => {
  it('should return true for a stylesheet on the Zenfolio asset path', () => {
    expect(isZenfolioHtml(zenfolioHtml)).toBe(true)
  })

  it('should return true for a protocol-relative stylesheet', () => {
    const value = '<link rel="stylesheet" href="//cdn.zenfolio.com/zf/css/layout.css">'

    expect(isZenfolioHtml(value)).toBe(true)
  })

  it('should return false for the asset path in text', () => {
    expect(isZenfolioHtml('<p>https://cdn.zenfolio.com/zf/css/layout.css</p>')).toBe(false)
  })

  it('should return false for the asset path in an anchor', () => {
    const value = '<a href="https://cdn.zenfolio.com/zf/css/layout.css">Gallery</a>'

    expect(isZenfolioHtml(value)).toBe(false)
  })

  it('should return false for the asset path inside another URL', () => {
    const value =
      '<link rel="stylesheet" href="https://cdn.example.com/?u=//cdn.zenfolio.com/zf/x.css">'

    expect(isZenfolioHtml(value)).toBe(false)
  })

  it('should return false for another stylesheet', () => {
    const value = '<link rel="stylesheet" href="https://cdn.example.com/zf/css/layout.css">'

    expect(isZenfolioHtml(value)).toBe(false)
  })
})

describe('isZenfolioHeaders', () => {
  it('should return true for the visitor cookie', () => {
    expect(isZenfolioHeaders(zenfolioHeaders)).toBe(true)
  })

  it('should return false for another cookie', () => {
    const value = new Headers({ 'set-cookie': 'zf_visitor=abc; path=/' })

    expect(isZenfolioHeaders(value)).toBe(false)
  })
})

describe('parseZenfolioUrl', () => {
  it('should return the site for a zenfolio.com subdomain', () => {
    const expected: ZenfolioUrl = { kind: 'site' }

    expect(parseZenfolioUrl('https://ctcphotography.zenfolio.com/')).toEqual(expected)
  })

  it('should return the site for a custom domain page', () => {
    const expected: ZenfolioUrl = { kind: 'site' }

    expect(parseZenfolioUrl('https://www.jennypodesta.com/p411800779')).toEqual(expected)
  })

  it('should return undefined for the zenfolio.com apex', () => {
    expect(parseZenfolioUrl('https://zenfolio.com/blog/')).toBeUndefined()
  })

  const serviceSubdomains: Array<string> = ['app', 'support', 'www']

  it.each(serviceSubdomains)('should return undefined for the %s subdomain', (value) => {
    expect(parseZenfolioUrl(`https://${value}.zenfolio.com/`)).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseZenfolioUrl('not-a-url')).toBeUndefined()
  })
})

describe('zenfolioHandler', () => {
  describe('match', () => {
    it('should match a zenfolio.com subdomain without content', () => {
      expect(zenfolioHandler.match('https://ctcphotography.zenfolio.com/')).toBe(true)
    })

    it('should match a custom domain by its stylesheet', () => {
      expect(zenfolioHandler.match('https://www.jennypodesta.com/', zenfolioHtml)).toBe(true)
    })

    it('should match a custom domain by its visitor cookie', () => {
      const value = 'https://www.jennypodesta.com/'

      expect(zenfolioHandler.match(value, '<html></html>', zenfolioHeaders)).toBe(true)
    })

    it('should not match a custom domain without a marker', () => {
      expect(zenfolioHandler.match('https://www.jennypodesta.com/', '<html></html>')).toBe(false)
    })

    it('should not match a Zenfolio service subdomain', () => {
      expect(zenfolioHandler.match('https://app.zenfolio.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site feeds from the origin', () => {
      const value = 'https://www.jennypodesta.com/p411800779'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.jennypodesta.com/recent.rss',
          hint: { key: 'zenfolio:recent', label: 'Recent galleries', format: 'rss' },
        },
        {
          uri: 'https://www.jennypodesta.com/recent.atom',
          hint: { key: 'zenfolio:recent', label: 'Recent galleries', format: 'atom' },
        },
        {
          uri: 'https://www.jennypodesta.com/featured.rss',
          hint: { key: 'zenfolio:featured', label: 'Featured galleries', format: 'rss' },
        },
        {
          uri: 'https://www.jennypodesta.com/featured.atom',
          hint: { key: 'zenfolio:featured', label: 'Featured galleries', format: 'atom' },
        },
        {
          uri: 'https://www.jennypodesta.com/blog.rss',
          hint: { key: 'zenfolio:blog', label: 'Blog', format: 'rss' },
        },
        {
          uri: 'https://www.jennypodesta.com/blog.atom',
          hint: { key: 'zenfolio:blog', label: 'Blog', format: 'atom' },
        },
      ]

      expect(zenfolioHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL that does not parse', () => {
      expect(zenfolioHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
