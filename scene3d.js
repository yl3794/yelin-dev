// Mini3D: a small, draggable 3D stage with HTML labels, used by the interactive demos
window.Mini3D = function (el, opts) {
  const T = window.THREE; if (!T) return null;
  opts = opts || {};
  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  el.style.position = 'relative';
  el.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(opts.fov || 36, 1, 0.1, 100);
  camera.position.set(0, opts.camY || 1.6, opts.camZ || 11);
  camera.lookAt(0, 0, 0);
  // ---- game-style lighting: sky fill, a warm sun with soft shadows, a cool rim light, soft reflections ----
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = false;
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
  scene.add(new T.HemisphereLight(0xFFF6E2, 0x8A7550, 0.55));
  const d = new T.DirectionalLight(0xFFE6BD, 1.6); d.position.set(5, 9, 7); d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048); d.shadow.radius = 5; d.shadow.bias = -0.0006; d.shadow.normalBias = 0.02;
  Object.assign(d.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); scene.add(d);
  const rim = new T.DirectionalLight(0xBFD6FF, 0.55); rim.position.set(-6, 4, -8); scene.add(rim);
  scene.fog = new T.Fog(0xFBF5E6, 18, 34);
  // a soft studio environment so glossy surfaces pick up highlights
  try {
    const env = new T.Scene(), pm = new T.PMREMGenerator(renderer);
    const sky = new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true }));
    const cs = [], p = sky.geometry.attributes.position, top = new T.Color(0xFFFDF6), bot = new T.Color(0xC9B48A), c = new T.Color();
    for (let i = 0; i < p.count; i++) { c.copy(bot).lerp(top, Math.min(1, Math.max(0, p.getY(i) / 20 * 0.5 + 0.55))); cs.push(c.r, c.g, c.b); }
    sky.geometry.setAttribute('color', new T.Float32BufferAttribute(cs, 3)); env.add(sky);
    [[6, 8, 6, 8, 3], [-8, 5, -4, 5, 2], [0, 12, 0, 10, 10]].forEach(([x, y, z, w, h]) => {
      const b = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: 0xFFFFFF, side: T.DoubleSide })); b.position.set(x, y, z); b.lookAt(0, 0, 0); env.add(b);
    });
    scene.environment = pm.fromScene(env, 0.04).texture;
  } catch (e) {}
  const group = new T.Group(); scene.add(group);
  const labels = [];
  function label(text, cls) {
    const div = document.createElement('div');
    div.className = 'l3 ' + (cls || ''); div.textContent = text; el.appendChild(div);
    const L = { el: div, pos: new T.Vector3(), life: null }; labels.push(L); return L;
  }
  function remove(L) { L.el.remove(); labels.splice(labels.indexOf(L), 1); }
  let rotY = opts.rotY || 0, rotX = opts.rotX || 0.12, tY = rotY, tX = rotX, drag = null;
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ry: tY, rx: tX }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    tY = drag.ry + (e.clientX - drag.x) * 0.008;
    tX = Math.max(-0.2, Math.min(0.7, drag.rx + (e.clientY - drag.y) * 0.006));
  });
  const end = () => { drag = null; el.style.cursor = ''; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  function size() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h;
    const fit = Math.max(1, (opts.fitWidth || 9) / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect) / (opts.camZ || 11));
    camera.position.setLength(Math.hypot(opts.camY || 1.6, opts.camZ || 11) * fit);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(el); else addEventListener('resize', size);
  const hooks = [], v = new T.Vector3();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    rotY += (tY - rotY) * 0.1; rotX += (tX - rotX) * 0.1;
    group.rotation.set(rotX, rotY, 0);
    hooks.forEach(f => f(dt, now / 1000));
    renderer.render(scene, camera);
    const w = el.clientWidth, h = el.clientHeight;
    labels.forEach(L => {
      v.copy(L.pos); group.localToWorld(v); v.project(camera);
      L.el.style.transform = 'translate(-50%, -50%) translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)';
      L.el.style.visibility = v.z < 1 ? 'visible' : 'hidden';
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // ---- cute toy style: toon shading, puffy rounded shapes, ink outlines, little faces ----
  if (!T.__cute) {
    T.__cute = true;
    const Box = T.BoxGeometry, Cyl = T.CylinderGeometry;
    // a box with rounded corners: push every vertex onto a rounded shell
    T.BoxGeometry = function (w, h, d) {
      const g = new Box(w, h, d, 8, 8, 8), p = g.attributes.position, n = g.attributes.normal;
      const r = Math.min(w, h, d) * 0.32, hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r, v = new T.Vector3(), c = new T.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        c.set(Math.max(-hw, Math.min(hw, v.x)), Math.max(-hh, Math.min(hh, v.y)), Math.max(-hd, Math.min(hd, v.z)));
        v.sub(c).normalize(); n.setXYZ(i, v.x, v.y, v.z); v.multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
      }
      return g;
    };
    // a cylinder with soft rounded rims, like a marshmallow
    T.CylinderGeometry = function (rt, rb, h, seg) {
      const R = Math.max(rt, rb), r = Math.min(R * 0.35, h * 0.45), pts = [new T.Vector2(0, -h / 2)];
      for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + k / 8 * Math.PI / 2; pts.push(new T.Vector2(R - r + Math.cos(a) * r, -h / 2 + r + Math.sin(a) * r)); }
      for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI / 2; pts.push(new T.Vector2(R - r + Math.cos(a) * r, h / 2 - r + Math.sin(a) * r)); }
      pts.push(new T.Vector2(0, h / 2));
      if (h > R * 2.5) return new Cyl(rt, rb, h, seg || 16);   // thin sticks stay plain
      return new T.LatheGeometry(pts, seg || 40);
    };
  }
  // glossy, lacquered-toy materials: soft clearcoat highlights, a little reflection
  const mat = (c, o) => {
    const dark = new T.Color(c).getHSL({}).l < 0.2;
    const m = new T.MeshPhysicalMaterial(Object.assign({ color: new T.Color(c).convertSRGBToLinear(), roughness: dark ? 0.5 : 0.38, metalness: 0.02, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: 0.9 }, o || {}));
    // demos recolor with hex codes; keep those in the same color space
    m.color.setHex = function (h) { T.Color.prototype.setHex.call(this, h); return this.convertSRGBToLinear(); };
    return m;
  };
  // no cartoon outlines in the realistic style; kept as an empty object so the demos still work
  const edges = () => new T.Object3D();
  // a soft floor that catches shadows and fades out at the edges
  const fade = document.createElement('canvas'); fade.width = fade.height = 256;
  { const g = fade.getContext('2d'), r = g.createRadialGradient(128, 128, 20, 128, 128, 128); r.addColorStop(0, '#fff'); r.addColorStop(0.55, '#bbb'); r.addColorStop(1, '#000'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); }
  const floor = new T.Mesh(new T.CircleGeometry(11, 64), new T.MeshStandardMaterial({ color: new T.Color(0xEADBB8).convertSRGBToLinear(), roughness: 0.85, transparent: true, alphaMap: new T.CanvasTexture(fade), depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.renderOrder = -1; group.add(floor);
  // a low round stage under the scene, like a game diorama
  const stage = new T.Mesh(new T.CylinderGeometry(1, 1, 0.32, 96), new T.MeshPhysicalMaterial({ color: new T.Color(0xF6EEDC).convertSRGBToLinear(), roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.4 }));
  stage.receiveShadow = true; stage.castShadow = true;
  const ring = new T.Mesh(new T.TorusGeometry(1, 0.018, 8, 160), new T.MeshBasicMaterial({ color: new T.Color(0xF2C94C).convertSRGBToLinear() }));
  ring.rotation.x = Math.PI / 2;
  // drifting dust in the light, for depth
  const dustTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,250,235,1)'); r.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new T.CanvasTexture(c); })();
  const dg = new T.BufferGeometry(), dp = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) { dp[i * 3] = (Math.random() - .5) * 14; dp[i * 3 + 1] = Math.random() * 6 - 2; dp[i * 3 + 2] = (Math.random() - .5) * 8; }
  dg.setAttribute('position', new T.BufferAttribute(dp, 3));
  const dust = new T.Points(dg, new T.PointsMaterial({ size: 0.09, map: dustTex, transparent: true, opacity: 0.75, depthWrite: false, color: 0xFFE7A8 }));
  scene.add(dust);
  let n = 0;
  hooks.push((dt, t) => {
    // every mesh casts and receives soft shadows (new ones too), the floor sits just under the scene
    if (n++ % 20 === 0) {
      const rx = group.rotation.x, ry = group.rotation.y; group.rotation.set(0, 0, 0); group.updateMatrixWorld(true);
      const box = new T.Box3(); floor.visible = stage.visible = ring.visible = false;
      group.traverse(o => { if (o.isMesh && o.visible && o !== floor && o !== stage && o !== ring && !(o.material && o.material.transparent && o.material.opacity < 0.2)) { o.castShadow = true; o.receiveShadow = true; box.expandByObject(o); } });
      floor.visible = true;
      if (!box.isEmpty() && n < 25) {
        const s = new T.Vector3(); box.getSize(s); const R = Math.max(s.x, s.z * 1.6) / 2 + 0.9, y = box.min.y - 0.02;
        stage.scale.set(R, 1, R * 0.62); stage.position.set((box.min.x + box.max.x) / 2, y - 0.16, (box.min.z + box.max.z) / 2);
        ring.scale.set(R + 0.01, R * 0.62 + 0.01, 1); ring.position.set(stage.position.x, y + 0.005, stage.position.z);
        floor.position.y = y - 0.33;
      }
      group.rotation.set(rx, ry, 0);
    }
    const a = dg.attributes.position;
    for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.12; if (y > 4) y = -2; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * .4 + i) * dt * 0.05); }
    a.needsUpdate = true;
  });
  // faces were removed; these stay as no-ops so the demos keep working
  const face = () => ({ f: new T.Group(), eyes: [] });
  const mood = () => {};
  return { T, scene, camera, group, label, remove, onFrame: f => hooks.push(f), mat, edges, face, mood };
};

