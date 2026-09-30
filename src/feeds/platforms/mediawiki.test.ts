import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isMediawikiHtml, mediawikiHandler } from './mediawiki.js'

const rsdLink = '<link rel="EditURI" type="application/rsd+xml" href="/w/api.php?action=rsd">'

describe('isMediawikiHtml', () => {
  it('should return true for the RSD link to api.php', () => {
    expect(isMediawikiHtml(rsdLink)).toBe(true)
  })

  it('should return false for the WordPress RSD link', () => {
    const value = `
      <link
        rel="EditURI"
        type="application/rsd+xml"
        href="https://example.org/xmlrpc.php?rsd"
      >
    `

    expect(isMediawikiHtml(value)).toBe(false)
  })

  it('should return false for an RSD link without href', () => {
    expect(isMediawikiHtml('<link rel="EditURI" type="application/rsd+xml">')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isMediawikiHtml('')).toBe(false)
  })
})

describe('mediawikiHandler', () => {
  describe('match', () => {
    it('should match a page carrying the RSD link to api.php', () => {
      expect(mediawikiHandler.match('https://example.org/wiki/Main_Page', rsdLink)).toBe(true)
    })

    it('should not match without content', () => {
      expect(mediawikiHandler.match('https://example.org/wiki/Main_Page')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the history and recent changes feeds for an article', () => {
      const value = 'https://example.org/wiki/Atom_(web_standard)'
      const content = `
        ${rsdLink}
        <script>RLCONF={"wgCanonicalNamespace":"","wgNamespaceNumber":0,"wgPageName":"Atom_(web_standard)"};</script>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/w/index.php?title=Atom_%28web_standard%29&action=history&feed=atom',
          hint: { key: 'mediawiki:history', label: 'Page history', format: 'atom' },
        },
        {
          uri: 'https://example.org/w/index.php?title=Special%3ARecentChanges&feed=atom',
          hint: { key: 'mediawiki:recent-changes', label: 'Recent changes', format: 'atom' },
        },
      ]

      expect(mediawikiHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the history feed of a page in a namespace', () => {
      const value = 'https://example.org/index.php?title=Help:Contents'
      const content = `
        <link rel="EditURI" type="application/rsd+xml" href="/api.php?action=rsd">
        <script>RLCONF={"wgCanonicalNamespace":"Help","wgNamespaceNumber":12,"wgPageName":"Help:Contents"};</script>
      `
      const expected: DiscoverUriEntry = {
        uri: 'https://example.org/index.php?title=Help%3AContents&action=history&feed=atom',
        hint: { key: 'mediawiki:history', label: 'Page history', format: 'atom' },
      }

      expect(mediawikiHandler.resolve(value, content)).toContainEqual(expected)
    })

    it('should decode escapes in the page name', () => {
      const value = 'https://example.org/wiki/AC/DC_%22Live%22'
      const content = `
        ${rsdLink}
        <script>RLCONF={"wgPageName":"AC\\/DC_\\"Live\\""};</script>
      `
      const expected: DiscoverUriEntry = {
        uri: 'https://example.org/w/index.php?title=AC%2FDC_%22Live%22&action=history&feed=atom',
        hint: { key: 'mediawiki:history', label: 'Page history', format: 'atom' },
      }

      expect(mediawikiHandler.resolve(value, content)).toContainEqual(expected)
    })

    it('should return only the recent changes feed for a special page', () => {
      const value = 'https://example.org/wiki/Special:RecentChanges'
      const content = `
        ${rsdLink}
        <script>RLCONF={"wgCanonicalNamespace":"Special","wgNamespaceNumber":-1,"wgPageName":"Special:RecentChanges"};</script>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/w/index.php?title=Special%3ARecentChanges&feed=atom',
          hint: { key: 'mediawiki:recent-changes', label: 'Recent changes', format: 'atom' },
        },
      ]

      expect(mediawikiHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the recent changes feed without a page name', () => {
      const value = 'https://example.org/wiki/Main_Page'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/w/index.php?title=Special%3ARecentChanges&feed=atom',
          hint: { key: 'mediawiki:recent-changes', label: 'Recent changes', format: 'atom' },
        },
      ]

      expect(mediawikiHandler.resolve(value, rsdLink)).toEqual(expected)
    })

    it('should keep the page origin when the RSD link names another server', () => {
      const value = 'https://example.org/wiki/Main_Page'
      const content = `
        <link
          rel="EditURI"
          type="application/rsd+xml"
          href="//wiki.example.com/w/api.php?action=rsd"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/w/index.php?title=Special%3ARecentChanges&feed=atom',
          hint: { key: 'mediawiki:recent-changes', label: 'Recent changes', format: 'atom' },
        },
      ]

      expect(mediawikiHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return no feeds without the RSD link', () => {
      expect(mediawikiHandler.resolve('https://example.org/wiki/Main_Page', '')).toEqual([])
    })
  })
})
