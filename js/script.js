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

      for (int i = 0; i < 16; i++) {
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
        float w   = 0.0045 + 0.002 * sin(fi * 2.7 + t * 0.8);
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
      col += vec3(0.0, 0.35, 0.9) * exp(-dist * dist * 4.5) * 0.22;

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

  let mx, my;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    mx = canvas.width / 2;
    my = canvas.height / 2;
  }
  resize();
  window.addEventListener("resize", resize);

  const hero = document.getElementById("hero");

  hero.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mx = (e.clientX - r.left) * dpr;
    my = (e.clientY - r.top) * dpr;
  });

  hero.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const t = e.touches[0];
      mx = (t.clientX - r.left) * dpr;
      my = (t.clientY - r.top) * dpr;
    },
    { passive: false },
  );

  let start = null;
  function frame(ts) {
    if (!start) start = ts;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (ts - start) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");

  setTimeout(() => {
    loader.classList.add("loader-hidden");

    setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("page-ready");
      loader.remove();
    }, 650);
  }, 1200);
});
