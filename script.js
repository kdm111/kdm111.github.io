/* Progressive enhancement only: all text, links and native video controls work without JS. */
(() => {
  'use strict';
  const videos = [...document.querySelectorAll('video')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  videos.forEach(video => {
    const frame = video.closest('.player');
    const button = frame?.querySelector('.play-button');
    if (button) {
      // Keep the initial poster clean; native controls appear on the user's play action.
      // The HTML still includes controls, so the no-JavaScript fallback remains usable.
      video.controls = false;
      button.hidden = false;
      button.addEventListener('click', async () => {
        video.controls = true;
        try { await video.play(); }
        catch (_) { video.controls = true; video.focus(); }
      });
    }
    video.loop = video.dataset.loop !== 'false' && !reducedMotion.matches;
    video.addEventListener('play', () => {
      videos.forEach(other => { if (other !== video && !other.paused) other.pause(); });
      if (button) button.hidden = true;
    });
    video.addEventListener('error', () => {
      if (button) button.hidden = true;
      if (!frame || frame.querySelector('.video-error')) return;
      const message = document.createElement('p');
      message.className = 'video-error';
      message.textContent = '영상을 불러오지 못했습니다. 아래 MP4 링크에서 직접 열어 주세요.';
      message.setAttribute('role', 'status');
      frame.append(message);
    });
  });
  // No autoplay: downloads start on the visitor's own play action.
  if ('IntersectionObserver' in window) {
    const pauseObserver = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => {
        if (!isIntersecting && !target.paused && !document.fullscreenElement && !target.webkitDisplayingFullscreen) target.pause();
      });
    }, {threshold: 0});
    videos.forEach(v => pauseObserver.observe(v));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(v => v.pause());
  });
  reducedMotion.addEventListener?.('change', () => videos.forEach(v => { v.loop = v.dataset.loop !== 'false' && !reducedMotion.matches; }));

  document.querySelectorAll('[data-seek]').forEach(button => {
    button.addEventListener('click', async () => {
      const video = document.querySelector('#full-demo');
      if (!video) return;
      const seconds = Number(button.dataset.seek);
      video.controls = true;
      // Move the player into view before playback, so off-screen pausing does not
      // interrupt a chapter selected from the list below the player.
      video.scrollIntoView({block:'center', behavior:'instant'});
      try {
        const metadata = video.readyState >= 1 ? Promise.resolve() : new Promise((resolve, reject) => {
          let timeout;
          const finish = error => {
            clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', ready);
            video.removeEventListener('error', failed);
            error ? reject(error) : resolve();
          };
          const ready = () => finish();
          const failed = () => finish(new Error('Video unavailable'));
          video.addEventListener('loadedmetadata', ready, {once:true});
          video.addEventListener('error', failed, {once:true});
          timeout = setTimeout(failed, 15000);
        });
        // Catch immediately: a rejected play promise must not become unhandled
        // while metadata is still loading over a mobile connection.
        const playing = video.play().catch(() => {});
        await metadata;
        video.currentTime = Math.min(seconds, video.duration || seconds);
        await playing;
        if (video.paused) await video.play();
      } catch (_) { video.controls = true; }
    });
  });

  const contents = document.querySelector('.contents');
  contents?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { contents.open = false; }));
  document.addEventListener('click', event => {
    if (contents?.open && !contents.contains(event.target)) contents.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && contents?.open) {
      contents.open = false;
      contents.querySelector('summary')?.focus();
    }
  });
  const progress = document.querySelector('.progress');
  const topButton = document.querySelector('.back-top');
  let scrolling = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    if (topButton) topButton.hidden = window.scrollY < 750;
    scrolling = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrolling) { scrolling = true; window.requestAnimationFrame(updateScroll); }
  }, {passive:true});
  window.addEventListener('resize', updateScroll, {passive:true});
  updateScroll();
  topButton?.addEventListener('click', () => {
    window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});
    document.querySelector('.wordmark')?.focus({preventScroll:true});
  });

  const dialog = document.querySelector('.image-dialog');
  let lastZoomButton;
  document.querySelectorAll('.zoom-image').forEach(button => {
    button.addEventListener('click', () => {
      const img = button.querySelector('img');
      if (!dialog || !img) return;
      if (typeof dialog.showModal !== 'function') { window.open(img.src,'_blank','noopener'); return; }
      lastZoomButton = button;
      const target = dialog.querySelector('img');
      target.src = img.src;
      target.alt = img.alt;
      dialog.querySelector('.dialog-bar p').textContent = img.alt;
      dialog.showModal();
      dialog.querySelector('.zoom-content').scrollTo(0,0);
    });
  });
  dialog?.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => lastZoomButton?.focus());

  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      let count=0;
      document.querySelectorAll('.gallery-card').forEach(card => {
        const shown = filter === 'all' || card.dataset.project === filter || card.dataset.kind === filter;
        card.hidden = !shown;
        if (!shown) card.querySelector('video')?.pause(); else count++;
      });
      const status = document.querySelector('#gallery-status');
      if (status) status.textContent = `${count}개 영상`;
    });
  });
})();
