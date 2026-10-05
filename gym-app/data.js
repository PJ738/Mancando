/* Seed data from the plan (workout program, meals, tips).
   Edit this file to change exercises or menus. Exercise ids must stay unique
   because logged weights are stored against them. */

var DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
var DAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
var MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// key = JS getDay(): 1 = Monday ... 5 = Friday
var PROGRAMS = {
  1: {
    focus: 'Push', sub: 'อก ไหล่ ไตรเซป', minutes: 50,
    exercises: [
      { id: 'push-bench', name: 'Dumbbell/Barbell bench press', sets: 3, reps: '8-10' },
      { id: 'push-incline', name: 'Incline dumbbell press', sets: 3, reps: '10-12' },
      { id: 'push-ohp', name: 'Dumbbell shoulder press', sets: 3, reps: '10' },
      { id: 'push-lat', name: 'Lateral raise', sets: 3, reps: '12-15' },
      { id: 'push-tri', name: 'Triceps pushdown', sets: 3, reps: '12' }
    ]
  },
  2: {
    focus: 'Pull', sub: 'หลัง ไบเซป', minutes: 50,
    exercises: [
      { id: 'pull-lat', name: 'Lat pulldown', sets: 3, reps: '10-12' },
      { id: 'pull-row', name: 'Seated cable row', sets: 3, reps: '10-12' },
      { id: 'pull-db', name: 'One-arm dumbbell row', sets: 3, reps: '10' },
      { id: 'pull-face', name: 'Face pull', sets: 3, reps: '15' },
      { id: 'pull-curl', name: 'Dumbbell curl', sets: 3, reps: '12' }
    ]
  },
  3: {
    focus: 'ขา', sub: 'เน้นต้นขาหน้า', minutes: 55,
    exercises: [
      { id: 'leg-press', name: 'Leg press (หรือ goblet squat)', sets: 3, reps: '10-12' },
      { id: 'leg-lunge', name: 'Walking lunge / split squat', sets: 2, reps: '10 ต่อข้าง' },
      { id: 'leg-ext', name: 'Leg extension', sets: 3, reps: '12' },
      { id: 'leg-calf', name: 'Calf raise', sets: 3, reps: '15' },
      { id: 'leg-plank', name: 'Plank', sets: 3, reps: '30-45 วินาที', noWeight: true }
    ]
  },
  4: {
    focus: 'Upper ผสม', sub: 'ความหนักเบากว่าวันจันทร์-อังคาร', minutes: 50,
    exercises: [
      { id: 'up-chest', name: 'Machine chest press', sets: 3, reps: '10-12' },
      { id: 'up-row', name: 'Seated row machine', sets: 3, reps: '10-12' },
      { id: 'up-ohp', name: 'Dumbbell shoulder press (เบากว่าวันจันทร์)', sets: 2, reps: '12' },
      { id: 'up-arms', name: 'Curl + pushdown สลับกัน', sets: 2, reps: '12' }
    ]
  },
  5: {
    focus: 'ขา/สะโพก', sub: 'เน้นด้านหลัง + แกนกลางลำตัว', minutes: 50,
    exercises: [
      { id: 'post-rdl', name: 'Romanian deadlift (dumbbell)', sets: 3, reps: '8-10' },
      { id: 'post-hip', name: 'Hip thrust', sets: 3, reps: '10-12' },
      { id: 'post-curl', name: 'Leg curl', sets: 3, reps: '12' },
      { id: 'post-core', name: 'Dead bug / plank', sets: 3, reps: '10 / 30 วินาที', noWeight: true }
    ]
  }
};

var WARMUP = {
  id: 'warmup',
  title: 'Warm-up 5-10 นาที',
  detail: 'เดินหรือปั่นเบา แล้วทำท่าแรกด้วยน้ำหนักเบา 1-2 เซ็ต'
};

var TRAIN_NOTE = 'หยุดแต่ละเซ็ตเมื่อเหลือแรงอีก 2 ครั้ง ถ้าทำครบทุกเซ็ตที่จำนวนครั้งสูงสุดของช่วง 2 ครั้งติดกัน ให้เพิ่มน้ำหนัก 2.5 กก. (ท่าแขน 1-2 กก.)';

var REST_DAY = {
  focus: 'วันพัก', sub: 'วิ่งเบา/เดินเร็ว + ยืดเหยียด',
  checks: [
    {
      id: 'rest-jog',
      title: 'วิ่งสลับเดิน 20-30 นาที',
      detail: 'เดิน 2 นาที วิ่งเบา 1 นาที ทำซ้ำ 8-10 รอบ ถ้าเจ็บเข่าให้เดินเร็วหรือปั่นจักรยานแทน'
    },
    { id: 'rest-stretch', title: 'ยืดเหยียด 10 นาที', detail: '' }
  ]
};

var MEALS_TRAIN = [
  { id: 'm-pre', time: '05:10', title: 'ก่อนเทรน', detail: 'กล้วย 1 ลูก + นมจืด 1 กล่อง' },
  { id: 'm-post', time: '06:45', title: 'หลังเทรน', detail: 'เวย์ 1 สกู๊ป (30 g) + ครีเอทีน 5 g' },
  { id: 'm-bf', time: '07:20', title: 'เช้า', detail: 'ไข่ต้ม 3 ฟอง + ข้าวโอ๊ต 50 g' },
  { id: 'm-lunch', time: '', title: 'กลางวัน', detail: 'อกไก่ 200 g (ดิบ) + ข้าวกล้อง 1 ถ้วย + ผัก 200 g + มันเทศ 150 g' },
  { id: 'm-dinner', time: '', title: 'เย็น', detail: 'ปลา/อกไก่/หมูสันใน 180 g + ข้าวกล้อง 3/4 ถ้วย + ผัก 200 g + เต้าหู้' },
  { id: 'm-fruit', time: '', title: 'ว่าง', detail: 'ฝรั่งหรือส้ม 1 ผล' }
];

