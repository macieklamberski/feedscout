import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  it('should return the forum for an uppercase route letter', () => {
    const value = 'https://example.alloforum.com/sample-C12-1.html'
    const expected: AlloforumUrl = { kind: 'forum' }

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

  const serviceHosts = [
    'https://admin.alloforum.com/',
    'https://images.alloforum.com/rss.gif',
    'https://mail.alloforum.com/',
    'https://smtp.alloforum.com/',
    'https://upload.alloforum.com/',
    'https://webmail.alloforum.com/',
    'https://www.alloforum.com/',
  ]

  it.each(serviceHosts)('should return undefined for service host %s', (value) => {
    expect(parseAlloforumUrl(value)).toBeUndefined()
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
})
