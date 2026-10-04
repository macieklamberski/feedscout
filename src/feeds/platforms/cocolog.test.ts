import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { cocologHandler } from './cocolog.js'

const homeContent = `
  <link
    rel="EditURI"
    type="application/rsd+xml"
    href="https://app.cocolog-nifty.com/t/rsd/47230"
  />
  <link
    rel="alternate"
    media="handheld"
    href="http://app.m-cocolog.jp/t/typecast/47230/46630"
  />
  <link
    rel="alternate"
    type="application/atom+xml"
    title="Atom"
    href="http://example.cocolog-nifty.com/index/atom.xml"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="RSS"
    href="http://example.cocolog-nifty.com/index/index.rdf"
  />
`

describe('cocologHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.cocolog-nifty.com/blog/'],
      [true, 'https://example.cocolog-nifty.com/blog/2024/01/post-1a2b.html'],
      [true, 'http://example.air-nifty.com/consulting/cat12345/index.html'],
      [true, 'http://example.way-nifty.com/diary/'],
      [false, 'https://example.cocolog-nifty.com/'],
      [false, 'https://example.cocolog-nifty.com/.shared/js/ax.js'],
      [false, 'https://example.cocolog-nifty.com/about.html'],
      [false, 'https://www.cocolog-nifty.com/blog/'],
      [false, 'https://app.cocolog-nifty.com/t/app/'],
      [false, 'https://app.f.cocolog-nifty.com/t/rsd/335263'],
      [false, 'https://cocolog-nifty.com/blog/'],
      [false, 'https://example.com/blog/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(cocologHandler.match(url)).toBe(expected)
    })

    it('should return true for the home page linking its blog feeds', () => {
      expect(cocologHandler.match('https://example.cocolog-nifty.com/', homeContent)).toBe(true)
    })

    it('should return false for the home page linking feeds on another host', () => {
      const value = `
        <link
          rel="alternate"
          type="application/rss+xml"
          href="http://other.cocolog-nifty.com/blog/index.rdf"
        />
      `

      expect(cocologHandler.match('https://example.cocolog-nifty.com/', value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feeds of the blog in the URL', () => {
      const value = 'https://example.cocolog-nifty.com/consulting/2024/01/post-1a2b.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.cocolog-nifty.com/consulting/atom.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/consulting/index.rdf',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/consulting/rss.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(cocologHandler.resolve(value)).toEqual(expected)
    })

    it('should return the posts feeds of the blog the home page links', () => {
      const value = 'https://example.cocolog-nifty.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.cocolog-nifty.com/index/atom.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/index/index.rdf',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/index/rss.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(cocologHandler.resolve(value, homeContent)).toEqual(expected)
    })

    it('should return empty array for the home page without feed links', () => {
      expect(cocologHandler.resolve('https://example.cocolog-nifty.com/')).toEqual([])
    })
  })
})
