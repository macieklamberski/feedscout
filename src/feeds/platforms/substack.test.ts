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

    it('should return undefined for a podcast feed', () => {
      const value = 'https://api.substack.com/feed/podcast/99741.rss'

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
  })
})
