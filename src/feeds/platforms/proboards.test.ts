import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  isProboardsHtml,
  type ProboardsUrl,
  parseProboardsUrl,
  proboardsHandler,
} from './proboards.js'

const coreScriptHtml = `
  <script
    type="text/javascript"
    src="//storage.proboards.com/forum/js/proboards.combined_1144.js"
  ></script>
`

describe('isProboardsHtml', () => {
  it('should return true for the core script on storage.proboards.com', () => {
    expect(isProboardsHtml(coreScriptHtml)).toBe(true)
  })

  it('should return true for the core script on storage.forums.net', () => {
    const value = `
      <script
        type="text/javascript"
        src="//storage.forums.net/forum/js/proboards.combined_1046.js"
      ></script>
    `

    expect(isProboardsHtml(value)).toBe(true)
  })

  it('should return false for another page', () => {
    expect(isProboardsHtml('<script src="https://example.com/app.js"></script>')).toBe(false)
  })
})

describe('parseProboardsUrl', () => {
  const forumUrls: Array<string> = [
    'https://example.proboards.com/',
    'https://example.proboards.com/board/15/general-board',
    'https://example.proboards.com/thread/71771/introductions',
    'https://example.freeforums.net/',
    'https://example.boards.net/',
  ]

  it.each(forumUrls)('should return the forum for %s', (value) => {
    const expected: ProboardsUrl = { kind: 'forum', forum: 'example' }

    expect(parseProboardsUrl(value)).toEqual(expected)
  })

  const wwwHostValues: Array<string> = [
    'https://www.proboards.com/',
    'https://www.freeforums.net/',
    'https://www.boards.net/',
  ]

  it.each(wwwHostValues)('should return undefined for the www host %s', (value) => {
    expect(parseProboardsUrl(value)).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseProboardsUrl('https://forum.example.proboards.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseProboardsUrl('https://proboards.com/')).toBeUndefined()
  })

  it('should return a custom domain for another host', () => {
    const expected: ProboardsUrl = { kind: 'customDomain' }

    expect(parseProboardsUrl('https://forum.example.com/')).toEqual(expected)
  })
})

describe('proboardsHandler', () => {
  describe('match', () => {
    it('should return true for a forum', () => {
      expect(proboardsHandler.match('https://example.proboards.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(proboardsHandler.match('https://example.com/')).toBe(false)
    })

    it('should return true for a custom domain carrying the core script', () => {
      expect(proboardsHandler.match('https://forum.example.com/', coreScriptHtml)).toBe(true)
    })

    it('should return false for www.proboards.com carrying the core script', () => {
      expect(proboardsHandler.match('https://www.proboards.com/', coreScriptHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the www host', () => {
      expect(proboardsHandler.resolve('https://www.proboards.com/')).toEqual([])
    })

    it('should return the posts feed for a forum page', () => {
      const value = 'https://example.proboards.com/board/15/general-board'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.proboards.com/rss/public',
          hint: { key: 'proboards:posts', label: 'Posts' },
        },
      ]

      expect(proboardsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the posts feed for a forum on a custom domain', () => {
      const value = 'https://forum.example.com/thread/71771/introductions'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://forum.example.com/rss/public',
          hint: { key: 'proboards:posts', label: 'Posts' },
        },
      ]

      expect(proboardsHandler.resolve(value, coreScriptHtml)).toEqual(expected)
    })

    it('should return the posts feed under the page scheme for a forum opened over http', () => {
      const value = 'http://example.freeforums.net/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.freeforums.net/rss/public',
          hint: { key: 'proboards:posts', label: 'Posts' },
        },
      ]

      expect(proboardsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep http for the posts feed of a custom domain opened over http', () => {
      const value = 'http://forum.example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://forum.example.com/rss/public',
          hint: { key: 'proboards:posts', label: 'Posts' },
        },
      ]

      expect(proboardsHandler.resolve(value, coreScriptHtml)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedValues: Array<string> = [
      'https://example.proboards.com/rss/public',
      'https://example.freeforums.net/rss/public',
      'https://example.boards.net/rss/public',
      'http://example.proboards.com/rss/public',
      'https://example.proboards.com/rss/public/',
      'https://www.example.boards.net/rss/public',
    ]

    it.each(feedValues)('should return the posts hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'proboards:posts', label: 'Posts' }

      expect(proboardsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    const otherValues: Array<string> = [
      'https://example.proboards.com/',
      'https://example.proboards.com/thread/71771/introductions',
      'https://example.proboards.com/rss',
      'https://proboards.com/rss/public',
      'https://www.proboards.com/rss/public',
      'https://m.example.boards.net/rss/public',
      'https://forum.example.com/rss/public',
    ]

    it.each(otherValues)('should return undefined for %s', (value) => {
      expect(proboardsHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const postsHint: DiscoverUriHint = { key: 'proboards:posts', label: 'Posts' }
    const ownFeeds: Array<string> = [
      'https://example.proboards.com/rss/public',
      'http://example.freeforums.net/rss/public',
      'https://example.boards.net/rss/public/',
      'https://www.example.proboards.com/rss/public',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [proboardsHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: postsHint }]

      expect(result).toEqual(expected)
    })
  })
})
