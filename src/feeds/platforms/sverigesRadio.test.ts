import { describe, expect, it } from 'bun:test'
import {
  parseSverigesRadioUrl,
  type SverigesRadioUrl,
  sverigesRadioHandler,
} from './sverigesRadio.js'

describe('parseSverigesRadioUrl', () => {
  it('should return the legacy program for a programid query', () => {
    const expected: SverigesRadioUrl = { kind: 'legacyProgram', programId: '2519' }

    expect(
      parseSverigesRadioUrl('https://sverigesradio.se/sida/default.aspx?programid=2519'),
    ).toEqual(expected)
  })

  it('should return the program for a program slug', () => {
    const expected: SverigesRadioUrl = { kind: 'program', slug: 'ekot' }

    expect(parseSverigesRadioUrl('https://sverigesradio.se/ekot')).toEqual(expected)
  })

  it('should keep the slug case', () => {
    const expected: SverigesRadioUrl = { kind: 'program', slug: 'Ekot' }

    expect(parseSverigesRadioUrl('https://sverigesradio.se/Ekot')).toEqual(expected)
  })

  it('should return undefined for an excluded path', () => {
    expect(parseSverigesRadioUrl('https://sverigesradio.se/nyheter')).toBeUndefined()
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

    it('should lowercase a capitalized program slug', () => {
      const value = 'https://sverigesradio.se/Morgonpodden'
      const expected = [
        {
          uri: 'https://public-api.sr.se/rss/morgonpodden',
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

    it('should return empty array for a section page', () => {
      expect(sverigesRadioHandler.resolve('https://sverigesradio.se/nyheter/p4-orebro')).toEqual([])
    })

    it('should return empty array for an episode page', () => {
      const value = 'https://sverigesradio.se/avsnitt/ett-avsnitt'

      expect(sverigesRadioHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for a capitalized section page', () => {
      expect(sverigesRadioHandler.resolve('https://sverigesradio.se/Nyheter')).toEqual([])
    })

    it('should return empty array for a legacy page without a program id', () => {
      expect(sverigesRadioHandler.resolve('https://sverigesradio.se/ettan.aspx')).toEqual([])
    })

    it('should return empty array for the homepage', () => {
      expect(sverigesRadioHandler.resolve('https://sverigesradio.se/')).toEqual([])
    })
  })
})
