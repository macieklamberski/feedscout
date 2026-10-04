import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type CanalblogUrl, canalblogHandler, parseCanalblogUrl } from './canalblog.js'

describe('parseCanalblogUrl', () => {
  it('should return the blog for a blog home page', () => {
    const expected: CanalblogUrl = { kind: 'blog' }

    expect(parseCanalblogUrl('https://alice.canalblog.com/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: CanalblogUrl = { kind: 'blog' }

    expect(
      parseCanalblogUrl('https://alice.canalblog.com/archives/2024/05/19/12345678.html'),
    ).toEqual(expected)
  })

  it('should return undefined for a service host', () => {
    expect(parseCanalblogUrl('https://www.canalblog.com/')).toBeUndefined()
    expect(parseCanalblogUrl('https://admin.canalblog.com/')).toBeUndefined()
    expect(
      parseCanalblogUrl('https://storage.canalblog.com/12/34/567890/12345678.jpg'),
    ).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseCanalblogUrl('https://www.alice.canalblog.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseCanalblogUrl('https://canalblog.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCanalblogUrl('https://example.com/')).toBeUndefined()
  })
})

describe('canalblogHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(canalblogHandler.match('https://alice.canalblog.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(canalblogHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed for blog', () => {
      const value = 'https://alice.canalblog.com/archives/2024/05/19/12345678.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.canalblog.com/rss',
          hint: { key: 'canalblog:posts', label: 'Posts' },
        },
      ]

      expect(canalblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Canalblog', () => {
      expect(canalblogHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
