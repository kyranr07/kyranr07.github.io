/*
  A Tour of My Home: a pixel-art walk through Jemez Pueblo.

  Edit the stop text in SCENES below. Each scene is one screen (192 x 108 pixels,
  scaled up). Walk right to reach the stop marker, keep walking off the right edge
  to travel to the next place.
*/
(function () {
  var W = 192, H = 108;
  var ASSET = 'assets/tour/';

  var SCENES = [
    { id: 'plaza', name: 'The Plaza', file: 'plaza.png', foot: 91, stop: 96,
      text: 'The heart of the village, with the kiva standing tallest over the plaza.' },
    { id: 'horno', name: 'The Horno', file: 'horno.png', foot: 91, stop: 118,
      text: 'The outdoor oven by the houses.' },
    { id: 'cliffs', name: 'Red Mesa and White Cliffs', file: 'cliffs.png', foot: 91, stop: 100,
      text: 'Autumn cottonwoods along the drive north.' },
    { id: 'red-rocks', name: 'Red Rocks', file: 'red-rocks.png', foot: 89, stop: 104,
      text: 'The gas station and store.' },
    { id: 'visitor-center', name: 'Walatowa Visitor Center', file: 'visitor-center.png', foot: 89, stop: 96,
      text: 'The Walatowa Visitor Center on the highway.' },
    { id: 'valles-caldera', name: 'Valles Caldera', file: 'valles-caldera.png', foot: 91, stop: 92,
      text: 'The finale, up in the mountains.' }
  ];

  // Sprite sheets: three frames side by side, facing right.
  // frame 0 = standing; walk cycles through the listed frames.
  var GUIDES = [
    { id: 'dog', name: 'Rez dog', file: 'dog.png', w: 28, h: 18, walk: [1, 0, 2, 0], ms: 120, bob: [0, 0, 0, 0] },
    { id: 'rabbit', name: 'Jackrabbit', file: 'rabbit.png', w: 22, h: 19, walk: [1, 2], ms: 170, bob: [0, -3] },
    { id: 'cat', name: 'Rez cat', file: 'cat.png', w: 25, h: 17, walk: [1, 0, 2, 0], ms: 120, bob: [0, 0, 0, 0] }
  ];
  var SPEED = 38;            // pixels per second
  var NEAR = 18;             // how close to the stop before its card shows

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  var stage = document.getElementById('stage');
  var titleEl = document.getElementById('title');
  var pickEl = document.getElementById('pick');
  var cardEl = document.getElementById('card');
  var cardTitle = document.getElementById('card-title');
  var cardText = document.getElementById('card-text');
  var curtain = document.getElementById('curtain');
  var endEl = document.getElementById('end');
  var placeEl = document.getElementById('place');
  var pad = document.getElementById('pad');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- images ----------
  var images = {};
  function load(file) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { images[file] = img; resolve(); };
      img.onerror = function () { resolve(); };
      img.src = ASSET + file;
    });
  }
  var files = ['welcome.png'].concat(SCENES.map(function (s) { return s.file; }), GUIDES.map(function (g) { return g.file; }));

  // ---------- sizing: whole-number pixel scale ----------
  function resize() {
    var maxW = document.documentElement.clientWidth - 32;
    var maxH = window.innerHeight - 140;
    var s = Math.min(maxW / W, maxH / H);
    s = s >= 2 ? Math.floor(s) : Math.max(1, s);   // whole-number scale when there's room
    var sw = Math.floor(W * s), sh = Math.floor(H * s);
    var root = document.documentElement.style;
    root.setProperty('--stage-w', sw + 'px');
    root.setProperty('--stage-h', sh + 'px');
    root.setProperty('--u', (sw / 100) + 'px');
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- state ----------
  var mode = 'title';        // title | walk | travel | end
  var guide = null, sceneIdx = 0;
  var x = 8, dir = 1, moving = false, frameT = 0, frameI = 0;
  var keys = { left: false, right: false };
  var t0 = 0, markerT = 0;

  function drawGuide(g, frame, px, py, flip, c) {
    c = c || ctx;
    var img = images[g.file];
    if (!img) return;
    c.save();
    if (flip) {
      c.translate(Math.round(px) + g.w, Math.round(py));
      c.scale(-1, 1);
      c.drawImage(img, frame * g.w, 0, g.w, g.h, 0, 0, g.w, g.h);
    } else {
      c.drawImage(img, frame * g.w, 0, g.w, g.h, Math.round(px), Math.round(py), g.w, g.h);
    }
    c.restore();
  }

  function drawMarker(sx, foot, t) {
    // a small wooden post with a bouncing gold diamond
    var bounce = reduceMotion ? 0 : Math.round(Math.sin(t * 4) * 1.5);
    ctx.fillStyle = '#2B2118'; ctx.fillRect(sx - 1, foot - 15, 3, 15);
    ctx.fillStyle = '#8A6A4A'; ctx.fillRect(sx, foot - 14, 1, 14);
    var y = foot - 22 + bounce;
    ctx.fillStyle = '#2B2118';
    ctx.fillRect(sx - 3, y, 7, 1); ctx.fillRect(sx - 2, y - 1, 5, 1); ctx.fillRect(sx - 1, y - 2, 3, 1); ctx.fillRect(sx, y - 3, 1, 1);
    ctx.fillRect(sx - 2, y + 1, 5, 1); ctx.fillRect(sx - 1, y + 2, 3, 1); ctx.fillRect(sx, y + 3, 1, 1);
    ctx.fillStyle = '#E8C672';
    ctx.fillRect(sx - 2, y, 5, 1); ctx.fillRect(sx - 1, y - 1, 3, 1); ctx.fillRect(sx - 1, y + 1, 3, 1); ctx.fillRect(sx, y - 2, 1, 1); ctx.fillRect(sx, y + 2, 1, 1);
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'title') {
      if (images['welcome.png']) ctx.drawImage(images['welcome.png'], 0, 0);
      return;
    }
    var s = SCENES[sceneIdx];
    if (images[s.file]) ctx.drawImage(images[s.file], 0, 0);
    drawMarker(s.stop, s.foot, t);
    var g = guide;
    var frame = moving ? g.walk[frameI % g.walk.length] : 0;
    var bob = moving ? g.bob[frameI % g.bob.length] : 0;
    drawGuide(g, frame, x, s.foot - g.h + bob, dir < 0);
  }

  function showCard(on) {
    var s = SCENES[sceneIdx];
    if (on && !cardEl.classList.contains('show')) {
      cardTitle.textContent = s.name;
      cardText.textContent = s.text;
      cardEl.classList.add('show');
    } else if (!on && cardEl.classList.contains('show')) {
      cardEl.classList.remove('show');
    }
  }

  function enterScene(i) {
    sceneIdx = i;
    x = 6; dir = 1;
    placeEl.textContent = SCENES[i].name + '  ' + (i + 1) + ' / ' + SCENES.length;
    showCard(false);
  }

  function travel(toIdx) {
    mode = 'travel';
    keys.left = keys.right = false;
    showCard(false);
    var label = toIdx < SCENES.length ? SCENES[toIdx].name : '';
    curtain.textContent = label;
    curtain.classList.add('show');
    var fade = reduceMotion ? 0 : 320;
    setTimeout(function () {
      if (toIdx >= SCENES.length) {
        curtain.classList.remove('show');
        endEl.classList.add('show');
        placeEl.textContent = '';
        mode = 'end';
        document.getElementById('again').focus();
        return;
      }
      enterScene(toIdx);
      setTimeout(function () {
        curtain.classList.remove('show');
        mode = 'walk';
      }, reduceMotion ? 600 : 850);
    }, fade);
  }

  function tick(now) {
    var dt = Math.min(0.05, (now - t0) / 1000 || 0);
    t0 = now; markerT += dt;
    if (mode === 'walk') {
      var g = guide, s = SCENES[sceneIdx];
      var v = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      moving = v !== 0;
      if (moving) {
        dir = v;
        x += v * SPEED * dt;
        if (x < 0) x = 0;
        frameT += dt * 1000;
        if (frameT >= g.ms) { frameT = 0; frameI++; }
      } else { frameI = 0; frameT = 0; }
      var center = x + g.w / 2;
      showCard(Math.abs(center - s.stop) < NEAR);
      if (x > W - 4) travel(sceneIdx + 1);
    }
    render(markerT);
    requestAnimationFrame(tick);
  }

  // ---------- title screen: character picker ----------
  function buildPicker() {
    pickEl.innerHTML = '';
    GUIDES.forEach(function (g, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Walk as the ' + g.name);
      var c = document.createElement('canvas');
      c.width = g.w; c.height = g.h;
      var cc = c.getContext('2d'); cc.imageSmoothingEnabled = false;
      drawGuide(g, 0, 0, 0, false, cc);
      var label = document.createElement('span');
      label.textContent = g.name;
      b.appendChild(c); b.appendChild(label);
      b.addEventListener('click', function () { start(g); });
      pickEl.appendChild(b);
      if (i === 0) setTimeout(function () { b.focus(); }, 0);
    });
  }

  function start(g) {
    guide = g;
    titleEl.classList.remove('show');
    endEl.classList.remove('show');
    pad.classList.add('active');
    travel(0);
  }

  function backToTitle() {
    mode = 'title';
    endEl.classList.remove('show');
    titleEl.classList.add('show');
    pad.classList.remove('active');
    placeEl.textContent = '';
    buildPicker();
  }
  document.getElementById('again').addEventListener('click', backToTitle);

  // ---------- controls ----------
  function setKey(e, on) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = on; e.preventDefault(); }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = on; e.preventDefault(); }
  }
  window.addEventListener('keydown', function (e) {
    if (mode === 'walk') setKey(e, true);
    if (e.key === 'Escape' && mode !== 'title') backToTitle();
  });
  window.addEventListener('keyup', function (e) { setKey(e, false); });
  window.addEventListener('blur', function () { keys.left = keys.right = false; });

  function hold(btn, side) {
    function on(e) { e.preventDefault(); if (mode === 'walk') keys[side] = true; }
    function off() { keys[side] = false; }
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  }
  hold(document.getElementById('left'), 'left');
  hold(document.getElementById('right'), 'right');

  // tap and hold on either half of the scene also walks
  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'walk') return;
    var r = canvas.getBoundingClientRect();
    keys[(e.clientX - r.left) < r.width / 2 ? 'left' : 'right'] = true;
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
    canvas.addEventListener(ev, function () { keys.left = keys.right = false; });
  });

  Promise.all(files.map(load)).then(function () {
    buildPicker();
    requestAnimationFrame(function (n) { t0 = n; tick(n); });
  });
})();
