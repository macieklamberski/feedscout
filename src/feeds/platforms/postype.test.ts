import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  it('should return the post for a post page', () => {
    const expected: PostypeUrl = { kind: 'post', channel: 'example' }

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

    it('should return the channel feed for a post page', () => {
      const value = 'https://www.postype.com/@example/post/23216701'
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

    it('should return the https channel feed for a subdomain opened over http', () => {
      const value = 'http://example.postype.com/'
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

  describe('getFeedKey', () => {
    it('should return the posts key for the channel feed', () => {
      const value = 'https://www.postype.com/@example/rss'
      const expected = 'postype:posts'

      expect(postypeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the channel feed on the bare host', () => {
      const value = 'https://postype.com/@example/rss'
      const expected = 'postype:posts'

      expect(postypeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the subdomain feed', () => {
      const value = 'https://example.postype.com/rss'
      const expected = 'postype:posts'

      expect(postypeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the subdomain feed over http', () => {
      const value = 'http://example.postype.com/rss'
      const expected = 'postype:posts'

      expect(postypeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://www.postype.com/@example'

      expect(postypeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://www.postype.com/@example/post/23216701'

      expect(postypeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the main host without a channel', () => {
      const value = 'https://www.postype.com/rss'

      expect(postypeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://a.b.postype.com/rss'

      expect(postypeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds = [
      'https://www.postype.com/@example/rss',
      'https://postype.com/@example/rss',
      'https://www.postype.com/@example/rss/',
      'https://example.postype.com/rss',
      'http://example.postype.com/rss',
      'https://example.postype.com/rss/',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [postypeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'postype:posts', label: 'Posts' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
