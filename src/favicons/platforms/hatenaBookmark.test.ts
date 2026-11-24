import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import {
  type HatenaBookmarkUrl,
  hatenaBookmarkEnricher,
  hatenaBookmarkHandler,
  parseHatenaBookmarkUrl,
} from './hatenaBookmark.js'

describe('parseHatenaBookmarkUrl', () => {
  const home: HatenaBookmarkUrl = { kind: 'home' }

  it('should return a search for a query page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/rss')).toEqual(expected)
  })

  it('should return a search for a query page with a capitalized q segment', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Q/rss')).toEqual(expected)
  })

  it('should return the decoded query for an encoded query page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'c++ web', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/c%2B%2B%20web')).toEqual(expected)
  })

  it('should keep a slash in the query', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss/atom', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/rss/atom')).toEqual(expected)
  })

  it('should keep the search filters of a query page', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'rss',
      params: { target: 'title', sort: 'recent', users: '10', date_range: '1w', safe: 'on' },
    }
    const url =
      'https://b.hatena.ne.jp/q/rss?target=title&sort=recent&users=10&date_range=1w&safe=on'

    expect(parseHatenaBookmarkUrl(url)).toEqual(expected)
  })

  it('should drop the page and unknown parameters of a query page', () => {
    const value = 'https://b.hatena.ne.jp/q/rss?target=text&page=2&ref=top'
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: { target: 'text' } }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the home page for a query page without a query', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/')).toEqual(home)
  })

  it('should return a search without a target for an old tag search', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/tag?q=rss')).toEqual(expected)
  })

  it('should return a search with a target for an old text search', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'feed',
      params: { target: 'text' },
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/text?q=feed')).toEqual(expected)
  })

  it('should return the lowercase target for a capitalized old search type', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'rss',
      params: { target: 'title' },
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Search/Title?q=rss')).toEqual(expected)
  })

  it('should keep the search filters of an old search', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'feed',
      params: { target: 'text', users: '3' },
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/text?q=feed&users=3')).toEqual(
      expected,
    )
  })

  it('should return the home page for an old search without a query', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/tag')).toEqual(home)
  })

  it('should return a site without its trailing slash for a domain page', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'site',
      site: 'example.com',
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/site/example.com/')).toEqual(expected)
  })

  it('should keep only the sort order of a site page', () => {
    const value = 'https://b.hatena.ne.jp/site/example.com/?page=2&sort=eid'
    const expected: HatenaBookmarkUrl = {
      kind: 'site',
      site: 'example.com',
      sort: 'eid',
    }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return a site for a domain page with a capitalized site segment', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'site',
      site: 'example.com',
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Site/example.com/')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/alice/')).toEqual(expected)
  })

  it('should return the user for a user page without a trailing slash', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/alice')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/alice/bookmark')).toEqual(expected)
  })

  it('should return a user ID with hyphens and underscores', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'bob-dev_jp' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/bob-dev_jp/')).toEqual(expected)
  })

  it('should keep the user ID case', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'ALice' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/ALice')).toEqual(expected)
  })

  it('should return the user and tag for a user page filtered by tag', () => {
    const value = 'https://b.hatena.ne.jp/alice/bookmark?tag=javascript'
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'alice', tag: 'javascript' }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the user for a user feed URL', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/alice.rss')).toEqual(expected)
  })

  it('should return the user for a user feed URL with a capitalized rss extension', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/alice.RSS')).toEqual(expected)
  })

  it('should return the hot entries of a category', () => {
    const expected: HatenaBookmarkUrl = { kind: 'hotentry', category: 'it' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/hotentry/it')).toEqual(expected)
  })

  it('should return the hot entries without an unknown category', () => {
    const expected: HatenaBookmarkUrl = { kind: 'hotentry', category: undefined }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Hotentry/nope')).toEqual(expected)
  })

  it('should return the hot entries without a category for the all category', () => {
    const value = 'https://b.hatena.ne.jp/hotentry/all'
    const expected: HatenaBookmarkUrl = { kind: 'hotentry', category: undefined }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the new entries', () => {
    const expected: HatenaBookmarkUrl = { kind: 'entrylist', category: undefined }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/entrylist')).toEqual(expected)
  })

  it('should return the home page for files at the root', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/favicon.ico')).toEqual(home)
  })

  it('should return the user for a two-letter path', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'ab' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/ab')).toEqual(expected)
  })

  it('should return the user for a path longer than 32 characters', () => {
    const value = 'https://b.hatena.ne.jp/abcdefghijklmnopqrstuvwxyzabcdefghijklmn/'
    const expected: HatenaBookmarkUrl = {
      kind: 'user',
      username: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmn',
    }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the home page for a path starting with a non-letter', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/-/my/config')).toEqual(home)
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/1abc')).toEqual(home)
  })

  it('should return the user for a path ending with a hyphen', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'abc-' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/abc-')).toEqual(expected)
  })

  it('should return the home page for the homepage', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/')).toEqual(home)
  })

  it('should return undefined for another host', () => {
    expect(parseHatenaBookmarkUrl('https://hatena.ne.jp/alice')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp.example.com/alice')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://example.com/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseHatenaBookmarkUrl('not-a-url')).toBeUndefined()
  })
})

