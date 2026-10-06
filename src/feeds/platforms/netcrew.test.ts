import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isNetcrewHtml, netcrewHandler, parseNetcrewUrl } from './netcrew.js'

const netcrewHtml = `
  <head>
    <style>
      @import url("/ssi/css/nw-page-top.css");
    </style>
    <link rel=stylesheet media=print href="/ssi/css/print.css">
    <script src="/ssi/js/escapeurl.js"></script>
    <script src="/ssi/js/common.js"></script>
  </head>
`
const scriptsOnlyHtml = '<script src="/ssi/js/menu.js"></script>'
// Constructed: templates whose script or style path sits under another directory.
const nestedScriptHtml = `
  <script src="https://cdn.example.com/site/.element/ssi/js/1.3/main.js"></script>
  <link href="/ssi/css/common.css">
`
const nestedStyleHtml = `
  <script src="/ssi/js/main.js"></script>
  <link href="https://cdn.example.com/site/.element/ssi/css/1.3/common.css">
`
const otherHtml = `
  <head>
    <link
      rel="stylesheet"
      href="/shared/style/default.css"
    >
    <script src="/shared/js/common.js"></script>
  </head>
`

describe('isNetcrewHtml', () => {
  it('should return true for the template script and style paths', () => {
    expect(isNetcrewHtml(netcrewHtml)).toBe(true)
  })

  it('should return false for the script path alone', () => {
    expect(isNetcrewHtml(scriptsOnlyHtml)).toBe(false)
  })

  it('should return false for a script path nested under another directory', () => {
    expect(isNetcrewHtml(nestedScriptHtml)).toBe(false)
  })

  it('should return false for a style path nested under another directory', () => {
    expect(isNetcrewHtml(nestedStyleHtml)).toBe(false)
  })

  it('should return false for another CMS', () => {
    expect(isNetcrewHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isNetcrewHtml('')).toBe(false)
  })
})

describe('parseNetcrewUrl', () => {
  it('should return the home page for the root', () => {
    expect(parseNetcrewUrl('https://example.com/')).toEqual({ kind: 'home' })
  })

  it('should return the home page for the index file', () => {
    expect(parseNetcrewUrl('https://example.com/index.html')).toEqual({ kind: 'home' })
  })

  it('should return undefined for a section page', () => {
    expect(parseNetcrewUrl('https://example.com/soshiki/12/')).toBeUndefined()
  })

  it('should return undefined for an article page', () => {
    expect(parseNetcrewUrl('https://example.com/site/news/1234.html')).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseNetcrewUrl('not-a-url')).toBeUndefined()
  })
})

describe('netcrewHandler', () => {
  describe('match', () => {
    it('should match a NetCrew CMS home page', () => {
      expect(netcrewHandler.match('https://example.com/', netcrewHtml)).toBe(true)
    })

    it('should not match a NetCrew CMS section page', () => {
      expect(netcrewHandler.match('https://example.com/life/1/7/', netcrewHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(netcrewHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another CMS', () => {
      expect(netcrewHandler.match('https://example.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site updates feed for the home page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: ['https://example.com/rss/10/list1.xml', 'https://example.com/rss/20/list1.xml'],
          hint: { key: 'netcrew:updates', label: 'Site updates' },
        },
      ]

      expect(netcrewHandler.resolve('https://example.com/')).toEqual(expected)
    })

    it('should return empty array for a section page', () => {
      expect(netcrewHandler.resolve('https://example.com/soshiki/12/')).toEqual([])
    })
  })
})
