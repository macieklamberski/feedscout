import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PosthavenUrl, parsePosthavenUrl, posthavenHandler } from './posthaven.js'

describe('parsePosthavenUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: PosthavenUrl = { kind: 'tag', tag: 'travel' }

    expect(parsePosthavenUrl('https://example.posthaven.com/tag/travel')).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const expected: PosthavenUrl = { kind: 'blog' }

    expect(parsePosthavenUrl('https://example.posthaven.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parsePosthavenUrl('https://example.com/tag/travel')).toBeUndefined()
  })
})

describe('posthavenHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.posthaven.com'],
      [true, 'https://anything.posthaven.com/post'],
      [false, 'https://posthaven.com'],
      [false, 'https://www.posthaven.com'],
      [false, 'https://blog.example.posthaven.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(posthavenHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(posthavenHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Posthaven', () => {
      expect(posthavenHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return posts feed for blog', () => {
      const value = 'https://alice.posthaven.com'
      const expected = [
        {
          uri: 'https://alice.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.posthaven.com/some-post-slug'
      const expected = [
        {
          uri: 'https://alice.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds under the page scheme for an http page', () => {
      const value = 'http://alice.posthaven.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and posts feeds for /tag/{tag}', () => {
      const value = 'https://alice.posthaven.com/tag/Feature%20Releases'
      const expected = [
        {
          uri: 'https://alice.posthaven.com/tag/Feature%20Releases.atom',
          hint: { key: 'posthaven:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and posts feeds for /tag/{tag} with a capitalized tag segment', () => {
      const value = 'https://alice.posthaven.com/Tag/Feature%20Releases'
      const expected = [
        {
          uri: 'https://alice.posthaven.com/tag/Feature%20Releases.atom',
          hint: { key: 'posthaven:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.posthaven.com/posts.atom',
          hint: { key: 'posthaven:posts', label: 'Posts' },
        },
      ]

      expect(posthavenHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a posts feed', () => {
      const value = 'https://erin.posthaven.com/posts.atom'
      const expected: DiscoverUriHint = { key: 'posthaven:posts', label: 'Posts' }

      expect(posthavenHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a tag feed as itself', async () => {
      const value = 'https://bob.posthaven.com/tag/webapp.atom'
      const options = {
        ...defaultPlatformOptions,
        handlers: [posthavenHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'posthaven:tag', label: 'Tag' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
