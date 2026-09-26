import { describe, expect, it } from 'bun:test'
import type { MastodonUrl } from './mastodon.js'
import { isMastodonHeaders, isMastodonHtml, mastodonHandler, parseMastodonUrl } from './mastodon.js'

const mastodonHtml = '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>'
const mastodonHeaders = new Headers({ server: 'Mastodon' })

describe('parseMastodonUrl', () => {
  it('should return the profile for /@user', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'Gargron' }

    expect(parseMastodonUrl('https://example.com/@Gargron')).toEqual(expected)
  })

  it('should return the profile for /users/{user}', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'Gargron' }

    expect(parseMastodonUrl('https://example.com/users/Gargron')).toEqual(expected)
  })

  it('should return the profile for /users/{user} with a capitalized users segment', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'Gargron' }

    expect(parseMastodonUrl('https://example.com/Users/Gargron')).toEqual(expected)
  })

  it('should return the profile for a /users/{user} status page', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'Gargron' }

    expect(parseMastodonUrl('https://example.com/users/Gargron/statuses/1')).toEqual(expected)
  })

  it('should return undefined for /users without a user', () => {
    expect(parseMastodonUrl('https://example.com/users')).toBeUndefined()
  })

  it('should return the profile for /@user with a trailing slash', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/')).toEqual(expected)
  })

  it('should strip the feed extension from the username', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user.rss')).toEqual(expected)
  })

  it('should strip the legacy Atom extension from the username', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user.atom')).toEqual(expected)
  })

  it('should strip a capitalized feed extension from the username', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user.RSS')).toEqual(expected)
  })

  it('should strip the ActivityPub JSON extension from a /users path', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/users/user.json')).toEqual(expected)
  })

  it('should keep the remote handle', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user@example.net' }

    expect(parseMastodonUrl('https://example.com/@user@example.net')).toEqual(expected)
  })

  it('should return the profile for a status page', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/117299324947033108')).toEqual(expected)
  })

  it('should return replies for /@user/with_replies', () => {
    const expected: MastodonUrl = { kind: 'replies', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/with_replies')).toEqual(expected)
  })

  it('should return replies for /@user/with_replies with a capitalized with_replies segment', () => {
    const expected: MastodonUrl = { kind: 'replies', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/With_replies')).toEqual(expected)
  })

  it('should return media for /@user/media', () => {
    const expected: MastodonUrl = { kind: 'media', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/media')).toEqual(expected)
  })

  it('should return media for /@user/media with a capitalized media segment', () => {
    const expected: MastodonUrl = { kind: 'media', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/Media')).toEqual(expected)
  })

  it('should return tagged for /@user/tagged/{tag}', () => {
    const expected: MastodonUrl = { kind: 'tagged', username: 'user', tag: 'news' }

    expect(parseMastodonUrl('https://example.com/@user/tagged/news')).toEqual(expected)
  })

  it('should return tagged for /@user/tagged/{tag} with a capitalized tagged segment', () => {
    const expected: MastodonUrl = { kind: 'tagged', username: 'user', tag: 'news' }

    expect(parseMastodonUrl('https://example.com/@user/Tagged/news')).toEqual(expected)
  })

  it('should return the profile for /@user/tagged without a tag', () => {
    const expected: MastodonUrl = { kind: 'profile', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/tagged')).toEqual(expected)
  })

  it('should return the tag for /tags/{tag}', () => {
    const expected: MastodonUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMastodonUrl('https://example.com/tags/javascript/')).toEqual(expected)
  })

  it('should return the tag for /tags/{tag} without a trailing slash', () => {
    const expected: MastodonUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMastodonUrl('https://example.com/tags/javascript')).toEqual(expected)
  })

  it('should strip the feed extension from /@user/with_replies.rss', () => {
    const expected: MastodonUrl = { kind: 'replies', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/with_replies.rss')).toEqual(expected)
  })

  it('should strip the feed extension from /@user/media.rss', () => {
    const expected: MastodonUrl = { kind: 'media', username: 'user' }

    expect(parseMastodonUrl('https://example.com/@user/media.rss')).toEqual(expected)
  })

  it('should strip the feed extension from /@user/tagged/{tag}.rss', () => {
    const expected: MastodonUrl = { kind: 'tagged', username: 'user', tag: 'news' }

    expect(parseMastodonUrl('https://example.com/@user/tagged/news.rss')).toEqual(expected)
  })

  it('should strip the feed extension from /tags/{tag}.rss', () => {
    const expected: MastodonUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMastodonUrl('https://example.com/tags/javascript.rss')).toEqual(expected)
  })

  it('should return undefined for /tags without a tag', () => {
    expect(parseMastodonUrl('https://example.com/tags')).toBeUndefined()
  })

  it('should return the tag for a capitalized /Tags prefix', () => {
    const expected: MastodonUrl = { kind: 'tag', tag: 'javascript' }

    expect(parseMastodonUrl('https://example.com/Tags/javascript')).toEqual(expected)
  })

  it('should return undefined for a bare /@', () => {
    expect(parseMastodonUrl('https://example.com/@')).toBeUndefined()
  })

  it('should return undefined for a path without @', () => {
    expect(parseMastodonUrl('https://example.com/about')).toBeUndefined()
  })

  it('should return undefined for the root path', () => {
    expect(parseMastodonUrl('https://example.com/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseMastodonUrl('not-a-url')).toBeUndefined()
  })
})

describe('isMastodonHtml', () => {
  it('should return true for standard Mastodon generator meta tag', () => {
    expect(isMastodonHtml('<meta name="generator" content="Mastodon v4.2.0">')).toBe(true)
  })

  it('should return true for case variations', () => {
    expect(isMastodonHtml('<meta name="generator" content="mastodon v4.0.0">')).toBe(true)
    expect(isMastodonHtml('<meta name="generator" content="MASTODON v4.0.0">')).toBe(true)
  })

  it('should return true for generator tag with single quotes', () => {
    expect(isMastodonHtml("<meta name='generator' content='Mastodon v4.2.0'>")).toBe(true)
  })

  it('should return true for tag within full HTML document', () => {
    const value = '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>'

    expect(isMastodonHtml(value)).toBe(true)
  })

  it('should return true for the mastodon app root without generator', () => {
    expect(isMastodonHtml('<body><div class="app-holder" id="mastodon"></div></body>')).toBe(true)
  })

  it('should return true for a single-quoted mastodon app root', () => {
    expect(isMastodonHtml("<body><div id='mastodon'></div></body>")).toBe(true)
  })

  it('should return false for non-Mastodon generator', () => {
    expect(isMastodonHtml('<meta name="generator" content="WordPress 6.0">')).toBe(false)
  })

  it('should return false for HTML without generator tag', () => {
    expect(isMastodonHtml('<html><head><title>Test</title></head></html>')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isMastodonHtml('')).toBe(false)
  })
})

describe('isMastodonHeaders', () => {
  it('should return true for Mastodon server header', () => {
    expect(isMastodonHeaders(new Headers({ server: 'Mastodon' }))).toBe(true)
  })

  it('should return true for case variations', () => {
    expect(isMastodonHeaders(new Headers({ server: 'mastodon' }))).toBe(true)
    expect(isMastodonHeaders(new Headers({ server: 'MASTODON' }))).toBe(true)
  })

  it('should return true for server header with version', () => {
    expect(isMastodonHeaders(new Headers({ server: 'Mastodon/4.2.0' }))).toBe(true)
  })

  it('should return true for server header containing Mastodon as substring', () => {
    expect(isMastodonHeaders(new Headers({ server: 'nginx (Mastodon)' }))).toBe(true)
  })

  it('should return false for non-Mastodon server', () => {
    expect(isMastodonHeaders(new Headers({ server: 'nginx' }))).toBe(false)
    expect(isMastodonHeaders(new Headers({ server: 'Apache' }))).toBe(false)
  })

  it('should return false for missing server header', () => {
    expect(isMastodonHeaders(new Headers())).toBe(false)
    expect(isMastodonHeaders(new Headers({ 'content-type': 'text/html' }))).toBe(false)
  })
})

describe('mastodonHandler', () => {
  describe('match', () => {
    it('should match profile path with Mastodon HTML', () => {
      expect(mastodonHandler.match('https://example.com/@Gargron', mastodonHtml)).toBe(true)
    })

    it('should match profile path with Mastodon server header', () => {
      expect(mastodonHandler.match('https://example.com/@user', '', mastodonHeaders)).toBe(true)
    })

    it('should not match without Mastodon HTML signals', () => {
      expect(mastodonHandler.match('https://example.com/@user', '<html></html>')).toBe(false)
    })

    it('should not match without Mastodon header signals', () => {
      const headers = new Headers({ server: 'nginx' })

      expect(mastodonHandler.match('https://example.com/@user', '', headers)).toBe(false)
    })

    it('should not match without content and headers', () => {
      expect(mastodonHandler.match('https://example.com/@user')).toBe(false)
    })

    it('should not match non-profile and non-tag paths', () => {
      expect(mastodonHandler.match('https://example.com/about', mastodonHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://example.com/@Gargron'
      const expected = [
        {
          uri: 'https://example.com/@Gargron.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for hashtag page', () => {
      const value = 'https://example.com/tags/javascript'
      const expected = [
        {
          uri: 'https://example.com/tags/javascript.rss',
          hint: { key: 'mastodon:tag', label: 'Tag' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return tagged and profile feeds for /@user/tagged/{tag}', () => {
      const value = 'https://example.com/@Gargron/tagged/mastodev'
      const expected = [
        {
          uri: 'https://example.com/@Gargron/tagged/mastodev.rss',
          hint: { key: 'mastodon:tagged', label: 'Tagged' },
        },
        {
          uri: 'https://example.com/@Gargron.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-matching paths', () => {
      expect(mastodonHandler.resolve('https://example.com/about')).toEqual([])
    })

    it('should return replies and profile feeds for /@user/with_replies', () => {
      const value = 'https://example.com/@Gargron/with_replies'
      const expected = [
        {
          uri: 'https://example.com/@Gargron/with_replies.rss',
          hint: { key: 'mastodon:replies', label: 'Posts with replies' },
        },
        {
          uri: 'https://example.com/@Gargron.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return media and profile feeds for /@user/media', () => {
      const value = 'https://example.com/@Gargron/media'
      const expected = [
        {
          uri: 'https://example.com/@Gargron/media.rss',
          hint: { key: 'mastodon:media', label: 'Media' },
        },
        {
          uri: 'https://example.com/@Gargron.rss',
          hint: { key: 'mastodon:posts', label: 'Posts' },
        },
      ]

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })
  })
})
