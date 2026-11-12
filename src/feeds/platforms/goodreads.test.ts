import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { GoodreadsUrl } from './goodreads.js'
import { goodreadsHandler, parseGoodreadsUrl } from './goodreads.js'

describe('parseGoodreadsUrl', () => {
  it('should return the user for a user page with a slug', () => {
    const value = 'https://www.goodreads.com/user/show/1-otis-chandler'
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the user for a user page with a slug with a capitalized user segment', () => {
    const value = 'https://www.goodreads.com/User/show/1-otis-chandler'
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the user for a user page with a slug with a capitalized show segment', () => {
    const value = 'https://www.goodreads.com/user/Show/1-otis-chandler'
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the user for a user page with a numeric id only', () => {
    const expected: GoodreadsUrl = { kind: 'user', userId: '4082853' }

    expect(parseGoodreadsUrl('https://www.goodreads.com/user/show/4082853')).toEqual(expected)
  })

  it('should return the user on the bare host', () => {
    const expected: GoodreadsUrl = { kind: 'user', userId: '1' }

    expect(parseGoodreadsUrl('https://goodreads.com/user/show/1')).toEqual(expected)
  })

  it('should return the reviews for a review list page with a slug', () => {
    const value = 'https://www.goodreads.com/review/list/1-otis-chandler'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the reviews for a review list page with a capitalized review segment', () => {
    const value = 'https://www.goodreads.com/Review/list/1-otis-chandler'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the reviews for a review list page with a capitalized list segment', () => {
    const value = 'https://www.goodreads.com/review/List/1-otis-chandler'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return the reviews for a review list page with a numeric id only', () => {
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '4082853' }

    expect(parseGoodreadsUrl('https://www.goodreads.com/review/list/4082853')).toEqual(expected)
  })

  it('should return the shelf of a review list page', () => {
    const value = 'https://www.goodreads.com/review/list/1-otis?shelf=read'
    const expected: GoodreadsUrl = { kind: 'reviews', userId: '1', shelf: 'read' }

    expect(parseGoodreadsUrl(value)).toEqual(expected)
  })

  it('should return undefined for a user page with a non-numeric id', () => {
    expect(parseGoodreadsUrl('https://www.goodreads.com/user/show/abc-otis')).toBeUndefined()
  })

  it('should return undefined for a review list page with a non-numeric id', () => {
    expect(parseGoodreadsUrl('https://www.goodreads.com/review/list/abc-otis')).toBeUndefined()
  })

  const otherPageValues: Array<string> = [
    'https://www.goodreads.com/book/show/5907.The_Hobbit',
    'https://www.goodreads.com/author/show/3354.Haruki_Murakami',
    'https://www.goodreads.com/genres/fiction',
    'https://www.goodreads.com/list/show/1.Best_Books_Ever',
    'https://www.goodreads.com/choiceawards',
  ]

  it.each(otherPageValues)('should return undefined for %s', (value) => {
    expect(parseGoodreadsUrl(value)).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseGoodreadsUrl('https://www.goodreads.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGoodreadsUrl('https://example.com/user/show/1')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGoodreadsUrl('not-a-url')).toBeUndefined()
  })
})

describe('goodreadsHandler', () => {
  describe('match', () => {
    it('should match a Goodreads URL', () => {
      expect(goodreadsHandler.match('https://www.goodreads.com/user/show/1-otis')).toBe(true)
    })

    it('should not match another host', () => {
      expect(goodreadsHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return updates and reviews feeds for user page', () => {
      const value = 'https://www.goodreads.com/user/show/1-otis-chandler'
      const expected = [
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return reviews and updates feeds for review list page', () => {
      const value = 'https://www.goodreads.com/review/list/1-otis-chandler'
      const expected = [
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should include shelf feed when shelf query param is set', () => {
      const value = 'https://www.goodreads.com/review/list/1-otis?shelf=read'
      const expected = [
        {
          uri: 'https://www.goodreads.com/review/list_rss/1?shelf=read',
          hint: { key: 'goodreads:shelf', label: 'Shelf' },
        },
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should encode special characters in shelf name', () => {
      const value = 'https://www.goodreads.com/review/list/1?shelf=currently%20reading'
      const expected = [
        {
          uri: 'https://www.goodreads.com/review/list_rss/1?shelf=currently%20reading',
          hint: { key: 'goodreads:shelf', label: 'Shelf' },
        },
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds on the https www host for an http page on the bare host', () => {
      const value = 'http://goodreads.com/user/show/1-otis-chandler'
      const expected = [
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for book pages', () => {
      const value = 'https://www.goodreads.com/book/show/5907.The_Hobbit'

      expect(goodreadsHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the reviews hint for a review list feed', () => {
      const value = 'https://www.goodreads.com/review/list_rss/7259651'
      const expected: DiscoverUriHint = { key: 'goodreads:reviews', label: 'Reviews' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reviews hint for a review list feed with a page parameter', () => {
      const value = 'https://www.goodreads.com/review/list_rss/50196372?page=6'
      const expected: DiscoverUriHint = { key: 'goodreads:reviews', label: 'Reviews' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reviews hint for a review list feed on the bare host over http', () => {
      const value = 'http://goodreads.com/review/list_rss/7259651'
      const expected: DiscoverUriHint = { key: 'goodreads:reviews', label: 'Reviews' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the shelf hint for a shelf feed', () => {
      const value = 'https://www.goodreads.com/review/list_rss/6585469?shelf=currently-reading'
      const expected: DiscoverUriHint = { key: 'goodreads:shelf', label: 'Shelf' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the shelf hint for a shelf feed with an encoded shelf and a page', () => {
      const value = 'https://www.goodreads.com/review/list_rss/3725895?page=1&shelf=%23ALL%23'
      const expected: DiscoverUriHint = { key: 'goodreads:shelf', label: 'Shelf' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updates hint for an updates feed', () => {
      const value = 'https://www.goodreads.com/user/updates_rss/4484461'
      const expected: DiscoverUriHint = { key: 'goodreads:updates', label: 'Updates' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updates hint for an updates feed with a v parameter', () => {
      const value = 'https://www.goodreads.com/user/updates_rss/6585469?v=as'
      const expected: DiscoverUriHint = { key: 'goodreads:updates', label: 'Updates' }

      expect(goodreadsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a review list feed with a private key', () => {
      const value = 'https://www.goodreads.com/review/list_rss/1?key=abc123&shelf=read'

      expect(goodreadsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an updates feed with a private key', () => {
      const value = 'https://www.goodreads.com/user/updates_rss/1?key=abc123'

      expect(goodreadsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a review list page', () => {
      const value = 'https://www.goodreads.com/review/list/1-otis-chandler'

      expect(goodreadsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a quotes feed', () => {
      const value = 'https://www.goodreads.com/quotes/list_rss/319473-sean-perry'

      expect(goodreadsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a review list feed path on another host', () => {
      const value = 'https://example.com/review/list_rss/7259651'

      expect(goodreadsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(goodreadsHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://www.goodreads.com/review/list_rss/7259651',
        { key: 'goodreads:reviews', label: 'Reviews' },
      ],
      [
        'https://www.goodreads.com/review/list_rss/14070425?shelf=read',
        { key: 'goodreads:shelf', label: 'Shelf' },
      ],
      [
        'https://www.goodreads.com/user/updates_rss/4484461',
        { key: 'goodreads:updates', label: 'Updates' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [goodreadsHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
