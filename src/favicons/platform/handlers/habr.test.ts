import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { habrHandler } from './habr.js'

const hubIcon =
  '//habrastorage.org/getpro/habr/hub/2b3/99b/964/2b399b964d456f3ad1bfddc0346b60d4.png'
const userAvatar =
  '//habrastorage.org/getpro/habr/avatars/353/8eb/088/3538eb088997a0fd418ce85841dd0996.png'
const authorAvatar =
  '//habrastorage.org/r/w48/getpro/habr/avatars/812/2ca/59d/8122ca59d6f9b159564625bfde4e35cf.jpeg'
const placeholder = 'https://assets.habr.com/habr-web/release_2.350.0/client/img/avatars/082.png'

const authorCard = `
  <a
    href="/ru/users/alice/"
    class="tm-user-info__userpic"
  ><div class="tm-entity-image"><img
    alt=""
    class="tm-entity-image__pic"
    height="24"
    src="${authorAvatar}"
    width="24"
  ></div></a>
`

const createHubPage = (src: string): string => {
  return `
    <div class="tm-hub-card__data"><div class="tm-hub-card__avatar"><div class="tm-entity-image"><img
      alt=""
      class="tm-entity-image__pic"
      src="${src}"
    ></div></div></div>
    ${authorCard}
  `
}

const createUserPage = (src: string): string => {
  return `
    <div
      class="user-card profile tm-user__user-card"
      data-async-called="true"
      data-v-38c4b225
    ><div
      class="header"
      data-v-38c4b225
    ><div
      class="header-data"
      data-v-38c4b225
    ><a
      href="/ru/users/Alice/"
      class="avatar avatar-48"
      data-v-38c4b225
    ><!--[--><div
      class="tm-entity-image"
      data-v-38c4b225
    ><img
      alt=""
      class="tm-entity-image__pic"
      src="${src}"
    ></div><!--]--></a></div></div></div>
  `
}

describe('habrHandler', () => {
  describe('match', () => {
    it('should match hub pages', () => {
      expect(habrHandler.match('https://habr.com/ru/hubs/javascript/')).toBe(true)
    })

    it('should match hub article lists', () => {
      expect(habrHandler.match('https://habr.com/ru/hubs/javascript/articles/')).toBe(true)
    })

    it('should match user pages', () => {
      expect(habrHandler.match('https://habr.com/ru/users/alice/')).toBe(true)
    })

    it('should match user post lists', () => {
      expect(habrHandler.match('https://habr.com/en/users/alice/posts/')).toBe(true)
    })

    it('should match www host', () => {
      expect(habrHandler.match('https://www.habr.com/ru/users/alice/')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(habrHandler.match('https://habr.com/ru/articles/')).toBe(false)
    })

    it('should not match company pages', () => {
      expect(habrHandler.match('https://habr.com/ru/companies/example/articles/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(habrHandler.match('https://example.com/ru/users/alice/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(habrHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the hub icon from the hub card', async () => {
        const content = createHubPage(hubIcon)
        const result = await habrHandler.resolve('https://habr.com/ru/hubs/javascript/', content)
        const expected: Array<DiscoverUriEntry> = [{ uri: hubIcon }]

        expect(result).toEqual(expected)
      })

      it('should return the user avatar from the user card', async () => {
        const content = createUserPage(userAvatar)
        const result = await habrHandler.resolve('https://habr.com/ru/users/alice/', content)
        const expected: Array<DiscoverUriEntry> = [{ uri: userAvatar }]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array when content is missing', async () => {
        const result = await habrHandler.resolve('https://habr.com/ru/users/alice/')

        expect(result).toEqual([])
      })

      it('should return empty array when the user has the placeholder avatar', async () => {
        const content = createUserPage(placeholder)
        const result = await habrHandler.resolve('https://habr.com/ru/users/alice/', content)

        expect(result).toEqual([])
      })

      it('should return empty array when the page has no card', async () => {
        const content = '<html><head><title>Habr</title></head></html>'
        const result = await habrHandler.resolve('https://habr.com/ru/users/alice/', content)

        expect(result).toEqual([])
      })

      it('should return empty array for the home page', async () => {
        const content = createUserPage(userAvatar)
        const result = await habrHandler.resolve('https://habr.com/ru/articles/', content)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should not return an author avatar when the hub card has no image', async () => {
        const hubCard = '<div class="tm-hub-card__avatar"><div class="tm-entity-image"></div></div>'
        const content = `${hubCard}${authorCard.trim()}`
        const result = await habrHandler.resolve('https://habr.com/ru/hubs/javascript/', content)

        expect(result).toEqual([])
      })

      it('should not read the user card on hub pages', async () => {
        const content = createUserPage(userAvatar)
        const result = await habrHandler.resolve('https://habr.com/ru/hubs/javascript/', content)

        expect(result).toEqual([])
      })
    })
  })
})
