import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isSvbtleHtml, svbtleHandler } from './svbtle.js'

const svbtleHtml = '<meta name="generator" content="Svbtle.com" />'
const otherHtml = '<meta name="generator" content="Ghost 5.0">'

describe('isSvbtleHtml', () => {
  it('should return true for the Svbtle generator meta tag', () => {
    expect(isSvbtleHtml(svbtleHtml)).toBe(true)
  })

  it('should return true for the Svbtle asset host', () => {
    const value = '<link rel="stylesheet" href="https://lightning.svbtle.com/cargo/blog.css">'

    expect(isSvbtleHtml(value)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isSvbtleHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isSvbtleHtml('')).toBe(false)
  })
})

describe('svbtleHandler', () => {
  describe('match', () => {
    it('should match a blog on its own host', () => {
      expect(svbtleHandler.match('https://example.com/a-post', svbtleHtml)).toBe(true)
    })

    it('should not match the platform host', () => {
      expect(svbtleHandler.match('https://www.svbtle.com/feed', svbtleHtml)).toBe(false)
      expect(svbtleHandler.match('https://svbtle.com/alice', svbtleHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(svbtleHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed', () => {
      const value = 'https://example.com/a-post'
      const expected = [
        { uri: 'https://example.com/feed', hint: { key: 'svbtle:posts', label: 'Posts' } },
      ]

      expect(svbtleHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the platform host', () => {
      expect(svbtleHandler.resolve('https://www.svbtle.com/alice')).toEqual([])
    })

    it('should keep the http scheme of the blog', () => {
      const value = 'http://alice.svbtle.com/a-post'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'http://alice.svbtle.com/feed', hint: { key: 'svbtle:posts', label: 'Posts' } },
      ]

      expect(svbtleHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a feed on a blog subdomain', () => {
      const value = 'https://alice.svbtle.com/feed'
      const expected: DiscoverUriHint = { key: 'svbtle:posts', label: 'Posts' }

      expect(svbtleHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a feed on a blog subdomain as itself', async () => {
      const value = 'https://alice.svbtle.com/feed'
      const hint: DiscoverUriHint = { key: 'svbtle:posts', label: 'Posts' }
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [svbtleHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
