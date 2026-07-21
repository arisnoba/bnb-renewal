import assert from 'node:assert/strict'
import test from 'node:test'

import { legacyCenterFromHostname, legacyCenterRoute } from './legacyCenterRoutes'

test('legacy center hostnames resolve with and without www', () => {
  assert.equal(legacyCenterFromHostname('baewoo.co.kr'), 'art')
  assert.equal(legacyCenterFromHostname('WWW.BAEWOO.KR'), 'exam')
  assert.equal(legacyCenterFromHostname('baewoo.me'), 'highteen')
  assert.equal(legacyCenterFromHostname('www.baewoo.net'), 'kids')
  assert.equal(legacyCenterFromHostname('baewoorun.co.kr'), 'avenue')
  assert.equal(legacyCenterFromHostname('example.com'), null)
})

test('legacy company links redirect to the matching center company section', () => {
  const route = legacyCenterRoute(
    new URL('https://baewoo.co.kr/web/bbs/content.php?co_id=parents'),
  )

  assert.equal(route?.center, 'art')
  assert.equal(route?.url.href, 'https://art.baewooenm.com/company#company-affiliates')
})

test('legacy routes also resolve after a domain-level redirect preserves the old path', () => {
  const route = legacyCenterRoute(
    new URL('https://kids.baewooenm.com/web/bbs/content.php?co_id=sisul'),
  )

  assert.equal(route?.url.href, 'https://kids.baewooenm.com/facilities')
})

test('legacy content ids map to current pages and section anchors', () => {
  const cases = [
    ['company', '/about'],
    ['cs_call', '/consult'],
    ['curi', '/curriculum'],
    ['curi03', '/curriculum'],
    ['curi04', '/curriculum'],
    ['edu01', '/curriculum'],
    ['edu02', '/curriculum'],
    ['edu03', '/curriculum'],
    ['enter01', '/admission#tuition'],
    ['enter02', '/admission#tuition'],
    ['enter03', '/admission#leave-completion'],
    ['enter04', '/admission#refund'],
    ['enterance', '/admission#procedure'],
    ['entertain', '/entertainment'],
    ['faq', '/faq'],
    ['grade01', '/grade-system#steps'],
    ['grade02', '/grade-system#criteria'],
    ['grade03', '/grade-system#cohorts'],
    ['grade04', '/grade-system'],
    ['greeting', '/company#company-message-title'],
    ['history', '/company#company-history-title'],
    ['identity', '/about'],
    ['location', '/map'],
    ['management', '/casting-system'],
    ['map', '/map'],
    ['parents', '/company#company-affiliates'],
    ['profile', '/profile-production'],
    ['sisul', '/facilities'],
    ['starcard', '/starcard'],
    ['systemintro', '/casting-system'],
    ['useguide', '/how-to-use'],
  ] as const

  for (const [coId, target] of cases) {
    const route = legacyCenterRoute(
      new URL(`https://baewoo.co.kr/web/bbs/content.php?co_id=${coId}`),
    )

    assert.equal(route?.url.href, `https://art.baewooenm.com${target}`)
  }
})

test('exam-only legacy content maps to current exam pages', () => {
  const cases = [
    ['Scholarship', '/admission#tuition'],
    ['exam_mng', '/management'],
    ['management', '/management'],
    ['new_sys01', '/how-to-use'],
    ['new_sys02', '/special-system#image-making'],
    ['new_sys03', '/special-system#education-support'],
    ['new_sys04', '/special-system#special-admission'],
    ['new_sys06', '/how-to-use'],
    ['new_sys07', '/how-to-use'],
    ['refund', '/admission#refund'],
  ] as const

  for (const [coId, target] of cases) {
    const route = legacyCenterRoute(
      new URL(`https://baewoo.kr/web/bbs/content.php?co_id=${coId}`),
    )

    assert.equal(route?.url.href, `https://exam.baewooenm.com${target}`)
  }
})

test('legacy board tables map to current archive and support pages', () => {
  const cases = [
    ['new_appear', '/casting-status'],
    ['new_audition', '/consult'],
    ['new_calendar', '/schedule'],
    ['new_calendar02', '/schedule'],
    ['new_casting', '/casting'],
    ['new_casting2', '/casting'],
    ['new_casting_bx', '/casting'],
    ['new_casting_enm', '/casting'],
    ['new_casting_img', '/casting'],
    ['new_counsel', '/consult'],
    ['new_direct2', '/direct-castings'],
    ['new_direct_bx', '/direct-castings'],
    ['new_direct_enm', '/direct-castings'],
    ['new_direct_img', '/direct-castings'],
    ['new_drama', '/screen-appearances'],
    ['new_hoogi', '/screen-appearances'],
    ['new_jehu', '/starcard'],
    ['new_notice', '/news'],
    ['new_profile', '/rookies'],
    ['new_shoot', '/artist-press'],
    ['new_specialclass', '/special-lecture'],
    ['new_starcard', '/starcard'],
  ] as const

  for (const [boTable, target] of cases) {
    const route = legacyCenterRoute(
      new URL(`https://baewoo.me/web/bbs/board.php?bo_table=${boTable}&wr_id=123`),
    )

    assert.equal(route?.url.href, `https://highteen.baewooenm.com${target}`)
  }
})

test('center-specific legacy result boards map to the corresponding current menu', () => {
  assert.equal(
    legacyCenterRoute(
      new URL('https://baewoo.kr/web/bbs/board.php?bo_table=new_hoogi&wr_id=10'),
    )?.url.href,
    'https://exam.baewooenm.com/passed-reviews',
  )
  assert.equal(
    legacyCenterRoute(
      new URL('https://baewoo.kr/web/bbs/board.php?bo_table=new_shoot&wr_id=20'),
    )?.url.href,
    'https://exam.baewooenm.com/passed-videos',
  )
  assert.equal(
    legacyCenterRoute(
      new URL('https://baewoo.kr/web/bbs/board.php?bo_table=victory10'),
    )?.url.href,
    'https://exam.baewooenm.com/university-results',
  )
  assert.equal(
    legacyCenterRoute(
      new URL('https://baewoo.kr/web/bbs/board.php?bo_table=victory30'),
    )?.url.href,
    'https://exam.baewooenm.com/arts-high-results',
  )
})

test('legacy html routes and old domain roots map to current center pages', () => {
  assert.equal(
    legacyCenterRoute(
      new URL('https://baewoo.net/web/html/teacher_list.php?mid=teacher'),
    )?.url.href,
    'https://kids.baewooenm.com/teachers',
  )
  assert.equal(
    legacyCenterRoute(
      new URL('https://baewoo.net/web/html/manage_list.php?mid=entertain'),
    )?.url.href,
    'https://kids.baewooenm.com/entertainment',
  )
  assert.equal(
    legacyCenterRoute(new URL('https://baewoo.net/web/html/class_curriculum.php'))?.url.href,
    'https://kids.baewooenm.com/curriculum',
  )
  assert.equal(
    legacyCenterRoute(new URL('https://baewoo.net/web/index.php'))?.url.href,
    'https://kids.baewooenm.com/',
  )
})

test('unknown legacy paths and unrelated hosts are not redirected', () => {
  assert.equal(legacyCenterRoute(new URL('https://baewoo.co.kr/web/unknown.php')), null)
  assert.equal(
    legacyCenterRoute(
      new URL('https://example.com/web/bbs/content.php?co_id=parents'),
    ),
    null,
  )
  assert.equal(legacyCenterRoute(new URL('https://art.baewooenm.com/company')), null)
})
