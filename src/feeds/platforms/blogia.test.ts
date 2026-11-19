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
    it('should keep the scheme of an http page', () => {
      const value = 'http://alice.blogia.com/temas/reflexiones/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.blogia.com/feed.xml',
          hint: { key: 'blogia:posts', label: 'Posts' },
        },
        {
          uri: 'http://alice.blogia.com/comentarios.xml',
          hint: { key: 'blogia:comments', label: 'Comments' },
        },
      ]

      expect(blogiaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the www host', () => {
      expect(blogiaHandler.resolve('https://www.blogia.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the comments hint for a comments feed', () => {
      const value = 'https://alice.blogia.com/comentarios.xml'
      const expected: DiscoverUriHint = { key: 'blogia:comments', label: 'Comments' }

      expect(blogiaHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a feed as itself', async () => {
      const value = 'http://alice.blogia.com/comentarios.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [blogiaHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.blogia.com/comentarios.xml',
          hint: { key: 'blogia:comments', label: 'Comments' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
