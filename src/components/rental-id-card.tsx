import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Building2, ShieldCheck, Wifi } from "lucide-react";

// CR80 standard ID card: 85.6 × 53.98 mm  ≈ 3.375" × 2.125"
// Design canvas locked to 1012 × 638 px (≈300 DPI). Use CSS transform: scale()
// from parent if you want smaller previews — the canvas itself stays exact.
export const CARD_WIDTH_PX = 1012;
export const CARD_HEIGHT_PX = 638;

export interface RentalCardData {
  cardNumber: string;
  propertyName: string;
  propertyLocation?: string | null;
  unitNumber: string;
  floorNumber?: number | null;
  monthlyRent?: number;
  tenantName?: string | null;
  tenantPhone?: string | null;
  tenantEmail?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  occupation?: string | null;
  employer?: string | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  arrears?: number;
  issuedAt: string | null;
  status?: string;
}

const PAY_SCHEME = "habico-pay";

export function buildPaymentPayload(cardNumber: string, origin?: string) {
  // QR encodes a web URL that:
  //  - shows card info / login when opened in a browser
  //  - routes to mobile payment when handled by the Habico app
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://habico.vercel.app");
  return `${base}/card?c=${encodeURIComponent(cardNumber)}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatExpiry(d: string | null | undefined) {
  if (!d) return "—";
  const issued = new Date(d);
  const exp = new Date(issued);
  exp.setFullYear(exp.getFullYear() + 2);
  return exp.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

/* ---------------- FRONT ---------------- */
export const RentalCardFront = forwardRef<HTMLDivElement, { data: RentalCardData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
          background:
            "radial-gradient(120% 140% at 0% 0%, #0e3a3a 0%, #08272a 55%, #04181a 100%)",
          color: "#F4EFE6",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          position: "relative",
          overflow: "hidden",
          borderRadius: 38,
          boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
        }}
      >
        {/* Decorative orange swoosh */}
        <svg
          viewBox="0 0 1012 638"
          width={CARD_WIDTH_PX}
          height={CARD_HEIGHT_PX}
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id="hg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#F47B2A" />
              <stop offset="100%" stopColor="#C84F0E" />
            </linearGradient>
            <linearGradient id="sheen" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 L1012,0 L1012,260 C820,180 540,340 260,300 C140,282 60,300 0,360 Z"
            fill="url(#hg)"
            opacity="0.95"
          />
          <path
            d="M0,360 C140,300 360,420 600,360 C820,310 940,360 1012,310 L1012,638 L0,638 Z"
            fill="url(#sheen)"
          />
          {/* fine guilloché pattern */}
          {Array.from({ length: 26 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${260 + i * 16} Q 506 ${300 + (i % 2 === 0 ? -20 : 20)} 1012 ${260 + i * 16}`}
              stroke="rgba(244,239,230,0.04)"
              strokeWidth="1"
              fill="none"
            />
          ))}
        </svg>

        {/* Header row */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 44,
            right: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <Building2 size={28} color="#F4EFE6" />
            </div>
            <div style={{ lineHeight: 1 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: 4,
                  color: "#FFFFFF",
                }}
              >
                HABICO
              </div>
              <div
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  letterSpacing: 6,
                  color: "#F4EFE6",
                  opacity: 0.85,
                  fontWeight: 600,
                }}
              >
                PROPERTY · RENTAL ID
              </div>
            </div>
          </div>
          <Wifi size={22} color="#F4EFE6" style={{ opacity: 0.7, transform: "rotate(90deg)" }} />
        </div>

        {/* Chip + holo */}
        <div style={{ position: "absolute", top: 184, left: 48 }}>
          <div
            style={{
              width: 92,
              height: 70,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #d6c98c 0%, #b59a4b 40%, #f6e9b0 70%, #8d7327 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            {/* chip traces */}
            <svg viewBox="0 0 92 70" width="92" height="70" style={{ position: "absolute", inset: 0 }}>
              <g stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" fill="none">
                <path d="M0 18 H30 V0" />
                <path d="M0 35 H46" />
                <path d="M0 52 H30 V70" />
                <path d="M92 18 H62 V0" />
                <path d="M92 35 H46" />
                <path d="M92 52 H62 V70" />
                <rect x="30" y="18" width="32" height="34" rx="4" />
              </g>
            </svg>
          </div>
        </div>

        {/* Holographic seal */}
        <div
          style={{
            position: "absolute",
            top: 184,
            left: 160,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, #f59e0b, #fde68a, #fb923c, #f59e0b, #fde68a, #ea580c, #f59e0b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 14px -6px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <ShieldCheck size={32} color="#1c1917" />
        </div>

        {/* Card number */}
        <div
          style={{
            position: "absolute",
            top: 292,
            left: 48,
            right: 48,
            fontFamily: '"OCR A", "Courier New", ui-monospace, monospace',
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 10,
            color: "#FFFFFF",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {data.cardNumber}
        </div>

        {/* Tenant + Unit + Property block */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            left: 48,
            right: 320,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(244,239,230,0.65)", fontWeight: 700 }}>
              CARDHOLDER
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginTop: 6 }}>
              {data.tenantName || "UNASSIGNED"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(244,239,230,0.65)", fontWeight: 700 }}>
              UNIT
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginTop: 6 }}>
              {data.unitNumber}
            </div>
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(244,239,230,0.65)", fontWeight: 700 }}>
              PROPERTY
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#F4EFE6", marginTop: 4 }}>
              {data.propertyName}
            </div>
          </div>
        </div>

        {/* QR + valid dates */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            right: 44,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 10,
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 6px 14px -8px rgba(0,0,0,0.5)",
            }}
          >
            <QRCodeSVG
              value={buildPaymentPayload(data.cardNumber)}
              size={140}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#0e3a3a"
            />
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 11, color: "rgba(244,239,230,0.85)" }}>
            <div>
              <div style={{ letterSpacing: 2, opacity: 0.7, fontWeight: 700 }}>ISSUED</div>
              <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{formatDate(data.issuedAt)}</div>
            </div>
            <div>
              <div style={{ letterSpacing: 2, opacity: 0.7, fontWeight: 700 }}>VALID THRU</div>
              <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{formatExpiry(data.issuedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
RentalCardFront.displayName = "RentalCardFront";

/* ---------------- BACK ---------------- */
function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(244,239,230,0.5)", fontWeight: 700, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#F4EFE6", lineHeight: 1.3 }}>
        {String(value)}
      </div>
    </div>
  );
}

