import { describe, expect, it } from 'bun:test'
import { habrHandler } from './habr.js'

const hubIcon =
  '//habrastorage.org/getpro/habr/hub/2b3/99b/964/2b399b964d456f3ad1bfddc0346b60d4.png'
const userAvatar =
  '//habrastorage.org/getpro/habr/avatars/353/8eb/088/3538eb088997a0fd418ce85841dd0996.png'
const authorAvatar =
  '//habrastorage.org/r/w48/getpro/habr/avatars/812/2ca/59d/8122ca59d6f9b159564625bfde4e35cf.jpeg'
const companyLogo =
  '//habrastorage.org/getpro/habr/company/b02/d9b/1d4/b02d9b1d4a6e64ff069e2ab32fdedae2.png'
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

const createCompanyPage = (src: string): string => {
  return `
    <div
      class="company-card tm-company-profile-card__info"
      data-v-a85a3e89
    ><div
      class="header"
      data-v-a85a3e89
    ><a
      href="/ru/companies/example/profile/"
      class="avatar"
      data-v-a85a3e89
    ><div
      class="tm-entity-image"
      data-v-a85a3e89
    ><img
      alt=""
      class="tm-entity-image__pic"
      height="48"
      src="${src}"
      width="48"
    ></div></a></div></div>
    ${authorCard}
  `
}

describe('habrHandler', () => {
  describe('match', () => {
    it('should match hub pages', () => {
      expect(habrHandler.match('https://habr.com/ru/hubs/javascript/')).toBe(true)
    })

    it('should not match the article list', () => {
      expect(habrHandler.match('https://habr.com/ru/articles/')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the hub icon from the hub card', async () => {
        const content = createHubPage(hubIcon)
        const result = await habrHandler.resolve('https://habr.com/ru/hubs/javascript/', content)
        const expected = [{ uri: hubIcon }]

        expect(result).toEqual(expected)
      })

      it('should return the hub icon when the hub card carries another class', async () => {
        const content = createHubPage(hubIcon).replace(
          'class="tm-hub-card__avatar"',
          'class="tm-hub-card__avatar tm-hub-card__avatar_small"',
        )
        const result = await habrHandler.resolve('https://habr.com/ru/hubs/javascript/', content)
        const expected = [{ uri: hubIcon }]

        expect(result).toEqual(expected)
      })

      it('should return the user avatar from the user card', async () => {
        const content = createUserPage(userAvatar)
        const result = await habrHandler.resolve('https://habr.com/ru/users/alice/', content)
        const expected = [{ uri: userAvatar }]

        expect(result).toEqual(expected)
      })

      it('should return the company logo from the company card', async () => {
        const value = 'https://habr.com/ru/companies/example/articles/'
        const content = createCompanyPage(companyLogo)
        const result = await habrHandler.resolve(value, content)
        const expected = [{ uri: companyLogo }]

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
