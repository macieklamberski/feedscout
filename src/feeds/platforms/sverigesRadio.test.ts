import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  parseSverigesRadioUrl,
  type SverigesRadioUrl,
  sverigesRadioHandler,
} from './sverigesRadio.js'

const programHint: DiscoverUriHint = { key: 'sveriges-radio:program', label: 'Program' }
const programFormatHint: DiscoverUriHint = {
  key: 'sveriges-radio:program-format',
  label: 'Program format',
}
const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://api.sr.se/api/rss/program/12345', programHint],
  ['http://api.sr.se/api/rss/program/12345/', programHint],
  ['https://api.sr.se/api/rss/program/12345?format=145', programFormatHint],
  ['http://api.sr.se/api/rss/program/12345/?format=1', programFormatHint],
  ['https://public-api.sr.se/rss/example-program', programHint],
  ['http://public-api.sr.se/rss/example-program/', programHint],
  ['https://api.sr.se/api/rss/pod/12345', programHint],
  ['http://api.sr.se/api/rss/pod/itunes/12345', programHint],
]

describe('parseSverigesRadioUrl', () => {
  it('should return the legacy program for a programid query', () => {
    const value = 'https://sverigesradio.se/sida/default.aspx?programid=2519'
    const expected: SverigesRadioUrl = { kind: 'legacyProgram', programId: '2519' }

    expect(parseSverigesRadioUrl(value)).toEqual(expected)
  })

  it('should return the program for a program slug', () => {
    const expected: SverigesRadioUrl = { kind: 'program', slug: 'ekot' }

    expect(parseSverigesRadioUrl('https://sverigesradio.se/ekot')).toEqual(expected)
  })

  it('should return the program for a podcast page', () => {
    const expected: SverigesRadioUrl = { kind: 'program', slug: 'p3-dokumentar' }

    expect(parseSverigesRadioUrl('https://www.sverigesradio.se/poddar/p3-dokumentar')).toEqual(
      expected,
    )
  })

  it('should keep the slug case', () => {
    const expected: SverigesRadioUrl = { kind: 'program', slug: 'Ekot' }

    expect(parseSverigesRadioUrl('https://sverigesradio.se/Ekot')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseSverigesRadioUrl('https://example.com/ekot')).toBeUndefined()
  })
})

describe('sverigesRadioHandler', () => {
  describe('match', () => {
    it('should match a Sveriges Radio URL', () => {
      expect(sverigesRadioHandler.match('https://sverigesradio.se/morgonpodden')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(sverigesRadioHandler.match('https://example.com/morgonpodden')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Sveriges Radio', () => {
      expect(sverigesRadioHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the program feed for a program page', () => {
      const value = 'https://sverigesradio.se/morgonpodden'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/morgonpodden',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the program feed for the www host', () => {
      const value = 'https://www.sverigesradio.se/morgonpodden'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/morgonpodden',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the program feed for a podcast page', () => {
      const value = 'https://www.sverigesradio.se/poddar/vetenskapsradion'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/vetenskapsradion',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the program feed for a page under a program', () => {
      const value = 'https://sverigesradio.se/morgonpodden/textarkiv'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/morgonpodden',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of a capitalized program slug', () => {
      const value = 'https://sverigesradio.se/Morgonpodden'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/Morgonpodden',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the program feed for a legacy page with a program id', () => {
      const value = 'https://sverigesradio.se/sida/default.aspx?programid=1234'
      const expected = [
        {
          uri: 'https://api.sr.se/api/rss/program/1234',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the program feed for an episode list with a program id', () => {
      const value = 'https://sverigesradio.se/avsnitt?programid=1234'
      const expected = [
        {
          uri: 'https://api.sr.se/api/rss/program/1234',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should ignore a non-numeric program id', () => {
      const value = 'https://sverigesradio.se/morgonpodden?programid=abc'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/morgonpodden',
          hint: { key: 'sveriges-radio:program', label: 'Program' },
        },
      ]

      expect(sverigesRadioHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a legacy page without a program id', () => {
      expect(sverigesRadioHandler.resolve('https://sverigesradio.se/ettan.aspx')).toEqual([])
    })

    it('should return empty array for the homepage', () => {
      expect(sverigesRadioHandler.resolve('https://sverigesradio.se/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the program hint for a program feed', () => {
      const value = 'https://api.sr.se/api/rss/program/12345'
      const expected: DiscoverUriHint = { key: 'sveriges-radio:program', label: 'Program' }

      expect(sverigesRadioHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the program format hint for a program feed with a format', () => {
      const value = 'https://api.sr.se/api/rss/program/12345?format=145'
      const expected: DiscoverUriHint = {
        key: 'sveriges-radio:program-format',
        label: 'Program format',
      }

      expect(sverigesRadioHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the program hint for a program feed on public-api.sr.se', () => {
      const value = 'https://public-api.sr.se/rss/example-program'
      const expected: DiscoverUriHint = { key: 'sveriges-radio:program', label: 'Program' }

      expect(sverigesRadioHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the program hint for a podcast feed', () => {
      const value = 'https://api.sr.se/api/rss/pod/12345'
      const expected: DiscoverUriHint = { key: 'sveriges-radio:program', label: 'Program' }

      expect(sverigesRadioHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the program hint for a podcast feed under itunes', () => {
      const value = 'https://api.sr.se/api/rss/pod/itunes/12345'
      const expected: DiscoverUriHint = { key: 'sveriges-radio:program', label: 'Program' }

      expect(sverigesRadioHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the program hint for a program feed over http with a trailing slash', () => {
      const value = 'http://api.sr.se/api/rss/program/12345/'
      const expected: DiscoverUriHint = { key: 'sveriges-radio:program', label: 'Program' }

      expect(sverigesRadioHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a word in place of the program id', () => {
      const value = 'https://api.sr.se/api/rss/program/example'

      expect(sverigesRadioHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the itunes path without a podcast id', () => {
      const value = 'https://api.sr.se/api/rss/pod/itunes'

      expect(sverigesRadioHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a file in place of the program slug', () => {
      const value = 'https://public-api.sr.se/rss/robots.txt'

      expect(sverigesRadioHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a traffic feed', () => {
      const value = 'https://api.sr.se/api/rss/traffic/12345'

      expect(sverigesRadioHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a program page', () => {
      const value = 'https://sverigesradio.se/example-program'

      expect(sverigesRadioHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/api/rss/program/12345'

      expect(sverigesRadioHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [sverigesRadioHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
