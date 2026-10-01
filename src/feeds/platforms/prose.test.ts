import { describe, expect, it } from 'bun:test'
import { type ProseUrl, parseProseUrl, proseHandler } from './prose.js'

describe('parseProseUrl', () => {
  it('should return the home page for the apex host', () => {
    const expected: ProseUrl = { kind: 'home' }

    expect(parseProseUrl('https://prose.sh/')).toEqual(expected)
  })

  it('should return the tag for a tag query', () => {
    const expected: ProseUrl = { kind: 'tag', tag: 'go' }

    expect(parseProseUrl('https://example.prose.sh/?tag=go')).toEqual(expected)
  })

  it('should return the blog for a subdomain', () => {
    const expected: ProseUrl = { kind: 'blog' }

    expect(parseProseUrl('https://example.prose.sh/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseProseUrl('https://example.com/')).toBeUndefined()
  })
})

describe('proseHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.prose.sh'],
      [true, 'https://blog.example.prose.sh'],
      [true, 'https://prose.sh'],
      [true, 'https://www.prose.sh'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(proseHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(proseHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside prose.sh', () => {
      expect(proseHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.prose.sh'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.prose.sh/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered feed when tag query is set', () => {
      const value = 'https://alice.prose.sh/?tag=announcement'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss?tag=announcement',
          hint: { key: 'prose:tag', label: 'Tag' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return discovery feed for apex prose.sh', () => {
      const value = 'https://prose.sh/'
      const expected = [
        {
          uri: 'https://prose.sh/rss',
          hint: { key: 'prose:discovery', label: 'Discovery' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return discovery feed for www apex', () => {
      const value = 'https://www.prose.sh/'
      const expected = [
        {
          uri: 'https://prose.sh/rss',
          hint: { key: 'prose:discovery', label: 'Discovery' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })
  })
})
