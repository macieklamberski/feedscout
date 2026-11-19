import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isWikidotHtml, parseWikidotUrl, type WikidotUrl, wikidotHandler } from './wikidot.js'

const wikidotHtml = `
  <link
    rel="alternate"
    type="application/wiki"
    href="javascript:WIKIDOT.page.listeners.editClick()"
  />
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

describe('isWikidotHtml', () => {
  it('should return true for the edit link handler', () => {
    expect(isWikidotHtml(wikidotHtml)).toBe(true)
  })

  it('should return false for other wiki software', () => {
    expect(isWikidotHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isWikidotHtml('')).toBe(false)
  })
})

describe('parseWikidotUrl', () => {
  it('should return the thread of a thread page', () => {
    const value = 'https://example.com/forum/t-12345/a-title'
    const expected: WikidotUrl = { kind: 'thread', threadId: '12345' }

    expect(parseWikidotUrl(value)).toEqual(expected)
  })

  it('should return the category of a forum category page', () => {
    const value = 'https://example.com/forum/c-678/general'
    const expected: WikidotUrl = { kind: 'category', categoryId: '678' }

    expect(parseWikidotUrl(value)).toEqual(expected)
  })

  it('should return the site for any other page', () => {
    const value = 'https://example.com/forum:start'
    const expected: WikidotUrl = { kind: 'site' }

    expect(parseWikidotUrl(value)).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseWikidotUrl('not-a-url')).toBeUndefined()
  })
})

describe('wikidotHandler', () => {
  describe('match', () => {
    it('should match a Wikidot page on a wikidot.com host', () => {
      expect(wikidotHandler.match('https://example.wikidot.com/page', wikidotHtml)).toBe(true)
    })

    it('should match a Wikidot page on a custom domain', () => {
      expect(wikidotHandler.match('https://example.com/page', wikidotHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(wikidotHandler.match('https://example.wikidot.com/page')).toBe(false)
    })

    it('should not match other wiki software', () => {
      expect(wikidotHandler.match('https://example.com/page', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site and forum feeds', () => {
      const value = 'https://example.com/page'
      const expected = [
        {
          uri: 'https://example.com/feed/site-changes.xml',
          hint: { key: 'wikidot:site-changes', label: 'Site changes' },
        },
        {
          uri: 'https://example.com/feed/forum/threads.xml',
          hint: { key: 'wikidot:forum-threads', label: 'Forum threads' },
        },
        {
          uri: 'https://example.com/feed/forum/posts.xml',
          hint: { key: 'wikidot:forum-posts', label: 'Forum posts' },
        },
      ]

      expect(wikidotHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site and forum feeds of a site on wikidot.com', () => {
      const value = 'https://alice.wikidot.com/page'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.wikidot.com/feed/site-changes.xml',
          hint: { key: 'wikidot:site-changes', label: 'Site changes' },
        },
        {
          uri: 'https://alice.wikidot.com/feed/forum/threads.xml',
          hint: { key: 'wikidot:forum-threads', label: 'Forum threads' },
        },
        {
          uri: 'https://alice.wikidot.com/feed/forum/posts.xml',
          hint: { key: 'wikidot:forum-posts', label: 'Forum posts' },
        },
      ]

      expect(wikidotHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a site on wikidot.com', () => {
      const value = 'http://alice.wikidot.com/page'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.wikidot.com/feed/site-changes.xml',
          hint: { key: 'wikidot:site-changes', label: 'Site changes' },
        },
        {
          uri: 'http://alice.wikidot.com/feed/forum/threads.xml',
          hint: { key: 'wikidot:forum-threads', label: 'Forum threads' },
        },
        {
          uri: 'http://alice.wikidot.com/feed/forum/posts.xml',
          hint: { key: 'wikidot:forum-posts', label: 'Forum posts' },
        },
      ]

      expect(wikidotHandler.resolve(value)).toEqual(expected)
    })
    it('should return the thread feed before the site feeds for a thread page', () => {
      const value = 'https://alice.wikidot.com/forum/t-12345/a-title'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.wikidot.com/feed/forum/t-12345.xml',
          hint: { key: 'wikidot:forum-thread', label: 'Forum thread' },
        },
        {
          uri: 'https://alice.wikidot.com/feed/site-changes.xml',
          hint: { key: 'wikidot:site-changes', label: 'Site changes' },
        },
        {
          uri: 'https://alice.wikidot.com/feed/forum/threads.xml',
          hint: { key: 'wikidot:forum-threads', label: 'Forum threads' },
        },
        {
          uri: 'https://alice.wikidot.com/feed/forum/posts.xml',
          hint: { key: 'wikidot:forum-posts', label: 'Forum posts' },
        },
      ]

      expect(wikidotHandler.resolve(value)).toEqual(expected)
    })

    it('should return the category feeds before the site feeds for a forum category page', () => {
      const value = 'https://example.com/forum/c-678/general'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/feed/forum/ct-678.xml',
          hint: { key: 'wikidot:forum-category-threads', label: 'Forum category threads' },
        },
        {
          uri: 'https://example.com/feed/forum/cp-678.xml',
          hint: { key: 'wikidot:forum-category-posts', label: 'Forum category posts' },
        },
        {
          uri: 'https://example.com/feed/site-changes.xml',
          hint: { key: 'wikidot:site-changes', label: 'Site changes' },
        },
        {
          uri: 'https://example.com/feed/forum/threads.xml',
          hint: { key: 'wikidot:forum-threads', label: 'Forum threads' },
        },
        {
          uri: 'https://example.com/feed/forum/posts.xml',
          hint: { key: 'wikidot:forum-posts', label: 'Forum posts' },
        },
      ]

      expect(wikidotHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the site changes hint for a site changes feed', () => {
      const value = 'https://alice.wikidot.com/feed/site-changes.xml'
      const expected: DiscoverUriHint = { key: 'wikidot:site-changes', label: 'Site changes' }

      expect(wikidotHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a site changes feed as itself', async () => {
      const value = 'https://alice.wikidot.com/feed/site-changes.xml'
      const hint: DiscoverUriHint = { key: 'wikidot:site-changes', label: 'Site changes' }
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [wikidotHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
