import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type DoubanUrl, doubanHandler, parseDoubanUrl } from './douban.js'

describe('parseDoubanUrl', () => {
  it('should return the user for a user page', () => {
    const expected: DoubanUrl = { kind: 'user', username: 'ahbei' }

    expect(parseDoubanUrl('https://www.douban.com/people/ahbei/')).toEqual(expected)
  })

  it('should return the subject for a subject page on a subdomain', () => {
    const expected: DoubanUrl = { kind: 'subject', subjectId: '1292052' }

    expect(parseDoubanUrl('https://movie.douban.com/subject/1292052/')).toEqual(expected)
  })

  it('should return a one-digit subject id whole', () => {
    const expected: DoubanUrl = { kind: 'subject', subjectId: '1' }

    expect(parseDoubanUrl('https://book.douban.com/subject/1/')).toEqual(expected)
  })

  it('should return undefined for a subject id with a letter', () => {
    expect(parseDoubanUrl('https://book.douban.com/subject/1084336abc/')).toBeUndefined()
  })

  it('should return the home page for the root', () => {
    const expected: DoubanUrl = { kind: 'home' }

    expect(parseDoubanUrl('https://www.douban.com/')).toEqual(expected)
  })

  it('should return undefined for another page', () => {
    expect(parseDoubanUrl('https://www.douban.com/group/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseDoubanUrl('https://example.com/people/ahbei/')).toBeUndefined()
  })

  const otherHostValues: Array<string> = [
    'https://accounts.douban.com/',
    'https://api.douban.com/people/ahbei/',
    'https://a.movie.douban.com/subject/1292052/',
  ]

  it.each(otherHostValues)('should return undefined for another Douban host %s', (value) => {
    expect(parseDoubanUrl(value)).toBeUndefined()
  })
})

describe('doubanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.douban.com/'],
      [true, 'https://douban.com/'],
      [true, 'https://book.douban.com/'],
      [true, 'https://movie.douban.com/'],
      [true, 'https://music.douban.com/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(doubanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(doubanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(doubanHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return interests, reviews, and notes feeds for user page', () => {
      const value = 'https://www.douban.com/people/ahbei/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/people/ahbei/interests',
          hint: { key: 'douban:interests', label: 'Interests' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/reviews',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/notes',
          hint: { key: 'douban:notes', label: 'Notes' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return interests, reviews, and notes feeds for user page with a capitalized people segment', () => {
      const value = 'https://www.douban.com/People/ahbei/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/people/ahbei/interests',
          hint: { key: 'douban:interests', label: 'Interests' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/reviews',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/notes',
          hint: { key: 'douban:notes', label: 'Notes' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return subject reviews feed for subject page', () => {
      const value = 'https://book.douban.com/subject/1084336/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/subject/1084336/reviews',
          hint: { key: 'douban:subject-reviews', label: 'Subject reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return subject reviews feed for subject page with a capitalized subject segment', () => {
      const value = 'https://book.douban.com/Subject/1084336/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/subject/1084336/reviews',
          hint: { key: 'douban:subject-reviews', label: 'Subject reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return category review feeds for root page', () => {
      const value = 'https://www.douban.com/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/review/book',
          hint: { key: 'douban:book-reviews', label: 'Book reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/review/movie',
          hint: { key: 'douban:movie-reviews', label: 'Movie reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/review/music',
          hint: { key: 'douban:music-reviews', label: 'Music reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/review/drama',
          hint: { key: 'douban:drama-reviews', label: 'Drama reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for unrecognized paths', () => {
      const value = 'https://www.douban.com/group/explore'

      expect(doubanHandler.resolve(value)).toEqual([])
    })

    it('should handle user page from subdomain', () => {
      const value = 'https://movie.douban.com/people/ahbei/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/people/ahbei/interests',
          hint: { key: 'douban:interests', label: 'Interests' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/reviews',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/notes',
          hint: { key: 'douban:notes', label: 'Notes' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should handle subject page from movie subdomain', () => {
      const value = 'https://movie.douban.com/subject/36873464/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/subject/36873464/reviews',
          hint: { key: 'douban:subject-reviews', label: 'Subject reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the interests key for a user interests feed', () => {
      const value = 'https://www.douban.com/feed/people/mockee/interests'
      const expected = 'douban:interests'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the reviews key for a user reviews feed', () => {
      const value = 'https://www.douban.com/feed/people/29610886/reviews'
      const expected = 'douban:reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the notes key for a user notes feed', () => {
      const value = 'https://www.douban.com/feed/people/mockee/notes'
      const expected = 'douban:notes'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the subject reviews key for a subject reviews feed', () => {
      const value = 'https://www.douban.com/feed/subject/1092183/reviews'
      const expected = 'douban:subject-reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the book reviews key for the book reviews feed', () => {
      const value = 'https://www.douban.com/feed/review/book'
      const expected = 'douban:book-reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the movie reviews key for the movie reviews feed', () => {
      const value = 'https://www.douban.com/feed/review/movie'
      const expected = 'douban:movie-reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the music reviews key for the music reviews feed', () => {
      const value = 'https://www.douban.com/feed/review/music'
      const expected = 'douban:music-reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the drama reviews key for the drama reviews feed', () => {
      const value = 'https://www.douban.com/feed/review/drama'
      const expected = 'douban:drama-reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the subject reviews key for a feed on the apex host', () => {
      const value = 'https://douban.com/feed/subject/1112696/reviews'
      const expected = 'douban:subject-reviews'

      expect(doubanHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user page', () => {
      const value = 'https://www.douban.com/people/mockee/'

      expect(doubanHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a subject page', () => {
      const value = 'https://movie.douban.com/subject/1092183/'

      expect(doubanHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/feed/people/mockee/notes'

      expect(doubanHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://www.douban.com/feed/people/mockee/interests',
        { key: 'douban:interests', label: 'Interests' },
      ],
      [
        'https://www.douban.com/feed/people/29610886/reviews',
        { key: 'douban:reviews', label: 'Reviews' },
      ],
      ['https://www.douban.com/feed/people/mockee/notes', { key: 'douban:notes', label: 'Notes' }],
      [
        'https://www.douban.com/feed/subject/1092183/reviews',
        { key: 'douban:subject-reviews', label: 'Subject reviews' },
      ],
      [
        'https://www.douban.com/feed/review/book',
        { key: 'douban:book-reviews', label: 'Book reviews' },
      ],
      [
        'https://www.douban.com/feed/review/movie',
        { key: 'douban:movie-reviews', label: 'Movie reviews' },
      ],
      [
        'https://www.douban.com/feed/review/music',
        { key: 'douban:music-reviews', label: 'Music reviews' },
      ],
      [
        'https://www.douban.com/feed/review/drama',
        { key: 'douban:drama-reviews', label: 'Drama reviews' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [doubanHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
