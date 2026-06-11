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

      for (int i = 0; i < 20; i++) {
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

  function frame(ts) {
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
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();

// PAGE LOADING SCREEN
window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");

  setTimeout(() => {
    loader.classList.add("loader-hidden");

    setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("page-ready");
      loader.remove();
    }, 650);
  }, 800);
});

// NAV GLASS EFFECT AFTER SCROLLING FROM HERO
const nav = document.querySelector("nav");
const hero = document.querySelector("#hero");

if (nav && hero) {
  const navObserver = new IntersectionObserver(
    ([entry]) => {
      nav.classList.toggle("is-scrolled", !entry.isIntersecting);
    },
    {
      threshold: 0,
      rootMargin: "-80px 0px 0px 0px",
    },
  );

  navObserver.observe(hero);
}

/* ─────────────────────────────────────────────
   ABOUT TERMINAL TYPING EFFECT
───────────────────────────────────────────── */

function initAboutTerminal() {
  const terminal = document.querySelector("#about-terminal-output");
  const aboutSection = document.querySelector("#about");

  if (!terminal || !aboutSection) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // WHERE TO EDIT THE TERMINAL SCRIPT TYPING CONTENT
  const terminalScript = [
    {
      command: "whoami",
      output: "nathaniel / cs-student / sysadmin",
    },
    {
      command: "current_focus",
      output: "learning by building real systems, not just reading about them",
    },
    {
      command: "stack",
      tags: ["Linux", "HTML", "CSS", "JavaScript", "Git", "Apache"],
    },
  ];

  let hasPlayed = false;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeText(element, text, speed = 24) {
    element.classList.add("terminal-caret");

    for (const character of text) {
      element.append(character);
      await wait(speed);
    }

    element.classList.remove("terminal-caret");
  }

  function createCommandLine() {
    const line = document.createElement("p");
    line.className = "terminal-line";

    const prompt = document.createElement("span");
    prompt.textContent = "$";

    line.append(prompt, " ");

    terminal.appendChild(line);

    return line;
  }

  function createOutputLine() {
    const output = document.createElement("p");
    output.className = "terminal-output";

    terminal.appendChild(output);

    return output;
  }

  async function renderTags(tags) {
    const tagContainer = document.createElement("div");
    tagContainer.className = "terminal-tags";

    terminal.appendChild(tagContainer);

    for (const tag of tags) {
      const tagElement = document.createElement("span");
      tagContainer.appendChild(tagElement);

      tagElement.classList.add("is-visible");
      await typeText(tagElement, tag, 18);
      await wait(90);
    }
  }

  async function playTerminal() {
    if (hasPlayed) return;

    hasPlayed = true;
    terminal.innerHTML = "";

    if (prefersReducedMotion) {
      terminalScript.forEach((entry) => {
        const commandLine = createCommandLine();
        commandLine.append(entry.command);

        if (entry.output) {
          const outputLine = createOutputLine();
          outputLine.textContent = entry.output;
        }

        if (entry.tags) {
          const tagContainer = document.createElement("div");
          tagContainer.className = "terminal-tags";

          entry.tags.forEach((tag) => {
            const tagElement = document.createElement("span");
            tagElement.textContent = tag;
            tagElement.classList.add("is-visible");
            tagContainer.appendChild(tagElement);
          });

          terminal.appendChild(tagContainer);
        }
      });

      return;
    }

    await wait(250);

    for (const entry of terminalScript) {
      const commandLine = createCommandLine();
      await typeText(commandLine, entry.command, 32);
      await wait(280);

      if (entry.output) {
        const outputLine = createOutputLine();
        await typeText(outputLine, entry.output, 18);
        await wait(420);
      }

      if (entry.tags) {
        await renderTags(entry.tags);
        await wait(420);
      }
    }
  }

  if ("IntersectionObserver" in window) {
    const terminalObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playTerminal();
          terminalObserver.disconnect();
        }
      },
      {
        threshold: 0.35,
      },
    );

    terminalObserver.observe(aboutSection);
  } else {
    playTerminal();
  }
}

initAboutTerminal();

/* ─────────────────────────────────────────────
   END OF ABOUT TERMINAL TYPING EFFECT
───────────────────────────────────────────── */
