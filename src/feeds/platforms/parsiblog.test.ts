import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type ParsiblogUrl, parseParsiblogUrl, parsiblogHandler } from './parsiblog.js'

describe('parseParsiblogUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: ParsiblogUrl = { kind: 'blog', blog: 'alice' }

    expect(parseParsiblogUrl('http://alice.parsiblog.com/')).toEqual(expected)
  })

  it('should return the blog for a parsiblog.ir subdomain', () => {
    const expected: ParsiblogUrl = { kind: 'blog', blog: 'alice' }

    expect(parseParsiblogUrl('http://alice.parsiblog.ir/')).toEqual(expected)
  })

  it('should return the blog for a post page in any case', () => {
    const value = 'http://Alice.ParsiBlog.com/Posts/12/%d8%b3%d9%84%d8%a7%d9%85/'
    const expected: ParsiblogUrl = { kind: 'blog', blog: 'alice' }

    expect(parseParsiblogUrl(value)).toEqual(expected)
  })

  it('should return undefined for the portal', () => {
    expect(parseParsiblogUrl('http://www.ParsiBlog.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseParsiblogUrl('http://parsiblog.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseParsiblogUrl('http://x.alice.parsiblog.com/')).toBeUndefined()
  })

  it('should return undefined for a nested parsiblog.ir subdomain', () => {
    expect(parseParsiblogUrl('http://x.alice.parsiblog.ir/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseParsiblogUrl('http://example.com/')).toBeUndefined()
  })
})

describe('parsiblogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'http://alice.parsiblog.com/'],
      [false, 'http://www.parsiblog.com/'],
      [true, 'http://alice.parsiblog.ir/'],
      [false, 'http://www.parsiblog.ir/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(parsiblogHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Parsiblog', () => {
      expect(parsiblogHandler.resolve('http://example.com/')).toEqual([])
    })

    it('should return RSS and Atom feeds over http for a blog page', () => {
      const value = 'https://Alice.ParsiBlog.com/Posts/12/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.parsiblog.com/rss/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.parsiblog.com/atom/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(parsiblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the parsiblog.com feeds for a parsiblog.ir blog page', () => {
      const value = 'http://alice.parsiblog.ir/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.parsiblog.com/rss/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.parsiblog.com/atom/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(parsiblogHandler.resolve(value)).toEqual(expected)
    })
  })
})
