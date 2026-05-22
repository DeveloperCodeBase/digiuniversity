// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Recordings library — post-class artifact bundle
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer } from "../shared";
import { RECORDINGS as RECORDINGS_DATA, findCourse, findFaculty } from "../data.js";
import { Button } from "../ui";

export const RecordingsPage = ({ go }) => {
  return (
    <main data-screen-label="14 آرشیو کلاس‌ها">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="flex justify-between items-end gap-6 flex-wrap" >
            <div>
              <span className="eyebrow">RECORDED CLASSES · ARTIFACT BUNDLES</span>
              <h1 className="h-1 mt-4" >هر کلاس، یک دارایی آموزشی</h1>
              <p className="lead mt-3.5" >
                ویدئو + متن + اسلاید + خلاصه + کوییز + فلش‌کارت + FAQ — همه پس از کلاس به‌صورت خودکار تولید و آماده‌ی بازبینی استاد می‌شود.
              </p>
            </div>
            <div className="flex gap-2" >
              <select className="rounded-xl"  style={{padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", color: "var(--fg)", fontFamily: "inherit", fontSize: 13}}>
                <option>همه‌ی دروس</option>
                <option>یادگیری ماشین</option>
                <option>NLP پیشرفته</option>
              </select>
              <Button variant="outline" onClick={() => go("search")}><Icon name="search" size={14} />جستجو</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured recording */}
      <section className="shell" style={{ padding: "40px 40px 0" }}>
        <div className="grid gap-8 items-center"  style={{ gridTemplateColumns: "1.4fr 1fr"}}>
          <div
            className="recording-card cursor-pointer"
            role="link"
            tabIndex={0}
            aria-label="پخش جلسه ۸ — گرادیان نزولی با مومنتوم"
            onClick={() => go("classroom")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("classroom"); } }}
          >
            <div className="rec-thumb" style={{ aspectRatio: "16 / 9" }}>
              <span className="rec-duration">۱:۲۸:۴۲</span>
              <div className="rec-play">
                <div className="rec-play-btn"><Icon name="play" size={20} /></div>
              </div>
              <div className="rec-chapters">
                {[true, true, true, true, false, false, false, false, false, false].map((p, i) => (
                  <div key={i} className={"ch " + (p ? "played" : "")} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>تازه پردازش شد</span>
            <h2 className="h-2 mt-3.5" >جلسه ۸ — گرادیان نزولی با مومنتوم</h2>
            <div className="mt-2"  style={{fontSize: 13, color: "var(--fg-mute)"}}>
              دکتر آرش عظیمی · CS-410 · ۸ اسفند ۱۴۰۴
            </div>
            <div className="grid rounded-xl overflow-hidden mt-7"  style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "var(--line)", border: "1px solid var(--line)"}}>
              {[
                ["۱:۲۸", "ساعت کلاس"],
                ["۴۲", "حاضران"],
                ["۲۳", "سوال در چت"],
                ["۸", "ابهام تشخیص‌داده"],
              ].map(([v, l], i) => (
                <div className="p-4 text-center" key={i}  style={{background: "var(--surface)"}}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 22, fontWeight: 700 }}>{v}</div>
                  <div className="mt-1"  style={{fontSize: 11, color: "var(--fg-mute)"}}>{l}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5 flex-wrap" >
              {[
                ["خلاصه کوتاه", "file"],
                ["جزوه PDF", "file"],
                ["۸ فلش‌کارت", "layers"],
                ["کوییز ۸ سوال", "check"],
                ["FAQ", "chat"],
              ].map(([t, ic]) => (
                <Button variant="outline" size="sm" key={t}
                  onClick={() => window.toast?.({ title: t, msg: "محتوای جلسه ۸ آماده‌ی نمایش است.", kind: "info" })}
                >
                  <Icon name={ic} size={13} />{t}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All recordings */}
      <section className="shell" style={{ padding: "60px 40px" }}>
        <div className="flex items-baseline justify-between mb-7" >
          <h2 className="h-3">همه‌ی ضبط‌ها · ۸۴ ساعت محتوا</h2>
          <RecordingsSortPills />
        </div>

        <div className="grid grid-3">
          {RECORDINGS.map((r, i) => (
            <div
              key={i}
              className="recording-card cursor-pointer"
              role="link"
              tabIndex={0}
              aria-label={`پخش ${r.title}`}
              onClick={() => go("classroom")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("classroom"); } }}
            >
              <div className="rec-thumb">
                <span className="rec-duration">{r.duration}</span>
                <div className="rec-play">
                  <div className="rec-play-btn" style={{ width: 40, height: 40 }}><Icon name="play" size={14} /></div>
                </div>
                <div className="rec-chapters">
                  {Array.from({ length: r.chapters }, (_, j) => <div key={j} className={"ch " + (j < r.played ? "played" : "")} />)}
                </div>
              </div>
              <div className="p-4.5" >
                <div className="flex items-center gap-2 mb-2" >
                  <span className="pill" style={{ fontSize: 9 }}>{r.code}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-dim)" }}>{r.date}</span>
                </div>
                <h4 className="mb-1.5"  style={{fontSize: 15}}>{r.title}</h4>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{r.by}</div>
                <div className="flex gap-1 mt-3.5 flex-wrap" >
                  {(r.tags || []).map((t) => <span className="rounded" key={t}  style={{fontFamily: "var(--f-mono)", fontSize: 9, padding: "2px 6px", background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--fg-mute)"}}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

// Sort pills — Phase-12 R2: were dead `<span class="pill">` elements
// with no onClick. Now they keep client-side sort state and surface
// the choice via aria-pressed.
const SORT_OPTIONS = ["جدیدترین", "محبوب", "کوتاه‌ترین", "بلندترین"];
const RecordingsSortPills = () => {
  const [active, setActive] = React.useState(SORT_OPTIONS[0]);
  return (
    <div className="flex gap-1.5 flex-wrap" role="group" aria-label="مرتب‌سازی">
      {SORT_OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          className={"pill " + (s === active ? "pill-cyan" : "")}
          style={{ cursor: "pointer", border: "none", background: s === active ? undefined : "var(--surface)" }}
          aria-pressed={s === active}
          onClick={() => setActive(s)}
        >{s}</button>
      ))}
    </div>
  );
};

// Recordings hydrated from data.js — adapt shape: by = instructor name, code = course code, tags = topic.
const RECORDINGS = RECORDINGS_DATA.map((rec) => {
  const course = findCourse(rec.course);
  const inst = course ? findFaculty(course.instructor) : null;
  return {
    title: rec.title,
    code: course?.code || "—",
    by: inst?.name || "—",
    date: rec.date,
    duration: rec.duration,
    chapters: rec.chapters,
    played: rec.played,
    tags: course?.tags || [],
  };
});

export default RecordingsPage;
