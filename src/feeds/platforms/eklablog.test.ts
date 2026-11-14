import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type EklablogUrl, eklablogHandler, isEklablogHtml, parseEklablogUrl } from './eklablog.js'

const pingHtml = '<script src="//connect.eklablog.com/ping/123456/isConnected" async></script>'

describe('isEklablogHtml', () => {
  it('should return true for the ping script on connect.eklablog.com', () => {
    expect(isEklablogHtml(pingHtml)).toBe(true)
  })

  it('should return false for the login link on connect.eklablog.com', () => {
    const value = '<a href="https://connect.eklablog.com/fr/login">Connexion</a>'

    expect(isEklablogHtml(value)).toBe(false)
  })

  it('should return false for an image on connect.eklablog.com', () => {
    const value = '<img src="//connect.eklablog.com/ping/123456/isConnected">'

    expect(isEklablogHtml(value)).toBe(false)
  })

  it('should return false for a script naming connect.eklablog.com in its query', () => {
    const value = '<script src="https://example.com/widget.js?host=connect.eklablog.com"></script>'

    expect(isEklablogHtml(value)).toBe(false)
  })

  it('should return false for the ping script on connect.over-blog.com', () => {
    const value = '<script src="//connect.over-blog.com/ping/123456/isConnected" async></script>'

    expect(isEklablogHtml(value)).toBe(false)
  })
})

describe('parseEklablogUrl', () => {
  const blogUrls: Array<string> = [
    'https://alice.eklablog.com/',
    'https://alice.eklablog.com/critique-en-serie-a129920826',
    'https://olivia.eklablog.fr/',
    'https://peggy.eklablog.net/',
    'https://ivan-smith.blogg.org/',
    'https://rupert.blogueuse.fr/',
    'https://heidi.cd.st/',
    'https://bob.doremiblog.com/',
    'https://erin.ek.la/',
    'https://frank.id.st/',
    'https://carol59.jeblog.fr/',
    'https://mallory.kazeo.com/',
    'https://niaj3.kif.fr/',
    'https://judy.lo.gs/',
    'https://dave-village.revolublog.com/',
    'https://grace-jones.zic.fr/',
  ]

  it.each(blogUrls)('should return the blog for %s', (url) => {
    const expected: EklablogUrl = { kind: 'blog' }

    expect(parseEklablogUrl(url)).toEqual(expected)
  })

  const otherUrls: Array<string> = [
    'https://eklablog.com/',
    'https://www.eklablog.com/',
    'https://www.alice.eklablog.com/',
  ]

  it.each(otherUrls)('should return undefined for %s', (url) => {
    expect(parseEklablogUrl(url)).toBeUndefined()
  })

  it('should return a custom domain for another host', () => {
    const expected: EklablogUrl = { kind: 'customDomain' }

    expect(parseEklablogUrl('https://www.example.com/')).toEqual(expected)
  })
})

describe('eklablogHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(eklablogHandler.match('https://alice.eklablog.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(eklablogHandler.match('https://example.com/')).toBe(false)
    })

    it('should return true for a custom domain carrying the marker', () => {
      expect(eklablogHandler.match('https://www.example.com/', pingHtml)).toBe(true)
    })

    it('should return false for the www host carrying the marker', () => {
      expect(eklablogHandler.match('https://www.eklablog.com/', pingHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the www host', () => {
      expect(eklablogHandler.resolve('https://www.eklablog.com/')).toEqual([])
    })

    it('should return posts and comments feeds for blog', () => {
      const value = 'https://alice.eklablog.com/critique-en-serie-a129920826'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.eklablog.com/rss',
          hint: { key: 'eklablog:posts', label: 'Posts' },
        },
        {
          uri: 'https://alice.eklablog.com/rss/comments',
          hint: { key: 'eklablog:comments', label: 'Comments' },
        },
      ]

      expect(eklablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return posts and comments feeds for custom domain', () => {
      const value = 'https://www.example.com/critique-en-serie-a129920826'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/rss',
          hint: { key: 'eklablog:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.example.com/rss/comments',
          hint: { key: 'eklablog:comments', label: 'Comments' },
        },
      ]

      expect(eklablogHandler.resolve(value, pingHtml)).toEqual(expected)
    })
  })
})
