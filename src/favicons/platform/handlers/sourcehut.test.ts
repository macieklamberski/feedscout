import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
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

    it('should not match a repository page on git.sr.ht', () => {
      expect(sourcehutHandler.match('https://git.sr.ht/~example/project')).toBe(false)
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
      it('should return the avatar from the user page content', () => {
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(sourcehutHandler.resolve('https://sr.ht/~example/', userPage)).toEqual(expected)
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

      it('should return empty array for an unmatched URL', () => {
        expect(sourcehutHandler.resolve('https://git.sr.ht/~example/project', userPage)).toEqual([])
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

      it('should read the avatar when class comes before src', () => {
        const content = `
          <img
            class="avatar"
            src="${avatarUrl}"
          />
        `
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(sourcehutHandler.resolve('https://sr.ht/~example/', content)).toEqual(expected)
      })
    })
  })
})
