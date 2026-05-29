import { memo, useEffect, useRef } from 'react';

function Starfield({
  id,
  density,
  minR,
  maxR,
  baseAlpha,
  color,
  bgGradient = false,
  twinkle = false,
  twinkleRatio = 0.12,
  drift = null,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const staticCanvas = document.createElement('canvas');
    const staticCtx = staticCanvas.getContext('2d');
    let stars = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastDraw = 0;
    let lastTime = performance.now();
    let ox = 0;
    let oy = 0;
    const frameMs = 50;
    const driftX = drift?.x || 0;
    const driftY = drift?.y || 0;

    function drawBg(targetCtx) {
      if (!bgGradient) return;
      const gradient = targetCtx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.2);
      gradient.addColorStop(0, '#0a1428');
      gradient.addColorStop(1, '#03060c');
      targetCtx.fillStyle = gradient;
      targetCtx.fillRect(0, 0, width, height);
    }

    function drawStaticStarsTo(targetCtx) {
      for (const star of stars) {
        if (star.twinkles) continue;
        targetCtx.beginPath();
        targetCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        targetCtx.fillStyle = `rgba(${color}, ${Math.min(1, star.baseA)})`;
        targetCtx.fill();
        if (star.r > 1.2) {
          targetCtx.beginPath();
          targetCtx.arc(star.x, star.y, star.r * 2.4, 0, Math.PI * 2);
          targetCtx.fillStyle = `rgba(${color}, ${star.baseA * 0.1})`;
          targetCtx.fill();
        }
      }
    }

    function drawStatic() {
      staticCanvas.width = width;
      staticCanvas.height = height;
      drawBg(staticCtx);
      drawStaticStarsTo(staticCtx);
      if (!twinkle && !drift) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(staticCanvas, 0, 0);
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      stars = [];
      const count = Math.floor((width * height) / density);
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * maxR + minR,
          baseA: Math.random() * 0.5 + baseAlpha,
          phase: Math.random() * Math.PI * 2,
          twinkles: twinkle && Math.random() < twinkleRatio,
          speed: 0.00045 + Math.random() * 0.0007,
        });
      }
      drawStatic();
    }

    function loop(t) {
      // Skip the per-frame star redraw when the tab is hidden or this canvas is
      // not displayed (e.g. covered/hidden under the atlas parchment theme).
      if (document.hidden || canvas.offsetParent === null) {
        frameId = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(100, t - lastTime) / 1000;
      lastTime = t;
      ox = (ox + driftX * dt) % width;
      oy = (oy + driftY * dt) % height;
      if (ox < 0) ox += width;
      if (oy < 0) oy += height;

      if (t - lastDraw >= frameMs) {
        lastDraw = t;
        ctx.clearRect(0, 0, width, height);
        if (drift) {
          ctx.drawImage(staticCanvas, ox, oy);
          ctx.drawImage(staticCanvas, ox - width, oy);
          ctx.drawImage(staticCanvas, ox, oy - height);
          ctx.drawImage(staticCanvas, ox - width, oy - height);
        } else {
          ctx.drawImage(staticCanvas, 0, 0);
        }

        if (twinkle) {
          for (const star of stars) {
            if (!star.twinkles) continue;
            const alpha = star.baseA + Math.sin(t * star.speed + star.phase) * 0.32;
            if (alpha <= 0) continue;
            const x = drift ? ((star.x + ox) % width + width) % width : star.x;
            const y = drift ? ((star.y + oy) % height + height) % height : star.y;
            ctx.beginPath();
            ctx.arc(x, y, star.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${Math.min(1, alpha)})`;
            ctx.fill();
            if (star.r > 1) {
              ctx.beginPath();
              ctx.arc(x, y, star.r * 2.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${color}, ${alpha * 0.15})`;
              ctx.fill();
            }
          }
        }
      }
      frameId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    resize();
    if (twinkle || drift) frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [baseAlpha, bgGradient, color, density, drift, maxR, minR, twinkle, twinkleRatio]);

  return <canvas id={id} ref={canvasRef} />;
}

export default memo(Starfield);
