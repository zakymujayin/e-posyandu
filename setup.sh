#!/usr/bin/env bash
# E-Posyandu — Setup deployment satu perintah.
# Jalankan:  bash setup.sh   (atau ./setup.sh)
# Tahapan:   install dependencies → buat tabel + seed data inti → build produksi.
set -euo pipefail

echo "🚀 E-Posyandu — Setup Deployment"
echo "================================="

# 1. Pastikan file environment ada
if [ ! -f .env ] && [ ! -f .env.local ]; then
  echo "❌ File .env tidak ditemukan."
  echo "   Salin dulu:  cp .env.example .env   lalu isi DATABASE_URL & secret."
  exit 1
fi

# 2. Pastikan DATABASE_URL terisi
if ! cat .env .env.local 2>/dev/null | grep -qE '^DATABASE_URL=.+'; then
  echo "❌ DATABASE_URL belum diisi di .env / .env.local"
  exit 1
fi

# 3. Install dependencies (sudah termasuk prisma/tsx/dotenv di dependencies)
echo ""
echo "📦 [1/3] Install dependencies..."
npm install

# 4. Setup database: buat tabel + seed data inti (TANPA dummy pengajuan/balita/ATS)
echo ""
echo "🗄️  [2/3] Setup database (tabel + seed data inti)..."
npm run db:setup

# 5. Build produksi
echo ""
echo "🏗️  [3/3] Build produksi..."
npm run build

echo ""
echo "✅ Setup selesai!"
echo "   Jalankan aplikasi :  npm start                              (port 3000)"
echo "   atau dengan PM2   :  pm2 start start.js --name e-posyandu"
echo "   Kredensial login lengkap ada di:  docs/DAFTAR USER E-POSYANDU.xlsx"
