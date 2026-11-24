import { describe, expect, it } from 'bun:test'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { defaultPlatformOptions } from '../defaults.js'
import { bigCartelHandler } from './bigCartel.js'
import { bigcommerceHandler } from './bigcommerce.js'
import { blogspotHandler } from './blogspot.js'
import { castopodHandler } from './castopod.js'
import { chambermasterHandler } from './chambermaster.js'
import { civicplusHandler } from './civicplus.js'
import { colorMeShopHandler } from './colorMeShop.js'
import { drupalHandler } from './drupal.js'
import { eklablogHandler } from './eklablog.js'
import { estrankyHandler } from './estranky.js'
import { fluxbbHandler } from './fluxbb.js'
import { forumotionHandler } from './forumotion.js'
import { friendicaHandler } from './friendica.js'
import { gcsWebHandler } from './gcsWeb.js'
import { giteaHandler } from './gitea.js'
import { gitlabHandler } from './gitlab.js'
import { goopeHandler } from './goope.js'
import { instatusHandler } from './instatus.js'
import { jimdoHandler } from './jimdo.js'
import { jiraHandler } from './jira.js'
import { lagetHandler } from './laget.js'
import { legistarHandler } from './legistar.js'
import { mastodonHandler } from './mastodon.js'
import { misskeyHandler } from './misskey.js'
import { mybbHandler } from './mybb.js'
import { nethouseHandler } from './nethouse.js'
import { ningHandler } from './ning.js'
import { noticeableHandler } from './noticeable.js'
import { ocnkHandler } from './ocnk.js'
import { odooHandler } from './odoo.js'
import { ojsHandler } from './ojs.js'
import { peertubeHandler } from './peertube.js'
import { phpbbHandler } from './phpbb.js'
import { podloveHandler } from './podlove.js'
import { powerpressHandler } from './powerpress.js'
import { proboardsHandler } from './proboards.js'
import { publicInboxHandler } from './publicInbox.js'
import { shaarliHandler } from './shaarli.js'
import { shinobiHandler } from './shinobi.js'
import { shopifyHandler } from './shopify.js'
import { skycmsHandler } from './skycms.js'
import { smfHandler } from './smf.js'
import { sportsregionsHandler } from './sportsregions.js'
import { statuspageHandler } from './statuspage.js'
import { svbtleHandler } from './svbtle.js'
import { textpatternHandler } from './textpattern.js'
import { ucozHandler } from './ucoz.js'
import { webnodeHandler } from './webnode.js'
import { wikidotHandler } from './wikidot.js'
import { wildApricotHandler } from './wildApricot.js'
import { wixHandler } from './wix.js'

// Every path shape is tried against every content-matched handler, because a
// handler that matches a path it cannot resolve has a `match` that drifted from
// its `resolve`.
const hosts = ['https://example.org', 'https://gitlab.com']
const paths = [
  '/',
  '/about',
  '/explore',
  '/admin',
  '/-',
  '/-/profile',
  '/@alice',
  '/@alice/media',
  '/@alice/with_replies',
  '/@alice/tagged/news',
  '/tags/news',
  '/c/programming',
  '/a/alice',
  '/u/alice',
  '/people/8d87a9403ee7013c',
  '/public/alice',
  '/t/a-topic/12',
  '/top/weekly',
  '/user/alice',
  '/user/alice/shelf/to-read',
  '/users/alice',
  '/users/alice/statuses/1',
  '/profile/alice',
  '/channel/alice',
  '/channels/alice',
  '/group/project',
  '/group/project/-/issues',
  '/group/subgroup/project/-/commits/main',
  '/alice',
  '/alice/project',
  '/alice/project/issues',
  '/p/12345',
  '/2503/a-page.html',
  '/display/SPACE',
  '/wiki/display/SPACE',
  '/wiki/spaces/SPACE/overview',
  '/projects/KEY',
  '/browse/KEY-1',
  '/jira/projects/KEY',
  '/blog',
  '/blog/news-1/a-post-2',
  '/events',
  '/blogs/news',
  '/blogs/news/a-post',
  '/category/1/general',
  '/topic/1/a-topic',
  '/f/general.1/',
  '/forums/general.1/',
  '/node/1',
  '/taxonomy/term/1',
  '/status',
  '/cgi-bin/koha/opac-search.pl?q=news',
  '/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber=1',
  '/LegislationDetail.aspx?ID=1&GUID=00000000-0000-0000-0000-000000000000',
  '/solrsearch/index/search/searchtype/collection/id/1',
]

type Case = [string, PlatformHandler, string, Headers?]

