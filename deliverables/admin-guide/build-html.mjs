import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { marked } from 'marked'

const guideDirectory = dirname(fileURLToPath(import.meta.url))
const markdownPath = join(guideDirectory, '관리자-사용-가이드.md')
const outputPath = join(guideDirectory, '관리자-사용-가이드.html')

const [markdown, stylesheet, clientScript] = await Promise.all([
  readFile(markdownPath, 'utf8'),
  readFile(join(guideDirectory, 'guide.css'), 'utf8'),
  readFile(join(guideDirectory, 'guide.js'), 'utf8'),
])

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const stripHtml = (value) =>
  value
    .replace(/<[^>]+>/g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#039;', "'")

const createSlugger = () => {
  const usedSlugs = new Map()

  return (value) => {
    const baseSlug = stripHtml(value)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const count = usedSlugs.get(baseSlug) ?? 0
    usedSlugs.set(baseSlug, count + 1)

    return count === 0 ? baseSlug : `${baseSlug}-${count}`
  }
}

const getMetadataValue = (label) => {
  const match = markdown.match(new RegExp(`^> ${label}: (.+)$`, 'm'))
  return match?.[1]?.replaceAll('`', '') ?? ''
}

const title = markdown.match(/^# (.+)$/m)?.[1] ?? '관리자 사용 가이드'
const version = getMetadataValue('문서 버전')
const updatedAt = getMetadataValue('최종 갱신일')
const audience = getMetadataValue('대상')
const adminUrl = getMetadataValue('관리자 주소')

let clientMarkdown = markdown
  .replace(/^# .+\n+(?:>.*\n?)+\n*/m, '')
  .replace(/\n본문의 이미지 위치에는[\s\S]*?```text\n[\s\S]*?```\n/, '\n')
  .replace(/\n## 목차\n[\s\S]*?(?=\n---\n\n## 1\.)/, '')
  .replace('\n---\n\n## 1.', '\n\n## 1.')
  .replace(/\n## 17\. 화면 캡처 목록[\s\S]*$/, '')

marked.setOptions({
  gfm: true,
  breaks: false,
})

let articleHtml = marked.parse(clientMarkdown)
const slugHeading = createSlugger()
const navigationItems = []

articleHtml = articleHtml.replace(
  /<h([2-6])>([\s\S]*?)<\/h\1>/g,
  (_, level, content) => {
    const id = slugHeading(content)
    const label = stripHtml(content)

    if (level === '2' && /^\d+\./.test(label)) {
      navigationItems.push({ id, label })
    }

    return `<h${level} id="${escapeHtml(id)}" tabindex="-1">${content}<a class="heading-link" href="#${escapeHtml(id)}" aria-label="${escapeHtml(label)} 바로가기">#</a></h${level}>`
  },
)

articleHtml = articleHtml.replace(
  /<p><img src="\.\/images\/([^"?]+)" alt="([^"]*)"><\/p>/g,
  (_, filename, alt) => {
    const number = filename.match(/^(\d+)/)?.[1] ?? '--'
    const safeFilename = escapeHtml(filename)
    const safeAlt = escapeHtml(alt)

    return `
      <figure class="guide-shot" data-guide-shot>
        <div class="guide-shot__frame">
          <img
            class="guide-shot__image"
            data-guide-image
            data-src="./images/${safeFilename}"
            alt="${safeAlt}"
            loading="lazy"
            decoding="async"
          >
          <div class="guide-shot__placeholder" data-guide-placeholder aria-hidden="true">
            <div class="dummy-browser">
              <div class="dummy-browser__bar">
                <span></span><span></span><span></span>
                <div class="dummy-browser__address">/admin</div>
              </div>
              <div class="dummy-admin">
                <div class="dummy-admin__rail">
                  <div class="dummy-admin__brand">B</div>
                  <i></i><i></i><i></i><i></i><i></i>
                </div>
                <div class="dummy-admin__content">
                  <div class="dummy-admin__eyebrow">SCREEN ${escapeHtml(number)}</div>
                  <div class="dummy-admin__title">${safeAlt}</div>
                  <div class="dummy-admin__layout">
                    <div class="dummy-admin__main">
                      <b></b><b></b><b></b>
                      <div class="dummy-admin__table"><i></i><i></i><i></i><i></i></div>
                    </div>
                    <div class="dummy-admin__side"><b></b><i></i><i></i><i></i></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="guide-shot__notice">
              <span>캡처 이미지 자리</span>
              <code>images/${safeFilename}</code>
            </div>
          </div>
        </div>
        <figcaption><span>${escapeHtml(number)}</span>${safeAlt}</figcaption>
      </figure>`
  },
)

const navigationHtml = navigationItems
  .map(({ id, label }, index) => {
    const number = label.match(/^\d+/)?.[0] ?? String(index + 1).padStart(2, '0')
    const shortLabel = label.replace(/^\d+\.\s*/, '')

    return `<li><a href="#${escapeHtml(id)}" data-guide-nav><span>${escapeHtml(number.padStart(2, '0'))}</span>${escapeHtml(shortLabel)}</a></li>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="description" content="배우앤배움 통합 사이트 운영자를 위한 관리자 사용 가이드">
  <title>${escapeHtml(title)}</title>
  <style>
${stylesheet}
  </style>
</head>
<body>
  <a class="skip-link" href="#guide-content">본문으로 바로가기</a>

  <header class="guide-hero">
    <div class="guide-hero__top">
      <a class="guide-brand" href="#top" aria-label="가이드 처음으로">
        <span>BNB</span>
        <strong>OPERATOR MANUAL</strong>
      </a>
      <div class="guide-hero__actions">
        <span class="image-status" data-image-status>이미지 확인 중</span>
        <button class="print-button" type="button" data-print-guide>PDF로 저장</button>
      </div>
    </div>

    <div class="guide-hero__body" id="top">
      <p class="guide-kicker">PAYLOAD CMS · ADMIN GUIDE</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="guide-summary">콘텐츠 등록부터 공개 확인까지, 실제 운영 흐름을 한 문서에서 빠르게 찾아보세요.</p>
      <dl class="guide-meta">
        <div><dt>대상</dt><dd>${escapeHtml(audience)}</dd></div>
        <div><dt>관리자</dt><dd>${escapeHtml(adminUrl)}</dd></div>
        <div><dt>버전</dt><dd>${escapeHtml(version)}</dd></div>
        <div><dt>갱신</dt><dd>${escapeHtml(updatedAt)}</dd></div>
      </dl>
    </div>

    <div class="guide-hero__rule"><span></span></div>
  </header>

  <div class="guide-shell">
    <aside class="guide-rail" aria-label="가이드 목차">
      <div class="guide-rail__sticky">
        <p class="guide-rail__label">CONTENTS</p>
        <nav>
          <ol>
${navigationHtml}
          </ol>
        </nav>
        <div class="guide-rail__help">
          <strong>화면이 다른가요?</strong>
          <p>계정 권한과 담당 센터에 따라 메뉴가 다르게 보일 수 있습니다.</p>
        </div>
      </div>
    </aside>

    <main class="guide-content" id="guide-content">
      <article class="guide-article">
${articleHtml}
      </article>

      <footer class="guide-footer">
        <span>BNB OPERATOR MANUAL</span>
        <p>${escapeHtml(version)} · ${escapeHtml(updatedAt)}</p>
      </footer>
    </main>
  </div>

  <button class="mobile-contents" type="button" data-mobile-contents aria-expanded="false" aria-controls="mobile-navigation">목차</button>
  <div class="mobile-navigation" id="mobile-navigation" data-mobile-navigation hidden>
    <div class="mobile-navigation__header">
      <strong>목차</strong>
      <button type="button" data-mobile-close aria-label="목차 닫기">닫기</button>
    </div>
    <nav aria-label="모바일 가이드 목차">
      <ol>
${navigationHtml}
      </ol>
    </nav>
  </div>

  <script>
${clientScript.replaceAll('</script>', '<\\/script>')}
  </script>
</body>
</html>
`

await writeFile(outputPath, html)

console.log(`관리자 가이드 HTML 생성 완료: ${outputPath}`)