var MEALS_REST = [
  { id: 'm-bf', time: '', title: 'เช้า', detail: 'ไข่ต้ม 3 ฟอง + ข้าวโอ๊ต 50 g + กล้วย 1 ลูก' },
  { id: 'm-lunch', time: '', title: 'กลางวัน', detail: 'อกไก่ 200 g (ดิบ) + ข้าวกล้อง 1 ถ้วย + ผัก 200 g + มันเทศ 150 g' },
  { id: 'm-whey', time: '', title: 'โปรตีน', detail: 'เวย์ 1 สกู๊ป (30 g) + ครีเอทีน 5 g (เวลาไหนก็ได้)' },
  { id: 'm-dinner', time: '', title: 'เย็น', detail: 'ปลา/อกไก่/หมูสันใน 180 g + ข้าวกล้อง 3/4 ถ้วย + ผัก 200 g + เต้าหู้' },
  { id: 'm-fruit', time: '', title: 'ว่าง', detail: 'ฝรั่งหรือส้ม 1 ผล' }
];

var TARGETS = [
  { label: 'พลังงาน', value: '~2,000 kcal' },
  { label: 'โปรตีน', value: '140-150 g' },
  { label: 'น้ำ', value: '2.5-3 ลิตร' }
];

var SLEEP_NOTE = 'ตื่น 05:00 · เข้านอนก่อน 21:30-22:00 (นอน 7-7.5 ชม.)';

var TIPS = [
  {
    title: 'กินกับลูกค้า/ซัพพลายเออร์ (กฎ 5 ข้อ)',
    items: [
      'ไม่อดมื้อก่อนหน้า กินโปรตีนเบาๆ (ไข่ต้ม/นม) ก่อนไป จะได้ไม่หิวแล้วสั่งเยอะ',
      'เลือกโปรตีนก่อน: ปลานึ่ง/เผา ไก่ย่าง ต้มยำน้ำใส เนื้อย่าง ยำ ข้าวพอประมาณ 1 ถ้วย',
      'เลี่ยงของทอด ผัดน้ำมันเยอะ น้ำหวานและของหวาน ดื่มน้ำเปล่า โซดา ชาไม่หวาน',
      'แอลกอฮอล์ไม่เกิน 1-2 แก้ว/ครั้ง (แคลอรีสูงและทำให้นอนแย่)',
      'มื้อถัดไปกลับมากินตามแผน ไม่อดชดเชย และเดินเพิ่มสักนิดในวันนั้น'
    ]
  },
  {
    title: 'ระหว่างเดินทาง / 7-11',
    items: [
      'เตรียมติดรถ: น้ำ 1 ลิตร+ ไข่ต้ม อกไก่ ถั่วไม่ปรุงหนึ่งกำมือ กล้วย และเชคเกอร์ที่ใส่ผงเวย์ไว้ล่วงหน้า',
      'แวะพักทุก 2 ชม. เดินยืดเหยียด 5 นาที ช่วยลดง่วงขับรถ',
      '7-11 เลือกให้โปรตีน ≥ 20 g ต่อมื้อ (ดูฉลาก): ไข่ต้ม อกไก่/ไก่ย่าง สลัดอกไก่ ข้าวกล่องไก่ย่าง/ปลา (ขอข้าวน้อย) นมจืด นมถั่วเหลืองไม่หวาน โยเกิร์ตกรีกไม่หวาน ทูน่า ข้าวโพดต้ม มันเทศ กล้วย กาแฟดำ',
      'เลี่ยง: ชานมไข่มุก ชาเขียวขวด เครื่องดื่มชูกำลัง ขนมปังไส้ครีม ไส้กรอกทอด ของทอดทุกชนิด'
    ]
  },
  {
    title: 'กลับบ้าน ตจว.',
    items: [
      'กลับสั้น 1-2 วัน: กินเต็มที่ได้ 1-2 มื้อ ถือเป็น cheat meal ของสัปดาห์ ที่เหลือใช้หลักจาน ผักครึ่งจาน โปรตีนหนึ่งในสี่ ข้าวหนึ่งในสี่',
      'เลี่ยงของเหลวหวานและของหวานที่กินต่อเนื่องหลายมื้อ',
      'เดินเช้าหรือเย็น 30-45 นาที พกเวย์กับครีเอทีน',
      'น้ำหนักที่ขึ้น 1-2 กก. หลังกลับบ้านส่วนใหญ่เป็นน้ำและอาหารตกค้าง ดูแนวโน้มรายเดือน ไม่ต้องดูตัวเลขรายวัน'
    ]
  },
  {
    title: 'คืนนอนดึก หรือวันที่ต้องเดินทางไกล',
    items: [
      'นอนหลังเที่ยงคืน: ข้ามเวทเช้านั้น นอนต่อหรือเดินเบาแทน แล้วเลื่อนท่าไปวันถัดไป ไม่ต้องเทรนซ้อนสองวัน',
      'เดินทางต่างจังหวัดวันธรรมดา: ทำเวทแบบย่อ 3 ท่าหลักของวันนั้นที่ห้องออกกำลังกายโรงแรมหรือที่บ้าน'
    ]
  }
];
