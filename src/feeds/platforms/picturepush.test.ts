import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PicturepushUrl, parsePicturepushUrl, picturepushHandler } from './picturepush.js'

describe('parsePicturepushUrl', () => {
  it('should return the user for a user subdomain', () => {
    const expected: PicturepushUrl = { kind: 'user' }

    expect(parsePicturepushUrl('https://alice.picturepush.com/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parsePicturepushUrl('https://picturepush.com/')).toBeUndefined()
  })

  const excludedSubdomains: Array<string> = ['en', 'fr', 'nl', 'www', 'www1']

  it.each(excludedSubdomains)('should return undefined for the %s subdomain', (subdomain) => {
    expect(parsePicturepushUrl(`https://${subdomain}.picturepush.com/`)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePicturepushUrl('https://example.com/')).toBeUndefined()
  })
})

describe('picturepushHandler', () => {
  describe('match', () => {
    it('should return true for a user page without content', () => {
      expect(picturepushHandler.match('https://alice.picturepush.com/')).toBe(true)
    })

    it('should return true for a user page linking its own host', () => {
      const value = 'https://alice.picturepush.com/'
      const content = `
        <link
          rel="alternate"
          title="PicturePush RSS feed"
          type="application/rss+xml"
          href="/user_rss.php"
        />
        <li class="active"><h1><a href="https://alice.picturepush.com/">Alice</a></h1></li>
      `

      expect(picturepushHandler.match(value, content)).toBe(true)
    })

    it('should return true for a user page linking its own host in another case', () => {
      const value = 'https://alice.picturepush.com/'
      const content = `
        <link
          rel="alternate"
          title="PicturePush RSS feed"
          type="application/rss+xml"
          href="/user_rss.php"
        />
        <li class="active"><h1><a href="https://Alice.picturepush.com/">Alice</a></h1></li>
      `

      expect(picturepushHandler.match(value, content)).toBe(true)
    })

    it('should return false for the home page served under a user host', () => {
      const value = 'https://alice.picturepush.com/'
      const content = `
        <link
          rel="alternate"
          title="PicturePush RSS feed"
          type="application/rss+xml"
          href="/user_rss.php"
        />
        <body class="home" style="position: relative;">
        <a href="https://bob.picturepush.com/album/1234/56789/Holidays/">Holidays</a>
      `

      expect(picturepushHandler.match(value, content)).toBe(false)
    })

    it('should return false for the apex domain', () => {
      expect(picturepushHandler.match('https://picturepush.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside PicturePush', () => {
      expect(picturepushHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the pictures feed for an album page', () => {
      const value = 'https://alice.picturepush.com/album/1234/p-Holidays.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.picturepush.com/user_rss.php',
          hint: { key: 'picturepush:pictures', label: 'Pictures' },
        },
      ]

      expect(picturepushHandler.resolve(value)).toEqual(expected)
    })
  })
})
