import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ItchioUrl, itchioHandler, parseItchioUrl } from './itchio.js'

describe('parseItchioUrl', () => {
  it('should return the filters for a listing with two filters', () => {
    const value = 'https://itch.io/games/tag-horror/tag-pixel-art'
    const expected: ItchioUrl = { kind: 'listing', filters: 'tag-horror/tag-pixel-art' }

    expect(parseItchioUrl(value)).toEqual(expected)
  })

  it('should return the tag and its sort for a sorted tag listing', () => {
    const value = 'https://itch.io/games/newest/tag-horror'
    const expected: ItchioUrl = { kind: 'tag', tag: 'horror', sort: 'newest' }

    expect(parseItchioUrl(value)).toEqual(expected)
  })

  it('should return the game for a game page', () => {
    const expected: ItchioUrl = { kind: 'game', creator: 'creator', game: 'mygame' }

    expect(parseItchioUrl('https://creator.itch.io/mygame')).toEqual(expected)
  })

  it('should return the creator for a creator subdomain', () => {
    const expected: ItchioUrl = { kind: 'creator', creator: 'creator' }

    expect(parseItchioUrl('https://creator.itch.io/')).toEqual(expected)
  })

  it('should return the creator for a games by page', () => {
    const expected: ItchioUrl = { kind: 'creator', creator: 'creator' }

    expect(parseItchioUrl('https://itch.io/games/by-creator')).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: ItchioUrl = { kind: 'tag', tag: 'horror' }

    expect(parseItchioUrl('https://itch.io/games/tag-horror')).toEqual(expected)
  })

  it('should return the platform for a platform page', () => {
    const expected: ItchioUrl = { kind: 'platform', platform: 'linux' }

    expect(parseItchioUrl('https://itch.io/games/platform-linux')).toEqual(expected)
  })

  it('should return the genre for a genre page', () => {
    const expected: ItchioUrl = { kind: 'genre', genre: 'action' }

    expect(parseItchioUrl('https://itch.io/games/genre-action')).toEqual(expected)
  })

  it('should return the engine for a made-with page', () => {
    const expected: ItchioUrl = { kind: 'madeWith', engine: 'godot' }

    expect(parseItchioUrl('https://itch.io/games/made-with-godot')).toEqual(expected)
  })

  it('should return the sort for a sorted games page', () => {
    const expected: ItchioUrl = { kind: 'games', sort: 'newest' }

    expect(parseItchioUrl('https://itch.io/games/newest')).toEqual(expected)
  })

  it('should return the games page', () => {
    const expected: ItchioUrl = { kind: 'games' }

    expect(parseItchioUrl('https://itch.io/games')).toEqual(expected)
  })

  it('should return the devlogs page', () => {
    const expected: ItchioUrl = { kind: 'devlogs' }

    expect(parseItchioUrl('https://itch.io/devlogs')).toEqual(expected)
  })

  it('should return the home page for the blog page', () => {
    const expected: ItchioUrl = { kind: 'home' }

    expect(parseItchioUrl('https://itch.io/blog')).toEqual(expected)
  })

  it('should return the section for a section page', () => {
    const expected: ItchioUrl = { kind: 'section', section: 'tools' }

    expect(parseItchioUrl('https://itch.io/tools')).toEqual(expected)
  })

  it('should return the home page for any other page', () => {
    const expected: ItchioUrl = { kind: 'home' }

    expect(parseItchioUrl('https://itch.io/')).toEqual(expected)
  })

  it('should return the whole tag for a sorted tag listing whose tag has a dot', () => {
    const value = 'https://itch.io/games/newest/tag-foo.bar'
    const expected: ItchioUrl = { kind: 'tag', tag: 'foo.bar', sort: 'newest' }

    expect(parseItchioUrl(value)).toEqual(expected)
  })

  it('should return the whole platform for a platform with a dot', () => {
    const expected: ItchioUrl = { kind: 'platform', platform: 'foo.bar' }

    expect(parseItchioUrl('https://itch.io/games/platform-foo.bar')).toEqual(expected)
  })

  it('should return the whole genre for a genre with a dot', () => {
    const expected: ItchioUrl = { kind: 'genre', genre: 'foo.bar' }

    expect(parseItchioUrl('https://itch.io/games/genre-foo.bar')).toEqual(expected)
  })

  it('should return the whole engine for an engine with a dot', () => {
    const expected: ItchioUrl = { kind: 'madeWith', engine: 'foo.bar' }

    expect(parseItchioUrl('https://itch.io/games/made-with-foo.bar')).toEqual(expected)
  })

  it('should return the home page for a sort word with another suffix', () => {
    const expected: ItchioUrl = { kind: 'home' }

    expect(parseItchioUrl('https://itch.io/games/newest.html')).toEqual(expected)
  })

  it('should return the home page for a section word with another suffix', () => {
    const expected: ItchioUrl = { kind: 'home' }

    expect(parseItchioUrl('https://itch.io/tools.html')).toEqual(expected)
  })

  it('should return the whole game for a game with a dot', () => {
    const expected: ItchioUrl = { kind: 'game', creator: 'creator', game: 'my.game' }

    expect(parseItchioUrl('https://creator.itch.io/my.game')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseItchioUrl('https://a.b.itch.io/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseItchioUrl('https://example.com/')).toBeUndefined()
  })
})

describe('itchioHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://itch.io/games'],
      [true, 'https://www.itch.io/games'],
      [true, 'https://alice.itch.io'],
      [true, 'https://alice.itch.io/x-moon'],
      [false, 'https://example.com'],
      [false, 'https://notitch.io'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(itchioHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(itchioHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the feed of a listing with two filters', () => {
      const value = 'https://itch.io/games/tag-horror/tag-pixel-art'
      const expected = [
        {
          uri: 'https://itch.io/games/tag-horror/tag-pixel-art.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed of a sorted tag listing', () => {
      const value = 'https://itch.io/games/newest/tag-horror'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://itch.io/games/newest/tag-horror.xml',
          hint: { key: 'itchio:tag', label: 'Tag' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the creator feed of a sorted creator listing', () => {
      const value = 'https://itch.io/games/newest/by-alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://itch.io/games/newest/by-alice.xml',
          hint: { key: 'itchio:creator', label: 'Creator' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside itch.io', () => {
      expect(itchioHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return devlog feed for game page on subdomain', () => {
      const value = 'https://bob.itch.io/a-tavern-for-tea'
      const expected = [
        {
          uri: 'https://bob.itch.io/a-tavern-for-tea/devlog.rss',
          hint: { key: 'itchio:devlog', label: 'Devlog' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlog feed for game page with subpath', () => {
      const value = 'https://alice.itch.io/x-moon/devlog'
      const expected = [
        {
          uri: 'https://alice.itch.io/x-moon/devlog.rss',
          hint: { key: 'itchio:devlog', label: 'Devlog' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http game page in its devlog feed', () => {
      const value = 'http://alice.itch.io/x-moon'
      const expected = [
        {
          uri: 'http://alice.itch.io/x-moon/devlog.rss',
          hint: { key: 'itchio:devlog', label: 'Devlog' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return creator feed for creator root', () => {
      const value = 'https://alice.itch.io/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://itch.io/games/by-alice.xml',
          hint: { key: 'itchio:creator', label: 'Creator' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return creator feed for by-username path', () => {
      const value = 'https://itch.io/games/by-alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://itch.io/games/by-alice.xml',
          hint: { key: 'itchio:creator', label: 'Creator' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return creator feed for by-username path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games/by-alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://itch.io/games/by-alice.xml',
          hint: { key: 'itchio:creator', label: 'Creator' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed for tag path', () => {
      const value = 'https://itch.io/games/tag-horror'
      const expected = [
        {
          uri: 'https://itch.io/games/tag-horror.xml',
          hint: { key: 'itchio:tag', label: 'Tag' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed for tag path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games/tag-horror'
      const expected = [
        {
          uri: 'https://itch.io/games/tag-horror.xml',
          hint: { key: 'itchio:tag', label: 'Tag' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return platform feed for platform path', () => {
      const value = 'https://itch.io/games/platform-web'
      const expected = [
        {
          uri: 'https://itch.io/games/platform-web.xml',
          hint: { key: 'itchio:platform', label: 'Platform' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return platform feed for platform path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games/platform-web'
      const expected = [
        {
          uri: 'https://itch.io/games/platform-web.xml',
          hint: { key: 'itchio:platform', label: 'Platform' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return genre feed for genre path', () => {
      const value = 'https://itch.io/games/genre-puzzle'
      const expected = [
        {
          uri: 'https://itch.io/games/genre-puzzle.xml',
          hint: { key: 'itchio:genre', label: 'Genre' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return genre feed for genre path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games/genre-puzzle'
      const expected = [
        {
          uri: 'https://itch.io/games/genre-puzzle.xml',
          hint: { key: 'itchio:genre', label: 'Genre' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return made-with feed for made-with path', () => {
      const value = 'https://itch.io/games/made-with-unity'
      const expected = [
        {
          uri: 'https://itch.io/games/made-with-unity.xml',
          hint: { key: 'itchio:made-with', label: 'Made with' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return made-with feed for made-with path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games/made-with-unity'
      const expected = [
        {
          uri: 'https://itch.io/games/made-with-unity.xml',
          hint: { key: 'itchio:made-with', label: 'Made with' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for sort path', () => {
      const value = 'https://itch.io/games/newest'
      const expected = [
        {
          uri: 'https://itch.io/games/newest.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for released path', () => {
      const value = 'https://itch.io/games/released'
      const expected = [
        {
          uri: 'https://itch.io/games/released.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for in-development path', () => {
      const value = 'https://itch.io/games/in-development'
      const expected = [
        {
          uri: 'https://itch.io/games/in-development.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide feeds for the blog page', () => {
      const value = 'https://itch.io/blog'
      const expected = [
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide feeds for a capitalized blog segment', () => {
      const value = 'https://itch.io/Blog'
      const expected = [
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for sort path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games/newest'
      const expected = [
        {
          uri: 'https://itch.io/games/newest.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for top-rated path', () => {
      const value = 'https://itch.io/games/top-rated'
      const expected = [
        {
          uri: 'https://itch.io/games/top-rated.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return lowercase sort feed for a capitalized top-rated path', () => {
      const value = 'https://itch.io/games/Top-Rated'
      const expected = [
        {
          uri: 'https://itch.io/games/top-rated.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for free path', () => {
      const value = 'https://itch.io/games/free'
      const expected = [
        {
          uri: 'https://itch.io/games/free.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return games feed for /games path', () => {
      const value = 'https://itch.io/games'
      const expected = [
        { uri: 'https://itch.io/games.xml', hint: { key: 'itchio:games', label: 'Games' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return games feed for /games path with a capitalized games segment', () => {
      const value = 'https://itch.io/Games'
      const expected = [
        { uri: 'https://itch.io/games.xml', hint: { key: 'itchio:games', label: 'Games' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return games feed for /games path with trailing slash', () => {
      const value = 'https://itch.io/games/'
      const expected = [
        { uri: 'https://itch.io/games.xml', hint: { key: 'itchio:games', label: 'Games' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlogs feed for /devlogs path', () => {
      const value = 'https://itch.io/devlogs'
      const expected = [
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlogs feed for /devlogs path with a capitalized devlogs segment', () => {
      const value = 'https://itch.io/Devlogs'
      const expected = [
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlogs feed for /devlogs path with trailing slash', () => {
      const value = 'https://itch.io/devlogs/'
      const expected = [
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return section feed for tools path', () => {
      const value = 'https://itch.io/tools'
      const expected = [
        { uri: 'https://itch.io/tools.xml', hint: { key: 'itchio:section', label: 'Section' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return lowercase section feed for a capitalized tools path', () => {
      const value = 'https://itch.io/Tools'
      const expected = [
        { uri: 'https://itch.io/tools.xml', hint: { key: 'itchio:section', label: 'Section' } },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return section feed for game-assets path', () => {
      const value = 'https://itch.io/game-assets'
      const expected = [
        {
          uri: 'https://itch.io/game-assets.xml',
          hint: { key: 'itchio:section', label: 'Section' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return section feed for soundtracks path', () => {
      const value = 'https://itch.io/soundtracks'
      const expected = [
        {
          uri: 'https://itch.io/soundtracks.xml',
          hint: { key: 'itchio:section', label: 'Section' },
        },
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated feeds for root path', () => {
      const value = 'https://itch.io/'
      const expected = [
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated feeds for www subdomain root', () => {
      const value = 'https://www.itch.io/'
      const expected = [
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlogs', label: 'Devlogs' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the tag hint for a tag feed on www', () => {
      const value = 'https://www.itch.io/games/tag-horror.xml'
      const expected: DiscoverUriHint = { key: 'itchio:tag', label: 'Tag' }

      expect(itchioHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a sorted tag feed on the www host over http as itself', async () => {
      const value = 'http://www.itch.io/games/free/tag-anime.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [itchioHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.itch.io/games/free/tag-anime.xml',
          hint: { key: 'itchio:tag', label: 'Tag' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