function formatIdTypeLabel(t: string | null | undefined) {
  if (!t) return null;
  return t === "drivers_license" ? "Driver's License" : t === "national_id" ? "National ID" : "Passport";
}

export const RentalCardBack = forwardRef<HTMLDivElement, { data: RentalCardData }>(
  ({ data }, ref) => {
    const leftWidth = 480;
    const rightX = 520;
    return (
      <div
        ref={ref}
        style={{
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
          background: "linear-gradient(180deg, #04181a 0%, #0a2e30 100%)",
          color: "#F4EFE6",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          position: "relative",
          overflow: "hidden",
          borderRadius: 38,
          boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
        }}
      >
        {/* magnetic stripe */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            right: 0,
            height: 60,
            background:
              "linear-gradient(180deg, #1a1a1a 0%, #000 50%, #1a1a1a 100%)",
          }}
        />

        {/* Data panel - left side */}
        <div style={{ position: "absolute", top: 116, left: 36, width: leftWidth }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
            {/* Tenant identity */}
            <div style={{ width: "100%", marginBottom: 4 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#F47B2A", fontWeight: 800 }}>
                TENANT
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>
                {data.tenantName || "UNASSIGNED"}
              </div>
            </div>
            <div style={{ width: "100%", marginBottom: 2 }}>
              <div style={{ height: 1, background: "rgba(244,239,230,0.12)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: 2 }}>
            <div style={{ width: "45%" }}>
              <InfoRow label="PHONE" value={data.tenantPhone} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="EMAIL" value={data.tenantEmail} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="ID TYPE" value={formatIdTypeLabel(data.idType)} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="ID NUMBER" value={data.idNumber} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="OCCUPATION" value={data.occupation} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="EMPLOYER" value={data.employer} />
            </div>
            {data.emergencyContact && (
              <>
                <div style={{ width: "100%", marginTop: 2 }}>
                  <div style={{ fontSize: 9, letterSpacing: 3, color: "#F47B2A", fontWeight: 800 }}>
                    EMERGENCY CONTACT
                  </div>
                </div>
                <div style={{ width: "45%" }}>
                  <InfoRow label="NAME" value={data.emergencyContact} />
                </div>
                <div style={{ width: "45%" }}>
                  <InfoRow label="PHONE" value={data.emergencyPhone} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Data panel - right side */}
        <div style={{ position: "absolute", top: 116, right: 36, width: 440 }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#F47B2A", fontWeight: 800 }}>
              PROPERTY
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
            <div style={{ width: "100%" }}>
              <InfoRow label="NAME" value={data.propertyName} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="LOCATION" value={data.propertyLocation} />
            </div>
            <div style={{ width: "45%" }}>
              <InfoRow label="UNIT" value={data.unitNumber} />
            </div>
            {data.floorNumber != null && (
              <div style={{ width: "45%" }}>
                <InfoRow label="FLOOR / BLOCK" value={data.floorNumber} />
              </div>
            )}
            {data.monthlyRent != null && data.monthlyRent > 0 && (
              <div style={{ width: "45%" }}>
                <InfoRow label="MONTHLY RENT" value={`UGX ${data.monthlyRent.toLocaleString()}`} />
              </div>
            )}
            {data.arrears != null && data.arrears > 0 && (
              <div style={{ width: "45%" }}>
                <InfoRow label="ARREARS" value={`UGX ${data.arrears.toLocaleString()}`} />
              </div>
            )}
            {data.leaseStart && (
              <div style={{ width: "45%" }}>
                <InfoRow label="LEASE START" value={data.leaseStart} />
              </div>
            )}
            {data.leaseEnd && (
              <div style={{ width: "45%" }}>
                <InfoRow label="LEASE END" value={data.leaseEnd} />
              </div>
            )}
          </div>

          {/* QR + valid dates */}
          <div style={{ position: "absolute", bottom: 140, right: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ padding: 8, background: "#FFFFFF", borderRadius: 10 }}>
              <QRCodeSVG value={buildPaymentPayload(data.cardNumber)} size={120} level="H" bgColor="#FFFFFF" fgColor="#0e3a3a" />
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 10, color: "rgba(244,239,230,0.85)" }}>
              <div>
                <div style={{ letterSpacing: 2, opacity: 0.6, fontWeight: 700 }}>ISSUED</div>
                <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{formatDate(data.issuedAt)}</div>
              </div>
              <div>
                <div style={{ letterSpacing: 2, opacity: 0.6, fontWeight: 700 }}>EXPIRES</div>
                <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{formatExpiry(data.issuedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 34,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 36px",
            fontSize: 9,
            color: "rgba(244,239,230,0.6)",
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: 2, color: "rgba(244,239,230,0.8)" }}>
            HABICO PROPERTY MANAGEMENT
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>support@habico.co.ug</span>
            <span>+256 700 000 000</span>
          </div>
          <div style={{ fontFamily: '"OCR A", "Courier New", ui-monospace, monospace', letterSpacing: 2 }}>
            {data.cardNumber}
          </div>
        </div>
      </div>
    );
  },
);
RentalCardBack.displayName = "RentalCardBack";
