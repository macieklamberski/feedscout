import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isJugemHtml, type JugemUrl, jugemHandler, parseJugemUrl } from './jugem.js'

const faviconHtml = `
  <link
    rel="shortcut icon"
    href="https://imaging.jugem.jp/portal/img/favicon.ico"
  />
`
const cookieScriptHtml = `
  <script
    type="text/javascript"
    src="./template/js/cookie.js"
  ></script>
`

describe('isJugemHtml', () => {
  it('should return true for the favicon on imaging.jugem.jp', () => {
    expect(isJugemHtml(faviconHtml)).toBe(true)
  })

  it('should return true for the cookie script', () => {
    expect(isJugemHtml(cookieScriptHtml)).toBe(true)
  })

  it('should return false for another page', () => {
    expect(isJugemHtml('<link rel="icon" href="https://example.com/favicon.ico" />')).toBe(false)
  })

  it('should return true for a script on imaging.jugem.jp', () => {
    const value = '<script src="https://imaging.jugem.jp/template/js/cookie.js"></script>'

    expect(isJugemHtml(value)).toBe(true)
  })

  it('should return false for a post image on imaging.jugem.jp', () => {
    const value = `
      <meta property="og:image" content="https://imaging.jugem.jp/portal/img/favicon.ico" />
      <img src="https://imaging.jugem.jp/portal/img/favicon.ico" />
    `

    expect(isJugemHtml(value)).toBe(false)
  })
})

describe('parseJugemUrl', () => {
  it('should return the blog for a jugem.jp blog subdomain', () => {
    const expected: JugemUrl = { kind: 'blog', blog: 'myblog' }

    expect(parseJugemUrl('https://myblog.jugem.jp/')).toEqual(expected)
  })

  it('should return the blog for a jugem.cc blog subdomain', () => {
    const expected: JugemUrl = { kind: 'blog', blog: 'myblog' }

    expect(parseJugemUrl('https://myblog.jugem.cc/')).toEqual(expected)
  })

  it('should return a custom domain for another host', () => {
    const expected: JugemUrl = { kind: 'customDomain' }

    expect(parseJugemUrl('http://blog.example.com/')).toEqual(expected)
  })

  it('should return undefined for the www portal', () => {
    expect(parseJugemUrl('https://www.jugem.jp/')).toBeUndefined()
  })

  it('should return undefined for the apex portal', () => {
    expect(parseJugemUrl('https://jugem.jp/')).toBeUndefined()
  })

  it('should return the theme for a portal theme page', () => {
    const value = 'http://jugem.jp/theme/c12/3456/'
    const expected: JugemUrl = { kind: 'theme', category: 'c12', theme: '3456' }

    expect(parseJugemUrl(value)).toEqual(expected)
  })

  it('should return undefined for a theme path without a category prefix', () => {
    const value = 'http://jugem.jp/theme/12/3456/'

    expect(parseJugemUrl(value)).toBeUndefined()
  })
})

describe('jugemHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.jugem.jp'],
      [true, 'https://alice.jugem.jp/?eid=123'],
      [true, 'https://alice.jugem.cc'],
      [true, 'http://jugem.jp/theme/c12/3456/'],
      [false, 'https://www.jugem.jp'],
      [false, 'https://blog.alice.jugem.jp'],
      [false, 'https://jugem.jp'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(jugemHandler.match(url)).toBe(expected)
    })

    it('should match a custom domain carrying the marker', () => {
      expect(jugemHandler.match('http://blog.example.com/', faviconHtml)).toBe(true)
    })

    it('should not match the jugem.jp portal carrying the marker', () => {
      expect(jugemHandler.match('https://jugem.jp/', faviconHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the portal host', () => {
      expect(jugemHandler.resolve('https://www.jugem.jp/')).toEqual([])
    })

    it('should return RSS 1.0 and Atom feeds for blog', () => {
      const value = 'https://alice.jugem.jp/?cid=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.jugem.jp/?mode=rss',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://alice.jugem.jp/?mode=atom',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(jugemHandler.resolve(value)).toEqual(expected)
    })

    it('should return the theme feed for a portal theme page', () => {
      const value = 'https://jugem.jp/theme/c12/3456/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://jugem.jp/theme/c12/3456/rss',
          hint: { key: 'jugem:theme', label: 'Theme', format: 'rdf' },
        },
      ]

      expect(jugemHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS 1.0 and Atom feeds for custom domain', () => {
      const value = 'http://blog.example.com/?eid=1029'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://blog.example.com/?mode=rss',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'http://blog.example.com/?mode=atom',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(jugemHandler.resolve(value, faviconHtml)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for an RSS 1.0 feed', () => {
      const value = 'https://alice.jugem.jp/?mode=rss'
      const expected: DiscoverUriHint = { key: 'jugem:posts', label: 'Posts', format: 'rdf' }

      expect(jugemHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://alice.jugem.jp/?mode=atom'
      const expected: DiscoverUriHint = { key: 'jugem:posts', label: 'Posts', format: 'atom' }

      expect(jugemHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an http feed on jugem.cc', () => {
      const value = 'http://alice.jugem.cc/?mode=rss'
      const expected: DiscoverUriHint = { key: 'jugem:posts', label: 'Posts', format: 'rdf' }

      expect(jugemHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an index.rdf feed', () => {
      const value = 'https://alice.jugem.jp/index.rdf'
      const expected: DiscoverUriHint = { key: 'jugem:posts', label: 'Posts', format: 'rdf' }

      expect(jugemHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an atom.xml feed', () => {
      const value = 'https://alice.jugem.jp/atom.xml'
      const expected: DiscoverUriHint = { key: 'jugem:posts', label: 'Posts', format: 'atom' }

      expect(jugemHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the theme hint for a theme feed', () => {
      const value = 'https://jugem.jp/theme/c12/3456/rss'
      const expected: DiscoverUriHint = { key: 'jugem:theme', label: 'Theme', format: 'rdf' }

      expect(jugemHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a theme page', () => {
      const value = 'http://jugem.jp/theme/c12/3456/'

      expect(jugemHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://alice.jugem.jp/?eid=123'

      expect(jugemHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed query on the apex portal', () => {
      const value = 'https://jugem.jp/?mode=rss'

      expect(jugemHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed query on the www portal', () => {
      const value = 'https://www.jugem.jp/?mode=atom'

      expect(jugemHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed query on a nested subdomain', () => {
      const value = 'https://blog.alice.jugem.jp/?mode=rss'

      expect(jugemHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'http://blog.example.com/?mode=rss'

      expect(jugemHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.jugem.jp/?mode=rss', { key: 'jugem:posts', label: 'Posts', format: 'rdf' }],
      ['http://alice.jugem.jp/?mode=atom', { key: 'jugem:posts', label: 'Posts', format: 'atom' }],
      ['https://alice.jugem.cc/?mode=atom', { key: 'jugem:posts', label: 'Posts', format: 'atom' }],
      ['https://alice.jugem.jp/index.rdf', { key: 'jugem:posts', label: 'Posts', format: 'rdf' }],
      ['http://alice.jugem.jp/atom.xml', { key: 'jugem:posts', label: 'Posts', format: 'atom' }],
      ['http://jugem.jp/theme/c12/3456/rss', { key: 'jugem:theme', label: 'Theme', format: 'rdf' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [jugemHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
