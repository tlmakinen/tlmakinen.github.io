function makeDjInspiralDeckAnimation({
    selector = ".dj-inspiral-deck",
    duration = 6.0,
    fps = 30,
    trailLength = 45
  } = {}) {
    const containers = document.querySelectorAll(selector);
  
    containers.forEach((container) => {
      const canvas = container.querySelector("canvas");
      if (!canvas) return;
  
      const ctx = canvas.getContext("2d");
  
      function linspace(start, stop, n) {
        const arr = new Array(n);
        const step = (stop - start) / (n - 1);
        for (let i = 0; i < n; i++) arr[i] = start + i * step;
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
  
      function roundedRectPath(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
  
      function rotatePoint(x, y, angle) {
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        return [x * ca - y * sa, x * sa + y * ca];
      }
  
      function drawCircle(x, y, r, fg, fillAlpha = 0, strokeAlpha = 1, lineWidth = 1.5) {
        ctx.save();
        if (fillAlpha > 0) {
          ctx.globalAlpha = fillAlpha;
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalAlpha = strokeAlpha;
        ctx.strokeStyle = fg;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
  
      function drawKnob(cx, cy, r, fg) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
  
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 0.58 * r, cy - 0.58 * r);
        ctx.stroke();
        ctx.restore();
      }
  
      function drawSlider(x, y, w, h, value, fg) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = fg;
        roundedRectPath(x, y, w, h, Math.min(6, h / 2));
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.2;
        roundedRectPath(x, y, w, h, Math.min(6, h / 2));
        ctx.stroke();
  
        const knobW = Math.max(16, w * 0.16);
        const knobH = h + 6;
        const knobX = x + value * (w - knobW);
        const knobY = y - 3;
  
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = fg;
        roundedRectPath(knobX, knobY, knobW, knobH, 6);
        ctx.fill();
  
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = fg;
        roundedRectPath(knobX, knobY, knobW, knobH, 6);
        ctx.stroke();
        ctx.restore();
      }
  
      // ------------------------------------------------------------
      // Toy inspiral + chirp waveform
      // ------------------------------------------------------------
  
      const nframes = Math.floor(duration * fps);
  
      const t = linspace(0, duration, nframes);
      const dt = t[1] - t[0];
  
      const r0 = 2.8;
      const r1 = 0.35;
      const u = t.map((v) => v / duration);
      const sep = u.map((v) => r1 + (r0 - r1) * Math.pow(1 - v, 0.55));
  
      const omega0 = 2.5;
      const omega = sep.map((s) => omega0 * Math.pow(r0 / s, 1.5));
  
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
  
      let amp = sep.map((s) => r0 / s);
      const maxAmp = Math.max(...amp);
      amp = amp.map((a) => a / maxAmp);
  
      const fade = u.map((v) => Math.exp(-Math.pow((v - 0.97) / 0.08, 4)));
  
      let h = new Array(nframes);
      for (let i = 0; i < nframes; i++) {
        h[i] = amp[i] * Math.sin(2 * phi[i]) * fade[i];
      }
  
      const maxAbsH = Math.max(...h.map(Math.abs));
      h = h.map((v) => v / maxAbsH);
  
      function drawFrame(frame, elapsedSeconds) {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const fg = getForegroundColor();
  
        ctx.clearRect(0, 0, width, height);
  
        const pad = Math.max(16, width * 0.025);
  
        const deckX = pad;
        const deckY = pad;
        const deckW = width - 2 * pad;
        const deckH = height - 2 * pad;
  
        // Deck body
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = fg;
        roundedRectPath(deckX, deckY, deckW, deckH, 20);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1.6;
        roundedRectPath(deckX, deckY, deckW, deckH, 20);
        ctx.stroke();
        ctx.restore();
  
        // Small corner screws
        const screwR = 3;
        [
          [deckX + 18, deckY + 18],
          [deckX + deckW - 18, deckY + 18],
          [deckX + 18, deckY + deckH - 18],
          [deckX + deckW - 18, deckY + deckH - 18]
        ].forEach(([sx, sy]) => {
          drawCircle(sx, sy, screwR, fg, 0.10, 0.5, 1);
        });
  
        // Layout
        const platterCx = deckX + deckW * 0.34;
        const platterCy = deckY + deckH * 0.40;
        const platterR = Math.min(deckW, deckH) * 0.24;
  
        const scopeX = deckX + deckW * 0.10;
        const scopeY = deckY + deckH * 0.72;
        const scopeW = deckW * 0.80;
        const scopeH = deckH * 0.14;
  
        const controlsX = deckX + deckW * 0.73;
        const controlsY = deckY + deckH * 0.18;
  
        // --------------------------------------------------------
        // Vinyl platter
        // --------------------------------------------------------
  
        drawCircle(platterCx, platterCy, platterR * 1.08, fg, 0.04, 0.45, 2);
        drawCircle(platterCx, platterCy, platterR * 0.93, fg, 0.08, 0.65, 1.8);
  
        ctx.save();
        ctx.beginPath();
        ctx.arc(platterCx, platterCy, platterR * 0.92, 0, 2 * Math.PI);
        ctx.clip();
  
        // Record fill
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(platterCx, platterCy, platterR * 0.92, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
  
        // Grooves
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.16;
        ctx.lineWidth = 1;
  
        for (let k = 0; k < 13; k++) {
          const rr = platterR * (0.20 + 0.055 * k);
          ctx.beginPath();
          ctx.arc(platterCx, platterCy, rr, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.restore();
  
        // Subtle rotating tick lines so the platter feels like it spins
        const spinAngle = elapsedSeconds * 2.2 * Math.PI;
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.10;
        ctx.lineWidth = 1;
  
        for (let k = 0; k < 16; k++) {
          const a = spinAngle + (k / 16) * 2 * Math.PI;
          const rA = platterR * 0.32;
          const rB = platterR * 0.90;
          const xA = platterCx + rA * Math.cos(a);
          const yA = platterCy + rA * Math.sin(a);
          const xB = platterCx + rB * Math.cos(a);
          const yB = platterCy + rB * Math.sin(a);
          ctx.beginPath();
          ctx.moveTo(xA, yA);
          ctx.lineTo(xB, yB);
          ctx.stroke();
        }
        ctx.restore();
  
        // Inspiral inside the record
        const scale = platterR * 0.50;
        const j0 = Math.max(0, frame - trailLength);
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.60;
        ctx.lineWidth = 1.35;
  
        ctx.beginPath();
        for (let j = j0; j <= frame; j++) {
          const [rx, ry] = rotatePoint(x1[j], y1[j], spinAngle);
          const sx = platterCx + rx * scale;
          const sy = platterCy + ry * scale;
          if (j === j0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
  
        ctx.beginPath();
        for (let j = j0; j <= frame; j++) {
          const [rx, ry] = rotatePoint(x2[j], y2[j], spinAngle);
          const sx = platterCx + rx * scale;
          const sy = platterCy + ry * scale;
          if (j === j0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
  
        const [r1x, r1y] = rotatePoint(x1[frame], y1[frame], spinAngle);
        const [r2x, r2y] = rotatePoint(x2[frame], y2[frame], spinAngle);
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(platterCx + r1x * scale, platterCy + r1y * scale, platterR * 0.055, 0, 2 * Math.PI);
        ctx.fill();
  
        ctx.beginPath();
        ctx.arc(platterCx + r2x * scale, platterCy + r2y * scale, platterR * 0.055, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
  
        // Record label / spindle
        drawCircle(platterCx, platterCy, platterR * 0.17, fg, 0.14, 0.65, 1.4);
        drawCircle(platterCx, platterCy, platterR * 0.025, fg, 0.7, 0.7, 1);
  
        ctx.restore();
  
        // --------------------------------------------------------
        // Tonearm
        // --------------------------------------------------------
  
        // --------------------------------------------------------
        // Rigid tonearm rotating from upper-right axle
        // --------------------------------------------------------

        const progress = frame / (nframes - 1);

        // Fixed axle near the upper-right of the platter/deck
        const armAxleX = platterCx + platterR * 1.28;
        const armAxleY = platterCy - platterR * 0.82;

        // One rigid arm: fixed length, changing angle only
        const armLength = platterR * 0.92;

        // The arm sweeps gently inward across the record
        const armStartAngle = 2.24;
        const armEndAngle = 2.55;
        const armAngle = armStartAngle + progress * (armEndAngle - armStartAngle);

        // Stylus / needle position follows from axle + rigid arm
        const stylusX = armAxleX + armLength * Math.cos(armAngle);
        const stylusY = armAxleY + armLength * Math.sin(armAngle);

        // Main rigid arm
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(armAxleX, armAxleY);
        ctx.lineTo(stylusX, stylusY);
        ctx.stroke();

        ctx.restore();

        // Axle pivot
        drawCircle(armAxleX, armAxleY, platterR * 0.075, {
        fillAlpha: 0.12,
        strokeAlpha: 0.78,
        lineWidth: 1.6
        });

        drawCircle(armAxleX, armAxleY, platterR * 0.030, {
        fillAlpha: 0.55,
        strokeAlpha: 0.80,
        lineWidth: 1.2
        });

        // Cartridge near the stylus, aligned with the rigid arm
        const cartridgeLength = platterR * 0.18;
        const cartridgeWidth = platterR * 0.07;

        const cartCx = stylusX - Math.cos(armAngle) * cartridgeLength * 0.45;
        const cartCy = stylusY - Math.sin(armAngle) * cartridgeLength * 0.45;

        ctx.save();
        ctx.translate(cartCx, cartCy);
        ctx.rotate(armAngle);

        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.14;
        roundedRectPath(
        -cartridgeLength / 2,
        -cartridgeWidth / 2,
        cartridgeLength,
        cartridgeWidth,
        4
        );
        ctx.fill();

        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.2;
        roundedRectPath(
        -cartridgeLength / 2,
        -cartridgeWidth / 2,
        cartridgeLength,
        cartridgeWidth,
        4
        );
        ctx.stroke();

        ctx.restore();

        // Short needle tip at the stylus
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.90;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(stylusX, stylusY);
        ctx.lineTo(
        stylusX + Math.cos(armAngle + Math.PI / 2) * 8,
        stylusY + Math.sin(armAngle + Math.PI / 2) * 8
        );
        ctx.stroke();

        ctx.restore();
  
        // --------------------------------------------------------
        // Cartoon controls
        // --------------------------------------------------------
  
        drawKnob(controlsX + 26, controlsY + 16, 16, fg);
        drawKnob(controlsX + 82, controlsY + 16, 16, fg);
        drawKnob(controlsX + 54, controlsY + 64, 20, fg);
  
        drawSlider(controlsX + 4, controlsY + 112, 100, 10, 0.62, fg);
  
        // Tiny record-start button
        drawCircle(controlsX + 20, controlsY + 148, 7, fg, 0.18, 0.7, 1.2);
  
        // --------------------------------------------------------
        // Oscilloscope box with chirp waveform
        // --------------------------------------------------------
  
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = fg;
        roundedRectPath(scopeX, scopeY, scopeW, scopeH, 14);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1.4;
        roundedRectPath(scopeX, scopeY, scopeW, scopeH, 14);
        ctx.stroke();
        ctx.restore();
  
        const innerPad = 10;
        const plotX = scopeX + innerPad;
        const plotY = scopeY + innerPad;
        const plotW = scopeW - 2 * innerPad;
        const plotH = scopeH - 2 * innerPad;
        const midY = plotY + plotH / 2;
  
        // Clip to the scope display
        ctx.save();
        roundedRectPath(plotX, plotY, plotW, plotH, 8);
        ctx.clip();
  
        // Scope grid
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = 1;
  
        for (let gx = 1; gx < 10; gx++) {
          const x = plotX + (gx / 10) * plotW;
          ctx.beginPath();
          ctx.moveTo(x, plotY);
          ctx.lineTo(x, plotY + plotH);
          ctx.stroke();
        }
  
        for (let gy = 1; gy < 4; gy++) {
          const y = plotY + (gy / 4) * plotH;
          ctx.beginPath();
          ctx.moveTo(plotX, y);
          ctx.lineTo(plotX + plotW, y);
          ctx.stroke();
        }
        ctx.restore();
  
        // Faint full waveform
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let j = 0; j < nframes; j++) {
          const x = plotX + (j / (nframes - 1)) * plotW;
          const y = midY - h[j] * (plotH * 0.38);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
  
        // Live trace
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j <= frame; j++) {
          const x = plotX + (j / (nframes - 1)) * plotW;
          const y = midY - h[j] * (plotH * 0.38);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
  
        // Scan dot
        const dotX = plotX + (frame / (nframes - 1)) * plotW;
        const dotY = midY - h[frame] * (plotH * 0.38);
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
  
        ctx.restore();
      }
  
      let startTime = null;
  
      function animate(timestamp) {
        if (startTime === null) startTime = timestamp;
  
        const secondsPerFrame = 1 / fps;
        const elapsed = (timestamp - startTime) / 1000;
        const frame = Math.floor(elapsed / secondsPerFrame) % nframes;
  
        drawFrame(frame, elapsed);
        requestAnimationFrame(animate);
      }
  
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
  
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        drawFrame(0, 0);
      } else {
        requestAnimationFrame(animate);
      }
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    makeDjInspiralDeckAnimation();
  });