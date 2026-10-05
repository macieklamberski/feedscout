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
    'https://enaelyork.eklablog.com/',
    'https://enaelyork.eklablog.com/critique-en-serie-a129920826',
    'https://obraska.eklablog.fr/',
    'https://randoacgv.eklablog.net/',
    'https://huilerie-beaucaire.blogg.org/',
    'https://singbell.blogueuse.fr/',
    'https://harbelita.cd.st/',
    'https://abysskan.doremiblog.com/',
    'https://forrawamu.ek.la/',
    'https://frasa.id.st/',
    'https://animal-crossing59.jeblog.fr/',
    'https://igre.kazeo.com/',
    'https://nintendooceanv3.kif.fr/',
    'https://hungmcleon.lo.gs/',
    'https://dudu-village.revolublog.com/',
    'https://half-dead-pigs.zic.fr/',
  ]

  it.each(blogUrls)('should return the blog for %s', (url) => {
    const expected: EklablogUrl = { kind: 'blog' }

    expect(parseEklablogUrl(url)).toEqual(expected)
  })

  const otherUrls: Array<string> = [
    'https://eklablog.com/',
    'https://admin.eklablog.com/',
    'https://assets.eklablog.com/',
    'https://connect.eklablog.com/',
    'https://image.eklablog.com/',
    'https://www.eklablog.com/',
    'https://www.enaelyork.eklablog.com/',
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
      expect(eklablogHandler.match('https://enaelyork.eklablog.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(eklablogHandler.match('https://example.com/')).toBe(false)
    })

    it('should return true for a custom domain carrying the marker', () => {
      expect(eklablogHandler.match('https://www.example.com/', pingHtml)).toBe(true)
    })

    it('should return false for a service host carrying the marker', () => {
      expect(eklablogHandler.match('https://www.eklablog.com/', pingHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a service host', () => {
      expect(eklablogHandler.resolve('https://www.eklablog.com/')).toEqual([])
    })

    it('should return posts and comments feeds for blog', () => {
      const value = 'https://enaelyork.eklablog.com/critique-en-serie-a129920826'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://enaelyork.eklablog.com/rss',
          hint: { key: 'eklablog:posts', label: 'Posts' },
        },
        {
          uri: 'https://enaelyork.eklablog.com/rss/comments',
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
