// Phase-A R2.4 — typed.
// =====================================================
// Credential / Certificate page
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer, toFa } from "../shared";
import { CREDENTIALS } from "../data.js";
import { Button } from "../ui";
import type { Go } from "../router";

const CredentialVerifyForm: React.FC = () => {
  const [code, setCode] = React.useState<string>("");
  return (
    <form className="flex gap-2 mt-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) {
          window.toast?.({ title: "خطا", msg: "ابتدا شناسه گواهی را وارد کنید.", kind: "warn" });
          return;
        }
        if (code.startsWith("DU-")) {
          window.toast?.({ title: "گواهی معتبر است", msg: "این گواهی توسط DigiUniversity در ۱۴۰۴ صادر شده.", kind: "success", ttl: 4500 });
        } else {
          window.toast?.({ title: "شناسه نامعتبر", msg: "شناسه باید با DU- شروع شود.", kind: "danger" });
        }
      }}
      
    >
      <input className="flex-1 rounded-xl text-left"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="DU-2026-..."
        aria-label="شناسه گواهی"
         style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          padding: "10px 12px",
          color: "var(--fg)",
          fontFamily: "var(--f-mono)",
          fontSize: 13,
          direction: "ltr"}}
      />
      <Button variant="secondary" size="sm" type="submit" aria-label="بررسی گواهی">بررسی</Button>
    </form>
  );
};

interface CredentialPageProps { go: Go }

