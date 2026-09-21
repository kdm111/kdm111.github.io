/* Progressive enhancement only: all text, links and native video controls work without JS. */
(() => {
  'use strict';
  const videos = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = new WeakMap();
  let autoplay = !reducedMotion.matches && !navigator.connection?.saveData;
  try { const saved = localStorage.getItem('portfolio-autoplay'); if (saved !== null) autoplay = saved === 'true'; } catch (_) {}
  let activeVideo, mediaObserver, scheduled = false;
  function safePause(video) {
    const state = states.get(video);
    if (state && !video.paused) { state.systemPause = true; video.pause(); }
  }
  function visibleArea(video) {
    if (!video.isConnected || !video.getClientRects().length) return 0;
    const dialog = video.closest('dialog');
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog && dialog !== openDialog) return 0;
    const box = video.getBoundingClientRect();
    let left = Math.max(0, box.left), right = Math.min(innerWidth, box.right);
    let top = Math.max(dialog ? 0 : 106, box.top), bottom = Math.min(innerHeight, box.bottom);
    const rail = video.closest('.drawer-rail');
    if (rail) { const r = rail.getBoundingClientRect(); left = Math.max(left, r.left); right = Math.min(right, r.right); }
    return Math.max(0, right-left) * Math.max(0, bottom-top) / Math.max(1, box.width*box.height);
  }
  function refreshPlayback() {
    scheduled = false;
    if (document.hidden) { videos.forEach(safePause); return; }
    const candidates = videos.filter(v => visibleArea(v) >= .35 && !v.error);
    let next = candidates.find(v => states.get(v)?.manual && !v.paused);
    if (!next && autoplay) next = candidates.filter(v => !states.get(v).userPaused && !states.get(v).blocked && !states.get(v).ended)
      .sort((a,b) => Math.abs(a.getBoundingClientRect().top+a.clientHeight/2-innerHeight/2)-Math.abs(b.getBoundingClientRect().top+b.clientHeight/2-innerHeight/2))[0];
    videos.forEach(v => { if (v !== next && (!states.get(v)?.manual || visibleArea(v)<.1)) safePause(v); });
    if (next && next.paused) {
      const state = states.get(next);
      state.autoStarting = true;
      next.play().catch(() => { state.autoStarting = false; state.blocked = true; });
    }
  }
  function schedulePlayback() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshPlayback);
  }
  function enhanceVideo(video) {
    if (states.has(video)) return;
    videos.push(video);
    const state = {userPaused:false, systemPause:false, autoStarting:false, manual:false, blocked:false, ended:false};
    states.set(video, state);
    const frame = video.closest('.player');
    const button = frame?.querySelector('.play-button');
    if (button) button.hidden = true;
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.loop = video.dataset.loop !== 'false' && !reducedMotion.matches;
    video.addEventListener('play', () => {
      state.manual = !state.autoStarting;
      state.autoStarting = false;
      state.userPaused = false;
      state.blocked = false;
      state.ended = false;
      activeVideo = video;
      videos.forEach(other => { if (other !== video) safePause(other); });
    });
    video.addEventListener('pause', () => {
      if (state.systemPause) state.systemPause = false;
      else if (!video.ended) state.userPaused = true;
    });
    video.addEventListener('ended', () => { state.ended = true; });
    video.addEventListener('volumechange', () => {
      if (!video.muted && !video.paused) state.manual = true;
    });
    video.addEventListener('error', () => {
      if (!frame || frame.querySelector('.video-error')) return;
      const message = document.createElement('p');
      message.className = 'video-error';
      message.textContent = '영상을 불러오지 못했습니다. ';
      const link = document.createElement('a');
      link.href = video.querySelector('source')?.src || video.src;
      link.textContent = 'MP4로 직접 열기';
      message.append(link);
      message.setAttribute('role', 'status');
      frame.append(message);
    });
    mediaObserver?.observe(video);
  }
  if ('IntersectionObserver' in window) {
    mediaObserver = new IntersectionObserver(schedulePlayback, {threshold:[0,.1,.35,.5,.75,1]});
  }
  document.querySelectorAll('video').forEach(enhanceVideo);
  window.addEventListener('scroll', schedulePlayback, {passive:true});
  window.addEventListener('resize', schedulePlayback, {passive:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(safePause); else schedulePlayback();
  });
  const toggles = [...document.querySelectorAll('.autoplay-toggle')];
  function updateToggles() {
    toggles.forEach(button => { button.setAttribute('aria-pressed', String(autoplay)); button.querySelector('span').textContent = autoplay ? '켜짐' : '꺼짐'; });
  }
  toggles.forEach(button => button.addEventListener('click', () => {
    autoplay = !autoplay;
    try { localStorage.setItem('portfolio-autoplay', String(autoplay)); } catch (_) {}
    if (!autoplay) videos.forEach(safePause);
    else videos.forEach(v => { const state=states.get(v); state.userPaused=false;state.blocked=false;state.ended=false; });
    updateToggles(); schedulePlayback();
  }));
  reducedMotion.addEventListener?.('change', () => {
    videos.forEach(v => { v.loop = v.dataset.loop !== 'false' && !reducedMotion.matches; });
    if (reducedMotion.matches) { autoplay=false; videos.forEach(safePause);updateToggles(); }
    schedulePlayback();
  });
  updateToggles(); schedulePlayback();

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
        if (!shown) { const video=card.querySelector('video'); if (video) safePause(video); } else count++;
      });
      const status = document.querySelector('#gallery-status');
      if (status) status.textContent = `${count}개 영상`;
      schedulePlayback();
    });
  });

  // One reusable drawer for every slide, with the same native video controls.
  const mediaDataNode = document.querySelector('#portfolio-media');
  const mediaData = mediaDataNode ? JSON.parse(mediaDataNode.textContent) : null;
  function makeMedia(clip) {
    const figure=document.createElement('figure');figure.className='media';figure.dataset.media=clip.id;
    const player=document.createElement('div');player.className='player';
    const video=document.createElement('video');
    video.controls=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='none';video.poster=clip.poster;
    video.setAttribute('aria-label',clip.title);video.dataset.loop=['larobot_full','vicpinky_carrier'].includes(clip.id)?'false':'true';
    const source=document.createElement('source');source.src=clip.file;source.type='video/mp4';video.append(source);player.append(video);
    const caption=document.createElement('figcaption');
    const title=document.createElement('span');title.className='media-title';title.textContent=clip.title;
    const environment=document.createElement('span');environment.className='media-env';environment.textContent=clip.environment;
    const download=document.createElement('a');download.className='media-download';download.href=clip.file;download.textContent='MP4로 열기 ↗';download.target='_blank';download.rel='noopener';
    caption.append(title,environment,download);figure.append(player,caption);
    enhanceVideo(video);
    return figure;
  }
  const drawer=document.querySelector('.media-drawer');
  const drawerRail=drawer?.querySelector('.drawer-rail');
  let drawerTrigger, drawerIndex=0;
  function updateDrawerIndex() {
    if (!drawerRail?.children.length) return;
    const cards=[...drawerRail.children],left=drawerRail.getBoundingClientRect().left;
    drawerIndex=cards.reduce((best,card,i)=>Math.abs(card.getBoundingClientRect().left-left)<Math.abs(cards[best].getBoundingClientRect().left-left)?i:best,0);
    drawer.querySelector('.drawer-count').textContent=`${String(drawerIndex+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
    drawer.querySelector('[data-media-prev]').disabled=drawerIndex===0;
    drawer.querySelector('[data-media-next]').disabled=drawerIndex===cards.length-1;
    schedulePlayback();
  }
  function goToMedia(index) {
    const card=drawerRail?.children[index];if (!card) return;
    drawerRail.scrollTo({left:card.offsetLeft-drawerRail.children[0].offsetLeft,behavior:reducedMotion.matches?'instant':'smooth'});
  }
  document.querySelectorAll('[data-open-media]').forEach(link=>link.addEventListener('click',event=>{
    if (!drawer || !mediaData || typeof drawer.showModal!=='function') return;
    if (event.ctrlKey||event.metaKey||event.shiftKey||event.altKey) return;
    const page=link.dataset.openMedia, ids=mediaData.pages[page];if (!ids?.length) return;
    event.preventDefault();drawerTrigger=link;
    drawerRail.replaceChildren();
    ids.forEach(id=>{const card=document.createElement('article');card.className='drawer-card';card.append(makeMedia(mediaData.clips[id]));drawerRail.append(card);});
    drawer.querySelector('#drawer-page').textContent=`PAGE ${String(page).padStart(2,'0')} · ${Number(page)<15?'LARO-BOT':'VICPINKY CARRIER'}`;
    drawer.querySelector('#drawer-title').textContent=document.querySelector(`#p${page} .slide-mobile h2`)?.textContent || '프로젝트 소개 영상';
    document.body.classList.add('modal-open');drawer.showModal();
    const index=Math.max(0,ids.indexOf(link.dataset.startClip));
    drawerRail.scrollLeft=drawerRail.children[index].offsetLeft-drawerRail.children[0].offsetLeft;
    updateDrawerIndex();
    videos.forEach(safePause);
    const selected=drawerRail.children[index].querySelector('video');
    selected.play().catch(()=>{selected.controls=true;});
    drawer.querySelector('.drawer-close').focus({preventScroll:true});
  }));
  drawer?.querySelector('.drawer-close').addEventListener('click',()=>drawer.close());
  drawer?.addEventListener('click',event=>{if(event.target===drawer){const r=drawer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right)drawer.close();}});
  drawer?.addEventListener('close',()=>{
    drawer.querySelectorAll('video').forEach(v=>{safePause(v);mediaObserver?.unobserve(v);const i=videos.indexOf(v);if(i>=0)videos.splice(i,1);});
    drawerRail.replaceChildren();document.body.classList.remove('modal-open');drawerTrigger?.focus({preventScroll:true});schedulePlayback();
  });
  drawerRail?.addEventListener('scroll',updateDrawerIndex,{passive:true});
  drawerRail?.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();goToMedia(drawerIndex+(event.key==='ArrowRight'?1:-1));}});
  drawer?.querySelector('[data-media-prev]').addEventListener('click',()=>goToMedia(drawerIndex-1));
  drawer?.querySelector('[data-media-next]').addEventListener('click',()=>goToMedia(drawerIndex+1));

  const watchPlayer=document.querySelector('#watch-player');
  if (watchPlayer && mediaData) {
    const id=new URLSearchParams(location.search).get('clip');
    const clip=Object.hasOwn(mediaData.clips,id)?mediaData.clips[id]:null;
    if (clip) {
      document.title=`${clip.title} | 박준수`;
      document.querySelector('#watch-title').textContent=clip.title;
      document.querySelector('#watch-page').textContent=`PAGE ${String(clip.page).padStart(2,'0')} · ${clip.project==='vic'?'VICPINKY CARRIER':'LARO-BOT'}`;
      document.querySelector('#watch-back').href=`index.html#p${clip.page}`;
      document.querySelector('.demo-page').classList.toggle('vic',clip.project==='vic');
      watchPlayer.append(makeMedia(clip));schedulePlayback();
    } else {
      const message=document.createElement('p');message.className='watch-error';message.textContent='선택한 영상을 찾을 수 없습니다. 전체 영상 목록에서 다시 선택해 주세요.';watchPlayer.append(message);
    }
  }
})();
