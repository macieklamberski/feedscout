import { describe, expect, it } from 'bun:test'
import type { PostypeUrl } from './postype.js'
import { parsePostypeUrl, postypeHandler } from './postype.js'

describe('parsePostypeUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: PostypeUrl = { kind: 'channel', channel: 'example' }

    expect(parsePostypeUrl('https://www.postype.com/@example')).toEqual(expected)
  })

  it('should return the channel for the bare host', () => {
    const expected: PostypeUrl = { kind: 'channel', channel: 'example' }

    expect(parsePostypeUrl('https://postype.com/@example')).toEqual(expected)
  })

  it('should return the channel for a post page', () => {
    const expected: PostypeUrl = { kind: 'channel', channel: 'example' }

    expect(parsePostypeUrl('https://www.postype.com/@example/post/23216701')).toEqual(expected)
  })

  it('should return the channel for a channel subdomain', () => {
    const expected: PostypeUrl = { kind: 'subdomain', channel: 'example' }

    expect(parsePostypeUrl('https://example.postype.com/')).toEqual(expected)
  })

  it('should return undefined for a bare at sign', () => {
    expect(parsePostypeUrl('https://www.postype.com/@')).toBeUndefined()
  })

  it('should return undefined for a page outside a channel', () => {
    expect(parsePostypeUrl('https://www.postype.com/explore')).toBeUndefined()
  })

  it('should return undefined for the main host root', () => {
    expect(parsePostypeUrl('https://www.postype.com/')).toBeUndefined()
  })

  it('should return undefined for infrastructure subdomains', () => {
    expect(parsePostypeUrl('https://api.postype.com/')).toBeUndefined()
    expect(parsePostypeUrl('https://cdn.postype.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePostypeUrl('https://a.b.postype.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePostypeUrl('https://example.com/@example')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePostypeUrl('not-a-url')).toBeUndefined()
  })
})

describe('postypeHandler', () => {
  describe('match', () => {
    it('should match a channel page', () => {
      expect(postypeHandler.match('https://www.postype.com/@example')).toBe(true)
    })

    it('should not match the main host without a channel path', () => {
      expect(postypeHandler.match('https://www.postype.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the channel feed for a path form', () => {
      const value = 'https://www.postype.com/@example'
      const expected = [
        {
          uri: 'https://www.postype.com/@example/rss',
          hint: { key: 'postype:posts', label: 'Posts' },
        },
      ]

      expect(postypeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the channel feed for a subdomain form', () => {
      const value = 'https://example.postype.com/'
      const expected = [
        {
          uri: 'https://example.postype.com/rss',
          hint: { key: 'postype:posts', label: 'Posts' },
        },
      ]

      expect(postypeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the main host root', () => {
      expect(postypeHandler.resolve('https://www.postype.com/')).toEqual([])
    })
  })
})