// Small 3D scene in each page header. The variant comes from data-variant on #scene.
(() => {
  const el = document.getElementById('scene');
  if (!el || !window.THREE) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INK = 0x16181D, SUN = 0xF2C94C, BLUE = 0x1E4FD8, AMBER = 0xC98A00, WHITE = 0xFFFFFF;

  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  el.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.4, 8);
  scene.add(new T.AmbientLight(WHITE, 0.75));
  const sun = new T.DirectionalLight(WHITE, 0.75); sun.position.set(3, 5, 6); scene.add(sun);
  const group = new T.Group(); scene.add(group);

  const mat = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.05 }, o));
  const edges = (geo, c = INK, op = 0.55) => new T.LineSegments(new T.EdgesGeometry(geo, 25), new T.LineBasicMaterial({ color: c, transparent: true, opacity: op }));

  const variants = {
    // idlexperts: a knot that keeps looping, with three markers riding around it
    loop() {
      const g = new T.TorusKnotGeometry(1.15, 0.32, 180, 20);
      group.add(new T.Mesh(g, mat(SUN, { flatShading: true })));
      group.add(new T.Mesh(g, new T.MeshBasicMaterial({ color: INK, wireframe: true, transparent: true, opacity: 0.08 })));
      const balls = [0, 1, 2].map(i => { const m = new T.Mesh(new T.SphereGeometry(0.16, 20, 20), mat(BLUE)); group.add(m); return m; });
      return t => balls.forEach((b, i) => {
        const a = t * 0.8 + i * 2.09, p = 2, q = 3, r = 1.15 + 0.75 * Math.cos(q * a);
        b.position.set(r * Math.cos(p * a) * 1.02, r * Math.sin(p * a) * 1.02, 0.9 * Math.sin(q * a) + 0.4);
      });
    },
    // ProNexus: a globe of roles; a few light up as matches
    sphere() {
      const N = 520, pos = new Float32Array(N * 3), pts = [];
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
        const v = new T.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(1.9);
        pts.push(v); pos.set([v.x, v.y, v.z], i * 3);
      }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      group.add(new T.Points(geo, new T.PointsMaterial({ color: INK, size: 0.06, transparent: true, opacity: 0.45 })));
      group.add(new T.Mesh(new T.SphereGeometry(1.86, 32, 32), mat(SUN, { transparent: true, opacity: 0.18 })));
      const hits = Array.from({ length: 10 }, () => { const m = new T.Mesh(new T.SphereGeometry(0.09, 14, 14), mat(BLUE)); group.add(m); return m; });
      const lines = new T.Group(); group.add(lines);
      let last = -1;
      return t => {
        const k = Math.floor(t / 2.2);
        if (k !== last) {
          last = k; lines.clear();
          hits.forEach((h, i) => { const p = pts[(k * 97 + i * 53) % N]; h.position.copy(p); h.userData.t0 = t + i * 0.06; });
          const center = new T.Vector3();
          hits.slice(0, 3).forEach(h => {
            const g = new T.BufferGeometry().setFromPoints([center, h.position.clone()]);
            lines.add(new T.Line(g, new T.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.5 })));
          });
        }
        hits.forEach(h => { const s = Math.min(1, Math.max(0, (t - h.userData.t0) * 3)); h.scale.setScalar(0.2 + s * (1 + 0.25 * Math.sin(t * 6))); });
      };
    },
    // Enhansys: records dropping into a stacked database
    stack() {
      const disks = [-1.0, -0.25, 0.5].map(y => {
        const g = new T.CylinderGeometry(1.25, 1.25, 0.55, 48);
        const m = new T.Mesh(g, mat(WHITE)); m.position.y = y; group.add(m);
        const e = edges(g, INK, 0.7); e.position.y = y; group.add(e);
        return m;
      });
      const band = new T.Mesh(new T.CylinderGeometry(1.27, 1.27, 0.08, 48), mat(SUN)); band.position.y = 0.5; group.add(band);
      const drops = Array.from({ length: 26 }, (_, i) => {
        const m = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.16), mat(i % 9 === 0 ? AMBER : BLUE));
        m.userData = { x: (Math.random() - 0.5) * 1.6, z: (Math.random() - 0.5) * 1.6, o: Math.random() * 3, sp: 0.6 + Math.random() * 0.5 };
        group.add(m); return m;
      });
      return t => drops.forEach(d => {
        const u = d.userData, p = ((t * u.sp + u.o) % 3) / 3;
        d.position.set(u.x * (1 - p * 0.5), 2.5 - p * 1.9, u.z * (1 - p * 0.5));
        d.rotation.set(t * 2 + u.o, t * 1.5, 0);
        d.scale.setScalar(p > 0.92 ? (1 - p) * 12 : 1);
        band.scale.setScalar(1 + 0.03 * Math.sin(t * 5));
      });
    },
    // ProNexus: applicants pour into a funnel (search), a few come out and line up as ranked matches
    funnel() {
      group.userData.tilt = 0.18;
      group.scale.setScalar(0.8); group.position.y = 0.25;
      const coneGeo = new T.CylinderGeometry(1.7, 0.28, 1.7, 48, 1, true);
      const cone = new T.Mesh(coneGeo, mat(SUN, { transparent: true, opacity: 0.35, side: T.DoubleSide }));
      cone.position.y = 0.55; group.add(cone);
      const rim = edges(coneGeo, INK, 0.35); rim.position.y = 0.55; group.add(rim);
      const bars = [[-0.85, 1.15], [0, 0.85], [0.85, 0.6]].map(([x, h], i) => {
        const m = new T.Mesh(new T.BoxGeometry(0.55, 1, 0.55), mat(i === 0 ? BLUE : SUN));
        m.position.set(x, -1.95, 0); m.userData.h = h; group.add(m); return m;
      });
      const cards = Array.from({ length: 70 }, (_, i) => {
        const m = new T.Mesh(new T.BoxGeometry(0.2, 0.26, 0.03), mat(WHITE));
        const a = Math.random() * Math.PI * 2;
        m.userData = { a, r: 0.6 + Math.random() * 1.0, o: Math.random(), sp: 0.22 + Math.random() * 0.12, pass: i % 6 === 0, bar: i % 3 };
        m.add(edges(m.geometry, INK, 0.6));
        group.add(m); return m;
      });
      return t => {
        cards.forEach(c => {
          const u = c.userData, p = (t * u.sp + u.o) % 1, y = 2.7 - p * 4.4;
          let r = u.r, x, z, s = 1;
          if (y < 1.4) r = u.r * Math.max(0.08, (y + 0.3) / 1.7);
          x = Math.cos(u.a + t * 0.6) * r; z = Math.sin(u.a + t * 0.6) * r;
          if (!u.pass && y < 0.9) s = Math.max(0, (y - 0.3) / 0.6);
          if (u.pass && y < -0.3) { const k = Math.min(1, (-0.3 - y) / 0.9); x = x * (1 - k) + bars[u.bar].position.x * k; z = z * (1 - k); s = 1 - k * 0.7; }
          c.position.set(x, y, z); c.scale.setScalar(Math.max(0.001, s));
          c.rotation.set(0.3, u.a + t, 0);
          c.material.color.setHex(u.pass && y < 0.6 ? BLUE : WHITE);
        });
        bars.forEach((b, i) => {
          const h = b.userData.h * (0.85 + 0.15 * Math.sin(t * 1.5 + i));
          b.scale.y = h; b.position.y = -2.1 + h / 2;
        });
      };
    },
    // Enhansys: 23 sources around one database; records arc in, one times out and retries
    sources() {
      group.userData.tilt = 0.5;
      group.scale.setScalar(0.8);
      const db = [-0.35, 0.1, 0.55].map(y => {
        const g = new T.CylinderGeometry(0.75, 0.75, 0.38, 40);
        const m = new T.Mesh(g, mat(WHITE)); m.position.y = y; group.add(m);
        const e = edges(g, INK, 0.7); e.position.y = y; group.add(e); return m;
      });
      const glow = new T.Mesh(new T.CylinderGeometry(0.77, 0.77, 0.06, 40), mat(SUN)); glow.position.y = 0.75; group.add(glow);
      const srcs = Array.from({ length: 23 }, (_, i) => {
        const a = i / 23 * Math.PI * 2, h = 0.25 + (i % 4) * 0.12;
        const m = new T.Mesh(new T.BoxGeometry(0.22, h, 0.22), mat(SUN));
        m.position.set(Math.cos(a) * 2.5, -0.45 + h / 2, Math.sin(a) * 2.5); group.add(m);
        m.add(edges(m.geometry, INK, 0.5)); return m;
      });
      const recs = Array.from({ length: 34 }, (_, i) => {
        const m = new T.Mesh(new T.SphereGeometry(0.08, 12, 12), mat(BLUE));
        m.userData = { s: i % 23, o: Math.random() * 2, sp: 0.45 + Math.random() * 0.25, bad: i % 11 === 0 };
        group.add(m); return m;
      });
      let flash = 0;
      return t => {
        recs.forEach(r => {
          const u = r.userData, cyc = (t * u.sp + u.o) % 1.25;
          const from = srcs[u.s].position, to = new T.Vector3(0, 0.8, 0);
          let p = Math.min(1, cyc), col = BLUE;
          if (u.bad) {
            if (cyc > 0.45 && cyc < 0.75) { p = 0.45; col = 0xD23B2F; }
            else if (cyc >= 0.75) { p = 0.45 + (Math.min(1.25, cyc) - 0.75) / 0.5 * 0.55; col = AMBER; }
          }
          const x = from.x + (to.x - from.x) * p, z = from.z + (to.z - from.z) * p;
          const y = from.y + (to.y - from.y) * p + Math.sin(p * Math.PI) * 1.1;
          r.position.set(x, y, z); r.material.color.setHex(col);
          r.scale.setScalar(p >= 1 ? 0.001 : (col === 0xD23B2F ? 1.5 + 0.4 * Math.sin(t * 14) : 1));
          if (p >= 1 && cyc < 1.02) flash = 1;
        });
        flash *= 0.9; glow.scale.set(1 + flash * 0.08, 1 + flash * 2, 1 + flash * 0.08);
      };
    },
    // Recommendation pipeline: events streaming through rings
    stream() {
      const rings = [-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => {
        const r = new T.Mesh(new T.TorusGeometry(0.85, 0.07, 14, 56), mat(i === 4 ? BLUE : SUN));
        r.rotation.y = Math.PI / 2; r.position.x = x; group.add(r); return r;
      });
      const parts = Array.from({ length: 60 }, (_, i) => {
        const m = new T.Mesh(new T.SphereGeometry(0.07, 10, 10), mat(i % 7 === 0 ? AMBER : INK));
        m.userData = { o: Math.random() * 6, a: Math.random() * Math.PI * 2, r: 0.15 + Math.random() * 0.5, sp: 0.8 + Math.random() * 0.6 };
        group.add(m); return m;
      });
      group.rotation.y = -0.55;
      return t => {
        parts.forEach(p => { const u = p.userData, x = ((t * u.sp + u.o) % 6) - 3, a = u.a + t * 1.4; p.position.set(x, Math.cos(a) * u.r, Math.sin(a) * u.r); });
        rings.forEach((r, i) => r.scale.setScalar(1 + 0.06 * Math.sin(t * 4 - i)));
      };
    },
    // Skill2: a 3D figure doing squats, with tracked joints
    pose() {
      const limbMat = mat(INK), jointMat = mat(BLUE);
      const joints = {}, names = ['ankle', 'knee', 'hip', 'shoulder', 'elbow', 'hand'];
      names.forEach(n => { const s = new T.Mesh(new T.SphereGeometry(0.13, 16, 16), jointMat); group.add(s); joints[n] = s; });
      const head = new T.Mesh(new T.SphereGeometry(0.34, 24, 24), mat(SUN)); group.add(head);
      const bones = [['ankle', 'knee'], ['knee', 'hip'], ['hip', 'shoulder'], ['shoulder', 'elbow'], ['elbow', 'hand']].map(([a, b]) => {
        const c = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1, 12), limbMat); group.add(c); return [a, b, c];
      });
      const floor = new T.Mesh(new T.CircleGeometry(1.6, 48), mat(SUN, { transparent: true, opacity: 0.35 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -2.05; group.add(floor);
      const up = new T.Vector3(0, 1, 0);
      return t => {
        const d = Math.pow(Math.sin(t * 1.3), 2), rad = x => x * Math.PI / 180;
        const s = rad(4 + d * 32), th = rad(6 + d * 80), u = rad(6 + d * 36);
        const A = new T.Vector3(0.2, -2, 0);
        const K = A.clone().add(new T.Vector3(1.2 * Math.sin(s), 1.2 * Math.cos(s), 0));
        const H = K.clone().add(new T.Vector3(-1.25 * Math.sin(th), 1.25 * Math.cos(th), 0));
        const S = H.clone().add(new T.Vector3(1.45 * Math.sin(u), 1.45 * Math.cos(u), 0));
        const E = S.clone().add(new T.Vector3(0.55, -0.3, 0.1));
        const Hd = S.clone().add(new T.Vector3(0.95, -0.15 + d * 0.2, 0.15));
        const P = { ankle: A, knee: K, hip: H, shoulder: S, elbow: E, hand: Hd };
        names.forEach(n => joints[n].position.copy(P[n]));
        head.position.copy(S.clone().add(new T.Vector3(0.45 * Math.sin(u), 0.45 * Math.cos(u), 0)));
        bones.forEach(([a, b, c]) => {
          const pa = P[a], pb = P[b], dir = pb.clone().sub(pa), len = dir.length();
          c.position.copy(pa.clone().add(pb).multiplyScalar(0.5)); c.scale.set(1, len, 1);
          c.quaternion.setFromUnitVectors(up, dir.normalize());
        });
        group.position.y = 0.15;
      };
    },
  };

  const update = (variants[el.dataset.variant] || variants.loop)();
  const target = { x: 0, y: 0 };
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    target.y = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
    target.x = ((e.clientY - r.top) / r.height - 0.5) * 0.7;
  });
  el.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
  let boost = 0;
  el.addEventListener('click', () => { boost = 1; });

  function size() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(el); else addEventListener('resize', size);

  const baseY = group.rotation.y;
  let spin = 0, t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    spin += 0.004 + boost * 0.12; boost *= 0.94;
    const keepSide = el.dataset.variant === 'pose' || el.dataset.variant === 'stream';
    group.rotation.y += ((keepSide ? baseY + Math.sin(t * 0.4) * 0.5 : spin) + target.y - group.rotation.y) * 0.08;
    group.rotation.x += ((group.userData.tilt || 0) + target.x - group.rotation.x) * 0.08;
    update(t);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
