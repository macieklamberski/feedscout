import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShinobiUrl = { kind: 'blog'; blog: string }

// Ninja Blog serves its blogs as subdomains of every one of these domains.
const domains = [
  '3rin.net',
  '7narabe.net',
  '99ing.net',
  'anime-cosplay.com',
  'anime-festa.com',
  'anime-japan.net',
  'anime-life.com',
  'anime-movie.net',
  'anime-navi.net',
  'anime-ranking.net',
  'anime-report.com',
  'anime-voice.com',
  'animech.net',
  'animegoe.com',
  'asukablog.net',
  'atgj.net',
  'bangalog.com',
  'bangofan.com',
  'bijual.com',
  'blog-fps.com',
  'blog-mmo.com',
  'blog-rpg.com',
  'blog-sim.com',
  'blog.shinobi.jp',
  'cooklog.net',
  'cos-live.com',
  'cos-mania.net',
  'coslife.net',
  'cosplay-festa.com',
  'cosplay-japan.net',
  'cosplay-navi.com',
  'cosplay-report.com',
  'dankanoko.com',
  'darumasangakoronda.com',
  'dou-jin.com',
  'edoblog.net',
  'en-grey.com',
  'fukuwarai.net',
  'futatsutomoe.com',
  'game-ss.com',
  'game-waza.net',
  'gg-blog.com',
  'gjgd.net',
  'gjpw.net',
  'go-th.net',
  'guhaw.com',
  'hyakunin-isshu.net',
  'ichi-matsu.net',
  'iga-log.com',
  'iku4.com',
  'indiesj.com',
  'janken-pon.net',
  'kagome-kagome.com',
  'kai-seki.net',
  'kakuren-bo.com',
  'kamakurablog.com',
  'ko-me.com',
  'komochijima.com',
  'koushijima.com',
  'kuizu.net',
  'kurofuku.com',
  'ky-3.net',
  'kyotolog.net',
  'mamagoto.com',
  'manga-cosplay.com',
  'mangadou.net',
  'mangalog.com',
  'misujitate.com',
  'mmo-fps.com',
  'moe-cosplay.com',
  'nari-kiri.com',
  'ni-3.net',
  'ni-moe.com',
  'no-mania.com',
  'o-oi.net',
  'omaww.net',
  'or-hell.com',
  'p-kin.net',
  'pazru.com',
  'ria10.com',
  'ryorika.com',
  'sakeblog.net',
  'sankuzushi.com',
  'satsumablog.com',
  'sekigaharablog.com',
  'side-story.net',
  'sugo-roku.com',
  'syoyu.net',
  'take-uma.net',
  'tosalog.com',
  'tou3.com',
  'tsuyushiba.com',
  'tyoshublog.com',
  'v-kei.net',
  'visualfan.com',
  'visualshoxx.net',
  'wa-syo-ku.com',
  'ya-gasuri.com',
  'yamatoblog.net',
  'yotsumeyui.com',
  'zoku-sei.com',
]

// A blog serves one feed under every path below: RSS 2.0 at /RSS/, /RSS/200/ and /OPML, RSS 0.91 at
// /RSS/091/, RSS 1.0 at /RSS/100/ and Atom at /ATOM/. The server ignores what follows a feed path,
// so /RSS/200/RSS is the RSS 2.0 feed too.
const feeds = definePlatformFeeds(
  [
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/', format: 'rss' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/ATOM/', format: 'atom' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/200/', format: 'rss' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/RSS/', format: 'rss' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/200/RSS/', format: 'rss' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/OPML', format: 'rss' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/091/', format: 'rss' },
    {
      key: 'shinobi:posts',
      template: '{scheme}://{blog}.{domain}/RSS/091/index.rdf',
      format: 'rss',
    },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/100/', format: 'rdf' },
    { key: 'shinobi:posts', template: '{scheme}://{blog}.{domain}/RSS/100/RSS/', format: 'rdf' },
  ],
  { domains },
)

export const parseShinobiUrl = (url: string): ShinobiUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const shinobiHandler: PlatformHandler = {
  match: (url) => {
    return parseShinobiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseShinobiUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const params = { blog: parsed.blog }

    return [
      page.getFeedEntry('shinobi:posts', params, 'rss'),
      page.getFeedEntry('shinobi:posts', params, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
