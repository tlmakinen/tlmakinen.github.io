function makeEmc2DegeneracyAnimation({
    selector = ".emc2-animation",
    framesPerAct = 120,
    fps = 20
  } = {}) {
    const containers = document.querySelectorAll(selector);
  
    containers.forEach(container => {
      const canvas = container.querySelector("canvas");
      if (!canvas) return;
  
      const ctx = canvas.getContext("2d");
  
      // ------------------------------------------------------------
      // Toy E = m c^2 degeneracy animation
      // ------------------------------------------------------------
  
      const nLevels = [1, 2, 3, 4, 5, 6, 7];
  
      const mMin = 0.5;
      const mMax = 5.0;
      const cMin = 0.5;
      const cMax = 5.0;
  
      const m0 = 2.0;
      const c0 = 3.0;
      const E0 = m0 * c0 * c0;
  
      const totalFrames = 2 * framesPerAct;
  
      const contourLevels = [2, 4, 8, 16, 32, 64, 96];
  
      let pathM = [];
      let pathC = [];
  
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
  
      function smoothstep(t) {
        return 3 * t * t - 2 * t * t * t;
      }
  
      function getParameters(frame) {
        let t;
        let m;
        let c;
        let label;
  
        if (frame < framesPerAct) {
          t = frame / (framesPerAct - 1);
          t = smoothstep(t);
  
          m = 0.8 + 3.4 * t;
          c = c0;
  
          label = "Act I: changing mass while c is fixed - the spectrum changes";
        } else {
          t = (frame - framesPerAct) / (framesPerAct - 1);
          t = smoothstep(t);
  
          m = 0.8 + 3.4 * t;
          c = Math.sqrt(E0 / m);
  
          label = "Act II: changing mass and c together - the spectrum stays the same";
        }
  
        return { m, c, label };
      }
  
      function worldToScreen(x, y, bounds, panel) {
        const sx = panel.x + ((x - bounds.xmin) / (bounds.xmax - bounds.xmin)) * panel.w;
        const sy = panel.y + panel.h - ((y - bounds.ymin) / (bounds.ymax - bounds.ymin)) * panel.h;
  
        return [sx, sy];
      }
  
      function drawText(text, x, y, options = {}) {
        const {
          size = 12,
          align = "left",
          baseline = "top",
          color = getForegroundColor(),
          alpha = 1
        } = options;
  
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.font =
          `${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, ` +
          `"Liberation Mono", "Courier New", monospace`;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(text, x, y);
        ctx.restore();
      }
  
      function drawRoundedRect(x, y, w, h, r) {
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
  
      function drawAxes(panel, xlabel, ylabel) {
        const fg = getForegroundColor();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
  
        ctx.beginPath();
        ctx.moveTo(panel.x, panel.y + panel.h);
        ctx.lineTo(panel.x + panel.w, panel.y + panel.h);
        ctx.moveTo(panel.x, panel.y);
        ctx.lineTo(panel.x, panel.y + panel.h);
        ctx.stroke();
  
        ctx.restore();
  
        drawText(xlabel, panel.x + panel.w / 2, panel.y + panel.h + 26, {
          size: 12,
          align: "center"
        });
  
        ctx.save();
        ctx.translate(panel.x - 34, panel.y + panel.h / 2);
        ctx.rotate(-Math.PI / 2);
        drawText(ylabel, 0, 0, {
          size: 12,
          align: "center",
          baseline: "middle"
        });
        ctx.restore();
      }
  
      function drawDegeneracyBackground(panel, bounds) {
        const fg = getForegroundColor();
  
        const cols = 70;
        const rows = 70;
  
        const cellW = panel.w / cols;
        const cellH = panel.h / rows;
  
        const eMin = mMin * cMin * cMin;
        const eMax = mMax * cMax * cMax;
        const logMin = Math.log(eMin);
        const logMax = Math.log(eMax);
  
        ctx.save();
        ctx.fillStyle = fg;
  
        for (let ix = 0; ix < cols; ix++) {
          for (let iy = 0; iy < rows; iy++) {
            const m = bounds.xmin + ((ix + 0.5) / cols) * (bounds.xmax - bounds.xmin);
            const c = bounds.ymin + ((iy + 0.5) / rows) * (bounds.ymax - bounds.ymin);
            const E = m * c * c;
  
            const q = (Math.log(E) - logMin) / (logMax - logMin);
  
            ctx.globalAlpha = 0.05 + 0.23 * q;
  
            ctx.fillRect(
              panel.x + ix * cellW,
              panel.y + panel.h - (iy + 1) * cellH,
              cellW + 0.5,
              cellH + 0.5
            );
          }
        }
  
        ctx.restore();
      }
  
      function drawContours(panel, bounds) {
        const fg = getForegroundColor();
  
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.42;
  
        contourLevels.forEach(level => {
          ctx.beginPath();
  
          let started = false;
  
          for (let i = 0; i <= 240; i++) {
            const m = bounds.xmin + (i / 240) * (bounds.xmax - bounds.xmin);
            const c = Math.sqrt(level / m);
  
            if (c < bounds.ymin || c > bounds.ymax) {
              started = false;
              continue;
            }
  
            const [sx, sy] = worldToScreen(m, c, bounds, panel);
  
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          }
  
          ctx.stroke();
  
          const labelM = Math.min(bounds.xmax - 0.15, Math.max(bounds.xmin + 0.15, level / 9));
          const labelC = Math.sqrt(level / labelM);
  
          if (labelC >= bounds.ymin && labelC <= bounds.ymax) {
            const [lx, ly] = worldToScreen(labelM, labelC, bounds, panel);
            drawText(String(level), lx + 4, ly - 4, {
              size: 10,
              alpha: 0.65
            });
          }
        });
  
        ctx.restore();
      }
  
      function drawSpectrum(panel, m, c) {
        const fg = getForegroundColor();
  
        const baseEnergy = m * c * c;
        const energies = nLevels.map(n => n * baseEnergy);
        const maxEnergy = Math.max(80, 1.15 * Math.max(...energies));
  
        const bounds = {
          xmin: 0,
          xmax: maxEnergy,
          ymin: 0.5,
          ymax: nLevels.length + 1
        };
  
        drawText("Observation: the spectrum", panel.x, panel.y - 30, {
          size: 15
        });
  
        drawAxes(panel, "energy", "");
  
        nLevels.forEach((n, i) => {
          const y = i + 1;
          const energy = energies[i];
  
          const [x0, yScreen] = worldToScreen(0, y, bounds, panel);
          const [x1] = worldToScreen(energy, y, bounds, panel);
  
          ctx.save();
          ctx.strokeStyle = fg;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.95;
  
          ctx.beginPath();
          ctx.moveTo(x0, yScreen);
          ctx.lineTo(x1, yScreen);
          ctx.stroke();
  
          ctx.restore();
  
          drawText(`level ${i + 1}: ${energy.toFixed(1)}`, x1 + 8, yScreen, {
            size: 10,
            baseline: "middle"
          });
        });
  
        const boxW = 132;
        const boxH = 74;
        const boxX = panel.x + panel.w * 0.70;
        const boxY = panel.y + panel.h * 0.18;
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.10;
        drawRoundedRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.restore();
  
        drawText(`m = ${m.toFixed(2)}`, boxX + 12, boxY + 12, { size: 12 });
        drawText(`c = ${c.toFixed(2)}`, boxX + 12, boxY + 32, { size: 12 });
        drawText(`m c² = ${baseEnergy.toFixed(2)}`, boxX + 12, boxY + 52, { size: 12 });
      }
  
      function drawMap(panel, m, c) {
        const fg = getForegroundColor();
  
        const bounds = {
          xmin: mMin,
          xmax: mMax,
          ymin: cMin,
          ymax: cMax
        };
  
        drawText("Settings: mass and speed of light", panel.x, panel.y - 30, {
          size: 15
        });
  
        drawDegeneracyBackground(panel, bounds);
        drawContours(panel, bounds);
        drawAxes(panel, "mass m", "speed of light c");
  
        // Path
        ctx.save();
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 2;
  
        ctx.beginPath();
        pathM.forEach((pm, i) => {
          const [sx, sy] = worldToScreen(pm, pathC[i], bounds, panel);
  
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
  
        ctx.restore();
  
        // Current point
        const [px, py] = worldToScreen(m, c, bounds, panel);
  
        ctx.save();
        ctx.fillStyle = fg;
        ctx.globalAlpha = 1;
  
        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, 2 * Math.PI);
        ctx.fill();
  
        ctx.restore();
      }
  
      function drawFrame(frame) {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
  
        const fg = getForegroundColor();
  
        ctx.clearRect(0, 0, width, height);
  
        const { m, c, label } = getParameters(frame);
  
        if (frame === 0 || frame === framesPerAct) {
          pathM = [];
          pathC = [];
        }
  
        pathM.push(m);
        pathC.push(c);
  
        const marginX = Math.max(44, width * 0.055);
        const top = Math.max(52, height * 0.12);
        const bottom = Math.max(62, height * 0.15);
        const gap = Math.max(44, width * 0.06);
  
        const usableW = width - 2 * marginX - gap;
        const panelH = height - top - bottom;
  
        const spectrumPanel = {
          x: marginX,
          y: top,
          w: usableW * 0.56,
          h: panelH
        };
  
        const mapPanel = {
          x: marginX + spectrumPanel.w + gap,
          y: top,
          w: usableW * 0.44,
          h: panelH
        };
  
        drawSpectrum(spectrumPanel, m, c);
        drawMap(mapPanel, m, c);
  
        // Bottom act label
        drawText(label, width / 2, height - 22, {
          size: 13,
          align: "center",
          baseline: "middle",
          color: fg
        });
      }
  
      let startTime = null;
  
      function animate(timestamp) {
        if (startTime === null) startTime = timestamp;
  
        const secondsPerFrame = 1 / fps;
        const elapsed = (timestamp - startTime) / 1000;
        const frame = Math.floor(elapsed / secondsPerFrame) % totalFrames;
  
        drawFrame(frame);
  
        requestAnimationFrame(animate);
      }
  
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
  
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        drawFrame(0);
      } else {
        requestAnimationFrame(animate);
      }
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    makeEmc2DegeneracyAnimation();
  });