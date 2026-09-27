import { describe, expect, it } from 'bun:test'
import { giteaHandler } from './gitea.js'

describe('giteaHandler', () => {
  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected = [{ uri: 'https://codeberg.org/user/avatar/forgejo/512' }]

      expect(giteaHandler.resolve('https://codeberg.org/forgejo')).toEqual(expected)
    })

    it('should resolve the owner avatar from repo URL', () => {
      const expected = [{ uri: 'https://codeberg.org/user/avatar/forgejo/512' }]

      expect(giteaHandler.resolve('https://codeberg.org/forgejo/forgejo')).toEqual(expected)
    })

    it('should resolve user avatar using the page origin', () => {
      const expected = [{ uri: 'https://gitea.com/user/avatar/gitea/512' }]

      expect(giteaHandler.resolve('https://gitea.com/gitea')).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(giteaHandler.resolve('https://codeberg.org/explore')).toEqual([])
    })
  })
})
