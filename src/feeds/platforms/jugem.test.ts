import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type JugemUrl, jugemHandler, parseJugemUrl } from './jugem.js'

describe('parseJugemUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: JugemUrl = { kind: 'blog', blog: 'myblog' }

    expect(parseJugemUrl('https://myblog.jugem.jp/')).toEqual(expected)
  })

  it('should return undefined for the www portal', () => {
    expect(parseJugemUrl('https://www.jugem.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseJugemUrl('https://example.com/')).toBeUndefined()
  })
})

describe('jugemHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.jugem.jp'],
      [true, 'https://alice.jugem.jp/?eid=123'],
      [false, 'https://www.jugem.jp'],
      [false, 'https://blog.alice.jugem.jp'],
      [false, 'https://jugem.jp'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(jugemHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside JUGEM', () => {
      expect(jugemHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS 1.0 and Atom feeds for blog', () => {
      const value = 'https://alice.jugem.jp/?cid=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.jugem.jp/?mode=rss',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://alice.jugem.jp/?mode=atom',
          hint: { key: 'jugem:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(jugemHandler.resolve(value)).toEqual(expected)
    })
  })
})
