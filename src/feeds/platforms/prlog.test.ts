import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getPrlogPage,
  type PrlogPage,
  type PrlogUrl,
  parsePrlogUrl,
  prlogHandler,
} from './prlog.js'

describe('parsePrlogUrl', () => {
  it('should return the pressroom for a pressroom page', () => {
    const value = 'https://pressroom.prlog.org/Example_Co/'
    const expected: PrlogUrl = { kind: 'pressroom', pressroomId: 'Example_Co' }

    expect(parsePrlogUrl(value)).toEqual(expected)
  })

  it('should return the pressroom for a page under it', () => {
    const value = 'https://pressroom.prlog.org/Example_Co/latest.xml'
    const expected: PrlogUrl = { kind: 'pressroom', pressroomId: 'Example_Co' }

    expect(parsePrlogUrl(value)).toEqual(expected)
  })

  it('should return undefined for the pressroom directory', () => {
    expect(parsePrlogUrl('https://pressroom.prlog.org/')).toBeUndefined()
  })

  it('should return undefined for the main site', () => {
    expect(parsePrlogUrl('https://www.prlog.org/news/tag/equity/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePrlogUrl('https://example.com/Example_Co/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePrlogUrl('not-a-url')).toBeUndefined()
  })
})

describe('getPrlogPage', () => {
  const value = 'https://pressroom.prlog.org/example_co/'

  it('should spell the pressroom id as the page alternate spells it', () => {
    const content =
      '<link rel="alternate" href="https://pressroom.prlog.org/Example_Co/latest.xml" type="application/rss+xml" />'
    const expected: PrlogPage = { kind: 'pressroom', pressroomId: 'Example_Co' }

    expect(getPrlogPage(value, content)).toEqual(expected)
  })

  it('should keep the URL spelling when the alternate names another pressroom', () => {
    const content =
      '<link rel="alternate" href="https://pressroom.prlog.org/Other_Co/latest.xml" type="application/rss+xml" />'
    const expected: PrlogPage = { kind: 'pressroom', pressroomId: 'example_co' }

    expect(getPrlogPage(value, content)).toEqual(expected)
  })

  it('should keep the URL spelling without content', () => {
    const expected: PrlogPage = { kind: 'pressroom', pressroomId: 'example_co' }

    expect(getPrlogPage(value, undefined)).toEqual(expected)
  })

  it('should return undefined for a URL outside a pressroom', () => {
    expect(getPrlogPage('https://pressroom.prlog.org/', undefined)).toBeUndefined()
  })
})

describe('prlogHandler', () => {
  describe('match', () => {
    it('should match a pressroom page', () => {
      expect(prlogHandler.match('https://pressroom.prlog.org/Example_Co/')).toBe(true)
    })

    it('should not match the pressroom directory', () => {
      expect(prlogHandler.match('https://pressroom.prlog.org/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the press releases feed for a pressroom', () => {
      const value = 'https://pressroom.prlog.org/Example_Co/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://pressroom.prlog.org/Example_Co/latest.xml',
          hint: { key: 'prlog:press-releases', label: 'Press releases' },
        },
      ]

      expect(prlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside a pressroom', () => {
      expect(prlogHandler.resolve('https://pressroom.prlog.org/')).toEqual([])
    })
  })
})
