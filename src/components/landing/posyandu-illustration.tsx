export function PosyanduIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 380"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ilustrasi kader posyandu melayani ibu dan bayi"
      role="img"
    >
      {/* Sky */}
      <rect width="480" height="380" fill="#EFF6FF" rx="20" />

      {/* Clouds */}
      <ellipse cx="80" cy="60" rx="40" ry="18" fill="white" opacity="0.8" />
      <ellipse cx="110" cy="52" rx="30" ry="16" fill="white" opacity="0.8" />
      <ellipse cx="55" cy="55" rx="25" ry="14" fill="white" opacity="0.8" />

      <ellipse cx="380" cy="70" rx="35" ry="16" fill="white" opacity="0.7" />
      <ellipse cx="405" cy="62" rx="25" ry="14" fill="white" opacity="0.7" />

      {/* Sun */}
      <circle cx="420" cy="55" r="32" fill="#FEF08A" opacity="0.6" />
      <circle cx="420" cy="55" r="22" fill="#FDE047" opacity="0.85" />

      {/* Ground */}
      <rect x="0" y="310" width="480" height="70" fill="#DCFCE7" rx="0" />
      <ellipse cx="240" cy="312" rx="240" ry="20" fill="#BBF7D0" />

      {/* Building — Posyandu */}
      <rect x="155" y="165" width="170" height="148" fill="#DBEAFE" rx="4" />
      {/* Roof */}
      <polygon points="135,168 240,98 345,168" fill="#2563EB" />
      <polygon points="148,168 240,106 332,168" fill="#3B82F6" />
      {/* Door */}
      <rect x="208" y="255" width="32" height="58" fill="#1D4ED8" rx="4" />
      <circle cx="234" cy="285" r="3" fill="#93C5FD" />
      {/* Windows */}
      <rect x="170" y="190" width="38" height="32" fill="#BFDBFE" rx="4" />
      <rect x="172" cy="206" width="34" height="2" fill="#93C5FD" />
      <rect x="189" y="192" width="2" height="28" fill="#93C5FD" />
      <rect x="272" y="190" width="38" height="32" fill="#BFDBFE" rx="4" />
      <rect x="274" cy="206" width="34" height="2" fill="#93C5FD" />
      <rect x="291" y="192" width="2" height="28" fill="#93C5FD" />
      {/* Health cross */}
      <rect x="232" y="120" width="16" height="36" fill="white" opacity="0.9" rx="2" />
      <rect x="224" y="128" width="32" height="16" fill="white" opacity="0.9" rx="2" />

      {/* Sign/Banner on building */}
      <rect x="175" y="238" width="130" height="16" fill="#EFF6FF" rx="3" />
      <rect x="183" y="242" width="50" height="4" fill="#93C5FD" rx="2" />
      <rect x="183" y="248" width="35" height="4" fill="#93C5FD" rx="2" />

      {/* Tree left */}
      <rect x="74" y="240" width="12" height="70" fill="#92400E" rx="3" />
      <ellipse cx="80" cy="218" rx="34" ry="38" fill="#16A34A" />
      <ellipse cx="62" cy="235" rx="24" ry="28" fill="#15803D" />
      <ellipse cx="98" cy="233" rx="24" ry="28" fill="#15803D" />

      {/* Tree right (smaller) */}
      <rect x="390" y="258" width="10" height="52" fill="#92400E" rx="3" />
      <ellipse cx="395" cy="240" rx="28" ry="30" fill="#16A34A" />
      <ellipse cx="380" cy="254" rx="20" ry="23" fill="#15803D" />

      {/* Bushes */}
      <ellipse cx="148" cy="315" rx="22" ry="12" fill="#22C55E" opacity="0.7" />
      <ellipse cx="332" cy="315" rx="20" ry="11" fill="#22C55E" opacity="0.7" />

      {/* Table */}
      <rect x="185" y="278" width="110" height="10" fill="#CA8A04" rx="4" />
      <rect x="190" y="287" width="10" height="28" fill="#A16207" rx="3" />
      <rect x="280" y="287" width="10" height="28" fill="#A16207" rx="3" />

      {/* Weighing scale on table */}
      <rect x="220" y="260" width="40" height="18" fill="#E2E8F0" rx="4" />
      <rect x="225" y="256" width="30" height="6" fill="#CBD5E1" rx="2" />
      <rect x="238" y="250" width="4" height="10" fill="#94A3B8" rx="1" />
      {/* Scale numbers */}
      <rect x="225" y="264" width="6" height="2" fill="#94A3B8" rx="1" />
      <rect x="233" y="264" width="6" height="2" fill="#64748B" rx="1" />
      <rect x="241" y="264" width="6" height="2" fill="#94A3B8" rx="1" />
      <rect x="249" y="264" width="6" height="2" fill="#94A3B8" rx="1" />

      {/* === KADER FIGURE (right) === */}
      {/* Legs */}
      <rect x="343" y="292" width="11" height="32" fill="#1D4ED8" rx="4" />
      <rect x="358" y="292" width="11" height="32" fill="#1D4ED8" rx="4" />
      {/* Shoes */}
      <ellipse cx="348" cy="325" rx="10" ry="5" fill="#1F2937" />
      <ellipse cx="363" cy="325" rx="10" ry="5" fill="#1F2937" />
      {/* Body/baju */}
      <rect x="338" y="248" width="34" height="46" fill="#16A34A" rx="8" />
      {/* Right arm with clipboard */}
      <rect x="368" y="255" width="10" height="34" fill="#16A34A" rx="4" />
      {/* Clipboard */}
      <rect x="373" y="252" width="22" height="28" fill="#FBBF24" rx="3" />
      <rect x="379" y="248" width="10" height="7" fill="#D97706" rx="2" />
      {/* Lines on clipboard */}
      <rect x="377" y="260" width="13" height="2.5" fill="#92400E" rx="1" />
      <rect x="377" y="265" width="13" height="2.5" fill="#92400E" rx="1" />
      <rect x="377" y="270" width="9" height="2.5" fill="#92400E" rx="1" />
      {/* Left arm */}
      <rect x="330" y="255" width="10" height="28" fill="#16A34A" rx="4" />
      {/* Head */}
      <circle cx="355" cy="234" r="18" fill="#FED7AA" />
      {/* Hijab */}
      <ellipse cx="355" cy="228" rx="19" ry="12" fill="#064E3B" />
      <ellipse cx="355" cy="240" rx="22" ry="8" fill="#064E3B" opacity="0.7" />
      {/* Face features */}
      <ellipse cx="350" cy="236" rx="2.5" ry="3" fill="#92400E" opacity="0.6" />
      <ellipse cx="360" cy="236" rx="2.5" ry="3" fill="#92400E" opacity="0.6" />
      <path d="M 349 242 Q 355 246 361 242" stroke="#92400E" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* === IBU FIGURE (left) === */}
      {/* Legs */}
      <rect x="118" y="292" width="11" height="32" fill="#7C3AED" rx="4" />
      <rect x="133" y="292" width="11" height="32" fill="#7C3AED" rx="4" />
      {/* Shoes */}
      <ellipse cx="123" cy="325" rx="10" ry="5" fill="#1F2937" />
      <ellipse cx="138" cy="325" rx="10" ry="5" fill="#1F2937" />
      {/* Body/baju */}
      <rect x="113" y="252" width="36" height="42" fill="#EC4899" rx="8" />
      {/* Right arm (extended toward scale) */}
      <rect x="145" y="258" width="28" height="10" fill="#EC4899" rx="4" />
      {/* Left arm down */}
      <rect x="105" y="258" width="10" height="26" fill="#EC4899" rx="4" />
      {/* Baby held in arms */}
      <rect x="108" y="272" width="26" height="16" fill="#BFDBFE" rx="6" />
      <circle cx="121" cy="267" r="10" fill="#FED7AA" />
      {/* Baby face */}
      <ellipse cx="118" cy="268" rx="1.5" ry="2" fill="#92400E" opacity="0.5" />
      <ellipse cx="124" cy="268" rx="1.5" ry="2" fill="#92400E" opacity="0.5" />
      {/* Head ibu */}
      <circle cx="131" cy="238" r="18" fill="#FED7AA" />
      {/* Hair */}
      <ellipse cx="131" cy="228" rx="19" ry="11" fill="#1F2937" />
      <ellipse cx="119" cy="234" rx="8" ry="10" fill="#1F2937" />
      {/* Face ibu */}
      <ellipse cx="126" cy="240" rx="2.5" ry="3" fill="#92400E" opacity="0.6" />
      <ellipse cx="136" cy="240" rx="2.5" ry="3" fill="#92400E" opacity="0.6" />
      <path d="M 125 246 Q 131 250 137 246" stroke="#92400E" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Decorative floating dots */}
      <circle cx="430" cy="140" r="6" fill="#86EFAC" opacity="0.5" />
      <circle cx="50" cy="170" r="5" fill="#93C5FD" opacity="0.5" />
      <circle cx="445" cy="180" r="4" fill="#FCD34D" opacity="0.55" />
      <circle cx="35" cy="120" r="7" fill="#FCA5A5" opacity="0.4" />
      <circle cx="460" cy="230" r="5" fill="#C4B5FD" opacity="0.45" />
    </svg>
  )
}
