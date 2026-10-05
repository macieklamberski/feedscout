import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { parseViablogaUrl, type ViablogaUrl, viablogaHandler } from './viabloga.js'

describe('parseViablogaUrl', () => {
  it('should return the blog for a blog home page', () => {
    const expected: ViablogaUrl = { kind: 'blog' }

    expect(parseViablogaUrl('http://alice.viabloga.com/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: ViablogaUrl = { kind: 'blog' }

    expect(parseViablogaUrl('http://alice.viabloga.com/news/canal-du-midi')).toEqual(expected)
  })

  const otherUrls = [
    'http://www.viabloga.com/',
    'http://viabloga2.viabloga.com/',
    'http://images.viabloga.com/',
    'http://news.viabloga.com/',
    'http://support.viabloga.com/',
    'http://test.viabloga.com/',
    'http://www.alice.viabloga.com/',
    'http://viabloga.com/',
    'http://example.com/',
  ]

  it.each(otherUrls)('should return undefined for %s', (url) => {
    expect(parseViablogaUrl(url)).toBeUndefined()
  })
})

describe('viablogaHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(viablogaHandler.match('http://alice.viabloga.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(viablogaHandler.match('http://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts, comments and wiki feeds for blog', () => {
      const value = 'http://alice.viabloga.com/news/canal-du-midi'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.viabloga.com/index.xml',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/atom.xml',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://alice.viabloga.com/index.rdf',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'http://alice.viabloga.com/comments.xml',
          hint: { key: 'viabloga:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/wiki.rdf',
          hint: { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' },
        },
      ]

      expect(viablogaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Viabloga', () => {
      expect(viablogaHandler.resolve('http://example.com/')).toEqual([])
    })
  })
})
