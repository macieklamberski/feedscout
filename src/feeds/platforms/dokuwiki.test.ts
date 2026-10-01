import { describe, expect, it } from 'bun:test'
import { dokuwikiHandler, isDokuwikiHeaders } from './dokuwiki.js'

const dokuwikiHeaders = new Headers({
  'set-cookie': 'DokuWiki=abc123; path=/; secure; HttpOnly; SameSite=Lax',
})

describe('isDokuwikiHeaders', () => {
  it('should return true for the DokuWiki session cookie', () => {
    expect(isDokuwikiHeaders(dokuwikiHeaders)).toBe(true)
  })

  it('should return false for a cookie whose name only starts with the marker', () => {
    const value = new Headers({ 'set-cookie': 'DokuWikiPrefs=1; path=/' })

    expect(isDokuwikiHeaders(value)).toBe(false)
  })

  it('should return false without cookies', () => {
    expect(isDokuwikiHeaders(new Headers())).toBe(false)
  })
})

describe('dokuwikiHandler', () => {
  describe('match', () => {
    it('should match a page carrying the DokuWiki session cookie', () => {
      const value = 'https://example.org/doku.php?id=wiki:syntax'

      expect(dokuwikiHandler.match(value, '<html></html>', dokuwikiHeaders)).toBe(true)
    })

    it('should not match without headers', () => {
      expect(dokuwikiHandler.match('https://example.org/wiki:syntax', '<html></html>')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the namespace and site feeds for a page inside a namespace', () => {
      const value = 'https://example.org/wiki:syntax'
      const content = `
        <link rel="start" href="/"/>
        <script>var NS='wiki';var JSINFO = {"namespace":"wiki"};</script>
      `
      const expected = [
        {
          uri: 'https://example.org/feed.php?ns=wiki',
          hint: { key: 'dokuwiki:namespace', label: 'Namespace' },
        },
        {
          uri: 'https://example.org/feed.php?mode=list&ns=wiki',
          hint: { key: 'dokuwiki:namespace-pages', label: 'Namespace pages' },
        },
        {
          uri: 'https://example.org/feed.php',
          hint: { key: 'dokuwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(dokuwikiHandler.resolve(value, content, dokuwikiHeaders)).toEqual(expected)
    })

    it('should return the site feed for a page in the root namespace', () => {
      const value = 'https://example.org/start'
      const content = `
        <link rel="start" href="/"/>
        <script>var NS='';var JSINFO = {"namespace":""};</script>
      `
      const expected = [
        {
          uri: 'https://example.org/feed.php',
          hint: { key: 'dokuwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(dokuwikiHandler.resolve(value, content, dokuwikiHeaders)).toEqual(expected)
    })

    it('should encode a nested namespace', () => {
      const value = 'https://example.org/doku.php/wiki:plugins:start'
      const content = "<script>var NS='wiki:plugins';</script>"
      const expected = {
        uri: 'https://example.org/feed.php?ns=wiki%3Aplugins',
        hint: { key: 'dokuwiki:namespace', label: 'Namespace' },
      }

      expect(dokuwikiHandler.resolve(value, content, dokuwikiHeaders)).toContainEqual(expected)
    })

    it('should build the feeds from the install root the start link names', () => {
      const value = 'https://example.org/tools/dokuwiki/doku.php?id=manual:start'
      const content = `
        <link rel="start" href="/tools/dokuwiki/"/>
        <script>var NS='manual';</script>
      `
      const expected = [
        {
          uri: 'https://example.org/tools/dokuwiki/feed.php?ns=manual',
          hint: { key: 'dokuwiki:namespace', label: 'Namespace' },
        },
        {
          uri: 'https://example.org/tools/dokuwiki/feed.php?mode=list&ns=manual',
          hint: { key: 'dokuwiki:namespace-pages', label: 'Namespace pages' },
        },
        {
          uri: 'https://example.org/tools/dokuwiki/feed.php',
          hint: { key: 'dokuwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(dokuwikiHandler.resolve(value, content, dokuwikiHeaders)).toEqual(expected)
    })

    it('should keep the page origin when the start link is absolute', () => {
      const value = 'https://example.org/wiki/start'
      const content = '<link rel="start" href="http://wiki.example.com/wiki/"/>'
      const expected = [
        {
          uri: 'https://example.org/wiki/feed.php',
          hint: { key: 'dokuwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(dokuwikiHandler.resolve(value, content, dokuwikiHeaders)).toEqual(expected)
    })

    it('should build the feeds from the session cookie path without a start link', () => {
      const value = 'https://example.org/wiki/doku.php?id=start'
      const headers = new Headers()

      headers.append('set-cookie', 'DOKU_PREFS=a; expires=Mon, 27 Sep 2027 05:21:30 GMT; path=/')
      headers.append('set-cookie', 'DokuWiki=abc123; path=/wiki/; secure; HttpOnly')

      const expected = [
        {
          uri: 'https://example.org/wiki/feed.php',
          hint: { key: 'dokuwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(dokuwikiHandler.resolve(value, '', headers)).toEqual(expected)
    })

    it('should fall back to the origin root without a start link or a cookie path', () => {
      const value = 'https://example.org/start'
      const expected = [
        {
          uri: 'https://example.org/feed.php',
          hint: { key: 'dokuwiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(dokuwikiHandler.resolve(value)).toEqual(expected)
    })
  })
})
