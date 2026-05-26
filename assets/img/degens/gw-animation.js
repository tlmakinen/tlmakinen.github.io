function makeBlackHoleInspiralAnimation({
  selector = ".gw-animation",
  duration = 6.0,
  fps = 30,
  trailLength = 45
} = {}) {
  const containers = document.querySelectorAll(selector);

  containers.forEach(container => {
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function linspace(start, stop, n) {
      const arr = new Array(n);
      const step = (stop - start) / (n - 1);

      for (let i = 0; i < n; i++) {
        arr[i] = start + i * step;
      }

      return arr;
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getForegroundColor() {
      const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--global-text-color")
        .trim();

      if (themeColor) return themeColor;

      return getComputedStyle(container).color || "black";
    }

    function worldToScreen(x, y, bounds, panel) {
      const { xmin, xmax, ymin, ymax } = bounds;
      const { x0, y0, w, h } = panel;

      const sx = x0 + ((x - xmin) / (xmax - xmin)) * w;
      const sy = y0 + h - ((y - ymin) / (ymax - ymin)) * h;

      return [sx, sy];
    }

    const nframes = Math.floor(duration * fps);

    const t = linspace(0, duration, nframes);
    const dt = t[1] - t[0];

    const r0 = 2.8;
    const r1 = 0.35;
    const omega0 = 2.5;

    const u = t.map(v => v / duration);

    const sep = u.map(v =>
      r1 + (r0 - r1) * Math.pow(1 - v, 0.55)
    );

    const omega = sep.map(s =>
      omega0 * Math.pow(r0 / s, 1.5)
    );

    const phi = new Array(nframes);
    let phaseSum = 0;

    for (let i = 0; i < nframes; i++) {
      phaseSum += omega[i] * dt;
      phi[i] = phaseSum;
    }

    const x1 = new Array(nframes);
    const y1 = new Array(nframes);
    const x2 = new Array(nframes);
    const y2 = new Array(nframes);

    for (let i = 0; i < nframes; i++) {
      x1[i] = 0.5 * sep[i] * Math.cos(phi[i]);
      y1[i] = 0.5 * sep[i] * Math.sin(phi[i]);

      x2[i] = -x1[i];
      y2[i] = -y1[i];
    }

    let amp = sep.map(s => r0 / s);
    const maxAmp = Math.max(...amp);
    amp = amp.map(a => a / maxAmp);

    const fade = u.map(v =>
      Math.exp(-Math.pow((v - 0.97) / 0.08, 4))
    );

    let h = new Array(nframes);

    for (let i = 0; i < nframes; i++) {
      h[i] = amp[i] * Math.sin(2 * phi[i]) * fade[i];
    }

    const maxAbsH = Math.max(...h.map(Math.abs));
    h = h.map(v => v / maxAbsH);

    function drawFrame(i) {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const fg = getForegroundColor();

      ctx.clearRect(0, 0, width, height);

      const padding = Math.max(18, width * 0.035);

      const orbitPanel = {
        x0: padding,
        y0: padding,
        w: width - 2 * padding,
        h: height * 0.70 - padding
      };

      const wavePanel = {
        x0: padding,
        y0: height * 0.76,
        w: width - 2 * padding,
        h: height * 0.18
      };

      const orbitBounds = {
        xmin: -1.7,
        xmax: 1.7,
        ymin: -1.7,
        ymax: 1.7
      };

      const j0 = Math.max(0, i - trailLength);

      ctx.save();
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      for (let j = j0; j <= i; j++) {
        const [sx, sy] = worldToScreen(x1[j], y1[j], orbitBounds, orbitPanel);
        if (j === j0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let j = j0; j <= i; j++) {
        const [sx, sy] = worldToScreen(x2[j], y2[j], orbitBounds, orbitPanel);
        if (j === j0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.restore();

      const [bh1x, bh1y] = worldToScreen(x1[i], y1[i], orbitBounds, orbitPanel);
      const [bh2x, bh2y] = worldToScreen(x2[i], y2[i], orbitBounds, orbitPanel);

      ctx.fillStyle = fg;

      ctx.beginPath();
      ctx.arc(bh1x, bh1y, 7, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bh2x, bh2y, 7, 0, 2 * Math.PI);
      ctx.fill();

      const fgw = omega[i] / Math.PI;

      ctx.fillStyle = fg;
      ctx.font =
        "13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
      ctx.textBaseline = "top";

      const textX = orbitPanel.x0;
      const textY = orbitPanel.y0 + orbitPanel.h - 52;

      ctx.fillText(`t = ${t[i].toFixed(2)} s`, textX, textY);
      ctx.fillText(`separation = ${sep[i].toFixed(2)}`, textX, textY + 18);
      ctx.fillText(`GW freq. ~ ${fgw.toFixed(2)} Hz`, textX, textY + 36);

      const waveBounds = {
        xmin: 0,
        xmax: duration,
        ymin: -1.2,
        ymax: 1.2
      };

      ctx.save();
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let j = 0; j < nframes; j++) {
        const [sx, sy] = worldToScreen(t[j], h[j], waveBounds, wavePanel);
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.restore();

      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let j = 0; j <= i; j++) {
        const [sx, sy] = worldToScreen(t[j], h[j], waveBounds, wavePanel);
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      const [wx, wy] = worldToScreen(t[i], h[i], waveBounds, wavePanel);

      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(wx, wy, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font =
        "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
      ctx.textBaseline = "alphabetic";

      ctx.fillText("Strain", wavePanel.x0, wavePanel.y0 - 8);
      ctx.fillText("Time [s]", wavePanel.x0 + wavePanel.w - 58, wavePanel.y0 + wavePanel.h + 20);
    }

    let startTime = null;

    function animate(timestamp) {
      if (startTime === null) startTime = timestamp;

      const elapsed = ((timestamp - startTime) / 1000) % duration;

      const i = Math.min(
        nframes - 1,
        Math.floor((elapsed / duration) * nframes)
      );

      drawFrame(i);

      requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(animate);
    } else {
      drawFrame(0);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  makeBlackHoleInspiralAnimation();
});
