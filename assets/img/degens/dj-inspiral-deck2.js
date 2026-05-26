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
  
      function drawText(text, x, y, options = {}) {
        const {
          size = 12,
          align = "left",
          baseline = "top",
          alpha = 1
        } = options;
  
        ctx.save();
        ctx.fillStyle = getForegroundColor();
        ctx.globalAlpha = alpha;
        ctx.font =
          `${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, ` +
          `"Liberation Mono", "Courier New", monospace`;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(text, x, y);
        ctx.restore();
      }
  
      function drawCircle(x, y, r, { fillAlpha = 0, strokeAlpha = 1, lineWidth = 1.5 } = {}) {
        const fg = getForegroundColor();
  
        ctx.save();
  
        if (fillAlpha > 0) {
          ctx.fillStyle = fg;
          ctx.globalAlpha = fillAlpha;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fill();
        }
  
        ctx.strokeStyle = fg;
        ctx.globalAlpha = strokeAlpha;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();
  
        ctx.restore();
      }
  
      function drawKnob(cx, cy, r) {
        const fg = getForegroundColor();
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
  
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(cx - r * 0.22, cy - r * 0.28, r * 0.42, 0, 2 * Math.PI);
        ctx.stroke();
  
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 0.62 * r, cy - 0.48 * r);
        ctx.stroke();
        ctx.restore();
      }
  
      function drawSlider(x, y, w, h, value) {
        const fg = getForegroundColor();
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.10;
        roundedRectPath(x, y, w, h, Math.min(7, h / 2));
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.4;
        roundedRectPath(x, y, w, h, Math.min(7, h / 2));
        ctx.stroke();
  
        const knobW = Math.max(18, w * 0.15);
        const knobH = h + 8;
        const knobX = x + value * (w - knobW);
        const knobY = y - 4;
  
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = fg;
        roundedRectPath(knobX, knobY, knobW, knobH, 6);
        ctx.fill();
  
        ctx.globalAlpha = 0.85;
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
  
      function drawMiniGwScreen(x, y, w, h, elapsedSeconds) {
        const fg = getForegroundColor();
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.10;
        roundedRectPath(x, y, w, h, 10);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.70;
        ctx.lineWidth = 1.5;
        roundedRectPath(x, y, w, h, 10);
        ctx.stroke();
        ctx.restore();
  
        const pad = 9;
        const innerX = x + pad;
        const innerY = y + pad;
        const innerW = w - 2 * pad;
        const innerH = h - 2 * pad;
  
        ctx.save();
        roundedRectPath(innerX, innerY, innerW, innerH, 7);
        ctx.clip();
  
        // Subtle analog scan lines.
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.10;
        ctx.lineWidth = 1;
  
        for (let sy = innerY + 3; sy < innerY + innerH; sy += 5) {
          ctx.beginPath();
          ctx.moveTo(innerX, sy);
          ctx.lineTo(innerX + innerW, sy);
          ctx.stroke();
        }
  
        ctx.restore();
  
        // Little moving monitor trace.
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.30;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
  
        for (let i = 0; i <= 60; i++) {
          const px = innerX + (i / 60) * innerW;
          const local = elapsedSeconds * 2.4 + i * 0.28;
          const py = innerY + innerH * 0.78 + Math.sin(local) * innerH * 0.05;
  
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
  
        ctx.stroke();
        ctx.restore();
  
        ctx.restore();
  
        drawText("gw :: inspiral", x + 12, y + 11, { size: 11, alpha: 0.95 });
        drawText("h(t) :: chirp", x + 12, y + 27, { size: 11, alpha: 0.95 });
        drawText("strain :: live", x + 12, y + 43, { size: 11, alpha: 0.95 });
      }
  
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
  
        // --------------------------------------------------------
        // Deck body
        // --------------------------------------------------------
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.07;
        roundedRectPath(deckX, deckY, deckW, deckH, 24);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 2.2;
        roundedRectPath(deckX, deckY, deckW, deckH, 24);
        ctx.stroke();
        ctx.restore();
  
        // Inner faceplate.
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.03;
        roundedRectPath(deckX + 10, deckY + 10, deckW - 20, deckH - 20, 18);
        ctx.fill();
        ctx.restore();
  
        // Cartoon feet.
        [[0.15, 0.95], [0.85, 0.95]].forEach(([fx, fy]) => {
          const cx = deckX + deckW * fx;
          const cy = deckY + deckH * fy;
  
          ctx.save();
          ctx.fillStyle = fg;
          ctx.globalAlpha = 0.12;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 22, 7, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        });
  
        // Corner bolts.
        [
          [deckX + 20, deckY + 20],
          [deckX + deckW - 20, deckY + 20],
          [deckX + 20, deckY + deckH - 20],
          [deckX + deckW - 20, deckY + deckH - 20]
        ].forEach(([sx, sy]) => {
          drawCircle(sx, sy, 3.3, {
            fillAlpha: 0.10,
            strokeAlpha: 0.55,
            lineWidth: 1
          });
        });
  
        // --------------------------------------------------------
        // Layout
        // --------------------------------------------------------
  
        const platterCx = deckX + deckW * 0.34;
        const platterCy = deckY + deckH * 0.39;
        const platterR = Math.min(deckW, deckH) * 0.24;
  
        const scopeX = deckX + deckW * 0.10;
        const scopeY = deckY + deckH * 0.72;
        const scopeW = deckW * 0.80;
        const scopeH = deckH * 0.14;
  
        const controlsPanelX = deckX + deckW * 0.69;
        const controlsPanelY = deckY + deckH * 0.14;
        const controlsPanelW = deckW * 0.18;
        const controlsPanelH = deckH * 0.34;
  
        const miniScreenX = controlsPanelX;
        const miniScreenY = controlsPanelY + controlsPanelH + 14;
        const miniScreenW = controlsPanelW;
        const miniScreenH = deckH * 0.16;
  
        // --------------------------------------------------------
        // Controls panel
        // --------------------------------------------------------
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.05;
        roundedRectPath(controlsPanelX, controlsPanelY, controlsPanelW, controlsPanelH, 16);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.60;
        ctx.lineWidth = 1.5;
        roundedRectPath(controlsPanelX, controlsPanelY, controlsPanelW, controlsPanelH, 16);
        ctx.stroke();
        ctx.restore();
  
        const knobY1 = controlsPanelY + 34;
        const knobY2 = controlsPanelY + 86;
        const knobX1 = controlsPanelX + controlsPanelW * 0.28;
        const knobX2 = controlsPanelX + controlsPanelW * 0.72;
        const knobX3 = controlsPanelX + controlsPanelW * 0.50;
  
        drawKnob(knobX1, knobY1, 16);
        drawKnob(knobX2, knobY1, 16);
        drawKnob(knobX3, knobY2, 20);
  
        drawSlider(
          controlsPanelX + controlsPanelW * 0.12,
          controlsPanelY + controlsPanelH - 26,
          controlsPanelW * 0.76,
          10,
          0.62
        );
  
        // Playful tick marks around the big knob.
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 1;
  
        for (let i = -2; i <= 2; i++) {
          const a = -Math.PI * 0.80 + (i + 2) * (Math.PI * 0.40 / 4);
          const xA = knobX3 + Math.cos(a) * 28;
          const yA = knobY2 + Math.sin(a) * 28;
          const xB = knobX3 + Math.cos(a) * 34;
          const yB = knobY2 + Math.sin(a) * 34;
  
          ctx.beginPath();
          ctx.moveTo(xA, yA);
          ctx.lineTo(xB, yB);
          ctx.stroke();
        }
  
        ctx.restore();
  
        drawMiniGwScreen(
          miniScreenX,
          miniScreenY,
          miniScreenW,
          miniScreenH,
          elapsedSeconds
        );
  
        // --------------------------------------------------------
        // Vinyl platter
        // --------------------------------------------------------
  
        drawCircle(platterCx, platterCy, platterR * 1.07, {
          fillAlpha: 0.04,
          strokeAlpha: 0.50,
          lineWidth: 2.0
        });
  
        drawCircle(platterCx, platterCy, platterR * 0.93, {
          fillAlpha: 0.10,
          strokeAlpha: 0.75,
          lineWidth: 1.8
        });
  
        ctx.save();
        ctx.beginPath();
        ctx.arc(platterCx, platterCy, platterR * 0.92, 0, 2 * Math.PI);
        ctx.clip();
  
        // Record fill.
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.arc(platterCx, platterCy, platterR * 0.92, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
  
        // Cartoon highlight.
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.20;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          platterCx - platterR * 0.12,
          platterCy - platterR * 0.08,
          platterR * 0.58,
          3.8,
          5.2
        );
        ctx.stroke();
        ctx.restore();
  
        // Grooves.
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
  
        // Rotating tick marks for vinyl motion.
        const spinAngle = elapsedSeconds * 2.2 * Math.PI;
  
        // This makes the black-hole masses visibly orbit inside the vinyl,
        // rather than appearing stuck to the record.
        const blackHoleOrbitBoost = 2.8;
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.11;
        ctx.lineWidth = 1;
  
        for (let k = 0; k < 18; k++) {
          const a = spinAngle + (k / 18) * 2 * Math.PI;
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
  
        // --------------------------------------------------------
        // Spinning inspiral inside the vinyl
        // --------------------------------------------------------
  
        const scale = platterR * 0.50;
        const j0 = Math.max(0, frame - trailLength);
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.62;
        ctx.lineWidth = 1.45;
  
        // Trail for black hole 1.
        ctx.beginPath();
  
        for (let j = j0; j <= frame; j++) {
          const r = 0.5 * sep[j];
          const a = blackHoleOrbitBoost * phi[j] + spinAngle;
  
          const sx = platterCx + r * Math.cos(a) * scale;
          const sy = platterCy + r * Math.sin(a) * scale;
  
          if (j === j0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
  
        ctx.stroke();
  
        // Trail for black hole 2.
        ctx.beginPath();
  
        for (let j = j0; j <= frame; j++) {
          const r = 0.5 * sep[j];
          const a = blackHoleOrbitBoost * phi[j] + spinAngle + Math.PI;
  
          const sx = platterCx + r * Math.cos(a) * scale;
          const sy = platterCy + r * Math.sin(a) * scale;
  
          if (j === j0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
  
        ctx.stroke();
        ctx.restore();
  
        // Current black-hole positions.
        const currentR = 0.5 * sep[frame];
        const currentA1 = blackHoleOrbitBoost * phi[frame] + spinAngle;
        const currentA2 = currentA1 + Math.PI;
  
        const bh1x = platterCx + currentR * Math.cos(currentA1) * scale;
        const bh1y = platterCy + currentR * Math.sin(currentA1) * scale;
  
        const bh2x = platterCx + currentR * Math.cos(currentA2) * scale;
        const bh2y = platterCy + currentR * Math.sin(currentA2) * scale;
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 1;
  
        ctx.beginPath();
        ctx.arc(bh1x, bh1y, platterR * 0.055, 0, 2 * Math.PI);
        ctx.fill();
  
        ctx.beginPath();
        ctx.arc(bh2x, bh2y, platterR * 0.055, 0, 2 * Math.PI);
        ctx.fill();
  
        ctx.restore();
  
        // Centre label / spindle.
        drawCircle(platterCx, platterCy, platterR * 0.17, {
          fillAlpha: 0.16,
          strokeAlpha: 0.70,
          lineWidth: 1.4
        });
  
        drawCircle(platterCx, platterCy, platterR * 0.025, {
          fillAlpha: 0.75,
          strokeAlpha: 0.75,
          lineWidth: 1
        });
  
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
        // Oscilloscope-style chirp box
        // --------------------------------------------------------
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.08;
        roundedRectPath(scopeX, scopeY, scopeW, scopeH, 14);
        ctx.fill();
        ctx.restore();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.70;
        ctx.lineWidth = 1.8;
        roundedRectPath(scopeX, scopeY, scopeW, scopeH, 14);
        ctx.stroke();
        ctx.restore();
  
        const innerPad = 10;
        const plotX = scopeX + innerPad;
        const plotY = scopeY + innerPad;
        const plotW = scopeW - 2 * innerPad;
        const plotH = scopeH - 2 * innerPad;
        const midY = plotY + plotH / 2;
  
        ctx.save();
        roundedRectPath(plotX, plotY, plotW, plotH, 8);
        ctx.clip();
  
        // Scope grid.
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
  
        // Faint full chirp.
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
  
        // Live trace.
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
  
        // Scan dot.
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