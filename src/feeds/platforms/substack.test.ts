import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getSubstackPage,
  parseSubstackUrl,
  type SubstackPage,
  type SubstackUrl,
  substackHandler,
} from './substack.js'

describe('parseSubstackUrl', () => {
  it('should return the newsletter for a publication subdomain', () => {
    const expected: SubstackUrl = { kind: 'newsletter' }

    expect(parseSubstackUrl('https://example.substack.com/p/post')).toEqual(expected)
  })

  it('should return the profile for a profile page', () => {
    const expected: SubstackUrl = { kind: 'profile', username: 'example' }

    expect(parseSubstackUrl('https://substack.com/@example')).toEqual(expected)
  })

  it('should return a one-letter username whole', () => {
    const expected: SubstackUrl = { kind: 'profile', username: 'a' }

    expect(parseSubstackUrl('https://substack.com/@a')).toEqual(expected)
  })

  it('should return undefined for a username with a dot', () => {
    expect(parseSubstackUrl('https://substack.com/@platformer.old')).toBeUndefined()
  })

  it('should return undefined for an apex page without a profile path', () => {
    expect(parseSubstackUrl('https://substack.com/home')).toBeUndefined()
  })

  it('should return undefined for the app host', () => {
    expect(parseSubstackUrl('https://open.substack.com/pub/myname/p/post-slug')).toBeUndefined()
  })

  it('should return undefined for the API host', () => {
    expect(parseSubstackUrl('https://api.substack.com/feed/podcast/12345.rss')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSubstackUrl('https://example.com/@example')).toBeUndefined()
  })
})

describe('getSubstackPage', () => {
  it('should return the origin of a newsletter page', () => {
    const value = 'https://alicewrites.substack.com/p/first-post'
    const expected: SubstackPage = {
      kind: 'newsletter',
      origin: 'https://alicewrites.substack.com',
    }

    expect(getSubstackPage(value, undefined)).toEqual(expected)
  })

  it('should return the custom domain of the primary publication of a profile', () => {
    const content =
      '{\\"primaryPublication\\":{\\"id\\":4330724,\\"subdomain\\":\\"alicewrites\\",\\"custom_domain\\":\\"newsletter.example.com\\"}}'
    const expected: SubstackPage = { kind: 'profile', origin: 'https://newsletter.example.com' }

    expect(getSubstackPage('https://substack.com/@alice', content)).toEqual(expected)
  })

  it('should return the subdomain of the primary publication of a profile', () => {
    const content =
      '{"primaryPublication":{"id":4330724,"subdomain":"alicewrites","custom_domain":null}}'
    const expected: SubstackPage = { kind: 'profile', origin: 'https://alicewrites.substack.com' }

    expect(getSubstackPage('https://substack.com/@alice', content)).toEqual(expected)
  })

  it('should return the handle subdomain of a profile without content', () => {
    const expected: SubstackPage = { kind: 'profile', origin: 'https://alice.substack.com' }

    expect(getSubstackPage('https://substack.com/@alice', undefined)).toEqual(expected)
  })

  it('should return undefined for the app host', () => {
    expect(getSubstackPage('https://open.substack.com/pub/alice', undefined)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getSubstackPage('https://example.com/@alice', undefined)).toBeUndefined()
  })
})

