import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type NewswireUrl, newswireHandler, parseNewswireUrl } from './newswire.js'

describe('parseNewswireUrl', () => {
  it('should return the newsroom for the home page', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl('https://acme.newswire.com/')).toEqual(expected)
  })

  it('should return the newsroom for a press release', () => {
    const value = 'https://acme.newswire.com/news/acme-opens-a-new-office-12345678'
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl(value)).toEqual(expected)
  })

  it('should return the beat for a beat page', () => {
    const expected: NewswireUrl = { kind: 'beat', newsroom: 'acme', beat: 'business-marketing' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/beat/business-marketing')).toEqual(
      expected,
    )
  })

  it('should return the beat for an uppercase route word', () => {
    const expected: NewswireUrl = { kind: 'beat', newsroom: 'acme', beat: 'business-marketing' }

    expect(parseNewswireUrl('https://acme.newswire.com/Browse/Beat/business-marketing')).toEqual(
      expected,
    )
  })

  it('should return the newsroom for a path below a beat', () => {
    const value = 'https://acme.newswire.com/browse/beat/business-marketing/extra'
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl(value)).toEqual(expected)
  })

  it('should return the content type for a press releases page', () => {
    const expected: NewswireUrl = { kind: 'contentType', newsroom: 'acme', contentType: 'pr' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/pr')).toEqual(expected)
  })

  it('should return the content type for a news page', () => {
    const expected: NewswireUrl = { kind: 'contentType', newsroom: 'acme', contentType: 'news' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/news')).toEqual(expected)
  })

  it('should return the content type for a social wire page', () => {
    const expected: NewswireUrl = { kind: 'contentType', newsroom: 'acme', contentType: 'social' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/social/')).toEqual(expected)
  })

  it('should return the content type spelled as the list spells it', () => {
    const expected: NewswireUrl = { kind: 'contentType', newsroom: 'acme', contentType: 'pr' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/PR')).toEqual(expected)
  })

  it('should return the newsroom for a social network page', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/social/twitter')).toEqual(expected)
  })

  it('should return the newsroom for an unknown content type', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/podcasts')).toEqual(expected)
  })

  it('should return the newsroom for a tag page', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl('https://acme.newswire.com/browse/tag/marketing')).toEqual(expected)
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseNewswireUrl('https://www.acme.newswire.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseNewswireUrl('https://www.newswire.com/')).toBeUndefined()
  })

  it('should return the newsroom for the service newsroom on mediaroom', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'mediaroom' }

    expect(parseNewswireUrl('https://mediaroom.newswire.com/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseNewswireUrl('https://newswire.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseNewswireUrl('https://example.com/')).toBeUndefined()
  })
})