const avatarUrl = 'https://cdn.profile-image.st-hatena.com/users/alice/profile_256x256.png'
const defaultAvatarUrl =
  'https://cdn.profile-image.st-hatena.com/default_profile_images/profile_256x256.png'

const ref: DiscoverRef = {
  platform: 'hatenaBookmark',
  id: 'alice',
  url: 'https://b.hatena.ne.jp/alice/',
}

// Maps a requested URL to the URL the response ends at, after redirects.
const createContext = (finalUrls: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: '',
    url: finalUrls[url] ?? url,
    status: url in finalUrls ? 200 : 404,
  })

  return { fetchFn }
}

describe('hatenaBookmarkHandler', () => {
  describe('match', () => {
    it('should match user page URLs', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/alice/')).toBe(true)
    })

    it('should not match category pages', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/hotentry/it')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a user page', async () => {
      expect(await hatenaBookmarkHandler.resolve('https://b.hatena.ne.jp/alice/')).toEqual([ref])
    })

    it('should return empty array for category pages', async () => {
      expect(await hatenaBookmarkHandler.resolve('https://b.hatena.ne.jp/hotentry/it')).toEqual([])
    })
  })
})

describe('hatenaBookmarkEnricher', () => {
  it('should return the avatar when it does not redirect to the default image', async () => {
    const context = createContext({ [avatarUrl]: avatarUrl })

    expect(await hatenaBookmarkEnricher(ref, context)).toEqual([avatarUrl])
  })

  it('should send a HEAD request for the avatar', async () => {
    let receivedMethod: string | undefined
    const fetchFn: FetchFn = (url, options) => {
      receivedMethod = options?.method

      return { headers: new Headers(), body: '', url, status: 200 }
    }

    await hatenaBookmarkEnricher(ref, { fetchFn })

    expect(receivedMethod).toBe('HEAD')
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = { platform: 'mastodon', id: 'alice', url: 'https://example.com' }

    expect(await hatenaBookmarkEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the avatar redirects to the default image', async () => {
    const context = createContext({ [avatarUrl]: defaultAvatarUrl })

    expect(await hatenaBookmarkEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the avatar is not found', async () => {
    expect(await hatenaBookmarkEnricher(ref, createContext({}))).toEqual([])
  })

  it('should reject when the avatar request fails with another status', () => {
    const fetchFn: FetchFn = (url) => {
      return { headers: new Headers(), body: '', url, status: 503 }
    }
    const throwing = () => hatenaBookmarkEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Unexpected status 503')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => hatenaBookmarkEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })
})
