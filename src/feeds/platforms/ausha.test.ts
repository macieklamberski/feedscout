import { describe, expect, it } from 'bun:test'
import {
  type AushaPage,
  type AushaUrl,
  aushaHandler,
  getAushaPage,
  parseAushaUrl,
} from './ausha.js'

describe('parseAushaUrl', () => {
  it('should return the show for a show page', () => {
    const expected: AushaUrl = { kind: 'show' }

    expect(parseAushaUrl('https://podcast.ausha.co/my-show')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseAushaUrl('https://podcast.ausha.co/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAushaUrl('https://example.com/my-show')).toBeUndefined()
  })
})

describe('getAushaPage', () => {
  const content = '<a href="https://feed.ausha.co/oKpV7hDw3XqM">RSS</a>'

  it('should return the feed id of a show page', () => {
    const value = 'https://podcast.ausha.co/my-show'
    const expected: AushaPage = { kind: 'show', feedId: 'oKpV7hDw3XqM' }

    expect(getAushaPage(value, content)).toEqual(expected)
  })

  it('should return the feed id of a smartlink page', () => {
    const value = 'https://smartlink.ausha.co/my-show'
    const expected: AushaPage = { kind: 'show', feedId: 'oKpV7hDw3XqM' }

    expect(getAushaPage(value, content)).toEqual(expected)
  })

  it('should return undefined without content', () => {
    expect(getAushaPage('https://podcast.ausha.co/my-show', undefined)).toBeUndefined()
  })

  it('should return undefined for a page without a feed link', () => {
    const value = 'https://podcast.ausha.co/my-show'

    expect(getAushaPage(value, '<p>My Show</p>')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getAushaPage('https://example.com/my-show', content)).toBeUndefined()
  })

  it('should return undefined for the host root', () => {
    expect(getAushaPage('https://podcast.ausha.co/', content)).toBeUndefined()
  })
})

describe('aushaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://podcast.ausha.co/example-show'],
      [true, 'https://podcast.ausha.co/example-show/example-episode'],
      [true, 'https://smartlink.ausha.co/example-show'],
      [true, 'https://smartlink.ausha.co/example-show/example-episode'],
      [false, 'https://podcast.ausha.co/'],
      [false, 'https://www.ausha.co/example-show'],
      [false, 'https://example.com/example-show'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(aushaHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(aushaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the feed read from the page content', () => {
      const value = 'https://podcast.ausha.co/example-show'
      const content = '{"key":"rss","url":"https://feed.ausha.co/VODwGU7PMQGG","position":0}'
      const expected = [
        {
          uri: 'https://feed.ausha.co/VODwGU7PMQGG',
          hint: { key: 'ausha:podcast', label: 'Podcast' },
        },
      ]

      expect(aushaHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      const value = 'https://podcast.ausha.co/example-show'

      expect(aushaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array when the feed id is not in the content', () => {
      const value = 'https://podcast.ausha.co/example-show'
      const content = '<html><body>No feed here</body></html>'

      expect(aushaHandler.resolve(value, content)).toEqual([])
    })
  })
})
