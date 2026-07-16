(() => {
  const shots = [...document.querySelectorAll('[data-guide-shot]')]
  const status = document.querySelector('[data-image-status]')
  let loadedImages = 0

  const updateImageStatus = () => {
    const placeholderCount = shots.length - loadedImages

    if (!status) return

    if (placeholderCount === 0) {
      status.textContent = `화면 이미지 ${loadedImages}개 연결됨`
      status.classList.add('is-complete')
      return
    }

    status.textContent = `더미 이미지 ${placeholderCount}개 · 실제 이미지 ${loadedImages}개`
  }

  shots.forEach((shot) => {
    const image = shot.querySelector('[data-guide-image]')

    if (!image) return

    image.addEventListener(
      'load',
      () => {
        loadedImages += 1
        shot.classList.add('has-image')
        updateImageStatus()
      },
      { once: true },
    )

    image.addEventListener('error', updateImageStatus, { once: true })
    image.src = image.dataset.src
  })

  updateImageStatus()

  const navigationLinks = [...document.querySelectorAll('.guide-rail [data-guide-nav]')]
  const sections = navigationLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean)

  const setActiveSection = (id) => {
    navigationLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`
      link.classList.toggle('is-active', isActive)

      if (isActive) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
  }

  if (sections.length > 0) {
    let isScheduled = false

    const updateActiveSection = () => {
      const currentSection = [...sections]
        .reverse()
        .find((section) => section.getBoundingClientRect().top <= 160) ?? sections[0]

      setActiveSection(currentSection.id)
      isScheduled = false
    }

    window.addEventListener(
      'scroll',
      () => {
        if (isScheduled) return

        isScheduled = true
        window.requestAnimationFrame(updateActiveSection)
      },
      { passive: true },
    )

    updateActiveSection()
  }

  document.querySelector('[data-print-guide]')?.addEventListener('click', () => window.print())

  const mobileButton = document.querySelector('[data-mobile-contents]')
  const mobileNavigation = document.querySelector('[data-mobile-navigation]')
  const mobileClose = document.querySelector('[data-mobile-close]')

  const setMobileNavigation = (isOpen) => {
    if (!mobileButton || !mobileNavigation) return

    mobileNavigation.hidden = !isOpen
    mobileButton.setAttribute('aria-expanded', String(isOpen))
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (isOpen) mobileNavigation.querySelector('a')?.focus()
    else mobileButton.focus()
  }

  mobileButton?.addEventListener('click', () => setMobileNavigation(true))
  mobileClose?.addEventListener('click', () => setMobileNavigation(false))
  mobileNavigation?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileNavigation(false))
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileNavigation && !mobileNavigation.hidden) {
      setMobileNavigation(false)
    }
  })
})()