describe('newswireHandler', () => {
  describe('match', () => {
    it('should return true for a newsroom', () => {
      expect(newswireHandler.match('https://acme.newswire.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(newswireHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Newswire', () => {
      expect(newswireHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the newsroom feed for a newsroom', () => {
      const value = 'https://acme.newswire.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acme.newswire.com/browse/rss',
          hint: { key: 'newswire:newsroom', label: 'Newsroom' },
        },
      ]

      expect(newswireHandler.resolve(value)).toEqual(expected)
    })

    it('should return the beat feed first for a beat page', () => {
      const value = 'https://acme.newswire.com/browse/beat/business-marketing'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acme.newswire.com/browse/rss/beat/business-marketing',
          hint: { key: 'newswire:beat', label: 'Beat' },
        },
        {
          uri: 'https://acme.newswire.com/browse/rss',
          hint: { key: 'newswire:newsroom', label: 'Newsroom' },
        },
      ]

      expect(newswireHandler.resolve(value)).toEqual(expected)
    })

    it('should return the press releases feed first for a press releases page', () => {
      const value = 'https://acme.newswire.com/browse/pr'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acme.newswire.com/browse/rss/pr',
          hint: { key: 'newswire:press-releases', label: 'Press releases' },
        },
        {
          uri: 'https://acme.newswire.com/browse/rss',
          hint: { key: 'newswire:newsroom', label: 'Newsroom' },
        },
      ]

      expect(newswireHandler.resolve(value)).toEqual(expected)
    })

    it('should return the news feed first for a news page', () => {
      const value = 'https://acme.newswire.com/browse/news'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acme.newswire.com/browse/rss/news',
          hint: { key: 'newswire:news', label: 'News' },
        },
        {
          uri: 'https://acme.newswire.com/browse/rss',
          hint: { key: 'newswire:newsroom', label: 'Newsroom' },
        },
      ]

      expect(newswireHandler.resolve(value)).toEqual(expected)
    })

    it('should return the social wire feed first for a social wire page', () => {
      const value = 'https://acme.newswire.com/browse/social'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acme.newswire.com/browse/rss/social',
          hint: { key: 'newswire:social', label: 'Social wire' },
        },
        {
          uri: 'https://acme.newswire.com/browse/rss',
          hint: { key: 'newswire:newsroom', label: 'Newsroom' },
        },
      ]

      expect(newswireHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http page', () => {
      const value = 'http://acme.newswire.com/browse/pr'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acme.newswire.com/browse/rss/pr',
          hint: { key: 'newswire:press-releases', label: 'Press releases' },
        },
        {
          uri: 'https://acme.newswire.com/browse/rss',
          hint: { key: 'newswire:newsroom', label: 'Newsroom' },
        },
      ]

      expect(newswireHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the beat key for a beat feed', () => {
      const value = 'https://flyinstyle.newswire.com/browse/rss/beat/industries-travel'
      const expected = 'newswire:beat'

      expect(newswireHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the press releases key for a press releases feed', () => {
      const value = 'https://zuum-transportation-inc.newswire.com/browse/rss/pr'
      const expected = 'newswire:press-releases'

      expect(newswireHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the social key for a social wire feed', () => {
      const value = 'https://bhcoe.newswire.com/browse/rss/social'
      const expected = 'newswire:social'

      expect(newswireHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for a news feed', () => {
      const value = 'https://intratec.newswire.com/browse/rss/news'
      const expected = 'newswire:news'

      expect(newswireHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the newsroom key for a newsroom feed', () => {
      const value = 'https://connectfx.newswire.com/browse/rss'
      const expected = 'newswire:newsroom'

      expect(newswireHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the newsroom key for a newsroom feed over http', () => {
      const value = 'http://link.newswire.com/browse/rss'
      const expected = 'newswire:newsroom'

      expect(newswireHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a beat page', () => {
      const value = 'https://flyinstyle.newswire.com/browse/beat/industries-travel'

      expect(newswireHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path with no beat', () => {
      const value = 'https://flyinstyle.newswire.com/browse/rss/beat'

      expect(newswireHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://news.acme.newswire.com/browse/rss'

      expect(newswireHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://newswire.com/browse/rss'

      expect(newswireHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/browse/rss'

      expect(newswireHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://flyinstyle.newswire.com/browse/rss/beat/industries-travel',
        { key: 'newswire:beat', label: 'Beat' },
      ],
      [
        'https://temptingfatellc.newswire.com/browse/rss/beat/lifestyles-and-society-relationship',
        { key: 'newswire:beat', label: 'Beat' },
      ],
      [
        'https://connectfx.newswire.com/browse/rss/pr',
        { key: 'newswire:press-releases', label: 'Press releases' },
      ],
      [
        'https://eclincher.newswire.com/browse/rss/social',
        { key: 'newswire:social', label: 'Social wire' },
      ],
      ['https://matefit.newswire.com/browse/rss/news', { key: 'newswire:news', label: 'News' }],
      [
        'https://connectfx.newswire.com/browse/rss',
        { key: 'newswire:newsroom', label: 'Newsroom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [newswireHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
