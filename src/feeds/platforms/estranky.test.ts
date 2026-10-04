import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type EstrankyUrl, estrankyHandler, parseEstrankyUrl } from './estranky.js'

describe('parseEstrankyUrl', () => {
  it('should return the site for an estranky.cz subdomain', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://example.estranky.cz/')).toEqual(expected)
  })

  it('should return the site for an estranky.sk subdomain', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://example.estranky.sk/')).toEqual(expected)
  })

  it('should return the site for a www-prefixed site host', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('http://www.example.estranky.cz/')).toEqual(expected)
  })

  it('should return the site for an article page', () => {
    const expected: EstrankyUrl = { kind: 'site' }

    expect(parseEstrankyUrl('https://example.estranky.cz/clanky/fkd-a/zapas.html')).toEqual(
      expected,
    )
  })

  it('should return undefined for the platform host', () => {
    expect(parseEstrankyUrl('https://www.estranky.cz/')).toBeUndefined()
  })

  it('should return undefined for the site directory', () => {
    expect(parseEstrankyUrl('https://katalog.estranky.cz/')).toBeUndefined()
  })

  it('should return undefined for the help hosts', () => {
    expect(parseEstrankyUrl('https://napoveda.estranky.cz/')).toBeUndefined()
    expect(parseEstrankyUrl('https://nova-napoveda.estranky.cz/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseEstrankyUrl('https://estranky.sk/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseEstrankyUrl('https://example.com/')).toBeUndefined()
  })
})

describe('estrankyHandler', () => {
  describe('match', () => {
    it('should return true for a site page', () => {
      expect(estrankyHandler.match('https://example.estranky.cz/fotoalbum/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(estrankyHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site feeds', () => {
      const value = 'https://example.estranky.sk/clanky/fkd-a/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.estranky.sk/rss/articles/data.xml',
          hint: { key: 'estranky:posts', label: 'Posts' },
        },
        {
          uri: 'https://example.estranky.sk/rss/photos/data.xml',
          hint: { key: 'estranky:photos', label: 'Photos' },
        },
        {
          uri: 'https://example.estranky.sk/rss/comments/data.xml',
          hint: { key: 'estranky:comments', label: 'Comments' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/homepage/data.xml',
          hint: { key: 'estranky:homepage-slice', label: 'Home page (Web Slice)' },
        },
        {
          uri: 'https://example.estranky.sk/rss/slices/l/photos/data.xml',
          hint: { key: 'estranky:photos-slice', label: 'Photo album (Web Slice)' },
        },
      ]

      expect(estrankyHandler.resolve(value)).toEqual(expected)
    })
  })
})
