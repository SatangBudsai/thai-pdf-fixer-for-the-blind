# Thai PDF Fixer - แปลง PDF ภาษาไทยเป็น Word

โปรแกรมสำหรับแปลงไฟล์ PDF ภาษาไทยเป็นไฟล์ Word (.docx) ที่อ่านได้ถูกต้อง
ออกแบบมาเพื่อผู้พิการทางสายตาโดยเฉพาะ รองรับโปรแกรมอ่านจอ (screen reader) เช่น NVDA และ JAWS

---

## >>> [ดาวน์โหลดโปรแกรม (คลิกที่นี่)](https://github.com/SatangBudsai/thai-pdf-fixer-for-the-blind/releases/latest) <<<

---

## สิ่งที่โปรแกรมทำได้

- แปลงข้อความภาษาไทยจาก PDF ที่ตัวอักษรเพี้ยน ให้กลับมาอ่านได้ปกติ
- ดึงตาราง และรูปภาพจาก PDF ไปใส่ในไฟล์ Word
- รองรับโปรแกรมอ่านจอ (screen reader) ทั้ง NVDA และ JAWS
- มีเสียงแจ้งเตือนเมื่อทำงานสำเร็จหรือเกิดข้อผิดพลาด
- อัปเดตเวอร์ชันใหม่อัตโนมัติ ไม่ต้องดาวน์โหลดเอง

---

## วิธีติดตั้ง (สำหรับผู้ใช้ทั่วไป)

