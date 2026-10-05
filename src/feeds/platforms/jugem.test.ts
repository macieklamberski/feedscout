import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
})

describe('jugemHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.jugem.jp'],
      [true, 'https://alice.jugem.jp/?eid=123'],
      [true, 'https://alice.jugem.cc'],
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
})
