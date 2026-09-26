import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { sourcehutEnricher, sourcehutHandler } from './sourcehut.js'

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

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string, id: string): DiscoverRef => {
  return { platform: 'sourcehut', id, url }
}

describe('sourcehutHandler', () => {
  describe('match', () => {
    it('should match a user page on sr.ht', () => {
      expect(sourcehutHandler.match('https://sr.ht/~example/')).toBe(true)
    })

    it('should not match a project page on sr.ht', () => {
      expect(sourcehutHandler.match('https://sr.ht/~example/project/')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the avatar from the user page content', () => {
        const expected = [{ uri: avatarUrl }]

        expect(sourcehutHandler.resolve('https://sr.ht/~example/', userPage)).toEqual(expected)
      })

      it('should return a ref to the owner for a repository page', () => {
        const value = 'https://git.sr.ht/~example/project/tree'
        const expected = [{ platform: 'sourcehut', id: 'example', url: value }]

        expect(sourcehutHandler.resolve(value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a user page passed without its content', () => {
        expect(sourcehutHandler.resolve('https://todo.sr.ht/~example')).toEqual([])
      })

      it('should return empty array for a user without an avatar', () => {
        const value = 'https://sr.ht/~example/'

        expect(sourcehutHandler.resolve(value, userPageWithoutAvatar)).toEqual([])
      })

      it('should return empty array for a project page', () => {
        expect(sourcehutHandler.resolve('https://sr.ht/~example/project/', userPage)).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should not read an image inside the user bio as the avatar', () => {
        const content = `
          <blockquote>
            <img
              src="https://example.com/favicon.jpg"
              alt=":)"
            />
          </blockquote>
        `

        expect(sourcehutHandler.resolve('https://sr.ht/~example/', content)).toEqual([])
      })

      it('should decode entities in the avatar URL', () => {
        const content = `
          <img
            class="avatar"
            src="${avatarUrl}?size=256&amp;v=2"
          />
        `
        const expected = [{ uri: `${avatarUrl}?size=256&v=2` }]

        expect(sourcehutHandler.resolve('https://sr.ht/~example/', content)).toEqual(expected)
      })

      it('should read the avatar when class comes before src', () => {
        const content = `
          <img
            class="avatar"
            src="${avatarUrl}"
          />
        `
        const expected = [{ uri: avatarUrl }]

        expect(sourcehutHandler.resolve('https://sr.ht/~example/', content)).toEqual(expected)
      })
    })
  })
})

describe('sourcehutEnricher', () => {
  it('should return the avatar from the owner page', async () => {
    const context = createContext({ 'https://git.sr.ht/~example/': userPage })
    const ref = createRef('https://git.sr.ht/~example/project/tree', 'example')

    expect(await sourcehutEnricher(ref, context)).toEqual([avatarUrl])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'example',
      url: 'https://example.com/@example',
    }

    expect(await sourcehutEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the owner page has no avatar', async () => {
    const context = createContext({ 'https://git.sr.ht/~example/': userPageWithoutAvatar })
    const ref = createRef('https://git.sr.ht/~example/project', 'example')

    expect(await sourcehutEnricher(ref, context)).toEqual([])
  })

  it('should reject when the owner page is missing', async () => {
    const ref = createRef('https://git.sr.ht/~example/project', 'example')
    const throwing = () => sourcehutEnricher(ref, createContext({}))
    const expected = 'Unexpected status 404 from https://git.sr.ht/~example/'

    await expect(throwing()).rejects.toThrow(expected)
  })

  it('should reject when the body is a stream', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })
    const ref = createRef('https://git.sr.ht/~example/project', 'example')
    const throwing = () => sourcehutEnricher(ref, { fetchFn })

    await expect(throwing()).rejects.toThrow('Unexpected stream body')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://git.sr.ht/~example/project', 'example')
    const throwing = () => sourcehutEnricher(ref, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })
})
