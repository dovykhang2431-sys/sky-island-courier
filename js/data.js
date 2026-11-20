/* Vua Sieu Thi Pho — PWA v7.0 | js/data.js
   Du lieu tinh: san pham, chuong, nang cap, khach, nhan vien, nhiem vu, thanh tuu.
   Khong chua logic choi. Giu lai can bang goc ban 6.1/6.2:
   - Chuong 1: targetCash 4.800.000, targetStar 3.5
   - Dien: 100.000 + chuong * 50.000 / ngay
   - Gia von (cogsPct) 44-52% tuy mon */
(function () {
  var VST = window.VST || (window.VST = {});
  VST.util = {
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    fmt: function (n) {
      n = Math.round(n || 0);
      if (n < 0) return '-' + VST.util.fmt(-n);
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    fmtMoney: function (n) { return VST.util.fmt(n) + 'd'; },
    fmtTime: function (minuteOfDay) {
      var h = Math.floor(minuteOfDay / 60), m = Math.floor(minuteOfDay % 60);
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
  };

  var PRODUCTS = [
    { id: 'veggie', name: 'Rau Cu',    full: 'Rau Cu & Thanh Long', color: '#4ade80', dark: '#166534', basePrice: 48000, cogsPct: 45, batchQty: 12, maxCap: 24, perishable: true,  icon: '🥬', shelf: 0 },
    { id: 'fruit',  name: 'Trai Cay',  full: 'Trai Cay & Cam Tao',   color: '#fb923c', dark: '#9a3412', basePrice: 55000, cogsPct: 46, batchQty: 12, maxCap: 24, perishable: true,  icon: '🍎', shelf: 1 },
    { id: 'noodle', name: 'Mi Goi',    full: 'Mi Goi & Mi Ly',       color: '#facc15', dark: '#854d0e', basePrice: 22000, cogsPct: 47, batchQty: 16, maxCap: 32, perishable: false, icon: '🍜', shelf: 2 },
    { id: 'bread',  name: 'Banh Mi',   full: 'Banh Mi & Banh Ngot',   color: '#d97706', dark: '#78350f', basePrice: 18000, cogsPct: 44, batchQty: 16, maxCap: 32, perishable: false, icon: '🥖', shelf: 3 },
    { id: 'milk',   name: 'Sua Tuoi',  full: 'Sua Tuoi & Nuoc Mat',   color: '#e0f2fe', dark: '#075985', basePrice: 38000, cogsPct: 49, batchQty: 14, maxCap: 28, perishable: false, icon: '🥛', shelf: 4, fridge: true },
    { id: 'drink',  name: 'Nuoc Ngot', full: 'Nuoc Ngot & Tra Sua',   color: '#38bdf8', dark: '#0c4a6e', basePrice: 25000, cogsPct: 50, batchQty: 14, maxCap: 28, perishable: false, icon: '🥤', shelf: 5, fridge: true },
    { id: 'candy',  name: 'Banh Keo',  full: 'Banh Keo & Snack',      color: '#f472b6', dark: '#831843', basePrice: 30000, cogsPct: 52, batchQty: 14, maxCap: 28, perishable: false, icon: '🍬', shelf: 6 },
    { id: 'snack',  name: 'Snack',     full: 'Snack & Hat Kho',      color: '#a78bfa', dark: '#4c1d95', basePrice: 28000, cogsPct: 51, batchQty: 14, maxCap: 28, perishable: false, icon: '🍿', shelf: 7 }
  ];
  var PRODUCT_MAP = {};
  PRODUCTS.forEach(function (p) { PRODUCT_MAP[p.id] = p; });

  // Ke 8 mon: 2 hang x 4 cot (toa do % tren canvas 1280x720)
  var SHELVES = [
    { productId: 'veggie', x: 8,  y: 20, w: 18, h: 15 },
    { productId: 'fruit',  x: 30, y: 20, w: 18, h: 15 },
    { productId: 'noodle', x: 52, y: 20, w: 18, h: 15 },
    { productId: 'bread',  x: 74, y: 20, w: 18, h: 15 },
    { productId: 'milk',   x: 8,  y: 46, w: 18, h: 15 },
    { productId: 'drink',  x: 30, y: 46, w: 18, h: 15 },
    { productId: 'candy',  x: 52, y: 46, w: 18, h: 15 },
    { productId: 'snack',  x: 74, y: 46, w: 18, h: 15 }
  ];
  var STATIONS = {
    pos:    { x: 88, y: 76, label: 'Quay POS' },
    coffee: { x: 8,  y: 76, label: 'May Ca Phe' },
    door:   { x: 50, y: 90, label: 'Cua Ra Vao' },
    truck:  { x: 50, y: 6,  label: 'Xe Tai' },
    bank:   { x: 88, y: 46, label: 'Ngan Hang' }
  };

  var CHAPTERS = [
    { id: 1,  name: 'Tap Hoa Hem Nho',       area: '20m2',  loanCap: 3000000,   targetCash: 4800000,   targetStar: 3.5, maxCust: 4,  spawnSec: 5.2, unlock: 'Ke Rau, Ke Mi, Quay POS' },
    { id: 2,  name: 'Tiem Tap Hoa Pho',      area: '45m2',  loanCap: 6000000,   targetCash: 12000000,  targetStar: 3.8, maxCust: 6,  spawnSec: 4.4, unlock: 'Tu Mat Sua, Nhan vien Kho' },
    { id: 3,  name: 'Sieu Thi Mini Khu Pho', area: '85m2',  loanCap: 12000000,  targetCash: 25000000,  targetStar: 4.0, maxCust: 8,  spawnSec: 3.7, unlock: 'Ke Banh Keo, Thu ngan POS' },
    { id: 4,  name: 'Cua Hang Tien Loi 24h', area: '130m2', loanCap: 20000000,  targetCash: 45000000,  targetStar: 4.2, maxCust: 10, spawnSec: 3.2, unlock: 'Quay Ca Phe Phin, Co Lao Cong' },
    { id: 5,  name: 'Mart Goc Nga Tu',       area: '190m2', loanCap: 32000000,  targetCash: 75000000,  targetStar: 4.3, maxCust: 12, spawnSec: 2.8, unlock: 'Don Shipper, Ky Su Dien Lanh' },
    { id: 6,  name: 'Sieu Thi Gia Dinh',     area: '260m2', loanCap: 48000000,  targetCash: 120000000, targetStar: 4.5, maxCust: 14, spawnSec: 2.4, unlock: 'Kiosk QR, PG Loa Sale' },
    { id: 7,  name: 'Chuoi Pho Trung Tam',   area: '330m2', loanCap: 70000000,  targetCash: 190000000, targetStar: 4.6, maxCust: 16, spawnSec: 2.1, unlock: 'Robot Lau San AI, San Go' },
    { id: 8,  name: 'Sieu Thi Boutique',     area: '410m2', loanCap: 100000000, targetCash: 290000000, targetStar: 4.7, maxCust: 18, spawnSec: 1.9, unlock: 'Tuong Op Go Den Vang, Khach VIP' },
    { id: 9,  name: 'Trung Tam Mua Sam',     area: '480m2', loanCap: 150000000, targetCash: 420000000, targetStar: 4.8, maxCust: 20, spawnSec: 1.7, unlock: 'Khu An Uong, Thang May' },
    { id: 10, name: 'De Che Ban Le',         area: '600m2', loanCap: 250000000, targetCash: 600000000, targetStar: 4.9, maxCust: 22, spawnSec: 1.5, unlock: 'Mo Che Do Tu Do' }
  ];
  var CHAPTER_MAP = {};
  CHAPTERS.forEach(function (c) { CHAPTER_MAP[c.id] = c; });

  var FLOORS = [
    { id: 1, name: 'Gach Men Trang', price: 0,        appeal: 1.00, c1: '#e8e4d8', c2: '#cfc9b8' },
    { id: 2, name: 'Gach Bong Co',   price: 1500000,  appeal: 1.05, c1: '#d9c8a9', c2: '#bfa77e' },
    { id: 3, name: 'Gach Gia Da',    price: 5000000,  appeal: 1.10, c1: '#cbd5e1', c2: '#94a3b8' },
    { id: 4, name: 'San Go Sang',    price: 12000000, appeal: 1.18, c1: '#d4a373', c2: '#a97c50' },
    { id: 5, name: 'San Da Cam Thach', price: 25000000, appeal: 1.25, c1: '#e2e8f0', c2: '#94a3b8' },
    { id: 6, name: 'San Da Vang',    price: 50000000, appeal: 1.35, c1: '#fde68a', c2: '#d97706' }
  ];
  var WALLS = [
    { id: 1, name: 'Tuong Voi Trang', price: 0,        appeal: 1.00, c1: '#f1f5f9', c2: '#cbd5e1' },
    { id: 2, name: 'Tuong Xanh Mint', price: 2000000,  appeal: 1.05, c1: '#a7f3d0', c2: '#6ee7b7' },
    { id: 3, name: 'Tuong Vang Kem',  price: 6000000,  appeal: 1.10, c1: '#fde68a', c2: '#fcd34d' },
    { id: 4, name: 'Tuong Op Go',     price: 16000000, appeal: 1.18, c1: '#b45309', c2: '#78350f' },
    { id: 5, name: 'Tuong Kinh Sang', price: 30000000, appeal: 1.25, c1: '#bae6fd', c2: '#38bdf8' },
    { id: 6, name: 'Tuong Da Vang',   price: 55000000, appeal: 1.35, c1: '#fef3c7', c2: '#f59e0b' }
  ];

  // Nang cap thiet bi: level 1 la mac dinh (da co), mua level 2, 3...
  var UPGRADES = {
    shelf:  { name: 'Ke Hang',      levels: [{ level: 1, price: 0 }, { level: 2, price: 3000000, capMult: 1.5, appeal: 1.08 }, { level: 3, price: 12000000, capMult: 2, appeal: 1.15 }] },
    pos:    { name: 'Quay POS',     levels: [{ level: 1, price: 0 }, { level: 2, price: 4000000, speed: 0.8, tipMult: 1.2 }, { level: 3, price: 15000000, speed: 0.6, tipMult: 1.4 }] },
    fridge: { name: 'Tu Lanh',      levels: [{ level: 1, price: 0 }, { level: 2, price: 5000000, spoilMult: 0.5 }, { level: 3, price: 18000000, spoilMult: 0.25 }] },
    coffee: { name: 'May Ca Phe',   levels: [{ level: 1, price: 0 }, { level: 2, price: 6000000, stamina: 60 }] },
    sign:   { name: 'Bien Quang Cao', levels: [{ level: 0, price: 0 }, { level: 1, price: 2500000, spawnMult: 1.15 }, { level: 2, price: 10000000, spawnMult: 1.3 }, { level: 3, price: 25000000, spawnMult: 1.5 }] }
  };

  var CUSTOMER_TYPES = {
    rush:       { name: 'Voi Va',     icon: '🏃', color: '#f97316', speed: 1.5, patience: 14, spend: 1.0, tip: 1.6, starLoss: 0.03, desc: 'Kien nhan thap, tip cao' },
    picky:      { name: 'Kho Tinh',   icon: '😤', color: '#ef4444', speed: 0.9, patience: 22, spend: 1.2, tip: 0.8, starLoss: 0.08, desc: 'Cho lau tru sao nhieu' },
    vip:        { name: 'VIP',        icon: '👑', color: '#facc15', speed: 1.0, patience: 30, spend: 2.2, tip: 2.0, starLoss: 0.05, desc: 'Mua nhieu, tip lon' },
    kid:        { name: 'Tre Em',     icon: '🧒', color: '#f472b6', speed: 1.2, patience: 18, spend: 0.7, tip: 1.0, starLoss: 0.02, desc: 'Chi mua keo / snack' },
    elder:      { name: 'Nguoi Gia',  icon: '👴', color: '#94a3b8', speed: 0.6, patience: 32, spend: 0.9, tip: 1.2, starLoss: 0.02, desc: 'Di cham, kien nhan' },
    influencer: { name: 'Influencer', icon: '📱', color: '#a78bfa', speed: 1.0, patience: 24, spend: 1.4, tip: 1.5, starLoss: 0.04, desc: 'Hai long thi mai dong khach hon' }
  };

  var STAFF_TYPES = {
    cashier: { name: 'Thu Ngan',      icon: '💰', wage: 180000, desc: 'Tu tinh tien, 1 khach / 1.4s', unlockChapter: 3 },
    stocker: { name: 'Nhan Vien Kho', icon: '📦', wage: 150000, desc: 'Tu len ke khi het hang',    unlockChapter: 2 },
    cleaner: { name: 'Lao Cong',      icon: '🧹', wage: 120000, desc: 'Don vet nuoc / kinh vo nhanh', unlockChapter: 4 },
    shipper: { name: 'Shipper',       icon: '🛵', wage: 200000, desc: 'Giao don nhanh gap doi',     unlockChapter: 5 }
  };

  var MISSION_POOL = [
    { id: 'serve15', text: 'Phuc vu 15 khach trong ngay', target: 15, metric: 'served', rewardCash: 200000, rewardCoins: 5 },
    { id: 'serve25', text: 'Phuc vu 25 khach trong ngay', target: 25, metric: 'served', rewardCash: 400000, rewardCoins: 10 },
    { id: 'rev800k', text: 'Doanh thu 800.000d trong ngay', target: 800000, metric: 'revenue', rewardCash: 300000, rewardCoins: 8 },
    { id: 'rev2m',   text: 'Doanh thu 2.000.000d trong ngay', target: 2000000, metric: 'revenue', rewardCash: 600000, rewardCoins: 15 },
    { id: 'nolost',  text: 'Khong de mat khach nao trong ngay', target: 0, metric: 'lostMax', rewardCash: 250000, rewardCoins: 8 },
    { id: 'restock5', text: 'Len ke 5 lan trong ngay', target: 5, metric: 'restocks', rewardCash: 150000, rewardCoins: 5 },
    { id: 'coffee3', text: 'Pha 3 ly ca phe trong ngay', target: 3, metric: 'coffees', rewardCash: 120000, rewardCoins: 5 },
    { id: 'star45',  text: 'Ket ngay voi sao >= 4.5', target: 4.5, metric: 'starsEnd', rewardCash: 500000, rewardCoins: 12 }
  ];

  var ACHIEVEMENTS = [
    { id: 'serve100',  name: 'Chu Tiem Cham Chi', desc: 'Phuc vu tong 100 khach', rewardCoins: 20 },
    { id: 'serve500',  name: 'Vua Phuc Vu',       desc: 'Phuc vu tong 500 khach', rewardCoins: 50 },
    { id: 'rev10m',    name: 'Trieu Phu Dau Tien', desc: 'Tong doanh thu 10.000.000d', rewardCoins: 30 },
    { id: 'star5',     name: 'Nam Sao Vang',      desc: 'Dat 5.0 sao', rewardCoins: 30 },
    { id: 'chap5',     name: 'Ong Chu Khu Pho',   desc: 'Len chuong 5', rewardCoins: 40 },
    { id: 'chap10',    name: 'De Che Ban Le',     desc: 'Pha dao chuong 10', rewardCoins: 100 },
    { id: 'rich',      name: 'Dai Gia',           desc: 'Tai san rong 100.000.000d', rewardCoins: 50 }
  ];

  var DIFFICULTIES = {
    de:  { name: 'De',  spawnMult: 0.85, patienceMult: 1.3, elecMult: 0.8,  startCash: 5500000 },
    vua: { name: 'Vua', spawnMult: 1.0,  patienceMult: 1.0, elecMult: 1.0,  startCash: 4500000 },
    kho: { name: 'Kho', spawnMult: 1.2,  patienceMult: 0.8, elecMult: 1.2,  startCash: 3500000 }
  };

  var WEATHERS = {
    sun:  { name: 'Nang',    icon: '☀️', spawnMult: 1.0,  desc: 'Ngay dep, khach binh thuong' },
    rain: { name: 'Mua',     icon: '🌧️', spawnMult: 0.85, desc: 'It khach hon, thuong shipper x1.5' },
    fest: { name: 'Le Hoi',  icon: '🎉', spawnMult: 1.35, desc: 'Dong khach, hong rau +10%, dien x1.1' }
  };

  VST.DATA = {
    PRODUCTS: PRODUCTS, PRODUCT_MAP: PRODUCT_MAP, SHELVES: SHELVES, STATIONS: STATIONS,
    CHAPTERS: CHAPTERS, CHAPTER_MAP: CHAPTER_MAP, FLOORS: FLOORS, WALLS: WALLS,
    UPGRADES: UPGRADES, CUSTOMER_TYPES: CUSTOMER_TYPES, STAFF_TYPES: STAFF_TYPES,
    MISSION_POOL: MISSION_POOL, ACHIEVEMENTS: ACHIEVEMENTS, DIFFICULTIES: DIFFICULTIES,
    WEATHERS: WEATHERS
  };
})();
