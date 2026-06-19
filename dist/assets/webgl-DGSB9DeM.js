(function(){let e=document.getElementById(`hero-canvas`),t=e.getContext(`webgl`);if(!t)return;function n(e,n){let r=t.createShader(e);return t.shaderSource(r,n),t.compileShader(r),r}let r=t.createProgram();t.attachShader(r,n(t.VERTEX_SHADER,`
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `)),t.attachShader(r,n(t.FRAGMENT_SHADER,`
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
  `)),t.linkProgram(r),t.useProgram(r);let i=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW);let a=t.getAttribLocation(r,`a_pos`);t.enableVertexAttribArray(a),t.vertexAttribPointer(a,2,t.FLOAT,!1,0,0);let o=t.getUniformLocation(r,`u_res`),s=t.getUniformLocation(r,`u_time`),c=t.getUniformLocation(r,`u_mouse`),l=0,u=0,d=0,f=0,p=0,m=null,h=!1;function g(e,t,n){return Math.max(t,Math.min(n,e))}function _(){let n=window.devicePixelRatio||1,r=e.width||1,i=e.height||1,a=l/r,o=u/i,s=d/r,c=f/i;e.width=Math.max(1,Math.floor(e.offsetWidth*n)),e.height=Math.max(1,Math.floor(e.offsetHeight*n)),t.viewport(0,0,e.width,e.height),l=a*e.width||e.width/2,u=o*e.height||e.height/2,d=s*e.width||e.width/2,f=c*e.height||e.height/2}_(),window.addEventListener(`resize`,_);let v=document.getElementById(`hero`),y=document.getElementById(`projects`);function b(t){let n=e.getBoundingClientRect(),r=window.devicePixelRatio||1;d=g((t.clientX-n.left)*r,0,e.width),f=g((t.clientY-n.top)*r,0,e.height)}v.addEventListener(`pointermove`,b,{passive:!0}),v.addEventListener(`pointerdown`,b,{passive:!0});let x=null;function S(){if(document.hidden)return{shouldRender:!1,reason:`tab hidden`};if(!y)return{shouldRender:!0,reason:`#projects not found`};let e=y.getBoundingClientRect().top>(window.innerHeight||document.documentElement.clientHeight)*.92;return{shouldRender:e,reason:e?`hero/about range active`:`#projects is near or visible`}}function C(e){h||(h=!0,p=0,m=requestAnimationFrame(E))}function w(e){h&&(h=!1,m&&=(cancelAnimationFrame(m),null))}function T(){let e=S();if(e.shouldRender){C(e.reason);return}w(e.reason)}function E(n){if(!h)return;x||=n,p||=n;let r=Math.min(.05,(n-p)/1e3);p=n;let i=1-Math.exp(-11*r);l+=(d-l)*i,u+=(f-u)*i,t.uniform2f(o,e.width,e.height),t.uniform1f(s,(n-x)/1e3),t.uniform2f(c,l,u),t.drawArrays(t.TRIANGLE_STRIP,0,4),m=requestAnimationFrame(E)}window.addEventListener(`scroll`,T,{passive:!0}),window.addEventListener(`resize`,T),document.addEventListener(`visibilitychange`,T),T()})(),(function(){let e=document.getElementById(`contact-canvas`),t=document.getElementById(`contact`);if(!e||!t)return;let n=e.getContext(`webgl`,{alpha:!0,antialias:!1,powerPreference:`low-power`});if(!n)return;function r(e,t){let r=n.createShader(e);return n.shaderSource(r,t),n.compileShader(r),r}let i=n.createProgram();n.attachShader(i,r(n.VERTEX_SHADER,`
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `)),n.attachShader(i,r(n.FRAGMENT_SHADER,`
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
      return min(saturated * 1.08, vec3(0.96));
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

      col = 1.0 - exp(-col * 1.38);
      vec3 paletteTint = glowstickColor / max(max(glowstickColor.r, glowstickColor.g), glowstickColor.b);
      col *= mix(vec3(1.0), paletteTint, 0.22);

      gl_FragColor = vec4(col, 1.0);
    }
  `)),n.linkProgram(i),n.useProgram(i);let a=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,a),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),n.STATIC_DRAW);let o=n.getAttribLocation(i,`a_pos`);n.enableVertexAttribArray(o),n.vertexAttribPointer(o,2,n.FLOAT,!1,0,0);let s=n.getUniformLocation(i,`u_res`),c=n.getUniformLocation(i,`u_time`),l=n.getUniformLocation(i,`u_mouse`),u=0,d=0,f=0,p=0,m=0,h=null,g=null,_=!1;function v(e,t,n){return Math.max(t,Math.min(n,e))}let y=[[0,195,165],[255,107,107],[126,200,227],[232,123,240],[0,150,255]];function b(e){return e*e*(3-2*e)}function x(e,t,n){return e.map((e,r)=>Math.round(e+(t[r]-e)*n))}function S(e,t=1.16,n=1.18){let r=e[0]*.299+e[1]*.587+e[2]*.114;return e.map(e=>{let i=r+(e-r)*n;return Math.round(v(i*t,0,245))})}function C(e){let n=e*.42%y.length,r=Math.floor(n),i=(r+1)%y.length,a=b(n-r),o=x(y[r],y[i],a),s=S(o);t.style.setProperty(`--contact-accent-rgb`,o.join(`, `)),t.style.setProperty(`--contact-accent-light-rgb`,s.join(`, `))}function w(){let t=Math.min(window.devicePixelRatio||1,1.5),r=e.width||1,i=e.height||1,a=u/r,o=d/i,s=f/r,c=p/i;e.width=Math.max(1,Math.floor(e.offsetWidth*t)),e.height=Math.max(1,Math.floor(e.offsetHeight*t)),n.viewport(0,0,e.width,e.height),u=a*e.width||e.width/2,d=o*e.height||e.height/2,f=s*e.width||e.width/2,p=c*e.height||e.height/2}function T(t){let n=e.getBoundingClientRect(),r=Math.min(window.devicePixelRatio||1,1.5);f=v((t.clientX-n.left)*r,0,e.width),p=v((t.clientY-n.top)*r,0,e.height)}function E(){if(document.hidden)return{shouldRender:!1,reason:`tab hidden`};let e=t.getBoundingClientRect(),n=window.innerHeight||document.documentElement.clientHeight,r=e.top<n*1.25&&e.bottom>-n*.25;return{shouldRender:r,reason:r?`#contact is near or visible`:`#contact is outside render range`}}function D(e){_||(w(),_=!0,m=0,g=requestAnimationFrame(A))}function O(e){_&&(_=!1,g&&=(cancelAnimationFrame(g),null))}function k(){let e=E();if(e.shouldRender){D(e.reason);return}O(e.reason)}function A(t){if(!_)return;h||=t,m||=t;let r=Math.min(.05,(t-m)/1e3);m=t;let i=1-Math.exp(-6*r);u+=(f-u)*i,d+=(p-d)*i;let a=(t-h)/1e3;C(a),n.uniform2f(s,e.width,e.height),n.uniform1f(c,a),n.uniform2f(l,u,d),n.drawArrays(n.TRIANGLE_STRIP,0,4),g=requestAnimationFrame(A)}w(),C(0),t.addEventListener(`pointermove`,T,{passive:!0}),t.addEventListener(`pointerdown`,T,{passive:!0}),window.addEventListener(`scroll`,k,{passive:!0}),window.addEventListener(`resize`,()=>{w(),k()}),document.addEventListener(`visibilitychange`,k),k()})();