1. ไปที่หน้า [Releases](https://github.com/SatangBudsai/thai-pdf-fixer-for-the-blind/releases/latest) บน GitHub
2. ดาวน์โหลดไฟล์ติดตั้ง:
   - ไฟล์ `.exe` — ตัวติดตั้งแบบ NSIS (แนะนำ)
   - ไฟล์ `.msi` — ตัวติดตั้งแบบ Windows Installer (เหมาะสำหรับผู้ใช้ screen reader เพราะ accessible กว่า)
3. เปิดไฟล์ที่ดาวน์โหลด แล้วทำตามขั้นตอนติดตั้ง
4. ถ้า Windows SmartScreen เตือน ให้กด Tab ไปที่ "More info" แล้วกด Enter จากนั้นกด Tab ไปที่ "Run anyway" แล้วกด Enter

ไม่ต้องติดตั้ง Python หรือโปรแกรมอื่นเพิ่ม ทุกอย่างรวมมาในตัวติดตั้งแล้ว

---

## วิธีใช้งาน

1. เปิดโปรแกรม Thai PDF Fixer
2. กดปุ่ม "เลือกไฟล์ PDF" (screen reader จะอ่านว่า "เลือกไฟล์ PDF เพื่อแปลง")
3. เลือกไฟล์ PDF ที่ต้องการจากหน้าต่างเลือกไฟล์ของ Windows
4. รอระบบอ่านและแกะข้อความ จะมีเสียงแจ้งเตือนเมื่อเสร็จ
5. ดูตัวอย่างข้อความที่แกะได้
6. กดปุ่ม "บันทึกเป็น Word" เลือกที่จะบันทึก
7. รอจนเสร็จ จะมีเสียงแจ้งเตือนเมื่อบันทึกสำเร็จ

ทุกขั้นตอนรองรับการใช้แป้นพิมพ์ทั้งหมด ไม่จำเป็นต้องใช้เมาส์

---

## การอัปเดตเวอร์ชันใหม่

โปรแกรมจะตรวจสอบเวอร์ชันใหม่อัตโนมัติทุกครั้งที่เปิด

- ถ้ามีเวอร์ชันใหม่ จะมีแถบสีน้ำเงินแจ้งเตือนด้านบนของหน้าจอ
- screen reader จะอ่านว่า "มีเวอร์ชันใหม่ พร้อมอัปเดต"
- กดปุ่ม "อัปเดตเลย" โปรแกรมจะดาวน์โหลดและติดตั้งให้อัตโนมัติ แล้วเปิดใหม่เอง
- ไม่ต้องเข้าเว็บไซต์ดาวน์โหลดใหม่

---

## สำหรับนักพัฒนา

### สิ่งที่ต้องติดตั้ง

- Node.js 20 ขึ้นไป
- Rust (stable)
- Python 3.12
- Tauri CLI (`npm install -g @tauri-apps/cli`)

### โครงสร้างโปรเจกต์

```text
thai-pdf-fixer-for-the-blind/
  src/                     # หน้าเว็บ (Next.js + React)
  src-tauri/               # แอป Tauri (Rust)
    binaries/              # ไฟล์ converter.exe (sidecar)
    capabilities/          # สิทธิ์ที่แอปใช้ได้
    src/lib.rs             # จุดเริ่มต้นของ Tauri
    tauri.conf.json        # ตั้งค่า Tauri ทั้งหมด
  python/                  # ตัวแปลง PDF (Python)
    converter.py           # โค้ดหลักในการแปลง PDF
    requirements.txt       # library ที่ใช้
  scripts/                 # สคริปต์ช่วย
    bump-version.mjs       # อัปเดตเลขเวอร์ชันทั้งโปรเจกต์
  .github/workflows/       # GitHub Actions สำหรับ build และ release
```

### วิธี build ในเครื่อง

#### 1. ติดตั้ง dependencies

```bash
# ติดตั้ง frontend dependencies
npm install

# ติดตั้ง Python dependencies
cd python
pip install -r requirements.txt
pip install pyinstaller
```

#### 2. build ตัวแปลง Python เป็น exe

```bash
cd python
pyinstaller --onefile --name converter converter.py
copy dist\converter.exe ..\src-tauri\binaries\converter-x86_64-pc-windows-msvc.exe
```

#### 3. build แอป Tauri

```bash
# build ทั้ง .exe (NSIS) และ .msi
npm run tauri build
```

ไฟล์ installer จะอยู่ที่:

- `src-tauri/target/release/bundle/nsis/` — ไฟล์ .exe
- `src-tauri/target/release/bundle/msi/` — ไฟล์ .msi

### วิธี dev ในเครื่อง

```bash
npm run tauri:dev
```

---

## วิธี deploy (ปล่อยเวอร์ชันใหม่)

### ขั้นตอนแรก (ทำครั้งเดียว) — ตั้งค่า GitHub Secrets

ไปที่ GitHub repository → Settings → Secrets and variables → Actions แล้วเพิ่ม:

1. `TAURI_SIGNING_PRIVATE_KEY` — เนื้อหาของไฟล์ `src-tauri/.tauri/updater.key`
2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — รหัสผ่านของ key (ถ้าไม่ได้ตั้งไว้ ไม่ต้องเพิ่ม secret นี้)

### ปล่อยเวอร์ชันใหม่

#### 1. อัปเดตเลขเวอร์ชัน (คำสั่งเดียว แก้ให้ทั้ง 4 ไฟล์)

```bash
npm run bump 1.2.0
```

สคริปต์จะแก้เวอร์ชันให้อัตโนมัติใน:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src/pages/index.tsx`

#### 2. commit และ tag

```bash
git add -A
git commit -m "release: v1.2.0"
git tag v1.2.0
git push origin main --tags
```

#### 3. GitHub Actions จะทำงานอัตโนมัติ

เมื่อ push tag ที่ขึ้นต้นด้วย `v` ระบบจะ:

1. build ตัวแปลง Python เป็น converter.exe
2. build แอป Tauri ทั้ง .exe และ .msi
3. สร้าง GitHub Release พร้อมไฟล์ดาวน์โหลด
4. สร้างไฟล์ `latest.json` สำหรับระบบอัปเดตอัตโนมัติ

ผู้ใช้ที่ติดตั้งแอปอยู่แล้วจะได้รับแจ้งเตือนอัปเดตอัตโนมัติ

---

## เทคโนโลยีที่ใช้

- Tauri 2 — สร้างแอป desktop
- Next.js + React — หน้าเว็บ
- Tailwind CSS — ตกแต่งหน้าตา
- Python + PyMuPDF + pdfplumber + PyThaiNLP — แปลง PDF และแก้ข้อความไทย
- GitHub Actions — build และ release อัตโนมัติ

---

## ลิขสิทธิ์

CC BY-NC-SA 4.0 — ใช้ได้ฟรีสำหรับวัตถุประสงค์ที่ไม่ใช่เชิงพาณิชย์ หากมีการปรับปรุงแก้ไขต้องเผยแพร่เป็นสาธารณะภายใต้สัญญาอนุญาตเดียวกัน
