import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PostachioUrl, parsePostachioUrl, postachioHandler } from './postachio.js'

describe('parsePostachioUrl', () => {
  it('should return the site for a site subdomain', () => {
    const expected: PostachioUrl = { kind: 'site', subdomain: 'alice' }

    expect(parsePostachioUrl('https://alice.postach.io/')).toEqual(expected)
  })

  it('should return the site for a post page', () => {
    const expected: PostachioUrl = { kind: 'site', subdomain: 'alice' }

    expect(parsePostachioUrl('https://alice.postach.io/post/some-post')).toEqual(expected)
  })

  it('should return the site for a tag page', () => {
    const expected: PostachioUrl = { kind: 'site', subdomain: 'alice' }

    expect(parsePostachioUrl('https://alice.postach.io/tag/travel')).toEqual(expected)
  })

  it('should lowercase the subdomain', () => {
    const expected: PostachioUrl = { kind: 'site', subdomain: 'alice' }

    expect(parsePostachioUrl('https://Alice.postach.io/')).toEqual(expected)
  })

  it('should return undefined for an excluded subdomain', () => {
    expect(parsePostachioUrl('https://www.postach.io/')).toBeUndefined()
    expect(parsePostachioUrl('https://api.postach.io/')).toBeUndefined()
    expect(parsePostachioUrl('https://blog.postach.io/')).toBeUndefined()
    expect(parsePostachioUrl('https://cdn-static.postach.io/')).toBeUndefined()
    expect(parsePostachioUrl('https://cdn-images.postach.io/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parsePostachioUrl('https://postach.io/blog/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePostachioUrl('https://example.com/')).toBeUndefined()
  })
})

describe('postachioHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.postach.io'],
      [false, 'https://www.postach.io'],
      [false, 'https://postach.io'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(postachioHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(postachioHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Postach.io', () => {
      expect(postachioHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return posts feed for site', () => {
      const value = 'http://alice.postach.io/post/some-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.postach.io/feed.xml',
          hint: { key: 'postachio:posts', label: 'Posts' },
        },
      ]

      expect(postachioHandler.resolve(value)).toEqual(expected)
    })
  })
})