describe('substackHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.substack.com'],
      [false, 'https://blog.example.substack.com'],
      [true, 'https://assets.substack.com'],
      [false, 'https://api.substack.com/feed/podcast/12345.rss'],
      [true, 'https://substack.com/@alice'],
      [true, 'https://substack.com/@bob'],
      [true, 'https://substack.com/@user-name'],
      [false, 'https://substack.com/home'],
      [false, 'https://substack.com'],
      [false, 'https://www.substack.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(substackHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(substackHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for newsletter', () => {
      const value = 'https://example.substack.com'
      const expected = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://example.substack.com/p/some-article'
      const expected = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for profile page', () => {
      const value = 'https://substack.com/@alice'
      const expected = [
        {
          uri: 'https://alice.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return the custom domain feed a profile page names', () => {
      const value = 'https://substack.com/@alice'
      const content =
        '{\\"primaryPublication\\":{\\"id\\":4330724,\\"subdomain\\":\\"alicewrites\\",\\"custom_domain\\":\\"newsletter.example.com\\"}}'
      const expected = [
        {
          uri: 'https://newsletter.example.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the publication subdomain feed when the custom domain is not one host', () => {
      const value = 'https://substack.com/@alice'
      const content =
        '{"primaryPublication":{"id":4330724,"subdomain":"alicewrites","custom_domain":"newsletter.example.com/x"}}'
      const expected = [
        {
          uri: 'https://alicewrites.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the publication subdomain feed when it differs from the handle', () => {
      const value = 'https://substack.com/@alice'
      const content =
        '{"primaryPublication":{"id":4330724,"subdomain":"alicewrites","custom_domain":null}}'
      const expected = [
        {
          uri: 'https://alicewrites.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should read a profile page with a long run of primaryPublication in linear time', () => {
      const value = 'https://substack.com/@alice'
      const content = '"primaryPublication":{'.repeat(25_000)
      const expected = [
        {
          uri: 'https://alice.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      const start = performance.now()
      const result = substackHandler.resolve(value, content)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(result).toEqual(expected)
    })

    it('should return feed URL for profile page with subpath', () => {
      const value = 'https://substack.com/@bob/recommendations'
      const expected = [
        {
          uri: 'https://bob.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for an apex URL without a profile path', () => {
      expect(substackHandler.resolve('https://substack.com/home')).toEqual([])
    })

    it('should return the podcast feed of a publication with a podcast', () => {
      const value = 'https://example.substack.com/podcast'
      const content =
        '{"pub":{"author_id":678,"hide_podcast_feed_link":false,"id":12345,"podcast_enabled":true,"podcast_feed_url":null}}'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
        {
          uri: 'https://api.substack.com/feed/podcast/12345.rss',
          hint: { key: 'substack:podcast', label: 'Podcast' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the newsletter feed alone for a publication without a podcast', () => {
      const value = 'https://example.substack.com'
      const content = '{"pub":{"author_id":678,"id":12345,"podcast_enabled":false}}'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for a podcast feed on the API host', () => {
      const value = 'https://api.substack.com/feed/podcast/12345.rss'
      const expected: Array<DiscoverUriEntry> = []

      expect(substackHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedUrls = [
      'https://piratewires.substack.com/feed',
      'https://piratewires.substack.com/feed.xml',
      'https://piratewires.substack.com/feed.rss',
      'http://piratewires.substack.com/feed',
      'https://DASMEEOK.substack.com/feed',
    ]

    it.each(feedUrls)('should return the newsletter hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'substack:newsletter', label: 'Newsletter' }

      expect(substackHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newsletter hint for a section feed', () => {
      const value = 'https://biggersisterchannel.substack.com/feed?sectionId=194387'
      const expected: DiscoverUriHint = { key: 'substack:newsletter', label: 'Newsletter' }

      expect(substackHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a newsletter page', () => {
      const value = 'https://piratewires.substack.com/p/some-article'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    const podcastFeedUrls = [
      'https://api.substack.com/feed/podcast/12345.rss',
      'https://api.substack.com/feed/podcast/12345/s/678.rss',
      'https://api.substack.com/feed/podcast/spotify/0b6c0a4e-1f2d-4e3a-9c8b-7a6d5e4f3c2b/12345.rss',
    ]

    it.each(podcastFeedUrls)('should return the podcast hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'substack:podcast', label: 'Podcast' }

      expect(substackHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the private feed of a paid podcast', () => {
      const value =
        'https://api.substack.com/feed/podcast/12345/private/0b6c0a4e-1f2d-4e3a-9c8b-7a6d5e4f3c2b.rss'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the API host', () => {
      const value = 'https://api.substack.com/feed'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://substack.com/feed'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www.substack.com', () => {
      const value = 'https://www.substack.com/feed'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the app host', () => {
      const value = 'https://open.substack.com/feed'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.piratewires.substack.com/feed'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://www.lennysnewsletter.com/feed'

      expect(substackHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds = [
      'https://piratewires.substack.com/feed',
      'https://piratewires.substack.com/feed.xml',
      'https://piratewires.substack.com/feed.rss',
      'https://DASMEEOK.substack.com/feed',
      'https://biggersisterchannel.substack.com/feed?sectionId=194387',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [substackHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'substack:newsletter', label: 'Newsletter' } },
      ]

      expect(result).toEqual(expected)
    })

    const podcastFeeds = [
      'https://api.substack.com/feed/podcast/12345.rss',
      'https://api.substack.com/feed/podcast/12345/s/678.rss',
      'https://api.substack.com/feed/podcast/spotify/0b6c0a4e-1f2d-4e3a-9c8b-7a6d5e4f3c2b/12345.rss',
    ]

    it.each(podcastFeeds)('should return podcast feed %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [substackHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'substack:podcast', label: 'Podcast' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
