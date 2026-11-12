import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type LichessUrl, lichessHandler, parseLichessUrl } from './lichess.js'

describe('parseLichessUrl', () => {
  it('should return the blog for a user blog page', () => {
    const expected: LichessUrl = { kind: 'blog', username: 'thibault' }

    expect(parseLichessUrl('https://lichess.org/@/thibault/blog')).toEqual(expected)
  })

  it('should return the language for a community blog page', () => {
    const expected: LichessUrl = { kind: 'community', language: 'fr' }

    expect(parseLichessUrl('https://lichess.org/fr/blog/community')).toEqual(expected)
  })

  it('should return a language longer than three letters', () => {
    const expected: LichessUrl = { kind: 'community', language: 'abcd' }

    expect(parseLichessUrl('https://lichess.org/abcd/blog/community')).toEqual(expected)
  })

  it('should return the community blog page without a language', () => {
    const expected: LichessUrl = { kind: 'community' }

    expect(parseLichessUrl('https://lichess.org/blog/community')).toEqual(expected)
  })

  it('should return the official blog for the blog page', () => {
    const expected: LichessUrl = { kind: 'officialBlog' }

    expect(parseLichessUrl('https://lichess.org/blog')).toEqual(expected)
  })

  it('should return the home page for any other page', () => {
    const expected: LichessUrl = { kind: 'home' }

    expect(parseLichessUrl('https://lichess.org/@/thibault')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLichessUrl('https://example.com/')).toBeUndefined()
  })
})

describe('lichessHandler', () => {
  describe('match', () => {
    it('should match a lichess.org URL', () => {
      expect(lichessHandler.match('https://lichess.org/@/thibault/blog')).toBe(true)
    })

    it('should not match another host', () => {
      expect(lichessHandler.match('https://example.com/@/thibault/blog')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Lichess', () => {
      expect(lichessHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the blog feed for a user blog', () => {
      const value = 'https://lichess.org/@/thibault/blog'
      const expected = [
        {
          uri: 'https://lichess.org/@/thibault/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed for a user blog post', () => {
      const value = 'https://lichess.org/@/thibault/blog/how-to-report-a-bug/otcAwtvA'
      const expected = [
        {
          uri: 'https://lichess.org/@/thibault/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the username case', () => {
      const value = 'https://lichess.org/@/Thibault/blog'
      const expected = [
        {
          uri: 'https://lichess.org/@/Thibault/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the Lichess blog feed for the official blog', () => {
      const value = 'https://lichess.org/blog'
      const expected = [
        {
          uri: 'https://lichess.org/@/Lichess/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the Lichess blog feed for an old official blog post', () => {
      const value = 'https://lichess.org/blog/W3WeMyQAACQAdfAL/7-piece-syzygy-tablebases'
      const expected = [
        {
          uri: 'https://lichess.org/@/Lichess/blog.atom',
          hint: { key: 'lichess:blog', label: 'Blog' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the community blogs feed for the community page', () => {
      const value = 'https://lichess.org/blog/community?filter=best'
      const expected = [
        {
          uri: 'https://lichess.org/blog/community.atom',
          hint: { key: 'lichess:community', label: 'Community blogs' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the language community blogs feed for a language community page', () => {
      const value = 'https://lichess.org/fr/blog/community'
      const expected = [
        {
          uri: 'https://lichess.org/blog/community.atom?lang=fr',
          hint: { key: 'lichess:community', label: 'Community blogs' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of an uppercase language code', () => {
      const value = 'https://lichess.org/FR/blog/community'
      const expected = [
        {
          uri: 'https://lichess.org/blog/community.atom?lang=FR',
          hint: { key: 'lichess:community', label: 'Community blogs' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for a monthly blog archive page', () => {
      const value = 'https://lichess.org/blog/monthly/2026/9'
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for a blog topic page', () => {
      const value = 'https://lichess.org/blog/topic/Chess'
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for the blog topics page', () => {
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve('https://lichess.org/blog/topic')).toEqual(expected)
    })

    it('should return the updates feed for a profile page', () => {
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve('https://lichess.org/@/thibault')).toEqual(expected)
    })

    it('should return the updates feed for the home page', () => {
      const expected = [
        {
          uri: 'https://lichess.org/feed.atom',
          hint: { key: 'lichess:updates', label: 'Updates' },
        },
      ]

      expect(lichessHandler.resolve('https://lichess.org/')).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the blog key for a user blog feed', () => {
      const value = 'https://lichess.org/@/A-T_A-S/blog.atom'
      const expected = 'lichess:blog'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for the official blog feed', () => {
      const value = 'https://lichess.org/@/Lichess/blog.atom'
      const expected = 'lichess:blog'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for the official blog feed at its short path', () => {
      const value = 'https://lichess.org/blog.atom'
      const expected = 'lichess:blog'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the community key for a language community feed', () => {
      const value = 'https://lichess.org/blog/community.atom?lang=de'
      const expected = 'lichess:community'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the community key for the community feed', () => {
      const value = 'https://lichess.org/blog/community.atom'
      const expected = 'lichess:community'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the updates key for the updates feed', () => {
      const value = 'https://lichess.org/feed.atom'
      const expected = 'lichess:updates'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a feed on the www host', () => {
      const value = 'https://www.lichess.org/@/ambrona/blog.atom'
      const expected = 'lichess:blog'

      expect(lichessHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user blog page', () => {
      const value = 'https://lichess.org/@/ambrona/blog'

      expect(lichessHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a community blog page', () => {
      const value = 'https://lichess.org/de/blog/community'

      expect(lichessHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://lichess.org/@/ambrona'

      expect(lichessHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog feed on another host', () => {
      const value = 'https://example.com/@/ambrona/blog.atom'

      expect(lichessHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://lichess.org/@/A-T_A-S/blog.atom', { key: 'lichess:blog', label: 'Blog' }],
      ['https://lichess.org/@/Lichess/blog.atom', { key: 'lichess:blog', label: 'Blog' }],
      ['https://lichess.org/blog.atom', { key: 'lichess:blog', label: 'Blog' }],
      [
        'https://lichess.org/blog/community.atom?lang=tk',
        { key: 'lichess:community', label: 'Community blogs' },
      ],
      [
        'https://lichess.org/blog/community.atom',
        { key: 'lichess:community', label: 'Community blogs' },
      ],
      ['https://lichess.org/feed.atom', { key: 'lichess:updates', label: 'Updates' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [lichessHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
