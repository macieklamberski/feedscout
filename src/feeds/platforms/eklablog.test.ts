import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type EklablogUrl, eklablogHandler, parseEklablogUrl } from './eklablog.js'

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
    'https://example.com/',
  ]

  it.each(otherUrls)('should return undefined for %s', (url) => {
    expect(parseEklablogUrl(url)).toBeUndefined()
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
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Eklablog', () => {
      expect(eklablogHandler.resolve('https://example.com/')).toEqual([])
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
  })
})
