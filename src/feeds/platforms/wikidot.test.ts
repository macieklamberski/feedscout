import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isWikidotHtml, wikidotHandler } from './wikidot.js'

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
  })

  describe('getFeedHint', () => {
    it('should return the site changes hint for a site changes feed', () => {
      const value = 'https://alice.wikidot.com/feed/site-changes.xml'
      const expected: DiscoverUriHint = { key: 'wikidot:site-changes', label: 'Site changes' }

      expect(wikidotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum threads hint for a forum threads feed', () => {
      const value = 'https://alice.wikidot.com/feed/forum/threads.xml'
      const expected: DiscoverUriHint = { key: 'wikidot:forum-threads', label: 'Forum threads' }

      expect(wikidotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum posts hint for a forum posts feed', () => {
      const value = 'https://alice.wikidot.com/feed/forum/posts.xml'
      const expected: DiscoverUriHint = { key: 'wikidot:forum-posts', label: 'Forum posts' }

      expect(wikidotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum posts hint for an http forum posts feed', () => {
      const value = 'http://alice.wikidot.com/feed/forum/posts.xml'
      const expected: DiscoverUriHint = { key: 'wikidot:forum-posts', label: 'Forum posts' }

      expect(wikidotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page', () => {
      const value = 'https://alice.wikidot.com/page'

      expect(wikidotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.wikidot.com/feed/site-changes.xml'

      expect(wikidotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://wikidot.com/feed/site-changes.xml'

      expect(wikidotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://forum.alice.wikidot.com/feed/forum/posts.xml'

      expect(wikidotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/feed/site-changes.xml'

      expect(wikidotHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://alice.wikidot.com/feed/site-changes.xml',
        { key: 'wikidot:site-changes', label: 'Site changes' },
      ],
      [
        'https://alice.wikidot.com/feed/forum/threads.xml',
        { key: 'wikidot:forum-threads', label: 'Forum threads' },
      ],
      [
        'http://alice.wikidot.com/feed/forum/posts.xml',
        { key: 'wikidot:forum-posts', label: 'Forum posts' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
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
