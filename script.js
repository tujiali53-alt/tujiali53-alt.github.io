(() => {
  const root = document.documentElement;
  const page = document.body.dataset.page;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;
  const loader = document.querySelector('.page-loader');
  const loaderBar = loader?.querySelector('[role="progressbar"]');
  const loaderPercent = loader?.querySelector('[data-loader-percent]');
  try {
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme) root.dataset.theme = savedTheme;
  } catch {
    // The default theme also works when storage is unavailable.
  }

  const syncMotionState = () => root.classList.toggle('motion-paused', document.hidden);
  document.addEventListener('visibilitychange', syncMotionState, { passive: true });
  syncMotionState();

  document.querySelectorAll(`[data-nav="${page}"]`).forEach(link => link.classList.add('is-active'));

  const topbar = document.querySelector('.topbar');
  const updateTopbar = () => topbar?.classList.toggle('is-scrolled', window.scrollY > 16);
  updateTopbar();
  window.addEventListener('scroll', updateTopbar, { passive: true });

  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('portfolio-theme', next);
    } catch {
      // The theme still applies to the current page.
    }
  });

  const aboutCalendar = document.querySelector('[data-about-calendar]');
  if (aboutCalendar) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const pad = value => String(value).padStart(2, '0');
    const localDate = `${year}-${pad(month + 1)}-${pad(day)}`;
    const weekdayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = aboutCalendar.querySelector('[data-calendar-grid]');

    aboutCalendar.querySelector('[data-calendar-year]').textContent = String(year);
    aboutCalendar.querySelector('[data-calendar-month]').textContent = pad(month + 1);
    aboutCalendar.querySelector('[data-calendar-day]').textContent = pad(day);
    aboutCalendar.querySelector('[data-calendar-weekday]').textContent = weekdayNames[now.getDay()];
    aboutCalendar.querySelector('[data-calendar-full-date]').textContent = `${year}年${month + 1}月${day}日`;
    const dateNode = aboutCalendar.querySelector('[data-calendar-date]');
    dateNode.dateTime = localDate;

    const calendarFragment = document.createDocumentFragment();
    for (let cell = 0; cell < 42; cell += 1) {
      const dateNumber = cell - firstDayOffset + 1;
      const dateCell = document.createElement('span');
      if (dateNumber < 1 || dateNumber > daysInMonth) {
        dateCell.className = 'is-muted';
        dateCell.setAttribute('aria-hidden', 'true');
      } else {
        dateCell.textContent = String(dateNumber);
        dateCell.setAttribute('aria-label', `${month + 1}月${dateNumber}日`);
        if (dateNumber === day) {
          dateCell.className = 'is-today';
          dateCell.setAttribute('aria-current', 'date');
        }
      }
      calendarFragment.appendChild(dateCell);
    }
    grid?.replaceChildren(calendarFragment);
  }

  const aboutHero = document.querySelector('.about-hero');
  const aboutIntro = document.querySelector('.about-intro');
  if ((aboutHero || aboutIntro) && window.gsap) {
    const gsap = window.gsap;
    const CustomEase = window.CustomEase;
    if (CustomEase) {
      gsap.registerPlugin(CustomEase);
      CustomEase.create('aboutSoft', '0.22,1,0.36,1');
      CustomEase.create('aboutBuoyant', '0.17,1.4,0.36,1');
    }
    const aboutEase = CustomEase ? 'aboutSoft' : 'power3.out';
    const buoyantEase = CustomEase ? 'aboutBuoyant' : 'back.out(1.7)';
    const aboutMedia = gsap.matchMedia();

    aboutMedia.add({
      allowMotion: '(prefers-reduced-motion: no-preference)',
      finePointer: '(pointer: fine)'
    }, context => {
      const { allowMotion, finePointer } = context.conditions;
      const cleanup = [];

      if (aboutHero && allowMotion) {
        const entranceTargets = [
          ...aboutHero.querySelectorAll('.about-hero-copy > *'),
          aboutHero.querySelector('.about-calendar')
        ].filter(Boolean);
        gsap.set(entranceTargets, { autoAlpha: 0, y: 28 });

        const revealHero = () => {
          gsap.to(entranceTargets, {
            autoAlpha: 1,
            y: 0,
            duration: .92,
            stagger: .11,
            ease: aboutEase,
            overwrite: 'auto'
          });
          gsap.from(aboutHero.querySelectorAll('.about-calendar-grid span:not(.is-muted)'), {
            autoAlpha: 0,
            y: 7,
            duration: .42,
            stagger: { amount: .32, from: 'random' },
            delay: .58,
            ease: 'power2.out'
          });
          gsap.fromTo(aboutHero.querySelector('.about-hero-bg'),
            { scale: 1.035 },
            { scale: 1, duration: 1.5, ease: aboutEase }
          );
        };

        let revealTimer = 0;
        const scheduleReveal = () => { revealTimer = window.setTimeout(revealHero, 520); };
        if (document.readyState === 'complete') scheduleReveal();
        else window.addEventListener('load', scheduleReveal, { once: true });
        cleanup.push(() => {
          window.clearTimeout(revealTimer);
          window.removeEventListener('load', scheduleReveal);
          gsap.killTweensOf(entranceTargets);
        });
      }

      if (aboutHero && allowMotion && finePointer) {
        const focusTargets = [...aboutHero.querySelectorAll('[data-about-focus]')];
        const heroBubbles = [...aboutHero.querySelectorAll('.about-water-bubbles i')];
        const bubbleScaleTos = heroBubbles.map(bubble => gsap.quickTo(bubble, 'scale', { duration: .38, ease: aboutEase }));
        let bubbleMetrics = [];
        let heroRect = aboutHero.getBoundingClientRect();
        let activeFocus = null;

        const measureHero = () => {
          heroRect = aboutHero.getBoundingClientRect();
          bubbleMetrics = heroBubbles.map(bubble => ({
            centerX: bubble.offsetLeft + bubble.offsetWidth / 2,
            centerY: bubble.offsetTop + bubble.offsetHeight / 2,
            radius: bubble.offsetWidth / 2 + 74
          }));
        };
        measureHero();
        const resetFocus = () => {
          if (activeFocus) gsap.to(activeFocus, { scale: 1, duration: .36, ease: aboutEase, overwrite: 'auto' });
          activeFocus = null;
          bubbleScaleTos.forEach(scaleTo => scaleTo(1));
        };
        const moveFocus = event => {
          const x = event.clientX - heroRect.left;
          const y = event.clientY - heroRect.top;
          const nextFocus = event.target.closest?.('[data-about-focus]') || null;
          if (nextFocus !== activeFocus) {
            if (activeFocus) gsap.to(activeFocus, { scale: 1, duration: .36, ease: aboutEase, overwrite: 'auto' });
            if (nextFocus) gsap.to(nextFocus, { scale: 1.065, duration: .42, ease: aboutEase, overwrite: 'auto' });
            activeFocus = nextFocus;
          }
          heroBubbles.forEach((bubble, index) => {
            const metric = bubbleMetrics[index];
            const bubbleX = metric.centerX + (Number(gsap.getProperty(bubble, 'x')) || 0);
            const bubbleY = metric.centerY + (Number(gsap.getProperty(bubble, 'y')) || 0);
            const distance = Math.hypot(x - bubbleX, y - bubbleY);
            bubbleScaleTos[index](distance < metric.radius ? 1.18 : 1);
          });
        };

        aboutHero.addEventListener('pointerleave', resetFocus);
        aboutHero.addEventListener('pointermove', moveFocus, { passive: true });
        window.addEventListener('resize', measureHero, { passive: true });

        cleanup.push(() => {
          aboutHero.removeEventListener('pointerleave', resetFocus);
          aboutHero.removeEventListener('pointermove', moveFocus);
          window.removeEventListener('resize', measureHero);
          gsap.killTweensOf([...focusTargets, ...heroBubbles]);
        });
      }

      if (aboutHero && allowMotion) {
        const waterBubbles = [...aboutHero.querySelectorAll('.about-water-bubbles i')];
        const bubbleTweens = waterBubbles.map((bubble, index) => gsap.to(bubble, {
          x: Math.sin(index * 1.47) * (36 + index % 3 * 18),
          y: Math.cos(index * 1.12) * (28 + index % 4 * 14),
          rotation: `+=${index % 2 ? 34 : -29}`,
          opacity: .22 + index % 4 * .045,
          duration: 1.625 + index % 5 * .21,
          delay: -index * .315,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        }));
        let bubbleObserver = null;
        if ('IntersectionObserver' in window) {
          bubbleObserver = new IntersectionObserver(entries => {
            bubbleTweens.forEach(tween => entries[0]?.isIntersecting ? tween.play() : tween.pause());
          }, { rootMargin: '120px 0px' });
          bubbleObserver.observe(aboutHero);
        }
        cleanup.push(() => {
          bubbleObserver?.disconnect();
          bubbleTweens.forEach(tween => tween.kill());
        });
      }

      if (aboutIntro && allowMotion) {
        const bubbles = [...aboutIntro.querySelectorAll('.keyword-bubble')];
        const bubbleCloud = aboutIntro.querySelector('.about-keyword-cloud');
        const bubbleStates = bubbles.map((bubble, index) => ({
          bubble,
          index,
          x: 0,
          y: 0,
          homeX: 0,
          homeY: 0,
          vx: Math.sin(index * 1.71) * .18,
          vy: Math.cos(index * 1.23) * .14,
          phase: index * .83,
          clickChain: 0,
          lastClickAt: 0,
          setX: gsap.quickSetter(bubble, 'x', 'px'),
          setY: gsap.quickSetter(bubble, 'y', 'px'),
          setRotation: gsap.quickSetter(bubble, 'rotation', 'deg')
        }));
        let activeBubble = null;
        let bubblePhysicsActive = true;
        let totalBubbleClicks = 0;

        const swapBubbleHomes = (firstState, secondState) => {
          const firstAbsoluteX = firstState.bubble.offsetLeft + firstState.homeX;
          const firstAbsoluteY = firstState.bubble.offsetTop + firstState.homeY;
          const secondAbsoluteX = secondState.bubble.offsetLeft + secondState.homeX;
          const secondAbsoluteY = secondState.bubble.offsetTop + secondState.homeY;
          firstState.homeX = secondAbsoluteX - firstState.bubble.offsetLeft;
          firstState.homeY = secondAbsoluteY - firstState.bubble.offsetTop;
          secondState.homeX = firstAbsoluteX - secondState.bubble.offsetLeft;
          secondState.homeY = firstAbsoluteY - secondState.bubble.offsetTop;
        };

        const updateBubblePhysics = (time, deltaTime) => {
          if (!bubblePhysicsActive || !bubbleCloud) return;
          const step = Math.min(2, Math.max(.35, deltaTime / 16.667));
          const cloudWidth = bubbleCloud.clientWidth;
          const cloudHeight = bubbleCloud.clientHeight;

          bubbleStates.forEach(state => {
            state.vx += ((state.homeX - state.x) * .0018 + Math.sin(time * 1.2 + state.phase) * .006) * step;
            state.vy += ((state.homeY - state.y) * .0018 - .004 + Math.cos(time * .95 + state.phase) * .005) * step;
            state.vx *= Math.pow(.982, step);
            state.vy *= Math.pow(.982, step);
            state.x += state.vx * step;
            state.y += state.vy * step;
          });

          for (let firstIndex = 0; firstIndex < bubbleStates.length; firstIndex += 1) {
            const first = bubbleStates[firstIndex];
            const firstRadius = first.bubble.offsetWidth * .39;
            for (let secondIndex = firstIndex + 1; secondIndex < bubbleStates.length; secondIndex += 1) {
              const second = bubbleStates[secondIndex];
              const secondRadius = second.bubble.offsetWidth * .39;
              const deltaX = (second.bubble.offsetLeft + second.x + second.bubble.offsetWidth / 2) - (first.bubble.offsetLeft + first.x + first.bubble.offsetWidth / 2);
              const deltaY = (second.bubble.offsetTop + second.y + second.bubble.offsetHeight / 2) - (first.bubble.offsetTop + first.y + first.bubble.offsetHeight / 2);
              const distance = Math.max(1, Math.hypot(deltaX, deltaY));
              const minimumDistance = firstRadius + secondRadius;
              if (distance >= minimumDistance) continue;
              const normalX = deltaX / distance;
              const normalY = deltaY / distance;
              const pressure = (minimumDistance - distance) * .018 * step;
              first.vx -= normalX * pressure;
              first.vy -= normalY * pressure;
              second.vx += normalX * pressure;
              second.vy += normalY * pressure;
            }
          }

          bubbleStates.forEach(state => {
            const bubbleWidth = state.bubble.offsetWidth;
            const bubbleHeight = state.bubble.offsetHeight;
            const absoluteX = state.bubble.offsetLeft + state.x;
            const absoluteY = state.bubble.offsetTop + state.y;
            if (absoluteX < -4) {
              state.x += -4 - absoluteX;
              state.vx = Math.abs(state.vx) * .62;
            } else if (absoluteX + bubbleWidth > cloudWidth + 4) {
              state.x -= absoluteX + bubbleWidth - cloudWidth - 4;
              state.vx = -Math.abs(state.vx) * .62;
            }
            if (absoluteY < -8) {
              state.y += -8 - absoluteY;
              state.vy = Math.abs(state.vy) * .52;
            } else if (absoluteY + bubbleHeight > cloudHeight + 7) {
              state.y -= absoluteY + bubbleHeight - cloudHeight - 7;
              state.vy = -Math.abs(state.vy) * .52;
            }
            state.setX(state.x);
            state.setY(state.y);
            state.setRotation(Math.max(-9, Math.min(9, state.vx * 3.4)));
          });
        };

        gsap.ticker.add(updateBubblePhysics);

        let bubbleObserver = null;
        if ('IntersectionObserver' in window) {
          bubbleObserver = new IntersectionObserver(entries => {
            bubblePhysicsActive = Boolean(entries[0]?.isIntersecting);
          }, { rootMargin: '160px 0px' });
          bubbleObserver.observe(aboutIntro);
        }

        const moveAcrossBubbles = event => {
          const nextBubble = event.target.closest?.('.keyword-bubble') || null;
          if (nextBubble === activeBubble) return;
          if (activeBubble) gsap.to(activeBubble, { scale: 1, duration: .3, ease: aboutEase, overwrite: 'auto' });
          if (nextBubble) gsap.to(nextBubble, { scale: 1.14, duration: .32, ease: aboutEase, overwrite: 'auto' });
          activeBubble = nextBubble;
        };
        const leaveBubbles = () => {
          if (activeBubble) gsap.to(activeBubble, { scale: 1, duration: .3, ease: aboutEase, overwrite: 'auto' });
          activeBubble = null;
        };
        if (finePointer) {
          bubbleCloud?.addEventListener('pointermove', moveAcrossBubbles, { passive: true });
          bubbleCloud?.addEventListener('pointerleave', leaveBubbles);
        }

        const liftBubble = event => {
          const bubble = event.target.closest?.('.keyword-bubble');
          if (!bubble) return;
          const bubbleIndex = bubbles.indexOf(bubble);
          const state = bubbleStates[bubbleIndex];
          if (!state) return;
          const now = Date.now();
          state.clickChain = now - state.lastClickAt < 620 ? Math.min(6, state.clickChain + 1) : 1;
          state.lastClickAt = now;
          totalBubbleClicks += 1;

          const speedBoost = 1 + state.clickChain * .46;
          state.vy -= 2.4 * speedBoost;
          state.vx += gsap.utils.random(-1.15, 1.15) * speedBoost;

          const clickedCenterX = bubble.offsetLeft + state.x + bubble.offsetWidth / 2;
          const clickedCenterY = bubble.offsetTop + state.y + bubble.offsetHeight / 2;
          bubbleStates.forEach(otherState => {
            if (otherState === state) return;
            const otherCenterX = otherState.bubble.offsetLeft + otherState.x + otherState.bubble.offsetWidth / 2;
            const otherCenterY = otherState.bubble.offsetTop + otherState.y + otherState.bubble.offsetHeight / 2;
            const deltaX = otherCenterX - clickedCenterX;
            const deltaY = otherCenterY - clickedCenterY;
            const distance = Math.max(36, Math.hypot(deltaX, deltaY));
            if (distance > 250) return;
            const push = (250 - distance) / 250 * (.7 + state.clickChain * .18);
            otherState.vx += deltaX / distance * push;
            otherState.vy += deltaY / distance * push - .12;
          });

          if (totalBubbleClicks % 2 === 0 || state.clickChain >= 3) {
            let swapIndex = Math.floor(Math.random() * bubbleStates.length);
            if (swapIndex === bubbleIndex) swapIndex = (swapIndex + 1) % bubbleStates.length;
            swapBubbleHomes(state, bubbleStates[swapIndex]);
          }

          gsap.killTweensOf(bubble, 'scale');
          const restingScale = finePointer && activeBubble === bubble ? 1.14 : 1;
          gsap.fromTo(bubble,
            { scale: restingScale * .94 },
            {
              scale: restingScale * 1.08,
              duration: Math.max(.16, .3 - state.clickChain * .025),
              ease: buoyantEase,
              yoyo: true,
              repeat: 1,
              overwrite: 'auto',
              onComplete: () => gsap.set(bubble, { scale: restingScale })
            }
          );
        };
        bubbleCloud?.addEventListener('click', liftBubble);

        const resetBubblePhysics = () => {
          bubbleStates.forEach(state => {
            state.x = 0;
            state.y = 0;
            state.homeX = 0;
            state.homeY = 0;
            state.vx = 0;
            state.vy = 0;
          });
        };
        window.addEventListener('resize', resetBubblePhysics, { passive: true });

        cleanup.push(() => {
          bubbleObserver?.disconnect();
          gsap.ticker.remove(updateBubblePhysics);
          gsap.killTweensOf(bubbles);
          bubbleCloud?.removeEventListener('pointermove', moveAcrossBubbles);
          bubbleCloud?.removeEventListener('pointerleave', leaveBubbles);
          bubbleCloud?.removeEventListener('click', liftBubble);
          window.removeEventListener('resize', resetBubblePhysics);
        });
      }

      return () => cleanup.forEach(callback => callback());
    });

    window.addEventListener('pagehide', () => aboutMedia.revert(), { once: true });
  }

  const journeyGallery = document.querySelector('.journey-gallery');
  if (journeyGallery) {
    const gallerySlides = [...journeyGallery.querySelectorAll('.journey-gallery-slide')];
    const galleryCurrent = journeyGallery.querySelector('[data-gallery-current]');
    const galleryPrev = journeyGallery.querySelector('[data-gallery-prev]');
    const galleryNext = journeyGallery.querySelector('[data-gallery-next]');
    let galleryIndex = 0;
    let galleryTimeline = null;

    const getGalleryPositions = () => window.matchMedia('(max-width: 680px)').matches
      ? { previous: -116, current: -50, next: 16, hiddenPrevious: -220, hiddenNext: 120 }
      : { previous: -158, current: -50, next: 58, hiddenPrevious: -268, hiddenNext: 168 };

    const showJourneySlide = (nextIndex, direction = 1, immediate = false) => {
      galleryIndex = (nextIndex + gallerySlides.length) % gallerySlides.length;
      const positions = getGalleryPositions();
      const slideStates = gallerySlides.map((slide, index) => {
        const forwardDistance = (index - galleryIndex + gallerySlides.length) % gallerySlides.length;
        if (forwardDistance === 0) return { position: positions.current, scale: 1.06, autoAlpha: 1, zIndex: 3, active: true };
        if (forwardDistance === 1) return { position: positions.next, scale: .88, autoAlpha: .68, zIndex: 2, active: false };
        if (forwardDistance === gallerySlides.length - 1) return { position: positions.previous, scale: .88, autoAlpha: .68, zIndex: 2, active: false };
        return {
          position: direction >= 0 ? positions.hiddenNext : positions.hiddenPrevious,
          scale: .78,
          autoAlpha: 0,
          zIndex: 1,
          active: false
        };
      });

      gallerySlides.forEach((slide, index) => {
        slide.classList.toggle('is-active', slideStates[index].active);
        slide.setAttribute('aria-hidden', String(!slideStates[index].active));
      });
      if (galleryCurrent) galleryCurrent.textContent = String(galleryIndex + 1).padStart(2, '0');

      if (!window.gsap || reducedMotion || immediate) {
        gallerySlides.forEach((slide, index) => {
          const state = slideStates[index];
          if (window.gsap) {
            window.gsap.set(slide, { xPercent: state.position, scale: state.scale, autoAlpha: state.autoAlpha, zIndex: state.zIndex });
          }
        });
        return;
      }

      galleryTimeline?.kill();
      galleryTimeline = window.gsap.timeline({ defaults: { duration: .72, ease: 'power3.inOut', overwrite: 'auto' } });
      galleryTimeline.addLabel('shift', 0);
      gallerySlides.forEach((slide, index) => {
        const state = slideStates[index];
        galleryTimeline.to(slide, {
          xPercent: state.position,
          scale: state.scale,
          autoAlpha: state.autoAlpha,
          zIndex: state.zIndex
        }, 'shift');
      });
    };

    const showPreviousJourneySlide = () => showJourneySlide(galleryIndex - 1, -1);
    const showNextJourneySlide = () => showJourneySlide(galleryIndex + 1, 1);
    const refreshJourneyGallery = () => showJourneySlide(galleryIndex, 1, true);
    const journeyImageCleanup = [];
    gallerySlides.forEach((slide, index) => {
      const image = slide.querySelector('img');
      if (!image) return;
      const openJourneyImage = () => openLightbox(image);
      const openJourneyImageWithKeyboard = event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openJourneyImage();
      };
      slide.tabIndex = 0;
      slide.setAttribute('role', 'button');
      slide.setAttribute('aria-label', `点击放大查看第 ${String(index + 1).padStart(2, '0')} 张沿途影像`);
      slide.addEventListener('click', openJourneyImage);
      slide.addEventListener('keydown', openJourneyImageWithKeyboard);
      journeyImageCleanup.push(() => {
        slide.removeEventListener('click', openJourneyImage);
        slide.removeEventListener('keydown', openJourneyImageWithKeyboard);
      });
    });
    galleryPrev?.addEventListener('click', showPreviousJourneySlide);
    galleryNext?.addEventListener('click', showNextJourneySlide);
    window.addEventListener('resize', refreshJourneyGallery, { passive: true });
    window.addEventListener('pagehide', () => {
      galleryTimeline?.kill();
      journeyImageCleanup.forEach(cleanup => cleanup());
      galleryPrev?.removeEventListener('click', showPreviousJourneySlide);
      galleryNext?.removeEventListener('click', showNextJourneySlide);
      window.removeEventListener('resize', refreshJourneyGallery);
    }, { once: true });
    showJourneySlide(0, 1, true);
  }

  const hero = document.querySelector('.hero');
  const glow = document.querySelector('.hero-glow');
  if (hero && glow && !reducedMotion && matchMedia('(pointer:fine)').matches) {
    const sparkleColors = ['#ffffff', '#ddd4ff', '#c8f2ff', '#ffd9ef'];
    const activeParticles = new Set();
    let heroRect = hero.getBoundingClientRect();
    let glowFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let lastParticleAt = 0;
    hero.addEventListener('pointerenter', () => { heroRect = hero.getBoundingClientRect(); }, { passive: true });
    hero.addEventListener('pointermove', event => {
      pointerX = event.clientX - heroRect.left;
      pointerY = event.clientY - heroRect.top;
      if (!glowFrame) {
        glowFrame = requestAnimationFrame(() => {
          glow.style.setProperty('--glow-x', `${pointerX}px`);
          glow.style.setProperty('--glow-y', `${pointerY}px`);
          glowFrame = 0;
        });
      }
      if (event.timeStamp - lastParticleAt < 48 || activeParticles.size >= 24) return;
      lastParticleAt = event.timeStamp;
      const particle = document.createElement('i');
      particle.className = 'mouse-particle';
      if (Math.random() < .22) particle.classList.add('is-star');
      particle.style.left = `${pointerX + (Math.random() - .5) * 12}px`;
      particle.style.top = `${pointerY + (Math.random() - .5) * 12}px`;
      particle.style.setProperty('--size', `${Math.random() * 3.5 + 2}px`);
      particle.style.setProperty('--dx', `${(Math.random() - .5) * 28}px`);
      particle.style.setProperty('--dy', `${-(Math.random() * 24 + 8)}px`);
      particle.style.setProperty('--particle-color', sparkleColors[Math.floor(Math.random() * sparkleColors.length)]);
      hero.appendChild(particle);
      activeParticles.add(particle);
      particle.addEventListener('animationend', () => {
        activeParticles.delete(particle);
        particle.remove();
      }, { once: true });
    });
  }

  const setupLetterTilt = (element, selector, variables) => {
    if (!element || reducedMotion || !matchMedia('(pointer:fine)').matches) return;
    const letters = [...element.querySelectorAll(selector)];
    let bounds;
    let centers = [];
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const measure = () => {
      bounds = element.getBoundingClientRect();
      centers = letters.map(letter => {
        const rect = letter.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.style.setProperty(variables.rotateX, '0deg');
      element.style.setProperty(variables.rotateY, '0deg');
      element.style.setProperty(variables.scale, '1');
      letters.forEach(letter => {
        letter.style.setProperty(variables.letterScale, '1');
        letter.style.setProperty(variables.letterLift, '0px');
      });
    };
    const render = () => {
      if (!bounds) measure();
      const relativeX = (pointerX - bounds.left) / bounds.width - .5;
      const relativeY = (pointerY - bounds.top) / bounds.height - .5;
      const influenceRange = Math.max(bounds.width * variables.range, variables.minimumRange);
      element.style.setProperty(variables.rotateX, `${(-relativeY * 6).toFixed(2)}deg`);
      element.style.setProperty(variables.rotateY, `${(relativeX * 8).toFixed(2)}deg`);
      element.style.setProperty(variables.scale, variables.activeScale);
      letters.forEach((letter, index) => {
        const influence = Math.max(0, 1 - Math.abs(pointerX - centers[index]) / influenceRange);
        letter.style.setProperty(variables.letterScale, (1 + influence * .2).toFixed(3));
        letter.style.setProperty(variables.letterLift, `${(-influence * 8).toFixed(1)}px`);
      });
      frame = 0;
    };

    element.addEventListener('pointerenter', measure, { passive: true });
    element.addEventListener('pointermove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    element.addEventListener('pointerleave', reset, { passive: true });
  };

  setupLetterTilt(document.querySelector('#works-hero-title'), 'span', {
    rotateX: '--title-rotate-x', rotateY: '--title-rotate-y', scale: '--title-scale',
    letterScale: '--letter-scale', letterLift: '--letter-lift', range: .26, minimumRange: 90, activeScale: '1.025'
  });
  setupLetterTilt(document.querySelector('.works-hero-subtitle'), '.subtitle-letter', {
    rotateX: '--subtitle-rotate-x', rotateY: '--subtitle-rotate-y', scale: '--subtitle-scale',
    letterScale: '--subtitle-letter-scale', letterLift: '--subtitle-letter-lift', range: .13, minimumRange: 70, activeScale: '1.02'
  });

  const worksHero = document.querySelector('.works-hero');
  if (worksHero && !reducedMotion && matchMedia('(pointer:fine)').matches) {
    const trailBubbles = new Set();
    let lastBubbleAt = 0;

    worksHero.addEventListener('pointermove', event => {
      if (event.timeStamp - lastBubbleAt < 50) return;
      lastBubbleAt = event.timeStamp;
      const heroRect = worksHero.getBoundingClientRect();
      const originX = event.clientX - heroRect.left;
      const originY = event.clientY - heroRect.top;
      const bubbleCount = Math.random() < .35 ? 2 : 1;

      for (let index = 0; index < bubbleCount; index++) {
        if (trailBubbles.size >= 28) {
          const oldestBubble = trailBubbles.values().next().value;
          oldestBubble?.remove();
          trailBubbles.delete(oldestBubble);
        }

        const bubble = document.createElement('i');
        const size = Math.random() * 6.5 + 3.5;
        const drift = (Math.random() - .5) * 42;
        const rise = Math.random() * 46 + 42;
        bubble.className = 'works-pointer-bubble';
        bubble.setAttribute('aria-hidden', 'true');
        bubble.style.left = `${originX + (Math.random() - .5) * 18}px`;
        bubble.style.top = `${originY + (Math.random() - .5) * 14}px`;
        bubble.style.setProperty('--trail-size', `${size.toFixed(1)}px`);
        bubble.style.setProperty('--trail-drift-mid', `${(drift * .68).toFixed(1)}px`);
        bubble.style.setProperty('--trail-rise-mid', `${(-rise * .7).toFixed(1)}px`);
        bubble.style.setProperty('--trail-drift', `${drift.toFixed(1)}px`);
        bubble.style.setProperty('--trail-rise', `${(-rise).toFixed(1)}px`);
        bubble.style.setProperty('--trail-duration', `${(Math.random() * .7 + 1.05).toFixed(2)}s`);
        bubble.style.setProperty('--trail-opacity', (Math.random() * .24 + .64).toFixed(2));
        bubble.style.setProperty('--trail-hue', `${Math.round((Math.random() - .5) * 42)}deg`);
        worksHero.appendChild(bubble);
        trailBubbles.add(bubble);
        bubble.addEventListener('animationend', () => {
          trailBubbles.delete(bubble);
          bubble.remove();
        }, { once: true });
      }
    });
  }

  const homeParticles = document.querySelector('#home-particles');
  const bootHomeParticles = () => {
    if (!homeParticles || reducedMotion || saveData || !window.tsParticles || !window.loadSlim) {
      homeParticles?.classList.add(saveData ? 'is-data-saver' : 'is-unavailable');
      return;
    }
    const compactParticles = window.innerWidth < 720;
    const finePointer = matchMedia('(pointer:fine)').matches;
    window.loadSlim(window.tsParticles)
      .then(() => window.tsParticles.load({
        id: 'home-particles',
        options: {
          fullScreen: { enable: false },
          background: { color: { value: 'transparent' } },
          detectRetina: true,
          fpsLimit: compactParticles ? 30 : 45,
          pauseOnBlur: true,
          pauseOnOutsideViewport: true,
          particles: {
            color: { value: ['#ffffff', '#ddd4ff', '#c8f2ff', '#ffd9ef'] },
            links: { enable: false },
            move: {
              enable: true,
              direction: 'none',
              random: true,
              speed: { min: .12, max: compactParticles ? .34 : .48 },
              straight: false,
              outModes: { default: 'out' }
            },
            number: { value: compactParticles ? 22 : 44 },
            opacity: {
              value: { min: .18, max: .72 },
              animation: { enable: true, speed: .65, sync: false }
            },
            shape: { type: 'circle' },
            size: {
              value: { min: 1, max: compactParticles ? 3.2 : 4.4 },
              animation: { enable: true, speed: 1.1, sync: false }
            }
          },
          interactivity: {
            detectsOn: 'window',
            events: {
              onClick: { enable: false },
              onHover: { enable: finePointer, mode: 'repulse' },
              resize: true
            },
            modes: {
              repulse: { distance: 68, duration: .35 }
            }
          }
        }
      }))
      .then(() => homeParticles.classList.add('is-ready'))
      .catch(() => homeParticles.classList.add('is-unavailable'));
  };

  const loadHomeParticles = () => {
    if (!homeParticles || reducedMotion || saveData) {
      homeParticles?.classList.add(saveData ? 'is-data-saver' : 'is-unavailable');
      return;
    }
    if (window.tsParticles && window.loadSlim) {
      bootHomeParticles();
      return;
    }
    const particleScript = document.createElement('script');
    particleScript.src = 'assets/vendor/tsparticles/tsparticles.slim.bundle.min.js';
    particleScript.async = true;
    particleScript.onload = bootHomeParticles;
    particleScript.onerror = () => homeParticles.classList.add('is-unavailable');
    document.head.appendChild(particleScript);
  };

  const certificatePreview = document.querySelector('[data-certificate-preview]');
  const certificateMedia = certificatePreview?.querySelector('[data-certificate-media]');
  const certificateStatus = certificateMedia?.querySelector('[role="status"]');
  const certificatePreviewCaption = certificatePreview?.querySelector('figcaption');
  const certificateBackdrop = document.querySelector('[data-certificate-backdrop]');
  const certificateClose = document.querySelector('[data-certificate-close]');
  const certificateTriggers = [...document.querySelectorAll('[data-certificate]')];
  const certificateImages = new Map();
  let certificatePinned = false;
  let activeCertificateTrigger = null;

  if (certificateBackdrop && certificatePreview) {
    document.body.append(certificateBackdrop, certificatePreview);
  }

  const loadCertificate = (trigger, priority) => {
    const url = trigger.dataset.certificate;
    const cached = certificateImages.get(url);
    if (cached) {
      if (priority === 'high') cached.image.fetchPriority = 'high';
      return cached.ready;
    }

    const image = new Image();
    image.fetchPriority = priority;
    image.src = url;
    const ready = image.decode().then(() => image, () => {
      certificateImages.delete(url);
      return null;
    });
    certificateImages.set(url, { image, ready });
    return ready;
  };

  if (certificateTriggers.length && 'IntersectionObserver' in window) {
    const certificateObserver = new IntersectionObserver(entries => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        certificateObserver.unobserve(target);
        loadCertificate(target, 'low');
      });
    }, { rootMargin: '280px 0px' });
    certificateTriggers.forEach(trigger => certificateObserver.observe(trigger));
  }

  const positionCertificatePreview = trigger => {
    if (!certificatePreview || certificatePinned) return;
    const triggerBounds = trigger.getBoundingClientRect();
    const previewBounds = certificatePreview.getBoundingClientRect();
    const gap = 14;
    const gutter = 16;
    let left = triggerBounds.right + gap;
    if (left + previewBounds.width > window.innerWidth - gutter) {
      left = triggerBounds.left - previewBounds.width - gap;
    }
    left = Math.max(gutter, Math.min(left, window.innerWidth - previewBounds.width - gutter));
    const top = Math.max(gutter, Math.min(
      triggerBounds.top - 24,
      window.innerHeight - previewBounds.height - gutter
    ));
    certificatePreview.style.left = `${left}px`;
    certificatePreview.style.top = `${top}px`;
  };

  const hideCertificateHover = trigger => {
    if (!certificatePreview || certificatePinned || activeCertificateTrigger !== trigger) return;
    certificatePreview.classList.remove('is-visible');
    certificatePreview.setAttribute('aria-hidden', 'true');
    activeCertificateTrigger = null;
  };

  const showCertificateImage = async trigger => {
    if (!certificateMedia || !certificateStatus || !certificatePreviewCaption) return;
    const title = trigger.dataset.certificateTitle || '比赛奖状';
    const previousImage = certificateMedia.querySelector('img');
    if (previousImage?.getAttribute('src') !== trigger.dataset.certificate) previousImage?.remove();
    certificatePreviewCaption.textContent = title;
    certificateStatus.hidden = Boolean(certificateMedia.querySelector('img')) || !certificatePinned;
    certificateStatus.textContent = certificateStatus.hidden ? '' : '正在加载图片…';

    const image = await loadCertificate(trigger, 'high');
    if (activeCertificateTrigger !== trigger) return;
    if (!image) {
      if (certificatePinned) certificateStatus.textContent = '图片加载失败，请关闭后重试。';
      return;
    }

    image.alt = `${title}图片预览`;
    certificateStatus.hidden = true;
    certificateMedia.append(image);
    if (!certificatePinned) positionCertificatePreview(trigger);
    certificatePreview.classList.add('is-visible');
    certificatePreview.setAttribute('aria-hidden', 'false');
  };

  const showCertificateHover = trigger => {
    if (!certificatePreview || certificatePinned) return;
    activeCertificateTrigger = trigger;
    showCertificateImage(trigger);
  };

  const pinCertificate = trigger => {
    if (!certificatePreview) return;
    certificateTriggers.forEach(button => button.setAttribute('aria-expanded', 'false'));
    certificatePinned = true;
    activeCertificateTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    certificatePreview.classList.add('is-pinned', 'is-visible');
    certificatePreview.setAttribute('aria-hidden', 'false');
    certificatePreview.setAttribute('role', 'dialog');
    certificatePreview.setAttribute('aria-modal', 'true');
    certificatePreview.setAttribute('aria-label', trigger.dataset.certificateTitle || '比赛奖状预览');
    certificateBackdrop?.classList.add('is-visible');
    certificateBackdrop?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    certificateClose?.focus({ preventScroll: true });
    showCertificateImage(trigger);
  };

  const closeCertificate = (restoreFocus = true) => {
    if (!certificatePreview) return;
    const previousTrigger = activeCertificateTrigger;
    if (restoreFocus) previousTrigger?.focus({ preventScroll: true });
    certificatePinned = false;
    certificateTriggers.forEach(button => button.setAttribute('aria-expanded', 'false'));
    certificatePreview.classList.remove('is-pinned', 'is-visible');
    certificatePreview.setAttribute('aria-hidden', 'true');
    certificatePreview.removeAttribute('role');
    certificatePreview.removeAttribute('aria-modal');
    certificatePreview.removeAttribute('aria-label');
    certificateBackdrop?.classList.remove('is-visible');
    certificateBackdrop?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeCertificateTrigger = null;
  };

  certificateTriggers.forEach(trigger => {
    trigger.addEventListener('pointerenter', () => showCertificateHover(trigger));
    trigger.addEventListener('pointerleave', () => hideCertificateHover(trigger));
    trigger.addEventListener('focus', () => showCertificateHover(trigger));
    trigger.addEventListener('blur', () => hideCertificateHover(trigger));
    trigger.addEventListener('click', () => pinCertificate(trigger));
  });
  certificateClose?.addEventListener('click', () => closeCertificate());
  certificateBackdrop?.addEventListener('click', () => closeCertificate());
  window.addEventListener('resize', () => {
    if (!certificatePinned && activeCertificateTrigger) positionCertificatePreview(activeCertificateTrigger);
  }, { passive: true });
  window.addEventListener('scroll', () => {
    if (!certificatePinned && activeCertificateTrigger) hideCertificateHover(activeCertificateTrigger);
  }, { passive: true });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && certificatePinned) closeCertificate();
  });

  const lightbox = document.querySelector('.lightbox');
  const openLightbox = source => {
    if (!lightbox || !source) return;
    const lightboxImage = lightbox.querySelector('img') || lightbox.appendChild(new Image());
    lightboxImage.src = source.src;
    lightboxImage.alt = source.alt;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const source = item.querySelector('img');
      openLightbox(source);
    });
  });

  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const slides = [...gallery.querySelectorAll('[data-gallery-slide]')];
    const thumbs = [...gallery.querySelectorAll('[data-gallery-thumb]')];
    const previous = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    const currentLabel = gallery.querySelector('[data-gallery-current]');
    const totalLabel = gallery.querySelector('[data-gallery-total]');
    if (!slides.length) return;

    let activeIndex = 0;
    const normalize = index => (index + slides.length) % slides.length;
    const showSlide = (nextIndex, direction = 1) => {
      activeIndex = normalize(nextIndex);
      const previousIndex = normalize(activeIndex - 1);
      const nextVisibleIndex = normalize(activeIndex + 1);
      gallery.dataset.direction = direction < 0 ? 'previous' : 'next';

      slides.forEach((slide, index) => {
        const isCurrent = index === activeIndex;
        slide.classList.toggle('is-current', isCurrent);
        slide.classList.toggle('is-prev', index === previousIndex);
        slide.classList.toggle('is-next', index === nextVisibleIndex);
        slide.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
        slide.tabIndex = isCurrent ? 0 : -1;
      });

      thumbs.forEach((thumb, index) => {
        const isActive = index === activeIndex;
        thumb.classList.toggle('is-active', isActive);
        thumb.setAttribute('aria-pressed', String(isActive));
      });

      if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
      if (totalLabel) totalLabel.textContent = String(slides.length).padStart(2, '0');
    };

    previous?.addEventListener('click', () => showSlide(activeIndex - 1, -1));
    next?.addEventListener('click', () => showSlide(activeIndex + 1, 1));
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => {
      const direction = index < activeIndex ? -1 : 1;
      showSlide(index, direction);
    }));
    slides.forEach(slide => slide.addEventListener('click', () => openLightbox(slide.querySelector('img'))));
    gallery.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(activeIndex - 1, -1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(activeIndex + 1, 1);
      }
    });

    showSlide(0);
  });

  const videoModal = document.querySelector('.video-modal');
  document.querySelectorAll('[data-video-open]').forEach(button => button.addEventListener('click', () => {
    videoModal?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }));

  const closeModal = modal => {
    modal?.classList.remove('is-open');
    document.body.style.overflow = '';
  };
  document.querySelectorAll('.modal-close').forEach(button => button.addEventListener('click', () => closeModal(button.closest('.lightbox, .video-modal'))));
  document.querySelectorAll('.lightbox, .video-modal').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); }));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelectorAll('.is-open').forEach(closeModal); });

  const worksToc = document.querySelector('.works-toc');
  const worksTocToggle = worksToc?.querySelector('.works-toc-toggle');
  if (worksTocToggle) {
    const setTocOpen = open => worksTocToggle.setAttribute('aria-expanded', String(open));
    const isTocOpen = () => worksTocToggle.getAttribute('aria-expanded') === 'true';
    const projectLinks = worksToc.querySelectorAll('.works-toc-projects a');
    const syncProjectLink = () => {
      projectLinks.forEach(link => {
        if (link.hash === window.location.hash) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    worksTocToggle.addEventListener('click', () => setTocOpen(!isTocOpen()));
    worksToc.addEventListener('click', event => {
      if (event.target.closest('a')) setTocOpen(false);
    });
    worksToc.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isTocOpen()) {
        setTocOpen(false);
        worksTocToggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (isTocOpen() && !worksToc.contains(event.target)) setTocOpen(false);
    });
    window.addEventListener('hashchange', syncProjectLink);
    syncProjectLink();
    worksToc.dataset.collapsible = '';
    worksTocToggle.hidden = false;
  }

  const tocLinks = [...document.querySelectorAll('.page-toc a:not(.works-toc-projects a)')];
  const tocSections = [...document.querySelectorAll('[data-toc]')];
  if (tocLinks.length && tocSections.length) {
    const setActive = id => {
      tocLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
    };
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActive(visible.target.id);
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .25, .6] });
    tocSections.forEach(section => observer.observe(section));
    tocLinks.forEach(link => {
      link.addEventListener('click', () => {
        const id = link.getAttribute('href')?.slice(1);
        if (id) setActive(id);
      });
    });
  }

  const workCards = document.querySelectorAll('.works-card');
  if (workCards.length) {
    const mobileNav = document.querySelector('.mobile-nav');
    const compactLayout = window.matchMedia('(max-width: 680px)');
    let activePreview = null;
    let hoverPreview = null;
    let closePreviewTimer = 0;

    const positionPreview = () => {
      if (!activePreview?.panel.matches(':popover-open')) return;
      const { card, panel } = activePreview;
      const bounds = card.getBoundingClientRect();
      const viewportWidth = root.clientWidth;
      const viewportBottom = compactLayout.matches && mobileNav ? mobileNav.getBoundingClientRect().top : root.clientHeight;
      const edge = 12;
      const gap = 10;
      const top = Math.max(0, topbar?.getBoundingClientRect().bottom ?? 0) + edge;
      const bottom = viewportBottom - edge;
      if (hoverPreview === activePreview && (bounds.bottom < top || bounds.top > bottom)) {
        panel.hidePopover();
        return;
      }

      const roomLeft = bounds.left - gap - edge;
      const roomRight = viewportWidth - bounds.right - gap - edge;
      const preferredWidth = 400;
      const placeOnLeft = roomRight < preferredWidth && roomLeft > roomRight;
      const sideRoom = placeOnLeft ? roomLeft : roomRight;
      const useSide = !compactLayout.matches && sideRoom >= 210;
      const width = Math.min(preferredWidth, useSide ? sideRoom : viewportWidth - 2 * edge);
      const availableHeight = Math.max(0, bottom - top);
      panel.style.inset = 'auto';
      panel.style.margin = '0';
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${Math.min(540, availableHeight)}px`;

      const height = panel.offsetHeight;
      const sideLeft = placeOnLeft ? bounds.left - gap - width : bounds.right + gap;
      const left = useSide ? sideLeft : (viewportWidth - width) / 2;
      const panelTop = useSide ? Math.max(top, Math.min(bounds.top, bottom - height)) : top + (availableHeight - height) / 2;
      panel.style.left = `${left}px`;
      panel.style.top = `${panelTop}px`;
    };

    workCards.forEach(card => {
      const panel = card.querySelector('.works-card-detail');
      const trigger = card.querySelector('h3 button');
      const player = card.querySelector('.works-card-player');
      if (!panel?.showPopover || !trigger) return;
      const preview = { card, panel };

      panel.addEventListener('toggle', event => {
        if (event.newState === 'open') {
          activePreview = preview;
          positionPreview();
        } else {
          if (activePreview === preview) activePreview = null;
          if (hoverPreview === preview) hoverPreview = null;
        }
      });

      card.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' || compactLayout.matches) return;
        if (activePreview && activePreview !== hoverPreview && activePreview.panel.matches(':popover-open')) return;
        window.clearTimeout(closePreviewTimer);
        if (panel.matches(':popover-open')) return;
        hoverPreview = preview;
        panel.showPopover({ source: trigger });
      });

      card.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'mouse' || hoverPreview !== preview) return;
        closePreviewTimer = window.setTimeout(() => {
          if (hoverPreview === preview && panel.matches(':popover-open')) panel.hidePopover();
        }, 220);
      });

      trigger.addEventListener('click', event => {
        if (hoverPreview !== preview || !panel.matches(':popover-open')) return;
        event.preventDefault();
        hoverPreview = null;
      });
      player?.addEventListener('pointerdown', () => {
        if (hoverPreview === preview && panel.matches(':popover-open')) panel.hidePopover();
      });
      panel.addEventListener('focusin', () => {
        if (hoverPreview === preview) hoverPreview = null;
      });
    });

    window.addEventListener('resize', positionPreview);
    window.addEventListener('scroll', positionPreview, { passive: true });
  }

  const loadBilibiliCover = stage => {
    const bvid = stage.dataset.bvid;
    const poster = stage.querySelector('.bilibili-poster');
    if (!bvid || !poster) return;

    const callbackName = `__biliCover_${bvid.replace(/[^a-z0-9]/gi, '')}_${Math.random().toString(36).slice(2)}`;
    const coverScript = document.createElement('script');
    const cleanup = () => {
      window.clearTimeout(timeout);
      window[callbackName] = null;
      coverScript.remove();
    };
    window[callbackName] = payload => {
      const cover = payload?.code === 0 ? payload.data?.pic : '';
      if (cover && /^https?:\/\//i.test(cover)) {
        poster.style.backgroundImage = `url("${cover.replace(/"/g, '%22')}")`;
        poster.classList.add('has-image');
      }
      cleanup();
    };
    coverScript.src = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}&jsonp=jsonp&callback=${callbackName}`;
    coverScript.onerror = cleanup;
    const timeout = window.setTimeout(cleanup, 5000);
    document.head.appendChild(coverScript);
  };

  const coverObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      coverObserver.unobserve(target);
      loadBilibiliCover(target);
    });
  }, { rootMargin: '160px 0px' }) : null;

  document.querySelectorAll('.bilibili-video').forEach(stage => {
    const bvid = stage.dataset.bvid;
    if (!bvid) return;
    const title = stage.dataset.videoTitle || '项目演示视频';
    const trigger = stage.querySelector('.bilibili-video-trigger');
    const clickOnly = stage.hasAttribute('data-video-click-only');
    let iframe = null;
    let mode = 'idle';
    let previewTimer;

    coverObserver?.observe(stage);

    const createPlayer = playWithSound => {
      if (iframe) iframe.remove();
      iframe = document.createElement('iframe');
      const params = new URLSearchParams({
        bvid,
        page: '1',
        high_quality: '1',
        danmaku: '0',
        autoplay: '1',
        muted: playWithSound ? '0' : '1'
      });
      iframe.src = `https://player.bilibili.com/player.html?${params.toString()}`;
      iframe.title = title;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      stage.appendChild(iframe);
    };

    const enterPreview = () => {
      if (mode !== 'idle') return;
      mode = 'preview';
      createPlayer(false);
      stage.classList.add('is-preview');
    };

    const startPlayback = event => {
      event.preventDefault();
      event.stopPropagation();
      const focusPlayer = document.activeElement === trigger;
      window.clearTimeout(previewTimer);
      mode = 'playing';
      createPlayer(true);
      stage.classList.remove('is-preview');
      stage.classList.add('is-playing');
      if (focusPlayer) iframe.focus();
    };

    const resetPreview = () => {
      window.clearTimeout(previewTimer);
      if (mode !== 'preview') return;
      mode = 'idle';
      iframe.remove();
      iframe = null;
      stage.classList.remove('is-preview');
    };

    if (!clickOnly) {
      stage.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' && mode === 'idle') previewTimer = window.setTimeout(enterPreview, 250);
      });
      stage.addEventListener('pointerleave', resetPreview);
    }
    trigger?.addEventListener('click', startPlayback);
    trigger?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') startPlayback(event);
    });
  });

  let homeParticlesScheduled = false;
  const scheduleHomeParticles = () => {
    if (!homeParticles || homeParticlesScheduled) return;
    homeParticlesScheduled = true;
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadHomeParticles, { timeout: 1600 });
    else window.setTimeout(loadHomeParticles, 700);
  };

  if (!loader || reducedMotion) {
    scheduleHomeParticles();
    return;
  }

  const loaderDuration = 400;
  const loaderStartedAt = performance.now();
  let loaderFrame;
  const renderLoaderProgress = progress => {
    loader.style.setProperty('--loader-progress', String(progress / 100));
    if (loaderPercent) loaderPercent.textContent = `${progress}%`;
    loaderBar?.setAttribute('aria-valuenow', String(progress));
  };
  const tickLoader = () => {
    const progress = Math.min(100, Math.round(8 + 92 * (performance.now() - loaderStartedAt) / loaderDuration));
    renderLoaderProgress(progress);
    if (progress < 100) loaderFrame = requestAnimationFrame(tickLoader);
  };

  const finishLoader = () => {
    cancelAnimationFrame(loaderFrame);
    renderLoaderProgress(100);
    loader.classList.add('is-done');
    loader.setAttribute('aria-hidden', 'true');
    scheduleHomeParticles();
  };

  const loaderTimer = window.setTimeout(finishLoader, loaderDuration);
  window.addEventListener('pagehide', () => {
    loader.hidden = true;
    loader.setAttribute('aria-hidden', 'true');
    cancelAnimationFrame(loaderFrame);
    window.clearTimeout(loaderTimer);
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && !loader.classList.contains('is-done')) scheduleHomeParticles();
  });

  tickLoader();
  loader.setAttribute('aria-hidden', 'false');
  loader.hidden = false;
})();
