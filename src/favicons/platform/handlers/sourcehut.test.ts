import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { sourcehutHandler } from './sourcehut.js'

const avatarUrl = 'https://s3.sr.ht/meta.sr.ht/avatars/10301d7605f6f84b46f1c454a2c7ebc8.jpg'

const userPage = `
  <div class="col-md-4">
    <img
      src="${avatarUrl}"
      alt="example's avatar"
      class="avatar"
    />
    <h2>~example</h2>
  </div>
`

const userPageWithoutAvatar = `
  <div class="col-md-4">
    <h2>~example</h2>
  </div>
`

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('sourcehutHandler', () => {
  describe('match', () => {
    it('should match a user page on sr.ht', () => {
      expect(sourcehutHandler.match('https://sr.ht/~example/')).toBe(true)
    })

    it('should match a user page on git.sr.ht', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example')).toBe(true)
    })

    it('should match a user page on todo.sr.ht', () => {
      expect(sourcehutHandler.match('https://todo.sr.ht/~example/')).toBe(true)
    })

    it('should match a repository page on git.sr.ht', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example/project')).toBe(true)
    })

    it('should match a path below the repository', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example/project/tree')).toBe(true)
    })

    it('should not match a project page on sr.ht', () => {
      expect(sourcehutHandler.match('https://sr.ht/~example/project/')).toBe(false)
    })

    it('should not match a tracker page on todo.sr.ht', () => {
      expect(sourcehutHandler.match('https://todo.sr.ht/~example/project')).toBe(false)
    })

    it('should not match a path without the tilde prefix', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/example/project')).toBe(false)
    })

    it('should not match a bare tilde', () => {
      expect(sourcehutHandler.match('https://sr.ht/~/')).toBe(false)
    })

    it('should not match the root', () => {
      expect(sourcehutHandler.match('https://sr.ht/')).toBe(false)
    })

    it('should not match other sr.ht services', () => {
      expect(sourcehutHandler.match('https://lists.sr.ht/~example')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(sourcehutHandler.match('https://example.com/~example')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(sourcehutHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the avatar from the user page content', async () => {
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(await sourcehutHandler.resolve('https://sr.ht/~example/', userPage)).toEqual(
          expected,
        )
      })

      it('should return the avatar from the owner page of a repository', async () => {
        const fetchFn = createMockFetch({ 'https://git.sr.ht/~example/': userPage })
        const value = 'https://git.sr.ht/~example/project/tree'
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(await sourcehutHandler.resolve(value, '', undefined, fetchFn)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a user page passed without its content', async () => {
        const fetchFn = createMockFetch({ 'https://todo.sr.ht/~example/': userPage })
        const value = 'https://todo.sr.ht/~example'

        expect(await sourcehutHandler.resolve(value, undefined, undefined, fetchFn)).toEqual([])
      })

      it('should return empty array for a user without an avatar', async () => {
        const value = 'https://sr.ht/~example/'

        expect(await sourcehutHandler.resolve(value, userPageWithoutAvatar)).toEqual([])
      })

      it('should return empty array when the owner page has no avatar', async () => {
        const fetchFn = createMockFetch({ 'https://git.sr.ht/~example/': userPageWithoutAvatar })
        const value = 'https://git.sr.ht/~example/project'

        expect(await sourcehutHandler.resolve(value, '', undefined, fetchFn)).toEqual([])
      })

      it('should return empty array when the owner page is missing', async () => {
        const fetchFn = createMockFetch({})
        const value = 'https://git.sr.ht/~example/project'

        expect(await sourcehutHandler.resolve(value, '', undefined, fetchFn)).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const fetchFn: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const value = 'https://git.sr.ht/~example/project'

        expect(await sourcehutHandler.resolve(value, '', undefined, fetchFn)).toEqual([])
      })

      it('should return empty array when the body is a stream', async () => {
        const fetchFn: DiscoverFetchFn = async (url) => ({
          headers: new Headers(),
          body: new ReadableStream(),
          url,
          status: 200,
          statusText: 'OK',
        })
        const value = 'https://git.sr.ht/~example/project'

        expect(await sourcehutHandler.resolve(value, '', undefined, fetchFn)).toEqual([])
      })

      it('should return empty array for a repository when fetchFn is not provided', async () => {
        expect(await sourcehutHandler.resolve('https://git.sr.ht/~example/project')).toEqual([])
      })

      it('should return empty array for an unmatched URL', async () => {
        expect(await sourcehutHandler.resolve('https://sr.ht/~example/project/')).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should not read an image inside the user bio as the avatar', async () => {
        const content = `
          <blockquote>
            <img
              src="https://example.com/favicon.jpg"
              alt=":)"
            />
          </blockquote>
        `

        expect(await sourcehutHandler.resolve('https://sr.ht/~example/', content)).toEqual([])
      })

      it('should read the avatar when class comes before src', async () => {
        const content = `
          <img
            class="avatar"
            src="${avatarUrl}"
          />
        `
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(await sourcehutHandler.resolve('https://sr.ht/~example/', content)).toEqual(expected)
      })
    })
  })
})
