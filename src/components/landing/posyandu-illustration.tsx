export function PosyanduIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Tampilan dashboard E-Posyandu"
    >
      {/* Drop shadow */}
      <rect x="12" y="14" width="462" height="342" rx="14" fill="#94a3b8" opacity="0.12" />

      {/* Window background */}
      <rect x="6" y="6" width="468" height="348" rx="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Top bar */}
      <rect x="6" y="6" width="468" height="44" rx="14" fill="#1e3a8a" />
      <rect x="6" y="32" width="468" height="18" fill="#1e3a8a" />

      {/* Window control dots */}
      <circle cx="26" cy="28" r="5" fill="#ef4444" opacity="0.65" />
      <circle cx="42" cy="28" r="5" fill="#f59e0b" opacity="0.65" />
      <circle cx="58" cy="28" r="5" fill="#22c55e" opacity="0.65" />

      {/* Top bar title */}
      <text x="240" y="32" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif" opacity="0.85">
        E-Posyandu — Dashboard DPMD Kabupaten Lebak
      </text>

      {/* Sidebar */}
      <rect x="6" y="50" width="56" height="304" fill="#1e40af" opacity="0.92" />

      {/* Sidebar menu items (abstract bars) */}
      <rect x="16" y="66" width="36" height="5" rx="2.5" fill="white" opacity="0.55" />
      <rect x="16" y="75" width="28" height="4" rx="2" fill="white" opacity="0.3" />
      <rect x="16" y="92" width="36" height="5" rx="2.5" fill="white" opacity="0.3" />
      <rect x="16" y="101" width="22" height="4" rx="2" fill="white" opacity="0.3" />
      <rect x="16" y="118" width="36" height="5" rx="2.5" fill="white" opacity="0.3" />
      <rect x="16" y="127" width="18" height="4" rx="2" fill="white" opacity="0.3" />
      <rect x="16" y="144" width="36" height="5" rx="2.5" fill="white" opacity="0.3" />
      <rect x="16" y="153" width="26" height="4" rx="2" fill="white" opacity="0.3" />

      {/* Active menu indicator */}
      <rect x="6" y="62" width="4" height="22" rx="2" fill="#93c5fd" />

      {/* === STAT CARDS === */}
      {/* Card 1 */}
      <rect x="72" y="58" width="126" height="60" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <text x="84" y="80" fill="#1e3a8a" fontSize="22" fontWeight="700" fontFamily="system-ui,sans-serif">128</text>
      <text x="84" y="97" fill="#3b82f6" fontSize="9.5" fontFamily="system-ui,sans-serif">Total Pengajuan</text>
      <rect x="178" y="66" width="12" height="12" rx="3" fill="#2563eb" opacity="0.15" />
      <rect x="180" y="68" width="8" height="8" rx="1.5" fill="#3b82f6" />

      {/* Card 2 */}
      <rect x="204" y="58" width="126" height="60" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <text x="216" y="80" fill="#1e3a8a" fontSize="22" fontWeight="700" fontFamily="system-ui,sans-serif">94</text>
      <text x="216" y="97" fill="#3b82f6" fontSize="9.5" fontFamily="system-ui,sans-serif">Terverifikasi</text>
      <rect x="310" y="66" width="12" height="12" rx="3" fill="#2563eb" opacity="0.15" />
      <rect x="312" y="68" width="8" height="8" rx="1.5" fill="#2563eb" />

      {/* Card 3 */}
      <rect x="336" y="58" width="126" height="60" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <text x="348" y="80" fill="#1e3a8a" fontSize="22" fontWeight="700" fontFamily="system-ui,sans-serif">31</text>
      <text x="348" y="97" fill="#3b82f6" fontSize="9.5" fontFamily="system-ui,sans-serif">Selesai</text>
      <rect x="442" y="66" width="12" height="12" rx="3" fill="#2563eb" opacity="0.15" />
      <rect x="444" y="68" width="8" height="8" rx="1.5" fill="#1d4ed8" />

      {/* === BAR CHART === */}
      <rect x="72" y="126" width="390" height="118" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <text x="84" y="143" fill="#334155" fontSize="9.5" fontWeight="600" fontFamily="system-ui,sans-serif">Pengajuan per Bulan</text>

      {/* Chart grid lines */}
      <line x1="100" y1="158" x2="452" y2="158" stroke="#F1F5F9" strokeWidth="1" />
      <line x1="100" y1="174" x2="452" y2="174" stroke="#F1F5F9" strokeWidth="1" />
      <line x1="100" y1="190" x2="452" y2="190" stroke="#F1F5F9" strokeWidth="1" />
      <line x1="100" y1="206" x2="452" y2="206" stroke="#F1F5F9" strokeWidth="1" />
      <line x1="100" y1="222" x2="452" y2="222" stroke="#E2E8F0" strokeWidth="1" />

      {/* Bars (bottom y=222) */}
      <rect x="108" y="182" width="30" height="40" rx="3" fill="#93c5fd" />
      <rect x="156" y="166" width="30" height="56" rx="3" fill="#60a5fa" />
      <rect x="204" y="158" width="30" height="64" rx="3" fill="#3b82f6" />
      <rect x="252" y="150" width="30" height="72" rx="3" fill="#2563eb" />
      <rect x="300" y="170" width="30" height="52" rx="3" fill="#3b82f6" />
      <rect x="348" y="162" width="30" height="60" rx="3" fill="#2563eb" />
      <rect x="396" y="146" width="30" height="76" rx="3" fill="#1d4ed8" />

      {/* Month labels */}
      <text x="123" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Jan</text>
      <text x="171" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Feb</text>
      <text x="219" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Mar</text>
      <text x="267" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Apr</text>
      <text x="315" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Mei</text>
      <text x="363" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Jun</text>
      <text x="411" y="234" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui,sans-serif">Jul</text>

      {/* === STATUS LIST === */}
      <rect x="72" y="252" width="390" height="96" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />

      {/* Row 1 */}
      <circle cx="90" cy="272" r="4" fill="#3b82f6" />
      <text x="102" y="276" fill="#334155" fontSize="10" fontFamily="system-ui,sans-serif">Menunggu Verifikasi</text>
      <rect x="388" y="264" width="64" height="16" rx="8" fill="#F1F5F9" />
      <text x="420" y="275" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">24 tiket</text>
      <line x1="84" y1="284" x2="456" y2="284" stroke="#F8FAFC" strokeWidth="1.5" />

      {/* Row 2 */}
      <circle cx="90" cy="300" r="4" fill="#2563eb" />
      <text x="102" y="304" fill="#334155" fontSize="10" fontFamily="system-ui,sans-serif">Dalam Proses OPD</text>
      <rect x="388" y="292" width="64" height="16" rx="8" fill="#DBEAFE" />
      <text x="420" y="303" textAnchor="middle" fill="#1d4ed8" fontSize="8" fontFamily="system-ui,sans-serif">18 tiket</text>
      <line x1="84" y1="312" x2="456" y2="312" stroke="#F8FAFC" strokeWidth="1.5" />

      {/* Row 3 */}
      <circle cx="90" cy="328" r="4" fill="#64748b" />
      <text x="102" y="332" fill="#334155" fontSize="10" fontFamily="system-ui,sans-serif">Selesai</text>
      <rect x="388" y="320" width="64" height="16" rx="8" fill="#DCFCE7" />
      <text x="420" y="331" textAnchor="middle" fill="#15803d" fontSize="8" fontFamily="system-ui,sans-serif">31 tiket</text>
    </svg>
  )
}
