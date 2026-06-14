// <!-- ─────────────────────────────────────────────────────
//      WebGL background shader — PS4 DualShock palette
//      △ #00C3A5  ○ #FF6B6B  ✕ #7EC8E3  □ #E87BF0  Lightbar #0096FF
// ──────────────────────────────────────────────────────── -->
(function () {
  const canvas = document.getElementById("hero-canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform vec2  u_mouse;

    float streak(vec2 uv, vec2 origin, vec2 dir, float width, float len) {
      vec2  d       = uv - origin;
      float along   = dot(d, dir);
      float perp    = length(d - along * dir);
      float fade    = smoothstep(0.0, width, width - perp);
      float lenFade = smoothstep(0.0, 0.08, along) * smoothstep(len, len * 0.25, along);
      return fade * lenFade;
    }

    void main() {
      vec2 uv    = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
      uv.x      *= u_res.x / u_res.y;
      vec2 mouse = (u_mouse    / u_res) * 2.0 - 1.0;
      mouse.x   *= u_res.x / u_res.y;
      mouse.y   *= -1.0;

      float t   = u_time * 0.35;
      vec3  col = vec3(0.0);

      /* PS4 DualShock palette */
      vec3 c[5];
      c[0] = vec3(0.000, 0.765, 0.647); /* △ teal    */
      c[1] = vec3(1.000, 0.420, 0.420); /* ○ red     */
      c[2] = vec3(0.494, 0.784, 0.890); /* ✕ blue    */
      c[3] = vec3(0.910, 0.482, 0.941); /* □ magenta */
      c[4] = vec3(0.000, 0.588, 1.000); /* lightbar  */

      for (int i = 0; i < 18; i++) {
        float fi    = float(i);
        float ci    = mod(fi, 5.0);
        float phase = fi * 1.1547 + t;
        float angle = phase
                    + sin(phase * 0.618 + mouse.x * 1.5) * 0.7
                    + cos(phase * 0.414 + mouse.y * 1.2) * 0.5;

        vec2 dir    = normalize(vec2(cos(angle), sin(angle)));
        vec2 origin = vec2(
          sin(fi * 2.39996 + t * 0.25 + mouse.x * 0.6) * 1.5,
          cos(fi * 1.61803 + t * 0.18 + mouse.y * 0.4) * 1.0
        );

        float len = 0.65 + 0.45 * sin(fi * 1.3  + t * 0.6);
        float w   = 0.003 + 0.002 * sin(fi * 2.7 + t * 0.8);
        float v   = streak(uv, origin, dir, w, len);

        vec3 hcol;
        if      (ci < 0.5) hcol = c[0];
        else if (ci < 1.5) hcol = c[1];
        else if (ci < 2.5) hcol = c[2];
        else if (ci < 3.5) hcol = c[3];
        else               hcol = c[4];

        float pulse = 0.5 + 0.5 * sin(fi * 1.2 + t * 1.5);
        col += v * hcol * pulse * 1.1;
      }

      /* Lightbar blue glow under cursor */
      float dist = length(uv - mouse);
      col += vec3(0.0, 0.35, 0.9) * exp(-dist * dist * 4.5) * 0.25;

      col = 1.0 - exp(-col * 2.5); /* tone-map */
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function makeShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let lastTs = 0;
  let rafId = null;
  let isRendering = false;
  let lastRenderLog = "";

  // SPECIAL DEBUG FOR DEVELOPMENT TO LOG CONSOLE FOR WEBGL MONITORING
  const DEBUG_WEBGL = false;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;

    const oldW = canvas.width || 1;
    const oldH = canvas.height || 1;

    const mouseNX = mouseX / oldW;
    const mouseNY = mouseY / oldH;
    const targetNX = targetX / oldW;
    const targetNY = targetY / oldH;

    canvas.width = Math.max(1, Math.floor(canvas.offsetWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.offsetHeight * dpr));

    gl.viewport(0, 0, canvas.width, canvas.height);

    mouseX = mouseNX * canvas.width || canvas.width / 2;
    mouseY = mouseNY * canvas.height || canvas.height / 2;
    targetX = targetNX * canvas.width || canvas.width / 2;
    targetY = targetNY * canvas.height || canvas.height / 2;
  }

  resize();
  window.addEventListener("resize", resize);

  const hero = document.getElementById("hero");
  const projects = document.getElementById("projects");

  function updateTargetFromPointer(e) {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    targetX = clamp((e.clientX - r.left) * dpr, 0, canvas.width);
    targetY = clamp((e.clientY - r.top) * dpr, 0, canvas.height);
  }

  hero.addEventListener("pointermove", updateTargetFromPointer, {
    passive: true,
  });
  hero.addEventListener("pointerdown", updateTargetFromPointer, {
    passive: true,
  });

  let start = null;

  function getRenderState() {
    if (document.hidden) {
      return {
        shouldRender: false,
        reason: "tab hidden",
      };
    }

    if (!projects) {
      return {
        shouldRender: true,
        reason: "#projects not found",
      };
    }

    const projectsTop = projects.getBoundingClientRect().top;
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    const shouldRender = projectsTop > viewportH * 0.92;

    return {
      shouldRender,
      reason: shouldRender
        ? "hero/about range active"
        : "#projects is near or visible",
    };
  }

  function logRenderStatus(status, reason) {
    if (!DEBUG_WEBGL) return;

    const message = `${status}: ${reason}`;

    if (message === lastRenderLog) return;

    lastRenderLog = message;
    console.log(`[webgl] ${message}`);
  }

  function startRenderLoop(reason) {
    if (isRendering) return;

    isRendering = true;
    lastTs = 0;
    logRenderStatus("rendering started", reason);
    rafId = requestAnimationFrame(frame);
  }

  function stopRenderLoop(reason) {
    if (!isRendering) {
      logRenderStatus("rendering idle", reason);
      return;
    }

    isRendering = false;
    logRenderStatus("rendering stopped", reason);

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function updateRenderState() {
    const state = getRenderState();

    if (state.shouldRender) {
      startRenderLoop(state.reason);
      return;
    }

    stopRenderLoop(state.reason);
  }

  function frame(ts) {
    if (!isRendering) return;

    if (!start) start = ts;
    if (!lastTs) lastTs = ts;

    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    const followSpeed = 11.0;
    const ease = 1.0 - Math.exp(-followSpeed * dt);

    mouseX += (targetX - mouseX) * ease;
    mouseY += (targetY - mouseY) * ease;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (ts - start) / 1000);
    gl.uniform2f(uMouse, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", updateRenderState, {
    passive: true,
  });
  window.addEventListener("resize", updateRenderState);
  document.addEventListener("visibilitychange", updateRenderState);

  updateRenderState();
})();

(function () {
  const canvas = document.getElementById("contact-canvas");
  const contact = document.getElementById("contact");

  if (!canvas || !contact) return;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });

  if (!gl) return;

  const DEBUG_WEBGL = false;

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision mediump float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform vec2  u_mouse;

    float softBand(vec2 uv, vec2 origin, vec2 dir, float width, float len) {
      vec2 d = uv - origin;
      float along = dot(d, dir);
      float perp = length(d - along * dir);
      float body = 1.0 - smoothstep(0.0, width, perp);
      float ends = smoothstep(-0.38, 0.12, along)
                 * (1.0 - smoothstep(len * 0.28, len, along));
      return body * ends;
    }

    vec3 boostGlowstickColor(vec3 color) {
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      vec3 saturated = mix(vec3(luma), color, 1.38);
      return min(saturated * 1.18, vec3(1.0));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / u_res) * 2.0 - 1.0;
      uv.x *= u_res.x / u_res.y;

      vec2 mouse = (u_mouse / u_res) * 2.0 - 1.0;
      mouse.x *= u_res.x / u_res.y;
      mouse.y *= -1.0;

      float t = u_time * 0.18;
      vec3 col = vec3(0.0);

      vec3 teal    = vec3(0.000, 0.765, 0.647);
      vec3 coral   = vec3(1.000, 0.420, 0.420);
      vec3 magenta = vec3(0.910, 0.482, 0.941);
      vec3 blue    = vec3(0.000, 0.588, 1.000);
      vec3 light   = vec3(0.494, 0.784, 0.890);

      float glowPhase = mod(u_time * 0.42, 5.0);
      float glowMix = fract(glowPhase);
      vec3 glowA;
      vec3 glowB;

      if      (glowPhase < 1.0) { glowA = teal;    glowB = coral; }
      else if (glowPhase < 2.0) { glowA = coral;   glowB = light; }
      else if (glowPhase < 3.0) { glowA = light;   glowB = magenta; }
      else if (glowPhase < 4.0) { glowA = magenta; glowB = blue; }
      else                      { glowA = blue;    glowB = teal; }

      vec3 glowColor = mix(glowA, glowB, smoothstep(0.0, 1.0, glowMix));
      vec3 glowstickColor = boostGlowstickColor(glowColor);
      float ambient = 1.0 - smoothstep(0.25, 1.85, length(uv));
      col += glowColor * ambient * 0.08;

      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        float phase = t + fi * 0.71;
        float angle = phase
                    + sin(fi * 1.37 + t * 0.8) * 0.65
                    + mouse.x * 0.18;

        vec2 dir = normalize(vec2(cos(angle), sin(angle)));
        vec2 origin = vec2(
          sin(fi * 1.91 + t * 0.42) * 1.45,
          cos(fi * 1.27 + t * 0.36) * 0.95
        );

        float width = 0.045 + 0.024 * sin(fi * 0.93 + t);
        float len = 0.72 + 0.42 * cos(fi * 1.11 + t * 0.7);
        float band = softBand(uv, origin, dir, width, len);
        float bandPulse = 0.76 + 0.24 * sin(fi * 1.21 + u_time * 0.7);

        col += band * glowstickColor * bandPulse * 0.42;
      }

      float mouseGlow = exp(-length(uv - mouse) * length(uv - mouse) * 2.35);
      col += glowColor * mouseGlow * 0.18;

      float vignette = 1.0 - smoothstep(0.18, 1.58, length(uv));
      col *= vignette;

      float edgeAmbient = smoothstep(0.62, 1.7, length(uv));
      col += glowColor * edgeAmbient * 0.055;

      col = 1.0 - exp(-col * 1.55);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function makeShader(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let lastTs = 0;
  let start = null;
  let rafId = null;
  let isRendering = false;
  let lastRenderLog = "";

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function logRenderStatus(status, reason) {
    if (!DEBUG_WEBGL) return;

    const message = `contact ${status}: ${reason}`;

    if (message === lastRenderLog) return;

    lastRenderLog = message;
    console.log(`[webgl] ${message}`);
  }

  const contactAccentPalette = [
    [0, 195, 165],
    [255, 107, 107],
    [126, 200, 227],
    [232, 123, 240],
    [0, 150, 255],
  ];

  function smoothstep01(value) {
    return value * value * (3 - 2 * value);
  }

  function mixColor(a, b, amount) {
    return a.map((channel, index) =>
      Math.round(channel + (b[index] - channel) * amount),
    );
  }

  function brightenColor(color, amount = 0.38) {
    return color.map((channel) =>
      Math.round(channel + (255 - channel) * amount),
    );
  }

  function setContactAccent(elapsedSeconds) {
    const phase = (elapsedSeconds * 0.42) % contactAccentPalette.length;
    const fromIndex = Math.floor(phase);
    const toIndex = (fromIndex + 1) % contactAccentPalette.length;
    const amount = smoothstep01(phase - fromIndex);
    const accent = mixColor(
      contactAccentPalette[fromIndex],
      contactAccentPalette[toIndex],
      amount,
    );
    const accentLight = brightenColor(accent);

    contact.style.setProperty("--contact-accent-rgb", accent.join(", "));
    contact.style.setProperty(
      "--contact-accent-light-rgb",
      accentLight.join(", "),
    );
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const oldW = canvas.width || 1;
    const oldH = canvas.height || 1;

    const mouseNX = mouseX / oldW;
    const mouseNY = mouseY / oldH;
    const targetNX = targetX / oldW;
    const targetNY = targetY / oldH;

    canvas.width = Math.max(1, Math.floor(canvas.offsetWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.offsetHeight * dpr));

    gl.viewport(0, 0, canvas.width, canvas.height);

    mouseX = mouseNX * canvas.width || canvas.width / 2;
    mouseY = mouseNY * canvas.height || canvas.height / 2;
    targetX = targetNX * canvas.width || canvas.width / 2;
    targetY = targetNY * canvas.height || canvas.height / 2;
  }

  function updateTargetFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    targetX = clamp((e.clientX - rect.left) * dpr, 0, canvas.width);
    targetY = clamp((e.clientY - rect.top) * dpr, 0, canvas.height);
  }

  function getRenderState() {
    if (document.hidden) {
      return {
        shouldRender: false,
        reason: "tab hidden",
      };
    }

    const rect = contact.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    const shouldRender =
      rect.top < viewportH * 1.25 && rect.bottom > -viewportH * 0.25;

    return {
      shouldRender,
      reason: shouldRender
        ? "#contact is near or visible"
        : "#contact is outside render range",
    };
  }

  function startRenderLoop(reason) {
    if (isRendering) return;

    resize();
    isRendering = true;
    lastTs = 0;
    logRenderStatus("rendering started", reason);
    rafId = requestAnimationFrame(frame);
  }

  function stopRenderLoop(reason) {
    if (!isRendering) {
      logRenderStatus("rendering idle", reason);
      return;
    }

    isRendering = false;
    logRenderStatus("rendering stopped", reason);

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function updateRenderState() {
    const state = getRenderState();

    if (state.shouldRender) {
      startRenderLoop(state.reason);
      return;
    }

    stopRenderLoop(state.reason);
  }

  function frame(ts) {
    if (!isRendering) return;

    if (!start) start = ts;
    if (!lastTs) lastTs = ts;

    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    const followSpeed = 6.0;
    const ease = 1.0 - Math.exp(-followSpeed * dt);

    mouseX += (targetX - mouseX) * ease;
    mouseY += (targetY - mouseY) * ease;

    const elapsed = (ts - start) / 1000;

    setContactAccent(elapsed);

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uMouse, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(frame);
  }

  resize();
  setContactAccent(0);
  contact.addEventListener("pointermove", updateTargetFromPointer, {
    passive: true,
  });
  contact.addEventListener("pointerdown", updateTargetFromPointer, {
    passive: true,
  });
  window.addEventListener("scroll", updateRenderState, {
    passive: true,
  });
  window.addEventListener("resize", () => {
    resize();
    updateRenderState();
  });
  document.addEventListener("visibilitychange", updateRenderState);

  updateRenderState();
})();
