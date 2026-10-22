import { describe, expect, it } from 'bun:test'
import type { OdyseeUrl } from './odysee.js'
import { odyseeHandler, parseOdyseeUrl } from './odysee.js'

describe('parseOdyseeUrl', () => {
  it('should return the name and claim ID for a channel page', () => {
    const value = 'https://odysee.com/@veritasium:f'
    const expected: OdyseeUrl = { kind: 'channel', name: 'veritasium', claimId: 'f' }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should return the name for a channel without claim ID', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'veritasium' }

    expect(parseOdyseeUrl('https://odysee.com/@veritasium')).toEqual(expected)
  })

  it('should return the channel for a page under a channel', () => {
    const value = 'https://odysee.com/@lbry:3f/some-video:abc'
    const expected: OdyseeUrl = { kind: 'channel', name: 'lbry', claimId: '3f' }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should return the channel for the www host', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'lbry', claimId: '3f' }

    expect(parseOdyseeUrl('https://www.odysee.com/@lbry:3f')).toEqual(expected)
  })

  it('should preserve uppercase characters in the channel name', () => {
    const value = 'https://odysee.com/@Veritasium:f'
    const expected: OdyseeUrl = { kind: 'channel', name: 'Veritasium', claimId: 'f' }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should lowercase an uppercase claim ID', () => {
    const value = 'https://odysee.com/@veritasium:FB364EF587872515F545A5B4B3182B58073F230F'
    const expected: OdyseeUrl = {
      kind: 'channel',
      name: 'veritasium',
      claimId: 'fb364ef587872515f545a5b4b3182b58073f230f',
    }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should decode an encoded channel name', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'élise' }

    expect(parseOdyseeUrl('https://odysee.com/@%C3%A9lise')).toEqual(expected)
  })

  it('should return undefined for a malformed encoded name', () => {
    expect(parseOdyseeUrl('https://odysee.com/@%E0%A4%A')).toBeUndefined()
  })

  it('should return a full-length claim ID whole', () => {
    const expected: OdyseeUrl = {
      kind: 'channel',
      name: 'lbry',
      claimId: '3fda836a92faaceedfe398225fb9b2ee2ed1f01a',
    }

    expect(
      parseOdyseeUrl('https://odysee.com/@lbry:3fda836a92faaceedfe398225fb9b2ee2ed1f01a'),
    ).toEqual(expected)
  })

  it('should return undefined for a claim ID with a non-hex character', () => {
    expect(parseOdyseeUrl('https://odysee.com/@lbry:3g')).toBeUndefined()
  })

  it('should return undefined for non-channel pages', () => {
    expect(parseOdyseeUrl('https://odysee.com/$/discover')).toBeUndefined()
    expect(parseOdyseeUrl('https://odysee.com/hello-world:a')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseOdyseeUrl('https://odysee.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseOdyseeUrl('https://example.com/@veritasium:f')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseOdyseeUrl('not-a-url')).toBeUndefined()
  })
})

describe('odyseeHandler', () => {
  describe('match', () => {
    it('should match a channel with its claim ID', () => {
      expect(odyseeHandler.match('https://odysee.com/@veritasium:f')).toBe(true)
    })

    it('should not match a channel without its claim ID', () => {
      expect(odyseeHandler.match('https://odysee.com/@veritasium')).toBe(false)
    })

    it('should not match another host', () => {
      expect(odyseeHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for channel', () => {
      const value = 'https://odysee.com/@veritasium:f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@veritasium:f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep an encoded channel name encoded', () => {
      const value = 'https://odysee.com/@%C3%A9lise:3f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@%C3%A9lise:3f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep an encoded URL delimiter in a channel name encoded', () => {
      const value = 'https://odysee.com/@news%23daily:3f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@news%23daily:3f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for channel without claim ID', () => {
      const value = 'https://odysee.com/@veritasium'

      expect(odyseeHandler.resolve(value)).toEqual([])
    })
  })
})