const cases: Array<Case> = [
  [
    'bigCartel',
    bigCartelHandler,
    '',
    new Headers({ 'x-frame-options': 'ALLOW-FROM https://my.bigcartel.com' }),
  ],
  ['bigcommerce', bigcommerceHandler, '', new Headers({ 'set-cookie': 'SHOP_SESSION_TOKEN=abc' })],
  [
    'blogspot',
    blogspotHandler,
    '<script src="https://www.blogger.com/static/v1/widgets/851759228-widgets.js"></script>',
  ],
  ['castopod', castopodHandler, '<link href="/themes/colors">'],
  ['chambermaster', chambermasterHandler, '', new Headers({ 'x-source': 'cmdotnetJYPM06' })],
  [
    'civicplus',
    civicplusHandler,
    '<script src="/Areas/Layout/Assets/Scripts/Search.js"></script><input id="pageModuleID" value="1">',
  ],
  [
    'colorMeShop',
    colorMeShopHandler,
    '',
    new Headers({ 'set-cookie': 'colorme_PHPSESSID=abc; Path=/' }),
  ],
  ['drupal', drupalHandler, '<meta name="generator" content="Drupal 10 (https://www.drupal.org)">'],
  [
    'eklablog',
    eklablogHandler,
    '<script src="//connect.eklablog.com/ping/123456/isConnected" async></script>',
  ],
  ['estranky', estrankyHandler, '<script src="https://s3c.estranky.cz/js/ui.js"></script>'],
  ['fluxbb', fluxbbHandler, '<div id="brdmenu"></div><div id="brdfooter"></div>'],
  [
    'forumotion',
    forumotionHandler,
    '<div id="phpbb"></div><script>_userdata["session_logged_in"] = 0;</script>',
  ],
  ['friendica', friendicaHandler, '<meta name="generator" content="Friendica 2026.05">'],
  ['gcsWeb', gcsWebHandler, '<link href="/sites/g/files/knoqqb12345/files/css/css_abc.css">'],
  ['gitea', giteaHandler, '', new Headers({ 'set-cookie': 'i_like_gitea=abc; Path=/' })],
  [
    'gitlab',
    gitlabHandler,
    '<script>window.gon={};</script><script src="/assets/webpack/main.chunk.js"></script>',
  ],
  ['goope', goopeHandler, '<img src="//r.goope.jp/qr/example">'],
  [
    'instatus',
    instatusHandler,
    '',
    new Headers({ 'x-matched-path': '/[lang]/[url]/[type]/[userId]' }),
  ],
  ['jimdo', jimdoHandler, '', new Headers({ 'x-jimdo-wid': 's1c8254714bfd7968' })],
  [
    'jira',
    jiraHandler,
    '<meta name="ajs-base-url" content="https://example.org"><meta name="application-name" content="JIRA">',
  ],
  [
    'laget',
    lagetHandler,
    '<link rel="stylesheet" href="https://g-content.laget.se/Public/Css/site-277b6ed876.css">',
  ],
  [
    'legistar',
    legistarHandler,
    '',
    new Headers({
      'set-cookie': 'BIGipServerinsite.legistar.com_443=908198666.47873.0000; path=/',
    }),
  ],
  ['mastodon', mastodonHandler, '<div class="app-holder" id="mastodon"></div>'],
  ['misskey', misskeyHandler, '<script type="application/json" id="misskey_meta">{}</script>'],
  ['mybb', mybbHandler, '', new Headers({ 'set-cookie': 'mybb[lastvisit]=1790000000; path=/' })],
  ['nethouse', nethouseHandler, '', new Headers({ 'x-generator': 'nethouse' })],
  [
    'ning',
    ningHandler,
    '<link href="https://static.ning.com/socialnetworkmain/widgets/index/css/common.min.css">',
  ],
  [
    'noticeable',
    noticeableHandler,
    '<link href="https://assets.noticeable.news/templates/noticeone/css/main.min.css">',
  ],
  ['ocnk', ocnkHandler, '<script src="/res/touch003/js/pack/ocnk-min.js"></script>'],
  [
    'odoo',
    odooHandler,
    '',
    new Headers([
      ['set-cookie', 'frontend_lang=en_US; Path=/'],
      ['set-cookie', 'session_id=abc; Path=/'],
    ]),
  ],
  [
    'ojs',
    ojsHandler,
    '<meta name="generator" content="Open Journal Systems 3.3.0.20"><link rel="stylesheet" href="https://example.org/index.php/journal/$$$call$$$/page/page/css?name=stylesheet">',
  ],
  ['peertube', peertubeHandler, '', new Headers({ 'x-powered-by': 'PeerTube' })],
  ['phpbb', phpbbHandler, '<body id="phpbb">'],
  [
    'podlove',
    podloveHandler,
    '<link href="/wp-content/plugins/podlove-podcasting-plugin-for-wordpress/css/frontend.css"><link rel="alternate" title="Podcast Feed: Show (MP3)" href="/feed/mp3/">',
  ],
  ['powerpress', powerpressHandler, '<script>function powerpress_pinw(pinw_url){}</script>'],
  [
    'proboards',
    proboardsHandler,
    '<script src="//storage.proboards.com/forum/js/proboards.combined_1144.js"></script>',
  ],
  [
    'publicInbox',
    publicInboxHandler,
    '<a href="_/text/help/">help</a><a href="_/text/color/">color</a>',
  ],
  ['shaarli', shaarliHandler, '<div id="shaarli-menu"></div>'],
  ['shinobi', shinobiHandler, '<img src="/admin/img/blogheader_logo.png">'],
  ['shopify', shopifyHandler, '', new Headers({ 'powered-by': 'Shopify' })],
  [
    'skycms',
    skycmsHandler,
    '<link href="/cms/public/image/default/bip_v4/favicon/a.png"><a href="/3467/lista-kanalow-rss.html">',
  ],
  [
    'smf',
    smfHandler,
    '<script>var smf_scripturl = "https://example.org/index.php";var smf_theme_url = "";</script>',
  ],
  [
    'sportsregions',
    sportsregionsHandler,
    '<a href="https://www.sportsregions.fr/signaler-un-contenu-inapproprie">Signaler</a>',
  ],
  ['statuspage', statuspageHandler, '', new Headers({ 'x-statuspage-version': '5a16926c' })],
  ['svbtle', svbtleHandler, '<link href="https://lightning.svbtle.com/cargo/blog.css">'],
  ['textpattern', textpatternHandler, '<meta name="generator" content="Textpattern CMS">'],
  ['ucoz', ucozHandler, '', new Headers({ 'set-cookie': '0exampleuCoz=; path=/' })],
  [
    'webnode',
    webnodeHandler,
    '<script src="https://d11bh4d8fhuq47.cloudfront.net/_system/client/js/frontend.js"></script>',
  ],
  ['wikidot', wikidotHandler, '<a onclick="WIKIDOT.page.listeners.editClick()">Edit</a>'],
  [
    'wildApricot',
    wildApricotHandler,
    '<a id="FunctionalBlock1_ctl00_blogPostList_rssLink" href="/news/RSS">RSS</a>',
    new Headers({ 'x-lb-server': 'ip-10-11-40-107.wa.local' }),
  ],
  ['wix', wixHandler, '', new Headers({ 'x-wix-request-id': '1790000000.1' })],
]

