import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { MediumUrl } from './medium.js'
import { mediumHandler, parseMediumUrl } from './medium.js'

describe('parseMediumUrl', () => {
  it('should return the user for a profile', () => {
    const expected: MediumUrl = { kind: 'user', username: 'ev' }

    expect(parseMediumUrl('https://medium.com/@ev')).toEqual(expected)
  })

  it('should return the user for a profile article', () => {
    const expected: MediumUrl = { kind: 'user', username: 'ev' }

    expect(parseMediumUrl('https://medium.com/@ev/some-article')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: MediumUrl = { kind: 'user', username: 'ev' }

    expect(parseMediumUrl('https://www.medium.com/@ev')).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: MediumUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMediumUrl('https://medium.com/tag/javascript')).toEqual(expected)
  })

  it('should return the tag for a tag page with a capitalized tag segment', () => {
    const expected: MediumUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMediumUrl('https://medium.com/Tag/javascript')).toEqual(expected)
  })

  it('should return the publication for a publication page', () => {
    const expected: MediumUrl = { kind: 'publication', publication: 'towards-data-science' }

    expect(parseMediumUrl('https://medium.com/towards-data-science')).toEqual(expected)
  })

  it('should return the publication for a publication on the www host', () => {
    const expected: MediumUrl = { kind: 'publication', publication: 'towards-data-science' }

    expect(parseMediumUrl('https://www.medium.com/towards-data-science')).toEqual(expected)
  })

  it('should return the publication for a numeric-only publication name', () => {
    const expected: MediumUrl = { kind: 'publication', publication: '12345' }

    expect(parseMediumUrl('https://medium.com/12345')).toEqual(expected)
  })

  it('should return the publication and tag for a publication tagged page', () => {
    const value = 'https://medium.com/towards-data-science/tagged/machine-learning'
    const expected: MediumUrl = {
      kind: 'publication',
      publication: 'towards-data-science',
      tag: 'machine-learning',
    }

    expect(parseMediumUrl(value)).toEqual(expected)
  })

  it('should return the publication and tag for a publication tagged page with a capitalized tagged segment', () => {
    const value = 'https://medium.com/towards-data-science/Tagged/machine-learning'
    const expected: MediumUrl = {
      kind: 'publication',
      publication: 'towards-data-science',
      tag: 'machine-learning',
    }

    expect(parseMediumUrl(value)).toEqual(expected)
  })

  it('should return the subdomain for a subdomain page', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'alice' }

    expect(parseMediumUrl('https://alice.medium.com/some-article')).toEqual(expected)
  })

  it('should return the subdomain for a subdomain root', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'alice' }

    expect(parseMediumUrl('https://alice.medium.com')).toEqual(expected)
  })

  it('should return the subdomain and tag for a subdomain tagged page', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'alice', tag: 'engineering' }

    expect(parseMediumUrl('https://alice.medium.com/tagged/engineering')).toEqual(expected)
  })

  it('should return the subdomain and tag for a subdomain tagged page with a capitalized tagged segment', () => {
    const expected: MediumUrl = { kind: 'subdomain', subdomain: 'alice', tag: 'engineering' }

    expect(parseMediumUrl('https://alice.medium.com/Tagged/engineering')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseMediumUrl('https://a.b.medium.com')).toBeUndefined()
  })

  const singleLetterSegmentValues: Array<string> = [
    'https://medium.com/m/signin',
    'https://medium.com/p/3f6a1b2c4d5e',
  ]

  it.each(singleLetterSegmentValues)(
    'should return undefined for a single-letter first segment %s',
    (value) => {
      expect(parseMediumUrl(value)).toBeUndefined()
    },
  )

  it('should return undefined for the root', () => {
    expect(parseMediumUrl('https://medium.com')).toBeUndefined()
    expect(parseMediumUrl('https://medium.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMediumUrl('https://example.com/@ev')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseMediumUrl('not-a-url')).toBeUndefined()
  })
})

