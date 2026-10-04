import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BloggerDeUrl, bloggerDeHandler, parseBloggerDeUrl } from './bloggerDe.js'

describe('parseBloggerDeUrl', () => {
  const values: Array<[string, BloggerDeUrl]> = [
    ['https://alice.blogger.de/', { kind: 'blog', blog: 'alice' }],
    ['https://Alice.blogger.de/', { kind: 'blog', blog: 'alice' }],
    ['https://alice.blogger.de/stories/2918480/', { kind: 'blog', blog: 'alice' }],
    ['https://alice.blogger.de/topics/Ex Libris', { kind: 'blog', blog: 'alice' }],
  ]

  it.each(values)('should parse %s', (url, expected) => {
    expect(parseBloggerDeUrl(url)).toEqual(expected)
  })

  const unmatched: Array<string> = [
    'https://blogger.de/',
    'https://www.blogger.de/members/login',
    'https://cdn.blogger.de/static/antville/info/files/bannerbig.js',
    'https://www.alice.blogger.de/',
    'https://example.com/rss',
    'not-a-url',
  ]

  it.each(unmatched)('should return undefined for %s', (url) => {
    expect(parseBloggerDeUrl(url)).toBeUndefined()
  })
})

describe('bloggerDeHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(bloggerDeHandler.match('https://alice.blogger.de/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(bloggerDeHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(bloggerDeHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed for a blog page', () => {
      const value = 'https://alice.blogger.de/stories/2918480/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogger.de/rss',
          hint: { key: 'blogger-de:posts', label: 'Posts' },
        },
      ]

      expect(bloggerDeHandler.resolve(value)).toEqual(expected)
    })
  })
})
