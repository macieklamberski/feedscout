import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PukiwikiPage } from './pukiwiki.js'
import { getPukiwikiPage, isPukiwikiHeaders, isPukiwikiHtml, pukiwikiHandler } from './pukiwiki.js'

const pukiwiki15Html = `
  <head>
    <title>FrontPage - PukiWiki-official</title>
    <link
      rel="stylesheet"
      type="text/css"
      href="skin/pukiwiki.css"
    />
  </head>
`
const pukiwiki14Html = `
  <head>
    <title>FrontPage - PukiWiki</title>
    <link
      rel="stylesheet"
      type="text/css"
      href="/monst3ds/skin/pukiwiki.css.php?charset=Shift_JIS"
    />
  </head>
`
const pyukiwikiHtml = `
  <head>
    <meta
      name="generator"
      content="PyukiWiki 0.2.0-utf8"
    />
    <link
      rel="stylesheet"
      href="./skin/pyukiwiki.default.css"
    />
  </head>
`
const qhmHeaders = new Headers({
  'set-cookie': 'QHMSSID1=ludesa9odrko0jao31h15r3v151n1hu3; path=/; domain=example.com',
})
const qhmLegacyHeaders = new Headers({
  'set-cookie': 'QHMSSID=72aab35e86bcb3669a5b1166a869cb36; path=/; domain=example.org',
})
const phpHeaders = new Headers({
  'set-cookie': 'PHPSESSID=fea047cb9101944366e5fe0acd956623; path=/; HttpOnly',
})

describe('isPukiwikiHtml', () => {
  it('should return true for the PukiWiki 1.5 stylesheet', () => {
    expect(isPukiwikiHtml(pukiwiki15Html)).toBe(true)
  })

  it('should return true for the PukiWiki 1.4 stylesheet', () => {
    expect(isPukiwikiHtml(pukiwiki14Html)).toBe(true)
  })

  it('should return false for another wiki stylesheet', () => {
    expect(isPukiwikiHtml(pyukiwikiHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPukiwikiHtml('')).toBe(false)
  })
})

describe('isPukiwikiHeaders', () => {
  it('should return true for a numbered Quick Homepage Maker session cookie', () => {
    expect(isPukiwikiHeaders(qhmHeaders)).toBe(true)
  })

  it('should return true for an unnumbered Quick Homepage Maker session cookie', () => {
    expect(isPukiwikiHeaders(qhmLegacyHeaders)).toBe(true)
  })

  it('should return false for a PHP session cookie', () => {
    expect(isPukiwikiHeaders(phpHeaders)).toBe(false)
  })
})

describe('getPukiwikiPage', () => {
  it('should return the root of a rewrite install from its stylesheet', () => {
    const value = 'http://example.com/wiki/FrontPage/'
    const content = '<link rel="stylesheet" href="/wiki/skin/pukiwiki.css">'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/' }

    expect(getPukiwikiPage(value, content)).toEqual(expected)
  })

  it('should return the root above a theme directory', () => {
    const value = 'http://example.com/wiki/FrontPage'
    const content = '<link rel="stylesheet" href="/wiki/skin/theme/pukiwiki/pukiwiki.css.php">'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/' }

    expect(getPukiwikiPage(value, content)).toEqual(expected)
  })

  it('should keep a script path that is not index.php', () => {
    const value = 'http://example.com/wiki/dtm.php?FrontPage'
    const content = '<link rel="stylesheet" href="skin/pukiwiki.css">'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/dtm.php' }

    expect(getPukiwikiPage(value, content)).toEqual(expected)
  })

  it('should keep the page path for a stylesheet on another origin', () => {
    const value = 'http://example.com/wiki/FrontPage/'
    const content = '<link rel="stylesheet" href="https://example.org/wiki/skin/pukiwiki.css">'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/FrontPage/' }

    expect(getPukiwikiPage(value, content)).toEqual(expected)
  })

  it('should keep the page path for a shared skin directory outside the wiki', () => {
    const value = 'http://example.com/wiki/'
    const content = '<link rel="stylesheet" href="/sys/skin/pukiwiki.css">'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/' }

    expect(getPukiwikiPage(value, content)).toEqual(expected)
  })

  it('should keep the page path for a stylesheet outside a skin directory', () => {
    const value = 'http://example.com/wiki/'
    const content = '<link rel="stylesheet" href="/pukiwiki.css">'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/' }

    expect(getPukiwikiPage(value, content)).toEqual(expected)
  })

  it('should keep the page path without a stylesheet', () => {
    const value = 'http://example.com/wiki/'
    const expected: PukiwikiPage = { kind: 'wiki', scriptUrl: 'http://example.com/wiki/' }

    expect(getPukiwikiPage(value, undefined)).toEqual(expected)
  })
})

describe('pukiwikiHandler', () => {
  describe('match', () => {
    it('should match a PukiWiki page', () => {
      expect(pukiwikiHandler.match('https://example.com/', pukiwiki15Html)).toBe(true)
    })

    it('should match a Quick Homepage Maker page', () => {
      const value = 'http://example.com/index.php'

      expect(pukiwikiHandler.match(value, '', qhmHeaders)).toBe(true)
    })

    it('should not match without content or headers', () => {
      expect(pukiwikiHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match other wiki software', () => {
      expect(pukiwikiHandler.match('http://example.org/', pyukiwikiHtml, phpHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the recent changes feed on the script of a page', () => {
      const value = 'http://example.com/monst3ds/index.php?FrontPage'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.com/monst3ds/index.php?cmd=rss',
          hint: { key: 'pukiwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(pukiwikiHandler.resolve(value)).toEqual(expected)
    })

    it('should return the recent changes feed on the directory of a wiki', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?cmd=rss',
          hint: { key: 'pukiwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(pukiwikiHandler.resolve(value)).toEqual(expected)
    })
  })
})