describe('mediumHandler', () => {
  describe('match', () => {
    it('should match a medium.com URL', () => {
      expect(mediumHandler.match('https://medium.com/@ev')).toBe(true)
    })

    it('should not match another host', () => {
      expect(mediumHandler.match('https://example.com/@ev')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://medium.com/@ev'
      const expected = [
        { uri: 'https://medium.com/feed/@ev', hint: { key: 'medium:posts', label: 'Posts' } },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication', () => {
      const value = 'https://medium.com/towards-data-science'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain publication', () => {
      const value = 'https://alice.medium.com/some-article'
      const expected = [
        {
          uri: 'https://alice.medium.com/feed',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return the subdomain feed under the page scheme for an http publication', () => {
      const value = 'http://alice.medium.com/some-article'
      const expected = [
        {
          uri: 'http://alice.medium.com/feed',
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://medium.com/tag/javascript'
      const expected = [
        {
          uri: 'https://medium.com/feed/tag/javascript',
          hint: { key: 'medium:tag', label: 'Tag' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication tagged page', () => {
      const value = 'https://medium.com/towards-data-science/tagged/machine-learning'
      const expected = [
        {
          uri: 'https://medium.com/feed/towards-data-science/tagged/machine-learning',
          hint: { key: 'medium:tagged', label: 'Tagged' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain tagged page', () => {
      const value = 'https://alice.medium.com/tagged/engineering'
      const expected = [
        {
          uri: 'https://alice.medium.com/feed/tagged/engineering',
          hint: { key: 'medium:tagged', label: 'Tagged' },
        },
      ]

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://medium.com/'

      expect(mediumHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a user feed', () => {
      const value = 'https://medium.com/feed/@anngivens'
      const expected: DiscoverUriHint = { key: 'medium:posts', label: 'Posts' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a user feed on the www host', () => {
      const value = 'https://www.medium.com/feed/@mariandrew'
      const expected: DiscoverUriHint = { key: 'medium:posts', label: 'Posts' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a user feed with the feed segment last', () => {
      const value = 'https://medium.com/@alice.example/feed'
      const expected: DiscoverUriHint = { key: 'medium:posts', label: 'Posts' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://medium.com/feed/tag/fake-news'
      const expected: DiscoverUriHint = { key: 'medium:tag', label: 'Tag' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tagged hint for a publication tagged feed', () => {
      const value = 'https://medium.com/feed/towards-data-science/tagged/machine-learning'
      const expected: DiscoverUriHint = { key: 'medium:tagged', label: 'Tagged' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tagged hint for a subdomain tagged feed', () => {
      const value = 'https://humanparts.medium.com/feed/tagged/poetry'
      const expected: DiscoverUriHint = { key: 'medium:tagged', label: 'Tagged' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the publication hint for a publication feed', () => {
      const value = 'https://medium.com/feed/age-of-awareness'
      const expected: DiscoverUriHint = { key: 'medium:publication', label: 'Publication' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the publication hint for a publication named like a route word', () => {
      const value = 'https://medium.com/feed/tag'
      const expected: DiscoverUriHint = { key: 'medium:publication', label: 'Publication' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the publication hint for a subdomain feed', () => {
      const value = 'https://humanparts.medium.com/feed'
      const expected: DiscoverUriHint = { key: 'medium:publication', label: 'Publication' }

      expect(mediumHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://medium.com/@anngivens'

      expect(mediumHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://medium.com/tag/fake-news'

      expect(mediumHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a subdomain tagged page', () => {
      const value = 'https://humanparts.medium.com/tagged/poetry'

      expect(mediumHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the bare feed path on medium.com', () => {
      const value = 'https://medium.com/feed'

      expect(mediumHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://a.b.medium.com/feed'

      expect(mediumHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/feed'

      expect(mediumHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://medium.com/feed/@anngivens', { key: 'medium:posts', label: 'Posts' }],
      ['https://medium.com/@alice.example/feed', { key: 'medium:posts', label: 'Posts' }],
      ['http://www.medium.com/@alice/feed/', { key: 'medium:posts', label: 'Posts' }],
      ['https://medium.com/feed/tag/fake-news', { key: 'medium:tag', label: 'Tag' }],
      [
        'https://medium.com/feed/towards-data-science/tagged/machine-learning',
        { key: 'medium:tagged', label: 'Tagged' },
      ],
      [
        'https://humanparts.medium.com/feed/tagged/poetry',
        { key: 'medium:tagged', label: 'Tagged' },
      ],
      [
        'https://medium.com/feed/age-of-awareness',
        { key: 'medium:publication', label: 'Publication' },
      ],
      ['https://medium.com/feed/tag', { key: 'medium:publication', label: 'Publication' }],
      ['https://humanparts.medium.com/feed', { key: 'medium:publication', label: 'Publication' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [mediumHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
