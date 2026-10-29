(() => {
  const FRAME_COUNT = 240;
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const images = [];
  let loadedCount = 0;
  let currentFrame = 1;
  let targetFrame = 1;
  let lastDrawnIndex = -1;

  // Format frame filename
  function getFrameSrc(index) {
    const pad = String(index).padStart(3, '0');
    return `Photos/ezgif-frame-${pad}.jpg`;
  }

  // Draw image to canvas with cover fit and centered crop
  function drawFrame(img) {
    if (!img || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch) return;

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    // Background fill
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, cw, ch);

    // Cover scale calculation
    const scale = Math.max(cw / imgW, ch / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;
    const renderX = (cw - renderW) / 2;
    const renderY = (ch - renderH) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, renderX, renderY, renderW, renderH);
  }

  // Find exact requested image or closest loaded frame
  function getBestImage(index) {
    const zeroBased = Math.max(0, Math.min(FRAME_COUNT - 1, index - 1));
    const exact = images[zeroBased];
    if (exact && exact.complete && exact.naturalWidth > 0) {
      return exact;
    }

    // Search outwards for nearest loaded frame to ensure zero flickering
    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const prev = images[zeroBased - offset];
      if (prev && prev.complete && prev.naturalWidth > 0) return prev;
      const next = images[zeroBased + offset];
      if (next && next.complete && next.naturalWidth > 0) return next;
    }

    return null;
  }

  // Handle canvas sizing and retina display scaling
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    const targetWidth = Math.floor(w * dpr);
    const targetHeight = Math.floor(h * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      lastDrawnIndex = -1; // force redraw on size change
    }
  }

  // Preload all frames concurrently
  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      const currentInt = Math.round(currentFrame);
      if (i === 1 || i === currentInt) {
        lastDrawnIndex = -1;
      }
    };
    img.onerror = () => {
      loadedCount++;
    };
    img.src = getFrameSrc(i);

    if (img.complete && img.naturalWidth > 0) {
      loadedCount++;
    }

    images.push(img);
  }

  // Calculate target frame from scroll progress (100% background clarity throughout)
  function updateScrollProgress() {
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    // Proportionally map 0% at page top to 100% exactly where the footer ends
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    targetFrame = 1 + progress * (FRAME_COUNT - 1);
  }

  // Animation Loop with smooth lerp dampening
  function animate() {
    resizeCanvas();

    // Lerp towards targetFrame (0.09 gives a buttery, responsive feel)
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.001) {
      currentFrame += diff * 0.09;
    } else {
      currentFrame = targetFrame;
    }

    const frameInt = Math.min(FRAME_COUNT, Math.max(1, Math.round(currentFrame)));

    if (frameInt !== lastDrawnIndex) {
      const img = getBestImage(frameInt);
      if (img) {
        drawFrame(img);
        lastDrawnIndex = frameInt;
      }
    }

    requestAnimationFrame(animate);
  }

  // Event Listeners
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    updateScrollProgress();
    lastDrawnIndex = -1;
  });

  // Initial draw
  resizeCanvas();
  updateScrollProgress();

  const initialImg = getBestImage(1);
  if (initialImg) {
    drawFrame(initialImg);
    lastDrawnIndex = 1;
  }

  // Back to top button smooth scroll
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Social links cursor aura follower
  const socialFollower = document.createElement('div');
  socialFollower.className = 'social-cursor-aura';
  document.body.appendChild(socialFollower);

  window.addEventListener('mousemove', (e) => {
    socialFollower.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }, { passive: true });

  document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      const color = link.getAttribute('data-color') || '#ffffff';
      socialFollower.style.setProperty('--aura-color', color);
      socialFollower.classList.add('is-active');
    });
    link.addEventListener('mouseleave', () => {
      socialFollower.classList.remove('is-active');
    });
  });

  requestAnimationFrame(animate);
})();
