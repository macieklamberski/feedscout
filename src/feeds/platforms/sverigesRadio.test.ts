import { describe, expect, it } from 'bun:test'
import { sverigesRadioHandler } from './sverigesRadio.js'

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
