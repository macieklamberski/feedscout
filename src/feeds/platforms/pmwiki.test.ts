import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isPmwikiHtml, type PmwikiUrl, parsePmwikiUrl, pmwikiHandler } from './pmwiki.js'

const pmwikiHtml = `
  <head>
    <title>Example Wiki | Main / HomePage</title>
    <!--HTMLHeader-->
  </head>
`
const otherHtml = `
  <html>
    <head>
      <meta
        name="generator"
        content="MediaWiki"
      >
    </head>
  </html>
`

describe('isPmwikiHtml', () => {
  it('should return true for the header directive comment', () => {
    expect(isPmwikiHtml(pmwikiHtml)).toBe(true)
  })

  it('should return false for other wiki software', () => {
    expect(isPmwikiHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPmwikiHtml('')).toBe(false)
  })
})

describe('parsePmwikiUrl', () => {
  it('should return the group of a clean URL page', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/', group: 'Main' }

    expect(parsePmwikiUrl('https://example.com/Main/HomePage')).toEqual(expected)
  })

  it('should return the group of a group home page', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/', group: 'Projects' }

    expect(parsePmwikiUrl('https://example.com/Projects')).toEqual(expected)
  })

  it('should return the script path of a wiki under a sub-path', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/wiki', group: 'Cookbook' }

    expect(parsePmwikiUrl('https://example.com/wiki/Cookbook/WebFeeds')).toEqual(expected)
  })

  it('should return the script path of a path info URL', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/index.php', group: 'Main' }

    expect(parsePmwikiUrl('https://example.com/index.php/Main/RecentChanges')).toEqual(expected)
  })

  it('should return the group of a page with a hyphenated name', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/', group: 'Projects' }

    expect(parsePmwikiUrl('https://example.com/Projects/Router-Tools')).toEqual(expected)
  })

  it('should return the group of a page named in the query', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/pmwiki.php', group: 'Main' }

    expect(parsePmwikiUrl('https://example.com/pmwiki.php?n=Main.HomePage')).toEqual(expected)
  })

  it('should return the group of a page named in the query with a slash', () => {
    const expected: PmwikiUrl = { kind: 'page', scriptPath: '/pmwiki.php', group: 'Main' }

    expect(parsePmwikiUrl('https://example.com/pmwiki.php?n=Main/HomePage')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: PmwikiUrl = { kind: 'home', scriptPath: '/' }

    expect(parsePmwikiUrl('https://example.com/')).toEqual(expected)
  })

  it('should return the home page for a script path without a page', () => {
    const expected: PmwikiUrl = { kind: 'home', scriptPath: '/wiki/pmwiki.php' }

    expect(parsePmwikiUrl('https://example.com/wiki/pmwiki.php')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parsePmwikiUrl('not-a-url')).toBeUndefined()
  })
})

describe('pmwikiHandler', () => {
  describe('match', () => {
    it('should match a PmWiki page', () => {
      expect(pmwikiHandler.match('https://example.com/Main/HomePage', pmwikiHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(pmwikiHandler.match('https://example.com/Main/HomePage')).toBe(false)
    })

    it('should not match other wiki software', () => {
      expect(pmwikiHandler.match('https://example.com/Main/HomePage', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(pmwikiHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the group and site feeds for a page', () => {
      const value = 'https://example.com/wiki/Cookbook/WebFeeds'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/wiki?n=Cookbook.RecentChanges&action=rss',
          hint: { key: 'pmwiki:group-changes', label: 'Group changes', format: 'rss' },
        },
        {
          uri: 'https://example.com/wiki?n=Cookbook.RecentChanges&action=atom',
          hint: { key: 'pmwiki:group-changes', label: 'Group changes', format: 'atom' },
        },
        {
          uri: 'https://example.com/wiki?n=Site.AllRecentChanges&action=rss',
          hint: { key: 'pmwiki:site-changes', label: 'Site changes', format: 'rss' },
        },
        {
          uri: 'https://example.com/wiki?n=Site.AllRecentChanges&action=atom',
          hint: { key: 'pmwiki:site-changes', label: 'Site changes', format: 'atom' },
        },
      ]

      expect(pmwikiHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feeds for the home page', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?n=Site.AllRecentChanges&action=rss',
          hint: { key: 'pmwiki:site-changes', label: 'Site changes', format: 'rss' },
        },
        {
          uri: 'https://example.com/?n=Site.AllRecentChanges&action=atom',
          hint: { key: 'pmwiki:site-changes', label: 'Site changes', format: 'atom' },
        },
      ]

      expect(pmwikiHandler.resolve(value)).toEqual(expected)
    })
  })
})
