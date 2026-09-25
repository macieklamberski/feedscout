import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isShaarliHtml, shaarliHandler } from './shaarli.js'

const shaarliHtml = '<div id="shaarli-menu" class="pure-menu"></div>'
const otherHtml = '<div id="menu"></div>'

describe('isShaarliHtml', () => {
  it('should return true for the Shaarli menu id', () => {
    expect(isShaarliHtml(shaarliHtml)).toBe(true)
  })

  it('should return true for a single-quoted Shaarli menu id', () => {
    expect(isShaarliHtml("<div id='shaarli-menu'></div>")).toBe(true)
  })

  it('should return false for another bookmark manager', () => {
    expect(isShaarliHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isShaarliHtml('')).toBe(false)
  })
})

describe('shaarliHandler', () => {
  describe('match', () => {
    it('should match a Shaarli page', () => {
      expect(shaarliHandler.match('https://example.org/', shaarliHtml)).toBe(true)
    })

    it('should match a themed install by its session cookie', () => {
      const value = 'https://example.org/links/'
      const headers = new Headers({ 'set-cookie': 'shaarli=abc; path=/links/; HttpOnly' })

      expect(shaarliHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match a cookie whose name only starts with the marker', () => {
      const value = 'https://example.org/links/'
      const headers = new Headers({ 'set-cookie': 'shaarli_staySignedIn=1; path=/' })

      expect(shaarliHandler.match(value, '<html></html>', headers)).toBe(false)
    })

    it('should not match without content', () => {
      expect(shaarliHandler.match('https://example.org/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(shaarliHandler.match('not-a-url', shaarliHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the current and legacy feed shapes', () => {
      const value = 'https://example.org/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/feed/rss',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/feed/atom',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.org/?do=rss',
          hint: { key: 'shaarli:posts-legacy', label: 'Posts (legacy)' },
        },
      ]

      expect(shaarliHandler.resolve(value)).toEqual(expected)
    })

    it('should build the feeds from the base path the page declares', () => {
      const value = 'https://example.org/links/shaare/abc123'
      const content = '<input type="hidden" name="js_base_path" value="/links" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/links/feed/rss',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/links/feed/atom',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.org/links/?do=rss',
          hint: { key: 'shaarli:posts-legacy', label: 'Posts (legacy)' },
        },
      ]

      expect(shaarliHandler.resolve(value, content)).toEqual(expected)
    })

    it('should read the base path when value comes before name', () => {
      const value = 'https://example.org/links/shaare/abc123'
      const content = `
        <input
          type="hidden"
          value="/links"
          name="js_base_path"
        />
      `
      const expected: DiscoverUriEntry = {
        uri: 'https://example.org/links/feed/rss',
        hint: { key: 'shaarli:posts', label: 'Posts', format: 'rss' },
      }

      expect(shaarliHandler.resolve(value, content)).toContainEqual(expected)
    })

    it('should build the feeds from the directory of a legacy install', () => {
      const value = 'https://example.org/links/?searchtags=web'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/links/feed/rss',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/links/feed/atom',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.org/links/?do=rss',
          hint: { key: 'shaarli:posts-legacy', label: 'Posts (legacy)' },
        },
      ]

      expect(shaarliHandler.resolve(value)).toEqual(expected)
    })

    it('should build the feeds from a legacy install path without a trailing slash', () => {
      const value = 'https://example.org/links'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/links/feed/rss',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.org/links/feed/atom',
          hint: { key: 'shaarli:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.org/links/?do=rss',
          hint: { key: 'shaarli:posts-legacy', label: 'Posts (legacy)' },
        },
      ]

      expect(shaarliHandler.resolve(value)).toEqual(expected)
    })
  })
})
