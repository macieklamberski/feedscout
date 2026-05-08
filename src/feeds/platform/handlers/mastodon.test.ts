import { describe, expect, it } from 'bun:test'
import { isProfilePath, isTagPath, mastodonHandler } from './mastodon.js'

const mastodonHtml = '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>'
const mastodonHeaders = new Headers({ server: 'Mastodon' })

describe('isProfilePath', () => {
  it('should return true for /@user paths', () => {
    expect(isProfilePath('/@user')).toBe(true)
    expect(isProfilePath('/@Gargron')).toBe(true)
  })

  it('should return true for /@user with trailing slash', () => {
    expect(isProfilePath('/@user/')).toBe(true)
  })

  it('should return true for /@user with extra segments', () => {
    expect(isProfilePath('/@user/123456789')).toBe(true)
  })

  it('should return false for paths without @', () => {
    expect(isProfilePath('/user')).toBe(false)
    expect(isProfilePath('/about')).toBe(false)
  })

  it('should return false for root path', () => {
    expect(isProfilePath('/')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isProfilePath('')).toBe(false)
  })
})

describe('isTagPath', () => {
  it('should return true for /tags/name paths', () => {
    expect(isTagPath('/tags/javascript')).toBe(true)
    expect(isTagPath('/tags/mastodon')).toBe(true)
  })

  it('should return true for /tags/name with trailing slash', () => {
    expect(isTagPath('/tags/javascript/')).toBe(true)
  })

  it('should return false for /tags without name', () => {
    expect(isTagPath('/tags')).toBe(false)
    expect(isTagPath('/tags/')).toBe(false)
  })

  it('should return false for non-tags paths', () => {
    expect(isTagPath('/about')).toBe(false)
    expect(isTagPath('/@user')).toBe(false)
  })

  it('should return false for case variation of /tags', () => {
    expect(isTagPath('/Tags/javascript')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isTagPath('')).toBe(false)
  })
})

describe('mastodonHandler', () => {
  describe('match', () => {
    it('should match profile path with Mastodon HTML', () => {
      expect(mastodonHandler.match('https://mastodon.social/@Gargron', mastodonHtml)).toBe(true)
      expect(mastodonHandler.match('https://example.com/@user', mastodonHtml)).toBe(true)
    })

    it('should match profile path with Mastodon server header', () => {
      const result = mastodonHandler.match('https://mastodon.social/@user', '', mastodonHeaders)

      expect(result).toBe(true)
    })

    it('should match tag path with Mastodon HTML', () => {
      const result = mastodonHandler.match('https://mastodon.social/tags/javascript', mastodonHtml)

      expect(result).toBe(true)
    })

    it('should match tag path with Mastodon server header', () => {
      const result = mastodonHandler.match(
        'https://mastodon.social/tags/javascript',
        '',
        mastodonHeaders,
      )

      expect(result).toBe(true)
    })

    it('should not match without Mastodon signals', () => {
      const result = mastodonHandler.match(
        'https://mastodon.social/@user',
        '',
        new Headers({ server: 'nginx' }),
      )

      expect(mastodonHandler.match('https://mastodon.social/@user', '<html></html>')).toBe(false)
      expect(result).toBe(false)
    })

    it('should not match without content and headers', () => {
      expect(mastodonHandler.match('https://mastodon.social/@user')).toBe(false)
    })

    it('should not match non-profile and non-tag paths', () => {
      expect(mastodonHandler.match('https://mastodon.social/about', mastodonHtml)).toBe(false)
      expect(mastodonHandler.match('https://mastodon.social/', mastodonHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(mastodonHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://mastodon.social/@Gargron'
      const expected = [
        {
          uri: 'https://mastodon.social/@Gargron.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for hashtag page', () => {
      const value = 'https://mastodon.social/tags/javascript'
      const expected = [
        {
          uri: 'https://mastodon.social/tags/javascript.rss',
          hint: { key: 'mastodon:tag', label: 'Tag' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for different instance', () => {
      const value = 'https://fosstodon.org/@kev'
      const expected = [
        {
          uri: 'https://fosstodon.org/@kev.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return tagged and profile feeds for /@user/tagged/{tag}', () => {
      const value = 'https://mastodon.social/@Gargron/tagged/mastodev'
      const expected = [
        {
          uri: 'https://mastodon.social/@Gargron/tagged/mastodev.rss',
          hint: { key: 'mastodon:tagged', label: 'Tagged' },
        },
        {
          uri: 'https://mastodon.social/@Gargron.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-matching paths', () => {
      expect(mastodonHandler.resolve('https://mastodon.social/about')).toEqual([])
    })

    it('should return empty array for invalid URL', () => {
      expect(mastodonHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