// A tuple row without headers would get the done callback in their place under it.each, so the
// rows go in as objects.
const rows = cases.map(([platform, handler, value, headers]) => {
  return { platform, handler, value, headers }
})

describe('platform handler invariant', () => {
  it.each(rows)(
    'should resolve a feed wherever $platform matches',
    async ({ handler, value, headers }) => {
      const violations: Array<string> = []
      let matched = 0

      for (const host of hosts) {
        for (const path of paths) {
          const url = `${host}${path}`

          if (!handler.match(url, value, headers)) {
            continue
          }

          matched++

          const uris = await handler.resolve(url, value, headers)

          if (uris.length === 0) {
            violations.push(url)
          }
        }
      }

      // A marker the handler no longer reads would pass every path vacuously.
      expect(matched).toBeGreaterThan(0)
      expect(violations).toEqual([])
    },
  )

  // Two handlers matching one page leave the result to their order in the defaults. Only the
  // neutral host is tried, since gitlab.com never serves another platform's markup.
  it.each(rows)(
    'should match $platform pages with no other default handler',
    ({ value, headers }) => {
      const violations: Array<string> = []

      for (const path of paths) {
        const url = `https://example.org${path}`
        const matching = defaultPlatformOptions.handlers.filter((handler) => {
          return handler.match(url, value, headers)
        })

        if (matching.length > 1) {
          violations.push(url)
        }
      }

      expect(violations).toEqual([])
    },
  )

  // The Platform method tries a handler that takes the URL alone ahead of the marker ones, which
  // only holds while no handler takes a host it does not own.
  it('should match no page of an unknown host without content and headers', () => {
    const violations: Array<string> = []

    for (const path of paths) {
      const url = `https://example.org${path}`

      if (defaultPlatformOptions.handlers.some((handler) => handler.match(url))) {
        violations.push(url)
      }
    }

    expect(violations).toEqual([])
  })
})
