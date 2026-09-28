import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { TeletypeUrl } from './teletype.js'
import { parseTeletypeUrl, teletypeHandler } from './teletype.js'

describe('parseTeletypeUrl', () => {
  it('should return the username for a blog page', () => {
    const expected: TeletypeUrl = { kind: 'blog', username: 'durov' }

    expect(parseTeletypeUrl('https://teletype.in/@durov')).toEqual(expected)
  })

  it('should return the username for a post page', () => {
    const expected: TeletypeUrl = { kind: 'blog', username: 'durov' }

    expect(parseTeletypeUrl('https://teletype.in/@durov/BJiAh0PhG')).toEqual(expected)
  })

  it('should decode an encoded username', () => {
    const expected: TeletypeUrl = { kind: 'blog', username: 'дуров' }

    expect(parseTeletypeUrl('https://teletype.in/@%D0%B4%D1%83%D1%80%D0%BE%D0%B2')).toEqual(
      expected,
    )
  })

  it('should return undefined for a malformed encoded username', () => {
    expect(parseTeletypeUrl('https://teletype.in/@%E0%A4%A')).toBeUndefined()
  })

  it('should return undefined for paths without @ prefix', () => {
    expect(parseTeletypeUrl('https://teletype.in/')).toBeUndefined()
    expect(parseTeletypeUrl('https://teletype.in/about')).toBeUndefined()
    expect(parseTeletypeUrl('https://teletype.in/rss/durov')).toBeUndefined()
  })

  it('should return undefined for an empty username', () => {
    expect(parseTeletypeUrl('https://teletype.in/@')).toBeUndefined()
  })

  it('should return undefined for a custom domain blog', () => {
    expect(parseTeletypeUrl('https://journal.teletype.in/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTeletypeUrl('https://example.com/@durov')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseTeletypeUrl('not-a-url')).toBeUndefined()
  })
})

describe('teletypeHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(teletypeHandler.match('https://teletype.in/@durov')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(teletypeHandler.match('https://teletype.in/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the RSS and Atom feeds for a blog', () => {
      const value = 'https://teletype.in/@durov'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://teletype.in/rss/durov',
          hint: { key: 'teletype:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://teletype.in/atom/durov',
          hint: { key: 'teletype:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(teletypeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without @ prefix', () => {
      expect(teletypeHandler.resolve('https://teletype.in/about')).toEqual([])
    })
  })
})
