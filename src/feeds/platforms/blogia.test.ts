import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type BlogiaUrl, blogiaHandler, parseBlogiaUrl } from './blogia.js'

describe('parseBlogiaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BlogiaUrl = { kind: 'blog', blog: 'alice' }

    expect(parseBlogiaUrl('https://alice.blogia.com/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: BlogiaUrl = { kind: 'blog', blog: 'alice' }

    expect(parseBlogiaUrl('https://alice.blogia.com/2020/042201-el-techo-.php')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseBlogiaUrl('https://blogia.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseBlogiaUrl('https://www.blogia.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBlogiaUrl('https://example.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseBlogiaUrl('https://www.alice.blogia.com/')).toBeUndefined()
  })
})

describe('blogiaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.blogia.com/'],
      [false, 'https://www.blogia.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(blogiaHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return the https posts feed for an http page', () => {
      const value = 'http://alice.blogia.com/temas/reflexiones/'
      const expected = [
        {
          uri: 'https://alice.blogia.com/feed.xml',
          hint: { key: 'blogia:posts', label: 'Posts' },
        },
      ]

      expect(blogiaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the www host', () => {
      expect(blogiaHandler.resolve('https://www.blogia.com/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for a posts feed', () => {
      const value = 'https://alice.blogia.com/feed.xml'
      const expected = 'blogia:posts'

      expect(blogiaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http posts feed', () => {
      const value = 'http://alice.blogia.com/feed.xml'
      const expected = 'blogia:posts'

      expect(blogiaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alice.blogia.com/temas/reflexiones/'

      expect(blogiaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.blogia.com/feed.xml'

      expect(blogiaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://blogia.com/feed.xml'

      expect(blogiaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feed.xml'

      expect(blogiaHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'blogia:posts', label: 'Posts' }
    const ownFeeds: Array<string> = [
      'https://alice.blogia.com/feed.xml',
      'http://alice.blogia.com/feed.xml',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [blogiaHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
