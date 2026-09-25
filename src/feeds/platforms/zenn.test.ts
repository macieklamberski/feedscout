import { describe, expect, it } from 'bun:test'
import type { ZennUrl } from './zenn.js'
import { parseZennUrl, zennHandler } from './zenn.js'

describe('parseZennUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: ZennUrl = { kind: 'user', username: 'catnose99' }

    expect(parseZennUrl('https://zenn.dev/catnose99')).toEqual(expected)
  })

  it('should return the user for an article page', () => {
    const expected: ZennUrl = { kind: 'user', username: 'catnose99' }

    expect(parseZennUrl('https://zenn.dev/catnose99/articles/some-article')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: ZennUrl = { kind: 'user', username: 'catnose99' }

    expect(parseZennUrl('https://www.zenn.dev/catnose99')).toEqual(expected)
  })

  it('should return the topic for a topic page', () => {
    const expected: ZennUrl = { kind: 'topic', topic: 'react' }

    expect(parseZennUrl('https://zenn.dev/topics/react')).toEqual(expected)
  })

  it('should return the topic for a topic feed URL', () => {
    const expected: ZennUrl = { kind: 'topic', topic: 'react' }

    expect(parseZennUrl('https://zenn.dev/topics/react/feed')).toEqual(expected)
  })

  it('should return the publication for a short publication page', () => {
    const expected: ZennUrl = { kind: 'publication', publication: 'team_zenn' }

    expect(parseZennUrl('https://zenn.dev/p/team_zenn')).toEqual(expected)
  })

  it('should return the publication for a long publication page', () => {
    const expected: ZennUrl = { kind: 'publication', publication: 'team_zenn' }

    expect(parseZennUrl('https://zenn.dev/publications/team_zenn')).toEqual(expected)
  })

  it('should return undefined for excluded paths', () => {
    expect(parseZennUrl('https://zenn.dev/topics')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/about')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/api')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/articles')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/books')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/login')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/notifications')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/p')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/privacy')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/publications')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/scraps')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/search')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/settings')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/signup')).toBeUndefined()
    expect(parseZennUrl('https://zenn.dev/terms')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseZennUrl('https://zenn.dev/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseZennUrl('https://example.com/catnose99')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseZennUrl('not-a-url')).toBeUndefined()
  })
})

describe('zennHandler', () => {
  describe('match', () => {
    it('should match a zenn.dev URL', () => {
      expect(zennHandler.match('https://zenn.dev')).toBe(true)
    })

    it('should not match another host', () => {
      expect(zennHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://zenn.dev/catnose99'
      const expected = [
        {
          uri: 'https://zenn.dev/catnose99/feed',
          hint: { key: 'zenn:posts', label: 'Posts' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for topic page', () => {
      const value = 'https://zenn.dev/topics/react'
      const expected = [
        {
          uri: 'https://zenn.dev/topics/react/feed',
          hint: { key: 'zenn:topic', label: 'Topic' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for short publication page', () => {
      const value = 'https://zenn.dev/p/team_zenn'
      const expected = [
        {
          uri: 'https://zenn.dev/p/team_zenn/feed',
          hint: { key: 'zenn:publication', label: 'Publication' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for root path', () => {
      const value = 'https://zenn.dev/'
      const expected = [
        {
          uri: 'https://zenn.dev/feed',
          hint: { key: 'zenn:trending', label: 'Trending' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(zennHandler.resolve('https://zenn.dev/search')).toEqual([])
    })
  })
})
