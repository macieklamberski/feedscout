import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type NewswireUrl, newswireHandler, parseNewswireUrl } from './newswire.js'

describe('parseNewswireUrl', () => {
  it('should return the newsroom for the home page', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(parseNewswireUrl('https://acme.newswire.com/')).toEqual(expected)
  })

  it('should return the newsroom for a press release', () => {
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(
      parseNewswireUrl('https://acme.newswire.com/news/acme-opens-a-new-office-12345678'),
    ).toEqual(expected)
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
    const expected: NewswireUrl = { kind: 'newsroom', newsroom: 'acme' }

    expect(
      parseNewswireUrl('https://acme.newswire.com/browse/beat/business-marketing/extra'),
    ).toEqual(expected)
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

  const serviceHosts = [
    'https://cdn.newswire.com/',
    'https://support.newswire.com/',
    'https://www.newswire.com/',
  ]

  it.each(serviceHosts)('should return undefined for service host %s', (value) => {
    expect(parseNewswireUrl(value)).toBeUndefined()
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
  })
})
