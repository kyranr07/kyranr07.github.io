/*
  Wandering cows for the side margins.
  Two cows per side walk between grass patches and graze. They stay in the
  empty space left of the sidebar and right of the main text, and hide when
  the window is too narrow to fit them.

  Tweak these:
*/
(function () {
  var COWS_PER_SIDE = 2;
  var PATCHES_PER_SIDE = 5;
  var WALK_SPEED = 26;              // pixels per second
  var GRAZE_SECONDS = [5, 12];      // min, max time spent eating at a patch
  var GAP_FROM_TEXT = 28;           // pixels kept clear of the text

  var C = {
    o: '#2B2118',  // outline
    B: '#8A5634',  // brown coat
    w: '#F7F1E6',  // white patches
    p: '#E2A99A',  // pink nose and udder
    k: '#1E1712',  // eyes, nostrils, hooves
    d: '#4A2E1C',  // dark brown ear and tail tuft
    h: '#D9C9A3',  // horn
    g: '#4E7A3A', G: '#6F9A4E', t: '#3D6130'  // grass
  };

  // Cow sprite, 32 x 13 pixels, facing right. Each layer is drawn on top of the last.
  var BODY = [
  '',
  '...ooooooooooooooooooooo',
  '..oBBBwwwwBBBBBBwwwwBBBBo',
  '..oBBwwwwwwBBBBBBwwwBBBBo',
  '..oBBBwwwwBBBBBBBBBBBBBBo',
  '..oBBBBwwBBBBBBBBBBBBBBBo',
  '..oBBBBBBBBBBBBBBBBBBBBBo',
  '..oBBBBBBBwwwwwwwwwBBBBBo',
  '..oBBBBBBwwwwppppwwwwBBBo',
  '..oooooooooooppppoooooooo',
  '.............oooo'
];
  var TAIL = [
    '', '', '',
    '.B', '.B', '.B', '.B', '.B',
    'dd', 'dd'
  ];
  function legs(shift) {
    // Brown legs with dark hooves; shift moves the lower half to make a walking step.
    var rows = [];
    for (var r = 0; r < 13; r++) rows.push('................................'.split(''));
    [[4, -shift], [8, shift], [17, -shift], [21, shift]].forEach(function (L) {
      for (var y = 9; y <= 12; y++) {
        var a = y >= 11 ? L[0] + L[1] : L[0];
        var c = y === 12 ? 'k' : 'B';
        rows[y][a] = c; rows[y][a + 1] = c;
      }
    });
    return rows.map(function (r) { return r.join(''); });
  }
  var HEAD_UP = [
  '.........................h',
  '......................oooooo',
  '.....................ddBBwwo',
  '.....................oBBkwwo',
  '....................oBBBBwwooooo',
  '...................oBBBBBBwopppo',
  '....................BBBBBBoopkpo',
  '.....................BBBBooooooo',
  '......................BBo'
];   // drawn 4 pixels higher so the head rises above the back
  var HEAD_DOWN = [
  '',
  '',
  '',
  '........................Bo',
  '........................BBoh',
  '........................BBBoo',
  '.......................ddBkwo',
  '........................BBBwwo',
  '........................oBBwwo',
  '.........................oBooooo',
  '.........................oBopppo',
  '..........................oopkpo',
  '...........................ooooo'
];

  function rects(rows, dx, dy) {
    var out = '';
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y] || '';
      var x = 0;
      while (x < row.length) {
        var ch = row[x];
        if (ch === '.' || !C[ch]) { x++; continue; }
        var x0 = x;
        while (x < row.length && row[x] === ch) x++;
        out += '<rect x="' + (x0 + (dx || 0)) + '" y="' + (y + (dy || 0)) + '" width="' + (x - x0) +
               '" height="1" ' + (ch === 'o' ? 'style="fill:var(--cow-line,#2B2118)"' : 'fill="' + C[ch] + '"') + '/>';
      }
    }
    return out;
  }

  var COW_SVG =
    '<g class="tail">' + rects(TAIL) + '</g>' +
    '<g class="legs-a">' + rects(legs(0)) + '</g>' +
    '<g class="legs-b">' + rects(legs(1)) + '</g>' +
    rects(BODY) +
    '<g class="head-up">' + rects(HEAD_UP, 0, -4) + '</g>' +
    '<g class="head-down">' + rects(HEAD_DOWN) + '</g>';

  var TUFT = [
    '..g...G..g..',
    '.gG..gG.gG.G',
    'gGgGgGGgGgGg',
    'tttttttttttt'
  ];
  var TUFT_SVG = rects(TUFT);

  var SPRITE_W = 32, SPRITE_H = 13, TUFT_W = 12, TUFT_H = 4;
  var MUZZLE_X = 29.5;   // where the nose sits in the sprite when grazing

  var pasture = document.getElementById('pasture');
  var sidebar = document.querySelector('.sidebar');
  var content = document.querySelector('.content');
  if (!pasture || !sidebar || !content) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sides = [], scale = 4, running = false, last = 0, resizeTimer = null;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeSvg(w, h, inner, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    s.setAttribute('width', w * scale);
    s.setAttribute('height', h * scale);
    s.setAttribute('shape-rendering', 'crispEdges');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = inner;
    pasture.appendChild(s);
    return s;
  }

  function columns() {
    var vw = document.documentElement.clientWidth;
    var left = { x0: 12, x1: sidebar.getBoundingClientRect().left - GAP_FROM_TEXT };
    var right = { x0: content.getBoundingClientRect().right + GAP_FROM_TEXT, x1: vw - 12 };
    return [left, right];
  }

  function place(el, x, y, flip) {
    el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)' +
                         (flip ? ' scaleX(-1)' : '');
  }

  // Where a cow must stand so its nose is on a patch, facing either way.
  function spotsFor(patch, col) {
    var cowW = SPRITE_W * scale, cowH = SPRITE_H * scale;
    var cx = patch.x + (TUFT_W * scale) / 2;
    var y = patch.y + TUFT_H * scale - cowH;
    var out = [];
    var xr = cx - MUZZLE_X * scale;                     // facing right
    if (xr >= col.x0 && xr + cowW <= col.x1) out.push({ x: xr, y: y, dir: 1 });
    var xl = cx - (SPRITE_W - MUZZLE_X) * scale;        // facing left
    if (xl >= col.x0 && xl + cowW <= col.x1) out.push({ x: xl, y: y, dir: -1 });
    return out;
  }

  function build() {
    pasture.innerHTML = '';
    sides = [];
    var cols = columns();
    var narrowest = Math.min(cols[0].x1 - cols[0].x0, cols[1].x1 - cols[1].x0);
    scale = narrowest >= 260 ? 4 : 3;
    var need = SPRITE_W * scale + TUFT_W * scale;
    if (narrowest < need) { pasture.hidden = true; stop(); return; }
    pasture.hidden = false;

    var vh = window.innerHeight;
    cols.forEach(function (col) {
      var side = { col: col, patches: [], cows: [] };
      var top = 70, bottom = vh - 40 - TUFT_H * scale;
      var band = (bottom - top) / PATCHES_PER_SIDE;
      for (var i = 0; i < PATCHES_PER_SIDE; i++) {
        var patch = {
          x: rand(col.x0, col.x1 - TUFT_W * scale),
          y: top + band * i + rand(SPRITE_H * scale, band),
          taken: null
        };
        if (!spotsFor(patch, col).length) continue;
        patch.el = makeSvg(TUFT_W, TUFT_H, TUFT_SVG, 'tuft');
        place(patch.el, patch.x, patch.y);
        side.patches.push(patch);
      }
      if (side.patches.length < COWS_PER_SIDE + 1) { sides.push(side); return; }
      var shuffled = side.patches.slice().sort(function () { return Math.random() - 0.5; });
      for (var n = 0; n < COWS_PER_SIDE; n++) {
        var p = shuffled[n], spot = spotsFor(p, col)[0];
        var cow = {
          el: makeSvg(SPRITE_W, SPRITE_H, COW_SVG, 'cow grazing'),
          x: spot.x, y: spot.y, dir: spot.dir, patch: p, goal: null,
          timer: rand(1, GRAZE_SECONDS[1])
        };
        p.taken = cow;
        p.el.classList.add('nibbled');
        side.cows.push(cow);
        draw(cow);
      }
      sides.push(side);
    });
    if (!reduceMotion) start();
  }

  function draw(cow) {
    place(cow.el, cow.x, cow.y, cow.dir < 0);
    cow.el.style.zIndex = Math.round(cow.y + SPRITE_H * scale);
  }

  function chooseNext(side, cow) {
    var options = side.patches.filter(function (p) { return !p.taken; });
    if (!options.length) { cow.timer = rand(2, 4); return; }
    var p = options[Math.floor(Math.random() * options.length)];
    var spots = spotsFor(p, side.col);
    spots.sort(function (a, b) { return Math.abs(a.x - cow.x) - Math.abs(b.x - cow.x); });
    if (cow.patch) {
      var old = cow.patch;
      old.taken = null;
      setTimeout(function () { old.el.classList.remove('nibbled'); }, 15000);
    }
    p.taken = cow;
    cow.patch = p;
    cow.goal = spots[0];
    cow.el.classList.remove('grazing');
    cow.el.classList.add('walking');
  }

  function tick(now) {
    if (!running) return;
    var dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    sides.forEach(function (side) {
      side.cows.forEach(function (cow) {
        if (cow.goal) {
          var dx = cow.goal.x - cow.x, dy = cow.goal.y - cow.y;
          var dist = Math.sqrt(dx * dx + dy * dy), stepLen = WALK_SPEED * dt;
          if (Math.abs(dx) > 1) cow.dir = dx > 0 ? 1 : -1;
          if (dist <= stepLen) {
            cow.x = cow.goal.x; cow.y = cow.goal.y; cow.dir = cow.goal.dir;
            cow.goal = null;
            cow.timer = rand(GRAZE_SECONDS[0], GRAZE_SECONDS[1]);
            cow.el.classList.remove('walking');
            cow.el.classList.add('grazing');
            cow.patch.el.classList.add('nibbled');
          } else {
            cow.x += dx / dist * stepLen;
            cow.y += dy / dist * stepLen;
          }
          draw(cow);
        } else {
          cow.timer -= dt;
          if (cow.timer <= 0) chooseNext(side, cow);
        }
      });
    });
    requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }
  function stop() { running = false; }

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build); else build();
})();
