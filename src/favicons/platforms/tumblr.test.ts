import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { tumblrHandler } from './tumblr.js'

describe('tumblrHandler', () => {
  describe('resolve', () => {
    it('should resolve blog avatar from subdomain URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/staff/avatar/512' },
      ]

      expect(tumblrHandler.resolve('https://staff.tumblr.com')).toEqual(expected)
    })

    it('should return empty array for the tumblr.com root', () => {
      expect(tumblrHandler.resolve('https://tumblr.com')).toEqual([])
    })
  })
})
