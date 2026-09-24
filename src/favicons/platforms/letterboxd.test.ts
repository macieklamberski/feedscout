import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { letterboxdEnricher, letterboxdHandler } from './letterboxd.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const aliceRef: DiscoverRef = {
  platform: 'letterboxd',
  id: 'alice',
  url: 'https://letterboxd.com/alice/',
}

const uploadedAvatarHtml = `
  <div class="profile-mini-person -has-badge">
    <a class="avatar -a24" href="/alice/" > <img src="https://a.ltrbxd.com/resized/avatar/upload/1/2/3/4/shard/avtr-0-48-0-48-crop.jpg?v=abc123" alt="Alice" width="24" height="24" /> </a>
    <h1 class="title-3"><a href="/alice/">Alice</a></h1>
  </div>
`

const listAvatarHtml = `
  <div class="person-summary -inline">
    <a class="avatar -a24" href="/alice/" > <img src="https://a.ltrbxd.com/resized/avatar/upload/1/2/3/4/shard/avtr-0-48-0-48-crop.jpg?v=abc123" alt="Alice" width="24" height="24" /> </a>
    <h1 class="title-4"><small class="context">List by</small></h1>
  </div>
`

const gravatarAvatarHtml = `
  <div class="profile-mini-person">
    <a class="avatar -a24" href="/alice/" > <img src="https://secure.gravatar.com/avatar/b7b59a60d69cdb2ff36f363fb953cdbc?rating=PG&amp;size=48&amp;border=&amp;default=https%3A%2F%2Fs.ltrbxd.com%2Fstatic%2Fimg%2Favatar48.png" alt="Alice" width="24" height="24" /> </a>
  </div>
`

const placeholderAvatarHtml = `
  <div class="profile-mini-person">
    <a class="avatar -a24" href="/alice/" > <img src="https://s.ltrbxd.com/static/img/avatar48-DSi8lXxI.png" alt="Alice" width="24" height="24" /> </a>
  </div>
`

const otherMemberAvatarHtml = `
  <li class="comment">
    <a class="avatar -a40" href="/bob/" > <img src="https://a.ltrbxd.com/resized/avatar/upload/5/6/7/8/shard/avtr-0-80-0-80-crop.jpg?v=def456" alt="Bob" width="40" height="40" /> </a>
  </li>
`

const largeUploadedAvatar =
  'https://a.ltrbxd.com/resized/avatar/upload/1/2/3/4/shard/avtr-0-1000-0-1000-crop.jpg?v=abc123'

describe('letterboxdHandler', () => {
  describe('match', () => {
    it('should match member profile URLs', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/alice/')).toBe(true)
    })

    it('should match member subpage URLs', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/alice/films/')).toBe(true)
      expect(letterboxdHandler.match('https://letterboxd.com/alice/list/favorites/')).toBe(true)
      expect(letterboxdHandler.match('https://letterboxd.com/alice/films/diary/')).toBe(true)
    })

    it('should match www.letterboxd.com URLs', () => {
      expect(letterboxdHandler.match('https://www.letterboxd.com/alice/')).toBe(true)
    })

    it('should not match the journal', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/journal/')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/films/')).toBe(false)
      expect(letterboxdHandler.match('https://letterboxd.com/settings/')).toBe(false)
    })

    it('should not match the root URL', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/')).toBe(false)
    })

    it('should not match non-Letterboxd URLs', () => {
      expect(letterboxdHandler.match('https://example.com/alice/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(letterboxdHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('member subpage', () => {
      it('should return the large avatar from the page HTML', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/films/',
          uploadedAvatarHtml,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('list page', () => {
      it('should return the large avatar from the person summary', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/list/favorites/',
          listAvatarHtml,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('gravatar avatar', () => {
      it('should return the large Gravatar that answers 404 when missing', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/films/',
          gravatarAvatarHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://secure.gravatar.com/avatar/b7b59a60d69cdb2ff36f363fb953cdbc?rating=PG&size=500&border=&default=404',
          },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('placeholder avatar', () => {
      it('should return empty array', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/films/',
          placeholderAvatarHtml,
        )

        expect(result).toEqual([])
      })
    })

    describe('profile root challenge page', () => {
      it('should return a ref for the member', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/',
          '<html><title>Just a moment...</title></html>',
        )

        expect(result).toEqual([aliceRef])
      })
    })

    describe('member subpage without the avatar', () => {
      it('should return a ref for the member', () => {
        const url = 'https://letterboxd.com/alice/films/diary/'
        const expected: Array<DiscoverRef> = [{ platform: 'letterboxd', id: 'alice', url }]

        expect(letterboxdHandler.resolve(url, '<html><body></body></html>')).toEqual(expected)
      })
    })

    describe('avatar of another member', () => {
      it('should return a ref for the member', () => {
        const url = 'https://letterboxd.com/alice/list/favorites/'
        const expected: Array<DiscoverRef> = [{ platform: 'letterboxd', id: 'alice', url }]

        expect(letterboxdHandler.resolve(url, otherMemberAvatarHtml)).toEqual(expected)
      })
    })

    it('should return a ref when content is absent', () => {
      expect(letterboxdHandler.resolve('https://letterboxd.com/alice/')).toEqual([aliceRef])
    })

    it('should return empty array for the journal', () => {
      const result = letterboxdHandler.resolve(
        'https://letterboxd.com/journal/',
        uploadedAvatarHtml,
      )

      expect(result).toEqual([])
    })

    it('should return empty array for invalid URL', () => {
      const result = letterboxdHandler.resolve('not-a-url', uploadedAvatarHtml)

      expect(result).toEqual([])
    })
  })
})

describe('letterboxdEnricher', () => {
  it('should return the large avatar from the films page', async () => {
    const context = createContext({
      'https://letterboxd.com/alice/films/': uploadedAvatarHtml,
    })

    expect(await letterboxdEnricher(aliceRef, context)).toEqual([largeUploadedAvatar])
  })

  it('should return the large Gravatar that answers 404 when missing', async () => {
    const context = createContext({
      'https://letterboxd.com/alice/films/': gravatarAvatarHtml,
    })
    const expected = [
      'https://secure.gravatar.com/avatar/b7b59a60d69cdb2ff36f363fb953cdbc?rating=PG&size=500&border=&default=404',
    ]

    expect(await letterboxdEnricher(aliceRef, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await letterboxdEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for the placeholder avatar', async () => {
    const context = createContext({
      'https://letterboxd.com/alice/films/': placeholderAvatarHtml,
    })

    expect(await letterboxdEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when the films page has no avatar', async () => {
    const context = createContext({
      'https://letterboxd.com/alice/films/': '<html><body></body></html>',
    })

    expect(await letterboxdEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when only another member has an avatar', async () => {
    const context = createContext({
      'https://letterboxd.com/alice/films/': otherMemberAvatarHtml,
    })

    expect(await letterboxdEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when the body is not a string', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })

    expect(await letterboxdEnricher(aliceRef, { fetchFn })).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await letterboxdEnricher(aliceRef, { fetchFn })).toEqual([])
  })
})