export const CredentialPage: React.FC<CredentialPageProps> = ({ go }) => {
  return (
    <main data-screen-label="08 گواهی">
      <section style={{ padding: "80px 0 40px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell text-center" >
          <span className="eyebrow justify-center" >VERIFIABLE CREDENTIALS · OPEN BADGES 3.0</span>
          <h1 className="h-display mt-4.5"  style={{ fontSize: "clamp(40px, 5vw, 80px)"}}>
            مدرکی که <span style={{ background: "linear-gradient(110deg, var(--amber), var(--cyan))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>قابل اثبات</span> است
          </h1>
          <p className="lead" style={{ margin: "20px auto 0" }}>
            هر گواهی با امضای دیجیتال دانشگاه، QR قابل راستی‌آزمایی عمومی، و فهرست شواهد یادگیری همراه است.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "60px 40px" }}>
        <div className="grid gap-10 items-start"  style={{ gridTemplateColumns: "1.4fr 1fr"}}>
          {/* Certificate */}
          <div className="cert">
            <div className="cert-head">
              <div>
                <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.12em" }}>DIGIUNIVERSITY · CERT</div>
                <div className="mt-1.5"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)"}}>ID · DU-2026-CS410-04217-A1</div>
              </div>
              <div className="cert-seal"></div>
            </div>
            <h2>گواهی پایان دوره با تسلط کامل</h2>
            <div className="mt-4.5"  style={{fontSize: 14, color: "var(--fg-mute)"}}>
              این سند گواهی می‌کند که
            </div>
            <div className="name">نسرین رضوی</div>
            <div className="mt-2"  style={{fontSize: 14, color: "var(--fg-mute)"}}>
              دوره‌ی <strong style={{ color: "var(--fg)" }}>مبانی یادگیری ماشین (CS-410)</strong> را با تسلط <strong style={{ color: "var(--amber)" }}>۹۲٪</strong> بر اهداف یادگیری به پایان رسانده است.
            </div>
            <div className="meta-row">
              <div>
                <div className="lab">تاریخ صدور</div>
                <div className="val">۱۸ اسفند ۱۴۰۴</div>
              </div>
              <div>
                <div className="lab">استاد</div>
                <div className="val">دکتر آرش عظیمی</div>
              </div>
              <div>
                <div className="lab">سطح</div>
                <div className="val">کارشناسی ارشد</div>
              </div>
            </div>
            <div className="cert-qr"></div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4" >
            <div className="card p-6" >
              <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>RAW CREDENTIAL · OB 3.0</div>
              <pre className="p-4 rounded-lg overflow-auto text-left m-0"  style={{fontFamily: "var(--f-mono)",
                fontSize: 11,
                lineHeight: 1.7,
                background: "var(--bg-deep)",
                direction: "ltr",
                color: "var(--fg-mute)",
                border: "1px solid var(--line)"}}>
{`{
  "@context": "https://w3.org/openbadges/v3",
  "type": "OpenBadgeCredential",
  "id": "urn:digiu:cert:CS410-04217",
  "issuer": "did:web:digiu.edu",
  "issuanceDate": "2026-03-08T14:22Z",
  "credentialSubject": {
    "name": "Nasrin Razavi",
    "achievement": "ML.Foundations",
    "mastery": 0.92
  },
  "proof": { "type": "Ed25519Sig" }
}`}
              </pre>
              <div className="flex gap-2 mt-3.5" >
                <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={() => window.toast?.({ title: "JSON-LD آماده شد", msg: "credential.json دانلود شد.", kind: "success" })}
                >
                  <Icon name="download" size={13} />JSON-LD
                </Button>
                <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={() => window.toast?.({ title: "PDF آماده شد", msg: "گواهی به‌صورت PDF دانلود شد.", kind: "success" })}
                >
                  <Icon name="download" size={13} />PDF
                </Button>
              </div>
            </div>

            <div className="card p-6" >
              <div className="mono mb-3.5"  style={{color: "var(--cyan)", fontSize: 11, letterSpacing: "0.08em"}}>EVIDENCE · ۲۴ شاهد یادگیری</div>
              <ul className="p-0 m-0 flex flex-col gap-2"  style={{listStyle: "none"}}>
                {[
                  ["۸ آزمون تطبیقی موفق", "۹۲٪"],
                  ["۱۲ پروژه عملی", "۹۰٪"],
                  ["۲۲ ساعت کلاس فعال", "۹۸٪"],
                  ["پروژه پایانی", "A"],
                ].map(([t, v]) => (
                  <li className="flex justify-between" key={t}  style={{ fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line)"}}>
                    <span style={{ color: "var(--fg-mute)" }}>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--cyan)", fontWeight: 600 }}>{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6" >
              <div className="mono mb-3.5"  style={{color: "var(--amber)", fontSize: 11, letterSpacing: "0.08em"}}>VERIFY</div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
                هر شخص یا سازمان می‌تواند با اسکن QR یا وارد کردن شناسه گواهی، صحت آن را در ثانیه راستی‌آزمایی کند.
              </p>
              <CredentialVerifyForm />
            </div>
          </aside>
        </div>

        {/* All credentials grid */}
        <div className="mt-20" >
          <div className="section-head mb-8" >
            <div className="text">
              <span className="eyebrow">ALL CREDENTIALS</span>
              <h2 className="h-2 mt-3.5" >کیف اعتبارنامه</h2>
            </div>
            <Button variant="outline" onClick={() => {
                if (navigator.clipboard) navigator.clipboard.writeText("https://digiu.edu/u/nasrin/credentials").catch(() => {});
                window.toast?.({ title: "لینک پروفایل کپی شد", msg: "digiu.edu/u/nasrin/credentials", kind: "success" });
              }}
            >
              <Icon name="share" size={14} />
              اشتراک پروفایل عمومی
            </Button>
          </div>
          <div className="grid grid-3">
            {CREDENTIALS.map((cred, i) => {
              const c = { t: cred.title, m: cred.mastery, kind: cred.kind, date: cred.date, color: cred.color };
              return (
              <div
                key={i}
                className="card p-6 cursor-pointer"
                
                onClick={() => window.toast?.({ title: c.t, msg: `${c.kind} · ${c.date} · تسلط ${c.m}٪` })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") window.toast?.({ title: c.t, msg: `${c.kind} · ${c.date}` }); }}
              >
                <div className="flex items-center justify-between mb-4.5" >
                  <span className={"pill pill-" + c.color} style={{ fontSize: 10 }}>{c.kind}</span>
                  <div className="relative"  style={{width: 36, height: 36, borderRadius: 50,
                    background: "conic-gradient(from 0deg, var(--amber), var(--cyan), var(--violet), var(--amber))"}}>
                    <div className="absolute grid"  style={{ inset: 3, borderRadius: 50, background: "var(--surface)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700, color: "var(--amber)"}}>VC</div>
                  </div>
                </div>
                <h4 className="mb-2.5"  style={{fontSize: 16}}>{c.t}</h4>
                <div className="mb-4"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>{c.date}</div>
                <div className="flex items-center gap-3" >
                  <div className="flex-1 rounded-full overflow-hidden"  style={{ height: 4, background: "var(--surface-2)"}}>
                    <div className="rounded-full"  style={{width: c.m + "%", height: "100%", background: "var(--cyan)"}} />
                  </div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600 }}>{toFa(c.m)}٪</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

export default CredentialPage;
