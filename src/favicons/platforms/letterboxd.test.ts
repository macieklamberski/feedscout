import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
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

    it('should not match the journal', () => {
      expect(letterboxdHandler.match('https://letterboxd.com/journal/')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('member subpage', () => {
      it('should return the large avatar from the page HTML', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/films/',
          uploadedAvatarHtml,
        )
        const expected = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('avatar link with the size class first', () => {
      it('should return the large avatar', () => {
        const content = uploadedAvatarHtml.replace('class="avatar -a24"', 'class="-a24 avatar"')
        const result = letterboxdHandler.resolve('https://letterboxd.com/alice/films/', content)
        const expected = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('avatar link without a trailing slash', () => {
      it('should return the large avatar', () => {
        const content = uploadedAvatarHtml.replace(
          'class="avatar -a24" href="/alice/"',
          'class="avatar -a24" href="/alice"',
        )
        const result = letterboxdHandler.resolve('https://letterboxd.com/alice/films/', content)
        const expected = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('avatar link in another case than the URL', () => {
      it('should return the large avatar', () => {
        const content = uploadedAvatarHtml.replace(
          'class="avatar -a24" href="/alice/"',
          'class="avatar -a24" href="/Alice/"',
        )
        const result = letterboxdHandler.resolve('https://letterboxd.com/alice/films/', content)
        const expected = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('username with a regex metacharacter', () => {
      it('should not match an avatar link the metacharacter would match', () => {
        const url = 'https://letterboxd.com/a.b/films/'
        const content = uploadedAvatarHtml.replace(
          'class="avatar -a24" href="/alice/"',
          'class="avatar -a24" href="/axb/"',
        )
        const expected = [{ platform: 'letterboxd', id: 'a.b', url }]

        expect(letterboxdHandler.resolve(url, content)).toEqual(expected)
      })
    })

    describe('list page', () => {
      it('should return the large avatar from the person summary', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/list/favorites/',
          listAvatarHtml,
        )
        const expected = [{ uri: largeUploadedAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('gravatar avatar', () => {
      it('should return the large Gravatar that answers 404 when missing', () => {
        const result = letterboxdHandler.resolve(
          'https://letterboxd.com/alice/films/',
          gravatarAvatarHtml,
        )
        const expected = [
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
        const expected = [{ platform: 'letterboxd', id: 'alice', url }]

        expect(letterboxdHandler.resolve(url, '<html><body></body></html>')).toEqual(expected)
      })
    })

    describe('avatar of another member', () => {
      it('should return a ref for the member', () => {
        const url = 'https://letterboxd.com/alice/list/favorites/'
        const expected = [{ platform: 'letterboxd', id: 'alice', url }]

        expect(letterboxdHandler.resolve(url, otherMemberAvatarHtml)).toEqual(expected)
      })
    })

    it('should return a ref when content is absent', () => {
      expect(letterboxdHandler.resolve('https://letterboxd.com/alice/')).toEqual([aliceRef])
    })

    it('should return empty array for a page without a member', () => {
      expect(letterboxdHandler.resolve('https://letterboxd.com/films/')).toEqual([])
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

  it('should reject when the body is a stream', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })
    const throwing = () => letterboxdEnricher(aliceRef, { fetchFn })

    await expect(throwing()).rejects.toThrow('Unexpected stream body')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => letterboxdEnricher(aliceRef, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', async () => {
    const throwing = () => letterboxdEnricher(aliceRef, createContext({}))
    const expected = 'Unexpected status 404 from https://letterboxd.com/alice/films/'

    await expect(throwing()).rejects.toThrow(expected)
  })
})
