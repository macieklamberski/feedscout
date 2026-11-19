import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseQiitaUrl, type QiitaUrl, qiitaHandler } from './qiita.js'

describe('parseQiitaUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: QiitaUrl = { kind: 'tag', tag: 'python' }

    expect(parseQiitaUrl('https://qiita.com/tags/python')).toEqual(expected)
  })

  it('should return the organization for an organization page', () => {
    const expected: QiitaUrl = { kind: 'organization', organization: 'example' }

    expect(parseQiitaUrl('https://qiita.com/organizations/example')).toEqual(expected)
  })

  it('should return the popular items page', () => {
    const expected: QiitaUrl = { kind: 'popularItems' }

    expect(parseQiitaUrl('https://qiita.com/popular-items')).toEqual(expected)
  })

  it('should return the official columns page', () => {
    const expected: QiitaUrl = { kind: 'officialColumns' }

    expect(parseQiitaUrl('https://qiita.com/official-columns')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: QiitaUrl = { kind: 'user', username: 'Qiita' }

    expect(parseQiitaUrl('https://qiita.com/Qiita')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseQiitaUrl('https://qiita.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseQiitaUrl('https://example.com/Qiita')).toBeUndefined()
  })
})

describe('qiitaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://qiita.com/Qiita'],
      [true, 'https://www.qiita.com/user'],
      [false, 'https://qiita.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(qiitaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(qiitaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const popularFeed: DiscoverUriEntry = {
      uri: 'https://qiita.com/popular-items/feed',
      hint: { key: 'qiita:popular', label: 'Popular items' },
    }
    const zineFeeds: Array<DiscoverUriEntry> = [
      {
        uri: 'https://qiita.com/official-columns/feed/',
        hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'rss' },
      },
      {
        uri: 'https://qiita.com/official-columns/feed/atom/',
        hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'atom' },
      },
    ]

    it('should return feed URL for user', () => {
      const value = 'https://qiita.com/Qiita'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/Qiita/feed',
          hint: { key: 'qiita:posts', label: 'Posts' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://qiita.com/Qiita/items/some-article'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/Qiita/feed',
          hint: { key: 'qiita:posts', label: 'Posts' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for tag page', () => {
      const value = 'https://qiita.com/tags/javascript'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/tags/javascript/feed',
          hint: { key: 'qiita:tag', label: 'Tag' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for the page of a tag named feed', () => {
      const value = 'https://qiita.com/tags/feed'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/tags/feed/feed',
          hint: { key: 'qiita:tag', label: 'Tag' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for tag page with a capitalized tags segment', () => {
      const value = 'https://qiita.com/Tags/javascript'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/tags/javascript/feed',
          hint: { key: 'qiita:tag', label: 'Tag' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for organization page', () => {
      const value = 'https://qiita.com/organizations/qiita-inc'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/organizations/qiita-inc/activities.atom',
          hint: { key: 'qiita:organization', label: 'Organization' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for organization page with a capitalized organizations segment', () => {
      const value = 'https://qiita.com/Organizations/qiita-inc'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/organizations/qiita-inc/activities.atom',
          hint: { key: 'qiita:organization', label: 'Organization' },
        },
        popularFeed,
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for popular items page', () => {
      const value = 'https://qiita.com/popular-items'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/popular-items/feed',
          hint: { key: 'qiita:popular', label: 'Popular items' },
        },
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for popular items page with a capitalized popular-items segment', () => {
      const value = 'https://qiita.com/Popular-Items'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/popular-items/feed',
          hint: { key: 'qiita:popular', label: 'Popular items' },
        },
        ...zineFeeds,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://qiita.com/'

      expect(qiitaHandler.resolve(value)).toEqual([])
    })

    it('should return Qiita Zine feeds for /official-columns', () => {
      const value = 'https://qiita.com/official-columns'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'rss' },
        },
        {
          uri: 'https://qiita.com/official-columns/feed/atom/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'atom' },
        },
        popularFeed,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return Qiita Zine feeds for /official-columns with a capitalized official-columns segment', () => {
      const value = 'https://qiita.com/Official-Columns'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'rss' },
        },
        {
          uri: 'https://qiita.com/official-columns/feed/atom/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'atom' },
        },
        popularFeed,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return Qiita Zine feeds for /official-columns/{slug}', () => {
      const value = 'https://qiita.com/official-columns/some-article'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'rss' },
        },
        {
          uri: 'https://qiita.com/official-columns/feed/atom/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'atom' },
        },
        popularFeed,
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a user feed', () => {
      const value = 'https://qiita.com/alice/feed.atom'
      const expected: DiscoverUriHint = { key: 'qiita:posts', label: 'Posts' }

      expect(qiitaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://qiita.com/tags/cloudformation/feed.atom'
      const expected: DiscoverUriHint = { key: 'qiita:tag', label: 'Tag' }

      expect(qiitaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the page of a tag named feed', () => {
      const value = 'https://qiita.com/tags/feed'

      expect(qiitaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the page of an organization named feed', () => {
      const value = 'https://qiita.com/organizations/feed'

      expect(qiitaHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a user feed with the extension as itself', async () => {
      const value = 'https://qiita.com/alice/feed.atom'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://qiita.com/alice/feed.atom', hint: { key: 'qiita:posts', label: 'Posts' } },
      ]
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [qiitaHandler],
        baseUrl: value,
      })

      expect(result).toEqual(expected)
    })

    it('should return the tag feed for the page of a tag named feed', async () => {
      const value = 'https://qiita.com/tags/feed'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://qiita.com/tags/feed/feed', hint: { key: 'qiita:tag', label: 'Tag' } },
        {
          uri: 'https://qiita.com/popular-items/feed',
          hint: { key: 'qiita:popular', label: 'Popular items' },
        },
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'rss' },
        },
        {
          uri: 'https://qiita.com/official-columns/feed/atom/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine', format: 'atom' },
        },
      ]
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [qiitaHandler],
        baseUrl: value,
      })

      expect(result).toEqual(expected)
    })
  })
})
