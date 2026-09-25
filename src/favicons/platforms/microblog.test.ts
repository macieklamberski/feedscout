import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { microblogHandler } from './microblog.js'

describe('microblogHandler', () => {
  describe('resolve', () => {
    it('should resolve the avatar from the blog home page', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://micro.blog/example/avatar.jpg' }]

      expect(microblogHandler.resolve('https://example.micro.blog')).toEqual(expected)
    })

    it('should return empty array for the micro.blog apex', () => {
      expect(microblogHandler.resolve('https://micro.blog/example')).toEqual([])
    })
  })
})
