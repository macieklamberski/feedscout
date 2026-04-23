import { describe, expect, it } from 'bun:test'
import {
  isCommunityPath,
  isHomePath,
  isLemmyHeaders,
  isLemmyHtml,
  isUserPath,
  lemmyHandler,
} from './lemmy.js'

const lemmyHtml = '<html><head><meta name="generator" content="Lemmy v0.19.5"></head></html>'
const lemmyHeaders = new Headers({ 'x-powered-by': 'Lemmy' })

describe('isCommunityPath', () => {
  it('should return true for /c/community paths', () => {
    expect(isCommunityPath('/c/programming')).toBe(true)
    expect(isCommunityPath('/c/world_news')).toBe(true)
  })

  it('should return true for /c/community with extra segments', () => {
    expect(isCommunityPath('/c/programming/hot')).toBe(true)
  })

  it('should return true for /c/community with trailing slash', () => {
    expect(isCommunityPath('/c/programming/')).toBe(true)
  })

  it('should return false for /c without community name', () => {
    expect(isCommunityPath('/c')).toBe(false)
    expect(isCommunityPath('/c/')).toBe(false)
  })

  it('should return false for non-community paths', () => {
    expect(isCommunityPath('/u/user')).toBe(false)
    expect(isCommunityPath('/about')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isCommunityPath('')).toBe(false)
  })
})

describe('isUserPath', () => {
  it('should return true for /u/username paths', () => {
    expect(isUserPath('/u/alice')).toBe(true)
    expect(isUserPath('/u/bob')).toBe(true)
  })

  it('should return true for /u/username with extra segments', () => {
    expect(isUserPath('/u/alice/posts')).toBe(true)
  })

  it('should return true for /u/username with trailing slash', () => {
    expect(isUserPath('/u/alice/')).toBe(true)
  })

  it('should return false for /u without username', () => {
    expect(isUserPath('/u')).toBe(false)
    expect(isUserPath('/u/')).toBe(false)
  })

  it('should return false for non-user paths', () => {
    expect(isUserPath('/c/programming')).toBe(false)
    expect(isUserPath('/about')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isUserPath('')).toBe(false)
  })
})

describe('isHomePath', () => {
  it('should return true for root paths', () => {
    expect(isHomePath('/')).toBe(true)
    expect(isHomePath('')).toBe(true)
    expect(isHomePath('/home')).toBe(true)
  })

  it('should return false for non-root paths', () => {
    expect(isHomePath('/c/programming')).toBe(false)
    expect(isHomePath('/u/alice')).toBe(false)
    expect(isHomePath('/about')).toBe(false)
  })
})

describe('isLemmyHtml', () => {
  it('should return true for Lemmy generator meta tag', () => {
    expect(isLemmyHtml('<meta name="generator" content="Lemmy v0.19.5">')).toBe(true)
    expect(isLemmyHtml('<meta name="generator" content="Lemmy">')).toBe(true)
  })

  it('should return true regardless of attribute order', () => {
    expect(isLemmyHtml('<meta content="Lemmy v0.19.5" name="generator">')).toBe(true)
  })

  it('should return true when embedded in full HTML', () => {
    expect(isLemmyHtml(lemmyHtml)).toBe(true)
  })

  it('should return false for non-Lemmy generator values', () => {
    expect(isLemmyHtml('<meta name="generator" content="Mastodon v4.2.0">')).toBe(false)
    expect(isLemmyHtml('<meta name="generator" content="WordPress 6.4">')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isLemmyHtml('')).toBe(false)
  })
})

describe('isLemmyHeaders', () => {
  it('should return true for x-powered-by: Lemmy header', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'Lemmy' }))).toBe(true)
  })

  it('should return true case-insensitively', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'lemmy' }))).toBe(true)
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'LEMMY' }))).toBe(true)
  })

  it('should return false when header is absent', () => {
    expect(isLemmyHeaders(new Headers())).toBe(false)
    expect(isLemmyHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })

  it('should return false for non-Lemmy x-powered-by values', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

describe('lemmyHandler', () => {
  describe('match', () => {
    it('should match community path with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/programming', lemmyHtml)).toBe(true)
    })

    it('should match user path with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/u/alice', lemmyHtml)).toBe(true)
    })

    it('should match community path with Lemmy server header', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/programming', '', lemmyHeaders)).toBe(true)
    })

    it('should match user path with Lemmy server header', () => {
      expect(lemmyHandler.match('https://beehaw.org/u/alice', '', lemmyHeaders)).toBe(true)
    })

    it('should match on a different Lemmy instance', () => {
      expect(lemmyHandler.match('https://beehaw.org/c/worldnews', lemmyHtml)).toBe(true)
    })

    it('should not match without content or headers', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/programming')).toBe(false)
    })

    it('should match home path with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/', lemmyHtml)).toBe(true)
      expect(lemmyHandler.match('https://lemmy.ml/home', lemmyHtml)).toBe(true)
    })

    it('should not match non-community, non-user, non-home paths even with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/about', lemmyHtml)).toBe(false)
    })

    it('should not match without Lemmy signals', () => {
      const plainHtml = '<html><head></head></html>'
      expect(lemmyHandler.match('https://lemmy.ml/c/programming', plainHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(lemmyHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return community feed URL', () => {
      const value = 'https://lemmy.ml/c/programming'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed URL', () => {
      const value = 'https://lemmy.ml/u/alice'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/u/alice.xml',
          hint: { key: 'lemmy:user', label: 'User' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve the instance origin', () => {
      const value = 'https://beehaw.org/c/worldnews'
      const expected = [
        {
          uri: 'https://beehaw.org/feeds/c/worldnews.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should use only the first path segment after the prefix', () => {
      const value = 'https://lemmy.ml/c/programming/hot'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return site-wide feeds for home path', () => {
      const value = 'https://lemmy.ml/'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/all.xml',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://lemmy.ml/feeds/local.xml',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should forward ?sort= on community, user, and home feeds', () => {
      const communityExpected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml?sort=TopWeek',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve('https://lemmy.ml/c/programming?sort=TopWeek')).toEqual(
        communityExpected,
      )

      const userExpected = [
        {
          uri: 'https://lemmy.ml/feeds/u/alice.xml?sort=New',
          hint: { key: 'lemmy:user', label: 'User' },
        },
      ]

      expect(lemmyHandler.resolve('https://lemmy.ml/u/alice?sort=New')).toEqual(userExpected)

      const homeExpected = [
        {
          uri: 'https://lemmy.ml/feeds/all.xml?sort=Active',
          hint: { key: 'lemmy:all', label: 'All' },
        },
        {
          uri: 'https://lemmy.ml/feeds/local.xml?sort=Active',
          hint: { key: 'lemmy:local', label: 'Local' },
        },
      ]

      expect(lemmyHandler.resolve('https://lemmy.ml/?sort=Active')).toEqual(homeExpected)
    })

    it('should drop unknown ?sort= values', () => {
      const value = 'https://lemmy.ml/c/programming?sort=garbage'
      const expected = [
        {
          uri: 'https://lemmy.ml/feeds/c/programming.xml',
          hint: { key: 'lemmy:community', label: 'Community' },
        },
      ]

      expect(lemmyHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-community, non-user, non-home paths', () => {
      expect(lemmyHandler.resolve('https://lemmy.ml/about')).toEqual([])
    })

    it('should return empty array for invalid URL', () => {
      expect(lemmyHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
