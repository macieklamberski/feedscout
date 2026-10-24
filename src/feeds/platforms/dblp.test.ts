import { describe, expect, it } from 'bun:test'
import type { DblpUrl } from './dblp.js'
import { dblpHandler, parseDblpUrl } from './dblp.js'

describe('parseDblpUrl', () => {
  it('should return the venue for a conference record page', () => {
    const expected: DblpUrl = { kind: 'venue', venueType: 'conf', venue: 'igarss' }

    expect(parseDblpUrl('https://dblp.org/rec/conf/igarss/HuTJZY23')).toEqual(expected)
  })

  it('should return the venue for a journal record page', () => {
    const expected: DblpUrl = { kind: 'venue', venueType: 'journals', venue: 'csur' }

    expect(parseDblpUrl('https://dblp.org/rec/journals/csur/McCanneBKACHMRRSSTWW99')).toEqual(
      expected,
    )
  })

  it('should return the venue for a venue page', () => {
    const expected: DblpUrl = { kind: 'venue', venueType: 'conf', venue: 'rss' }

    expect(parseDblpUrl('https://dblp.org/db/conf/rss/')).toEqual(expected)
  })

  it('should return the venue for a volume page', () => {
    const expected: DblpUrl = { kind: 'venue', venueType: 'conf', venue: 'igarss' }

    expect(parseDblpUrl('https://dblp.org/db/conf/igarss/igarss2023.html')).toEqual(expected)
  })

  it('should return the venue for a stream page', () => {
    const expected: DblpUrl = { kind: 'venue', venueType: 'conf', venue: 'igarss' }

    expect(parseDblpUrl('https://dblp.org/streams/conf/igarss')).toEqual(expected)
  })

  it('should return the venue for a record page with capitalized route words', () => {
    const expected: DblpUrl = { kind: 'venue', venueType: 'conf', venue: 'igarss' }

    expect(parseDblpUrl('https://dblp.org/Rec/Conf/igarss/HuTJZY23')).toEqual(expected)
  })

  it('should return the person for a person page', () => {
    const expected: DblpUrl = { kind: 'person', group: '10', personId: '3248' }

    expect(parseDblpUrl('https://dblp.org/pid/10/3248.html')).toEqual(expected)
  })

  it('should return the person for a person page without an extension', () => {
    const expected: DblpUrl = { kind: 'person', group: '10', personId: '3248' }

    expect(parseDblpUrl('https://dblp.org/pid/10/3248')).toEqual(expected)
  })

  it('should return the home page for a series page', () => {
    const expected: DblpUrl = { kind: 'home' }

    expect(parseDblpUrl('https://dblp.org/db/series/lncs/index.html')).toEqual(expected)
  })

  it('should return the home page for the venue type index', () => {
    const expected: DblpUrl = { kind: 'home' }

    expect(parseDblpUrl('https://dblp.org/db/conf/index.html')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: DblpUrl = { kind: 'home' }

    expect(parseDblpUrl('https://dblp.org/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseDblpUrl('https://example.com/rec/conf/igarss/HuTJZY23')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDblpUrl('not a url')).toBeUndefined()
  })
})

describe('dblpHandler', () => {
  describe('match', () => {
    it('should match a dblp page', () => {
      expect(dblpHandler.match('https://dblp.org/rec/conf/igarss/HuTJZY23')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(dblpHandler.match('https://example.com/rec/conf/igarss/HuTJZY23')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside dblp', () => {
      expect(dblpHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the venue stream feed for a record page', () => {
      const expected = [
        {
          uri: 'https://dblp.org/feed/streams/conf/igarss.rss',
          hint: { key: 'dblp:venue', label: 'Venue' },
        },
      ]

      expect(dblpHandler.resolve('https://dblp.org/rec/conf/igarss/HuTJZY23')).toEqual(expected)
    })

    it('should return the person feed for a person page', () => {
      const expected = [
        {
          uri: 'https://dblp.org/pid/10/3248.rss',
          hint: { key: 'dblp:person', label: 'Person' },
        },
      ]

      expect(dblpHandler.resolve('https://dblp.org/pid/10/3248.html')).toEqual(expected)
    })

    it('should return the updates feed for any other page', () => {
      const expected = [
        {
          uri: 'https://dblp.org/feed/new.rss',
          hint: { key: 'dblp:updates', label: 'New issues and volumes' },
        },
      ]

      expect(dblpHandler.resolve('https://dblp.org/')).toEqual(expected)
    })
  })
})
