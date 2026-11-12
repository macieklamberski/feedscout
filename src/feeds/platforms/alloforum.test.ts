import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type AlloforumUrl, alloforumHandler, parseAlloforumUrl } from './alloforum.js'

describe('parseAlloforumUrl', () => {
  const forumUrls = [
    'https://example.alloforum.com/',
    'https://example.alloforum.com',
    'http://1234.alloforum.com/',
    'https://example.alloforum.com/sample-topic-t123-1.html',
    'https://example.alloforum.com/profil-alice.html',
    'https://example.alloforum.com/stats.php',
  ]

  it.each(forumUrls)('should return the forum for %s', (value) => {
    const expected: AlloforumUrl = { kind: 'forum' }

    expect(parseAlloforumUrl(value)).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const value = 'https://example.alloforum.com/sample-category-c12-1.html'
    const expected: AlloforumUrl = { kind: 'category', slug: 'sample-category', categoryId: '12' }

    expect(parseAlloforumUrl(value)).toEqual(expected)
  })

  it('should return the category for a later page of a category', () => {
    const value = 'https://example.alloforum.com/sample-c12-3.html'
    const expected: AlloforumUrl = { kind: 'category', slug: 'sample', categoryId: '12' }

    expect(parseAlloforumUrl(value)).toEqual(expected)
  })

  it('should return the category for an uppercase route letter', () => {
    const value = 'https://example.alloforum.com/sample-C12-1.html'
    const expected: AlloforumUrl = { kind: 'category', slug: 'sample', categoryId: '12' }

    expect(parseAlloforumUrl(value)).toEqual(expected)
  })

  it('should return the subcategory for a subcategory page', () => {
    const value = 'https://example.alloforum.com/sample-category-c12-sample-board-s34-1.html'
    const expected: AlloforumUrl = {
      kind: 'subcategory',
      slug: 'sample-category',
      categoryId: '12',
      subcategorySlug: 'sample-board',
      subcategoryId: '34',
    }

    expect(parseAlloforumUrl(value)).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseAlloforumUrl('https://alloforum.com/')).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseAlloforumUrl('https://www.example.alloforum.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseAlloforumUrl('https://www.alloforum.com/')).toBeUndefined()
  })

  it('should return undefined for a domain ending in alloforum.com', () => {
    expect(parseAlloforumUrl('https://example.notalloforum.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAlloforumUrl('https://example.com/')).toBeUndefined()
  })
})

describe('alloforumHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.alloforum.com/'],
      [false, 'https://alloforum.com/'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(alloforumHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside AlloForum', () => {
      expect(alloforumHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the latest topics feed for a forum', () => {
      const value = 'https://example.alloforum.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.alloforum.com/derniers-sujets.xml',
          hint: { key: 'alloforum:latest-topics', label: 'Latest topics' },
        },
      ]

      expect(alloforumHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http forum', () => {
      const value = 'http://1234.alloforum.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://1234.alloforum.com/derniers-sujets.xml',
          hint: { key: 'alloforum:latest-topics', label: 'Latest topics' },
        },
      ]

      expect(alloforumHandler.resolve(value)).toEqual(expected)
    })

    it('should return the category and latest topics feeds for a category', () => {
      const value = 'https://example.alloforum.com/sample-category-c12-2.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.alloforum.com/derniers-sujets-sample-category-c12.xml',
          hint: { key: 'alloforum:category', label: 'Category' },
        },
        {
          uri: 'https://example.alloforum.com/derniers-sujets.xml',
          hint: { key: 'alloforum:latest-topics', label: 'Latest topics' },
        },
      ]

      expect(alloforumHandler.resolve(value)).toEqual(expected)
    })

    it('should mint lowercase route letters for a subcategory spelled in uppercase', () => {
      const value = 'https://example.alloforum.com/sample-category-C12-sample-board-S34-1.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.alloforum.com/derniers-sujets-sample-category-c12-sample-board-s34.xml',
          hint: { key: 'alloforum:subcategory', label: 'Subcategory' },
        },
        {
          uri: 'https://example.alloforum.com/derniers-sujets.xml',
          hint: { key: 'alloforum:latest-topics', label: 'Latest topics' },
        },
      ]

      expect(alloforumHandler.resolve(value)).toEqual(expected)
    })

    it('should return the subcategory and latest topics feeds for a subcategory', () => {
      const value = 'https://example.alloforum.com/sample-category-c12-sample-board-s34-1.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.alloforum.com/derniers-sujets-sample-category-c12-sample-board-s34.xml',
          hint: { key: 'alloforum:subcategory', label: 'Subcategory' },
        },
        {
          uri: 'https://example.alloforum.com/derniers-sujets.xml',
          hint: { key: 'alloforum:latest-topics', label: 'Latest topics' },
        },
      ]

      expect(alloforumHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the latest topics key for a latest topics feed', () => {
      const value = 'https://123perlamis.alloforum.com/derniers-sujets.xml'
      const expected = 'alloforum:latest-topics'

      expect(alloforumHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for a category feed', () => {
      const value = 'https://10253.alloforum.com/derniers-sujets-materiel-volieres-c285.xml'
      const expected = 'alloforum:category'

      expect(alloforumHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the subcategory key for a subcategory feed', () => {
      const value =
        'https://123perlamis.alloforum.com/derniers-sujets-materiel-techniques-c44498-divers-s17544.xml'
      const expected = 'alloforum:subcategory'

      expect(alloforumHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the subcategory key for a subcategory feed with a hyphenated slug', () => {
      const value =
        'https://123perlamis.alloforum.com/derniers-sujets-materiel-techniques-c44498-nuanciers-perles-s17542.xml'
      const expected = 'alloforum:subcategory'

      expect(alloforumHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for an http category feed', () => {
      const value = 'http://10253.alloforum.com/derniers-sujets-discussions-generales-c275.xml'
      const expected = 'alloforum:category'

      expect(alloforumHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a category page', () => {
      const value = 'https://10253.alloforum.com/materiel-volieres-c285-1.html'

      expect(alloforumHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.alloforum.com/derniers-sujets.xml'

      expect(alloforumHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://alloforum.com/derniers-sujets.xml'

      expect(alloforumHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/derniers-sujets.xml'

      expect(alloforumHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://123perlamis.alloforum.com/derniers-sujets.xml',
        { key: 'alloforum:latest-topics', label: 'Latest topics' },
      ],
      [
        'https://10253.alloforum.com/derniers-sujets-materiel-volieres-c285.xml',
        { key: 'alloforum:category', label: 'Category' },
      ],
      [
        'https://10253.alloforum.com/derniers-sujets-discussions-generales-c275.xml',
        { key: 'alloforum:category', label: 'Category' },
      ],
      [
        'https://123perlamis.alloforum.com/derniers-sujets-materiel-techniques-c44498-divers-s17544.xml',
        { key: 'alloforum:subcategory', label: 'Subcategory' },
      ],
      [
        'https://123perlamis.alloforum.com/derniers-sujets-materiel-techniques-c44498-nuanciers-perles-s17542.xml',
        { key: 'alloforum:subcategory', label: 'Subcategory' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [alloforumHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
