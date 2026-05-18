// =====================================================
// Credential / Certificate page
// =====================================================
const CredentialPage = ({ go }) => {
  return (
    <main data-screen-label="08 گواهی">
      <section style={{ padding: "80px 0 40px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>VERIFIABLE CREDENTIALS · OPEN BADGES 3.0</span>
          <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(40px, 5vw, 80px)" }}>
            مدرکی که <span style={{ background: "linear-gradient(110deg, var(--amber), var(--cyan))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>قابل اثبات</span> است
          </h1>
          <p className="lead" style={{ margin: "20px auto 0" }}>
            هر گواهی با امضای دیجیتال دانشگاه، QR قابل راستی‌آزمایی عمومی، و فهرست شواهد یادگیری همراه است.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "60px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40, alignItems: "start" }}>
          {/* Certificate */}
          <div className="cert">
            <div className="cert-head">
              <div>
                <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.12em" }}>DIGIUNIVERSITY · CERT</div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)", marginTop: 6 }}>ID · DU-2026-CS410-04217-A1</div>
              </div>
              <div className="cert-seal"></div>
            </div>
            <h2>گواهی پایان دوره با تسلط کامل</h2>
            <div style={{ fontSize: 14, color: "var(--fg-mute)", marginTop: 18 }}>
              این سند گواهی می‌کند که
            </div>
            <div className="name">نسرین رضوی</div>
            <div style={{ fontSize: 14, color: "var(--fg-mute)", marginTop: 8 }}>
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
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div className="mono" style={{ color: "var(--fg-mute)", marginBottom: 14, fontSize: 11, letterSpacing: "0.08em" }}>RAW CREDENTIAL · OB 3.0</div>
              <pre style={{
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                lineHeight: 1.7,
                background: "var(--bg-deep)",
                padding: 16,
                borderRadius: 8,
                overflow: "auto",
                direction: "ltr",
                textAlign: "left",
                color: "var(--fg-mute)",
                border: "1px solid var(--line)",
                margin: 0,
              }}>
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
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                  <Icon name="download" size={13} />JSON-LD
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                  <Icon name="download" size={13} />PDF
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div className="mono" style={{ color: "var(--cyan)", marginBottom: 14, fontSize: 11, letterSpacing: "0.08em" }}>EVIDENCE · ۲۴ شاهد یادگیری</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["۸ آزمون تطبیقی موفق", "۹۲٪"],
                  ["۱۲ پروژه عملی", "۹۰٪"],
                  ["۲۲ ساعت کلاس فعال", "۹۸٪"],
                  ["پروژه پایانی", "A"],
                ].map(([t, v]) => (
                  <li key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--fg-mute)" }}>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--cyan)", fontWeight: 600 }}>{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div className="mono" style={{ color: "var(--amber)", marginBottom: 14, fontSize: 11, letterSpacing: "0.08em" }}>VERIFY</div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
                هر شخص یا سازمان می‌تواند با اسکن QR یا وارد کردن شناسه گواهی، صحت آن را در ثانیه راستی‌آزمایی کند.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input placeholder="DU-2026-..." style={{
                  flex: 1,
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: "var(--fg)",
                  fontFamily: "var(--f-mono)",
                  fontSize: 13,
                  direction: "ltr",
                  textAlign: "left",
                }} />
                <button className="btn btn-amber btn-sm">بررسی</button>
              </div>
            </div>
          </aside>
        </div>

        {/* All credentials grid */}
        <div style={{ marginTop: 80 }}>
          <div className="section-head" style={{ marginBottom: 32 }}>
            <div className="text">
              <span className="eyebrow">ALL CREDENTIALS</span>
              <h2 className="h-2" style={{ marginTop: 14 }}>کیف اعتبارنامه</h2>
            </div>
            <button className="btn btn-outline">
              <Icon name="share" size={14} />
              اشتراک پروفایل عمومی
            </button>
          </div>
          <div className="grid grid-3">
            {[
              { t: "مبانی یادگیری ماشین", m: 92, kind: "گواهی پایان دوره", date: "اسفند ۱۴۰۴", color: "cyan" },
              { t: "آمار بیزی کاربردی", m: 84, kind: "گواهی پایان دوره", date: "بهمن ۱۴۰۴", color: "amber" },
              { t: "پایگاه داده پیشرفته", m: 88, kind: "گواهی پایان دوره", date: "دی ۱۴۰۴", color: "violet" },
              { t: "Python برای تحلیل داده", m: 95, kind: "نشان مهارت", date: "آذر ۱۴۰۴", color: "cyan" },
              { t: "تحلیل آماری SPSS", m: 79, kind: "نشان مهارت", date: "آبان ۱۴۰۴", color: "rose" },
              { t: "Git و کنترل نسخه", m: 96, kind: "نشان مهارت", date: "مهر ۱۴۰۴", color: "amber" },
            ].map((c, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <span className={"pill pill-" + c.color} style={{ fontSize: 10 }}>{c.kind}</span>
                  <div style={{
                    width: 36, height: 36, borderRadius: 50,
                    background: "conic-gradient(from 0deg, var(--amber), var(--cyan), var(--violet), var(--amber))",
                    position: "relative",
                  }}>
                    <div style={{ position: "absolute", inset: 3, borderRadius: 50, background: "var(--surface)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700, color: "var(--amber)" }}>VC</div>
                  </div>
                </div>
                <h4 style={{ fontSize: 16, marginBottom: 10 }}>{c.t}</h4>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginBottom: 16 }}>{c.date}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: c.m + "%", height: "100%", background: "var(--cyan)", borderRadius: 999 }} />
                  </div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600 }}>{toFa(c.m)}٪</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

window.CredentialPage = CredentialPage;
