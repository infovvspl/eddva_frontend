## Summary
- **Files Scanned:** 490
- **Files to Modify:** 308
- **Ambiguous Flex Containers:** 4306

# Responsive Transformation Dry-Run Report

This report flags all the responsive changes the script intends to make.

### `src\pages\admin\AdminDashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 136: `<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-3">`
- Line 143: `<p className="text-base font-semibold text-slate-600 mt-2 flex items-center gap-2">`
- Line 148: `<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4">`
- Line 149: `<div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">`
- Line 156: `<div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">`
- Line 233: `<div className="flex items-center gap-3">`
- Line 254: `className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"`
- Line 268: `className="group flex items-center gap-5 p-5 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl transition-all cursor-pointer"`

### `src\pages\admin\AdminNotificationsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 57: `"group relative flex gap-4 p-5 rounded-2xl border transition-all",`
- Line 97: `className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"`
- Line 105: `className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"`
- Line 114: `className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"`
- Line 203: `<h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">`
- Line 220: `className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors"`
- Line 233: `<div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">`
- Line 281: `<p className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-1">`

### `src\pages\admin\AdminOnboardingPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 104: `<span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">`
- Line 113: `<div className="flex gap-2">`
- Line 122: `className="px-4 h-10 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5">`
- Line 287: `<div className="flex items-center gap-3 mb-12">`
- Line 311: `<div key={i} className={cn("flex items-center gap-3 transition-all duration-300", !done && !active && "opacity-40")}>`
- Line 349: `<div className="flex items-center gap-5">`
- Line 429: `"flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",`
- Line 471: `? <button onClick={prev} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">`
- Line 480: `<div className="flex items-center gap-3">`
- Line 483: `className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-200">`
- Line 493: `className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-200">`

### `src\pages\admin\AdminSettingsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 68: `<p className={`text-xs flex items-center gap-1 ${isCrit ? "text-red-500" : "text-amber-500"}`}>`
- Line 231: `<div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">`
- Line 258: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 269: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 284: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 296: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 313: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 317: `<div className="flex gap-2">`
- Line 332: `<span key={course} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">`
- Line 346: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 357: `className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${`
- Line 374: `<label className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 458: `<div className="flex items-center gap-3">`
- Line 511: `<div className="flex gap-3">`
- Line 553: `className="group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-white truncate cursor-default hover:opacity-90"`
- Line 579: `<div key={t.value} className="flex items-center gap-1.5">`
- Line 592: `<div key={ev.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">`
- Line 656: `<div className="flex items-center gap-2 mb-1">`
- Line 683: `<span key={f} className="text-xs flex items-center gap-1 bg-background border border-border rounded-full px-3 py-1 text-foreground">`
- Line 700: `<div className="flex items-start gap-4">`
- Line 709: `<button className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">`
- Line 719: `<h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Billing Email</h3>`
- Line 722: `<div className="flex gap-3">`
- Line 731: `<div className="flex items-center gap-3">`
- Line 783: `<div className="flex items-start gap-3">`
- Line 848: `<div className="flex overflow-x-auto border-b border-border gap-1 scrollbar-none -mb-px">`
- Line 853: `className={`shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${`

### `src\pages\admin\AdminStudentDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 17: `<div className="flex items-center gap-3">`

### `src\pages\admin\BatchDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 196: `<div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">`
- Line 269: `<div className="flex gap-3">`
- Line 271: `className={`flex-1 h-10 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${`
- Line 277: `className={`flex-1 h-10 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${`
- Line 310: `<span className="relative z-10 text-xs font-semibold bg-white/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">`
- Line 320: `<div className="flex gap-3 pt-1">`
- Line 367: `<div className="flex items-center gap-2">`
- Line 399: `<div className="flex items-center gap-2">`
- Line 412: `<div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 relative">`
- Line 427: `<div className="flex justify-end gap-2">`
- Line 452: `<div className="flex items-center gap-2">`
- Line 462: `<div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl">`
- Line 482: `<div className="flex items-center gap-0.5 mb-2">`
- Line 567: `<div className="flex items-center justify-between gap-4">`
- Line 569: `className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">`
- Line 572: `<div className="flex items-center gap-2">`
- Line 592: `className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">`
- Line 596: `className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">`
- Line 600: `className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">`
- Line 659: `<div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 uppercase">`
- Line 670: `<div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">`
- Line 680: `<div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase">`
- Line 690: `<div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 uppercase">`
- Line 700: `<div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">`

### `src\pages\admin\BatchesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 162: `<div className="flex items-center gap-2 text-sm text-red-500">`
- Line 199: `<div className="flex items-center gap-2.5">`
- Line 349: `<div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2.5">`
- Line 365: `<div className="flex gap-2">`
- Line 424: `<div className="flex gap-2">`
- Line 450: `<div className="mt-2 flex items-center gap-2">`
- Line 492: `<div className="flex items-center gap-1.5">`
- Line 544: `<div className="flex items-center gap-2.5">`
- Line 688: `<div className="flex items-center gap-1.5">`
- Line 735: `<div className="flex gap-1">`
- Line 768: `<div className="flex items-center gap-2.5">`
- Line 782: `<span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">`
- Line 842: `<div className="flex items-center gap-1">`
- Line 928: `<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">`
- Line 936: `<div key={s.studentId ?? i} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">`
- Line 950: `<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">`
- Line 958: `<div key={s.studentId ?? i} className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2">`
- Line 1076: `<div className="flex items-center gap-3">`
- Line 1094: `<div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">`
- Line 1173: `className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${`
- Line 1190: `className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${`
- Line 1224: `<div className="bg-slate-900 px-3 py-2 flex items-center gap-2">`
- Line 1233: `<div className="flex items-center gap-2">`
- Line 1242: `<div className="flex items-center gap-2">`
- Line 1272: `<span className="relative z-10 flex items-center gap-1 text-xs font-bold bg-white/90 px-3 py-1.5 rounded-xl shadow-sm">`
- Line 1284: `<div className="px-6 pb-6 flex gap-3">`
- Line 1445: `className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"`
- Line 1470: `<div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">`
- Line 1562: `<div className="flex gap-3">`
- Line 1565: `className={`flex-1 h-12 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${`
- Line 1575: `className={`flex-1 h-12 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${`
- Line 1598: `<div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">`
- Line 1627: `<div className="relative z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm">`
- Line 1650: `<div className="flex gap-3 pt-1">`
- Line 1657: `className="flex-1 h-11 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"`
- Line 1700: `className="w-full bg-white border border-slate-100 rounded-3xl px-5 py-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all text-left group"`
- Line 1712: `<span className="shrink-0 flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">`
- Line 1726: `<div className="flex items-center gap-2">`
- Line 1731: `<span className="flex items-center gap-0.5 text-[11px] font-black text-amber-500">`
- Line 1740: `<div className="flex items-center gap-1.5 shrink-0">`

### `src\pages\admin\ContentPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 117: `<div className="flex items-center gap-1.5 py-1">`
- Line 150: `<div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={e => e.stopPropagation()}>`
- Line 188: `<div className="flex items-center gap-3 mb-4">`
- Line 199: `<div className="flex gap-2">`
- Line 204: `className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">`
- Line 313: `<div className="flex items-center gap-4">`
- Line 342: `<div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">`
- Line 369: `className="group flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"`
- Line 376: `<div className="flex items-center gap-2 mt-0.5">`
- Line 378: `{ytId && <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5"><Youtube className="w-2.5 h-2.5" /> YouTube</span>}`
- Line 379: `{r.description && !r.fileUrl && !r.externalUrl && <span className="text-[10px] text-violet-500 font-black uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Generated</span>}`
- Line 383: `<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">`
- Line 386: `className="h-7 px-3 rounded-xl bg-violet-50 border border-violet-100 text-[10px] font-black text-violet-600 hover:bg-violet-600 hover:text-white transition-all flex items-center gap-1.5">`
- Line 392: `className="h-7 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center gap-1 transition-all">`
- Line 467: `<div className="flex items-center gap-3">`
- Line 497: `className={cn("flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm", rt.bg, rt.border)}>`
- Line 513: `<div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black", activeCfg.bg, activeCfg.border, activeCfg.color)}>`
- Line 541: `<p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">`
- Line 547: `<div className={cn("rounded-2xl border-2 p-4 flex items-center gap-3", activeCfg.bg, activeCfg.border)}>`
- Line 585: `className="w-full h-11 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"`
- Line 663: `<div className="group flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">`
- Line 683: `<div className="flex items-center gap-2 mt-0.5">`
- Line 690: `className="opacity-0 group-hover:opacity-100 h-7 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center gap-1 transition-all shrink-0">`
- Line 758: `<div className="flex items-center gap-1.5 text-xs mb-2">`
- Line 763: `<div className="flex items-start justify-between gap-4">`
- Line 771: `className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-black transition-opacity hover:opacity-90"`
- Line 777: `className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-black bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">`
- Line 782: `className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-black bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors ml-auto">`
- Line 806: `className={cn("flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all hover:shadow-sm", rt.bg, rt.border)}>`
- Line 819: `<div className="flex items-center gap-2">`
- Line 827: `className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors">`
- Line 843: `<div className="flex items-center gap-2">`
- Line 851: `className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">`
- Line 881: `className="fixed bottom-5 right-5 z-30 flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 text-sm font-bold text-white shadow-md sm:bottom-8 sm:right-8"`
- Line 957: `className="flex items-center gap-1 h-7 px-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-black transition-colors"`
- Line 971: `<div className="flex items-center gap-2">`
- Line 1079: `<div className="flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors group">`
- Line 1080: `<button onClick={onToggle} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">`
- Line 1103: `<div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">`
- Line 1174: `className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"`
- Line 1237: `<div className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white transition-colors group">`
- Line 1238: `<button onClick={onToggle} className="flex items-center gap-1.5 shrink-0">`
- Line 1256: `<div className="flex items-center gap-1 shrink-0">`
- Line 1262: `<div className="hidden group-hover:flex items-center gap-0.5">`
- Line 1322: `className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-blue-500 hover:bg-white rounded-xl transition-all"`
- Line 1372: `"flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold group transition-all",`
- Line 1386: `<button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">`
- Line 1391: `"flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",`
- Line 1563: `<div className="flex items-center gap-2 text-slate-500">`
- Line 1576: `<div className="flex items-start justify-between gap-3">`
- Line 1584: `className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 hover:text-slate-700"`
- Line 1630: `<summary className="flex cursor-pointer items-center justify-between gap-2 p-3">`
- Line 1632: `<span className="flex items-center gap-2 text-[10px] font-black">`
- Line 1641: `<summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">`
- Line 1643: `<span className="flex items-center gap-2 text-[10px] font-black">`
- Line 1662: `<span className="ml-3 flex items-center gap-1.5 font-black">`
- Line 1722: `<div className="flex items-center gap-2 sm:gap-2.5">`
- Line 1770: `<div className="flex items-center justify-between gap-3">`
- Line 1778: `<div className="flex gap-3">`
- Line 1907: `<h2 className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">`
- Line 1951: `<div className="flex items-start justify-between gap-3 pl-3">`
- Line 1958: `<div className="flex shrink-0 items-center gap-2">`
- Line 1971: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 1974: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 1977: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2018: `<div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">`
- Line 2043: `<div className="mb-5 flex gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">`
- Line 2057: `className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-90"`
- Line 2066: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"`
- Line 2073: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60"`
- Line 2115: `<h2 className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">`
- Line 2156: `"group relative flex w-full items-stretch gap-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition-all duration-200 sm:p-6",`
- Line 2167: `<div className="flex items-start gap-3">`
- Line 2176: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2180: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2188: `<div className="mb-1.5 flex items-center justify-between gap-2">`
- Line 2258: `<h2 className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">`
- Line 2308: `"group relative flex w-full items-stretch gap-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-4 pr-3 text-left shadow-sm transition-all duration-200 sm:gap-4 sm:py-5 sm:pl-6 sm:pr-4",`
- Line 2317: `<div className="flex min-w-0 flex-1 gap-3 pl-3">`
- Line 2324: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2328: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2332: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2336: `<span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">`
- Line 2429: `<div className="mb-4 flex items-start justify-between gap-3">`
- Line 2468: `<div className="mt-6 flex justify-end gap-2">`
- Line 2476: `className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"`
- Line 2643: `<h3 className="text-lg font-black text-slate-900 flex items-center gap-2">`
- Line 2658: `<div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">`
- Line 2662: `"flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all",`
- Line 2684: `<div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">`
- Line 2694: `"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",`
- Line 2756: `<div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">`
- Line 2790: `<div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">`
- Line 2803: `<div className="flex items-center gap-2 mb-1">`
- Line 2872: `<div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">`
- Line 2881: `className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-40"`
- Line 2889: `<button onClick={() => setStep("input")} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">`
- Line 2895: `className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-black rounded-2xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-60"`
- Line 2970: `<div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">`
- Line 2985: `className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm text-left transition-all disabled:opacity-40"`
- Line 2997: `<div className="flex gap-2 mb-3">`
- Line 3007: `<div className="flex items-center gap-2">`
- Line 3022: `className="w-full h-11 rounded-2xl text-white text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"`
- Line 3241: `<div className="flex min-w-0 items-center gap-3">`
- Line 3246: `<div className="flex items-center gap-2">`
- Line 3274: `<button type="button" onClick={handleSave} disabled={saveAiRes.isPending} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700 disabled:opacity-60">`
- Line 3285: `<div className="flex items-center gap-2">`
- Line 3317: `<div className="mb-3 flex items-center gap-2">`
- Line 3372: `<div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-10 text-sm font-semibold text-slate-500">`
- Line 3379: `<div className="flex gap-2 border-t border-slate-100 p-4">`
- Line 3382: `{generating ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating…</span> : "Generate"}`
- Line 3422: `<div className="flex items-start justify-between gap-3">`
- Line 3438: `<span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">`
- Line 3451: `className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1"`
- Line 3462: `className="text-[11px] font-black text-violet-600 hover:text-violet-800 flex items-center gap-1"`
- Line 3553: `<div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-3">`
- Line 3554: `<div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">`
- Line 3636: `className="group flex shrink-0 items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"`
- Line 3642: `<div className="flex min-w-0 flex-1 items-center gap-2.5">`
- Line 3662: `className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-3"`
- Line 3678: `className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-xs font-black text-white shadow-sm transition hover:opacity-90 sm:px-3.5"`
- Line 3698: `<div className="flex w-full min-w-0 items-stretch justify-around gap-0.5 px-2 sm:gap-1">`
- Line 3819: `className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"`
- Line 3865: `className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"`
- Line 3877: `className="inline-flex w-fit items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-900"`
- Line 3997: `className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"`
- Line 4129: `className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-900"`
- Line 4237: `className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-sm transition hover:opacity-90 sm:w-auto"`
- Line 4261: `className="group flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left hover:bg-indigo-100"`

### `src\pages\admin\LecturesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 61: `<div className="flex items-center gap-2">`
- Line 95: `<div className="flex items-center gap-2 text-sm text-foreground">`
- Line 104: `<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">`
- Line 109: `<div key={i} className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2">`
- Line 113: `<div className="flex items-center gap-1 mt-1">`
- Line 146: `<div className="flex items-center gap-0 px-6 py-4 border-b border-slate-100">`
- Line 151: `<div key={label} className="flex items-center gap-0 flex-1 last:flex-none">`
- Line 219: `className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md text-left transition-all group"`
- Line 231: `<div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">`
- Line 269: `"w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all",`
- Line 297: `className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"`
- Line 404: `"w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all",`
- Line 429: `<div className="shrink-0 mx-6 mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5">`
- Line 486: `<label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block flex items-center gap-1">`
- Line 498: `<label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block flex items-center gap-1">`
- Line 535: `<div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">`
- Line 602: `"flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all",`
- Line 615: `"flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all",`
- Line 623: `<div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">`
- Line 645: `<div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">`
- Line 653: `<label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block flex items-center gap-1">`
- Line 667: `<div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">`
- Line 850: `<div className="flex items-center gap-3">`
- Line 914: `className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-30"`
- Line 923: `className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-opacity"`
- Line 933: `"flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-opacity",`
- Line 992: `<div className="flex items-start justify-between gap-4 mb-6">`
- Line 998: `<div className="flex items-center gap-2 shrink-0 pt-1">`
- Line 1001: `className="flex items-center gap-2 h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-black transition-colors"`
- Line 1008: `className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-black transition-opacity hover:opacity-90"`
- Line 1026: `<div className="flex items-center justify-center gap-3">`
- Line 1029: `className="flex items-center gap-2 h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-black transition-colors"`
- Line 1035: `className="flex items-center gap-2 h-9 px-5 rounded-xl text-white text-sm font-black"`
- Line 1070: `<span className="text-xs text-muted-foreground flex items-center gap-1">`
- Line 1075: `<span className="text-xs text-muted-foreground flex items-center gap-1">`
- Line 1080: `<span className="text-xs text-muted-foreground flex items-center gap-1">`
- Line 1086: `<span className="text-xs text-muted-foreground flex items-center gap-1">`
- Line 1092: `<div className="flex items-center gap-2 shrink-0">`
- Line 1096: `className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"`
- Line 1103: `className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"`
- Line 1110: `className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors"`
- Line 1117: `className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"`
- Line 1123: `className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors"`
- Line 1172: `<div className="flex gap-3">`
- Line 1182: `className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"`
- Line 1209: `<div className="flex gap-3">`
- Line 1219: `className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"`

### `src\pages\admin\MockTestsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 1052: `"truncate font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-full",`
- Line 1072: `className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50/50 transition-colors">`
- Line 1106: `<div className="shrink-0 flex items-center gap-1">`
- Line 1154: `className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors cursor-pointer",`
- Line 1196: `<div className="flex gap-2">`
- Line 1229: `"flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",`
- Line 1905: `<div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 border border-violet-200">`
- Line 2017: `<div className="flex items-center gap-1.5 pt-0.5">`
- Line 2027: `<div className="flex items-center gap-1.5 pt-0.5">`
- Line 2037: `<div className="flex items-center gap-1.5 pt-0.5">`
- Line 2047: `<div className="flex items-center gap-1.5 pt-0.5">`
- Line 2159: `<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">`
- Line 2165: `<div className="flex items-start justify-between gap-3">`
- Line 2166: `<div className="flex items-start gap-2.5 min-w-0">`
- Line 2308: `<div className="flex items-center gap-2">`
- Line 2316: `className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 hover:border-[#013889]/40 hover:bg-slate-50 transition-all mb-4 text-left">`
- Line 2340: `<div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">`
- Line 2355: `<div key={q._key} className="text-xs bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">`
- Line 2683: `<div className="flex items-center gap-3">`
- Line 2702: `<div className="flex items-center gap-3">`
- Line 2715: `<div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 font-medium">`
- Line 2730: `className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",`
- Line 2736: `<div className="flex items-center gap-2">`
- Line 2755: `<div className={cn("flex items-center gap-2 p-3 rounded-xl border", TEST_CATEGORY_CONFIG[testCategory].border, TEST_CATEGORY_CONFIG[testCategory].bg)}>`
- Line 2791: `<div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">`
- Line 2846: `<div className="flex items-center gap-2">`
- Line 2881: `<div className="flex items-center gap-2">`
- Line 2908: `<div className="flex items-center gap-2 mb-2.5">`
- Line 2920: `className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-slate-700 border border-blue-200 px-2 py-1 rounded-lg">`
- Line 2930: `<div className="flex items-center gap-2 mb-1.5">`
- Line 2943: `<div className="flex items-center gap-2 mb-1.5">`
- Line 2969: `<label className="flex items-start gap-2.5 cursor-pointer group">`
- Line 3011: `<div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 font-medium">`
- Line 3024: `<div className="flex items-center gap-3">`
- Line 3032: `className="flex items-center gap-1 text-xs font-bold text-[#013889] hover:text-[#0257c8] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:border-[#013889]/30 transition-all">`
- Line 3051: `<div className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-3">`
- Line 3091: `<div className="flex gap-1 bg-slate-100 p-1 rounded-xl">`
- Line 3111: `className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-[#013889]/30 hover:bg-blue-50/40 transition-all text-left">`
- Line 3227: `<div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">`
- Line 3234: `<div className="flex gap-3 pt-2">`
- Line 3286: `className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">`
- Line 3300: `<div className="flex gap-2">`
- Line 3320: `<div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">`
- Line 3348: `<div className="flex items-start justify-between gap-3">`
- Line 3349: `<div className="flex items-start gap-3 min-w-0">`
- Line 3377: `<div key={o.id} className={cn("flex items-center gap-2 text-xs rounded-lg px-2 py-1",`
- Line 3452: `<div className="relative flex items-center gap-1.5">`
- Line 3467: `<div className="flex items-center gap-3 mt-3">`
- Line 3468: `<div className="flex items-center gap-1 text-xs text-slate-400">`
- Line 3652: `<div className="flex items-center gap-3">`
- Line 3658: `<div className="flex items-center gap-2">`
- Line 3700: `<div className="flex items-center gap-2 shrink-0">`
- Line 3731: `"px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm",`
- Line 3762: `<div className="flex gap-2 justify-center mt-5">`
- Line 3781: `<div className="flex items-center gap-3 min-w-0 flex-1">`
- Line 3804: `<div className="flex items-center gap-2 shrink-0">`

### `src\pages\admin\PYQManagementPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 75: `<div key={i} className="flex items-center gap-3">`
- Line 155: `<div className="flex items-center gap-2 mb-3">`
- Line 183: `<div className="flex gap-2">`
- Line 384: `<div className="flex items-start justify-between gap-2">`
- Line 407: `<div className="flex items-center gap-2">`
- Line 416: `"text-sm px-3 py-2 rounded-lg border flex items-start gap-2",`
- Line 437: `<div className="flex gap-2 mt-3">`
- Line 465: `<div className="flex items-center gap-2">`
- Line 471: `<div className="flex items-center gap-2">`
- Line 498: `<div className="flex items-center justify-center gap-3 pt-2">`

### `src\pages\admin\ReportsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 109: `<h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">`
- Line 118: `className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"`
- Line 132: `<div className="flex items-center gap-3">`
- Line 164: `<div className="flex items-center gap-4">`
- Line 229: `<div className="p-7 border-b border-slate-50 flex items-center gap-4">`
- Line 275: `<div className="p-7 border-b border-slate-50 flex items-center gap-4">`
- Line 292: `<div key={t.id} className="flex items-center gap-4 px-6 py-3.5">`
- Line 317: `<div className="p-7 border-b border-slate-50 flex items-center gap-4">`

### `src\pages\admin\RolesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 179: `<div className="flex gap-1">`
- Line 244: `<div className="flex items-start gap-2.5 bg-red-50/50 border border-red-200 rounded-2xl px-4 py-3">`
- Line 274: `<div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 items-start">`
- Line 293: `className={`flex items-start gap-3.5 p-3.5 cursor-pointer transition-all hover:bg-slate-50 select-none ${`
- Line 315: `<div className="flex justify-end gap-3 pt-4 border-t border-slate-100">`

### `src\pages\admin\StudentsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 165: `<form onSubmit={handleSearch} className="flex gap-3 flex-1 min-w-[260px]">`
- Line 201: `<div className="flex items-center gap-2">`
- Line 205: `className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"`
- Line 262: `<div className="flex items-center gap-3">`
- Line 273: `<div className="flex items-center gap-1.5">`
- Line 286: `className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"`
- Line 304: `<td className="p-4 flex justify-end gap-2">`
- Line 331: `<div className="flex items-center gap-2">`

### `src\pages\admin\TeacherDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 54: `<div className="flex items-center gap-4 mb-6">`
- Line 61: `<div className="flex items-center gap-3">`
- Line 67: `<div className="flex items-center gap-2 mt-0.5">`
- Line 82: `<div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">`
- Line 91: `<div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">`
- Line 100: `<div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">`

### `src\pages\admin\TeacherManualGradingPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 40: `className={cn("fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2",`
- Line 79: `<div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">`
- Line 88: `? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Correct</span>`
- Line 90: `? <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="w-3.5 h-3.5" />Wrong</span>`
- Line 91: `: <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><Minus className="w-3.5 h-3.5" />Skipped</span>`
- Line 116: `"flex items-start gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",`
- Line 152: `<p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">`
- Line 163: `<p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">`
- Line 183: `<p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">`
- Line 191: `<div className="flex items-center gap-4 pt-1">`
- Line 202: `<div className="flex items-center gap-2">`
- Line 230: `<div className="flex items-center justify-end text-xs text-muted-foreground gap-1">`
- Line 315: `<div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">`
- Line 341: `<div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">`
- Line 362: `<div className="hidden sm:flex items-center gap-2 text-xs shrink-0">`
- Line 370: `"flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",`
- Line 385: `<span className="flex items-center gap-1.5 text-muted-foreground">`
- Line 389: `<span className="flex items-center gap-1.5 text-muted-foreground">`
- Line 393: `<span className="flex items-center gap-1.5 text-muted-foreground">`
- Line 398: `<span className="flex items-center gap-1.5 text-amber-600 font-medium ml-auto">`
- Line 430: `className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"`

### `src\pages\admin\TeachersPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 151: `<div className="flex gap-2">`
- Line 189: `<div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">`
- Line 205: `<div className="flex gap-2">`
- Line 272: `<div className="flex items-center gap-2 mb-3">`
- Line 294: `<div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">`
- Line 322: `<div className="flex items-center gap-2 text-red-500 text-sm mb-4">`
- Line 351: `<div className="flex items-center gap-3">`
- Line 368: `<div className="flex items-center gap-2 mb-3">`
- Line 372: `<div className="flex gap-4 mb-4">`
- Line 396: `<div className="flex items-center gap-2">`
- Line 417: `<div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">`
- Line 451: `<div className="flex items-center gap-3">`

### `src\pages\admin\TeacherTestResultsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 69: `<div key={label} className="flex items-center gap-3 text-sm">`
- Line 309: `className={cn("flex items-center gap-1 text-xs font-semibold transition-colors hover:text-foreground",`
- Line 323: `<div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">`
- Line 344: `<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">`
- Line 375: `<span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{(test as any).durationMinutes} min</span>`
- Line 376: `<span className="flex items-center gap-1.5"><Target className="w-4 h-4" />{totalMarks} marks</span>`
- Line 377: `<span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{(test as any).questionIds?.length ?? 0} questions</span>`
- Line 390: `<h3 className="text-sm font-semibold mb-4 flex items-center gap-2">`
- Line 407: `<div className="flex gap-2">`
- Line 420: `className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-secondary transition-colors"`
- Line 484: `<div className="flex items-center justify-end gap-2">`
- Line 521: `className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"`

### `src\pages\calendar\AcademicCalendarPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 509: `<div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-500 font-medium">`
- Line 571: `<label className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer">`
- Line 584: `<label key={batch.id} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">`
- Line 604: `<div className="flex gap-3 pt-2">`
- Line 620: `<div className="flex items-center gap-3">`
- Line 636: `<div className="flex items-center gap-2">`
- Line 721: `className={`group/chip flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-white truncate leading-tight shadow-sm ${itemStyle(ev.kind)}`}`
- Line 745: `<div className="flex items-center gap-2">`
- Line 750: `<div key={t.value} className="flex items-center gap-2">`
- Line 755: `<div className="flex items-center gap-2">`
- Line 759: `<div className="flex items-center gap-2">`
- Line 763: `<div className="flex items-center gap-2">`
- Line 791: `className="relative group/item flex items-center gap-4 bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border p-4 rounded-3xl transition-all active:scale-[0.98] cursor-pointer overflow-hidden"`
- Line 814: `<p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1 flex items-center gap-2">`

### `src\pages\Courses.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 178: `className="flex items-center gap-3 mb-8"`
- Line 220: `className="group relative inline-flex items-center gap-2 bg-[#0066cc] hover:bg-[#004499] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 overflow-hidden"`
- Line 258: `className="absolute bottom-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2 text-slate-600 text-xs font-semibold tracking-widest uppercase z-20"`
- Line 285: `<div className="flex items-center gap-3 mb-4">`
- Line 343: `<div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm">`
- Line 351: `<div className="flex items-center gap-4 mb-4 text-xs font-semibold text-slate-500">`
- Line 352: `<div className="flex items-center gap-1.5">`
- Line 357: `<div className="flex items-center gap-1.5">`
- Line 372: `<div className="flex items-center gap-3">`
- Line 431: `className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"`
- Line 440: `className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:border-[#0066cc]/40 hover:text-slate-900 px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-md"`
- Line 447: `<div className="flex items-center gap-2 text-xs text-slate-400 font-medium">`

### `src\pages\JoinBatchPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 164: `<div className="flex gap-2">`
- Line 182: `<div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2 w-fit">`
- Line 196: `<div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl p-3">`
- Line 203: `<div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl p-3">`
- Line 213: `<div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl p-3 col-span-2">`
- Line 245: `<div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">`
- Line 253: `className="w-full h-12 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"`
- Line 275: `className="w-full h-12 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2"`
- Line 283: `className="w-full h-12 rounded-2xl font-black text-slate-700 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors"`
- Line 294: `<h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">`

### `src\pages\landing\CareerPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 165: `className="flex items-center gap-3 mb-8"`
- Line 226: `className="absolute bottom-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2 text-slate-600 text-xs font-semibold tracking-widest uppercase z-20"`
- Line 257: `<div className="flex items-center gap-3 mb-4">`
- Line 308: `<div className="flex items-center gap-2 mb-3">`
- Line 330: `<div className="flex items-center gap-5 text-xs font-semibold text-slate-500">`
- Line 331: `<div className="flex items-center gap-1.5">`
- Line 335: `<div className="flex items-center gap-1.5">`
- Line 347: `className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-[#0066cc] px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 shadow-sm"`
- Line 380: `<div className="flex items-center gap-3 mb-6">`
- Line 408: `<button className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden">`

### `src\pages\landing\ExamsRegistrationPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 74: `<div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 backdrop-blur-sm">`
- Line 92: `<div className="landing-shell flex min-h-[72px] items-center justify-between gap-4 py-4">`
- Line 93: `<div className="flex items-center gap-6">`
- Line 100: `<div className="hidden md:flex items-center gap-4">`
- Line 136: `<div className="flex items-center gap-2 text-gray-400">`
- Line 143: `<div className="flex items-center gap-2 text-gray-400">`
- Line 152: `<div className="flex items-center gap-3">`

### `src\pages\landing\ExamTrackDemoPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 165: `<div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">`
- Line 218: `<div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">`
- Line 230: `className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-bold text-white shadow"`
- Line 238: `className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50"`
- Line 248: `<div className="flex items-center justify-between gap-4 border-t border-gray-100 px-6 py-4">`
- Line 250: `<div className="flex items-center gap-2 text-[12px] text-red-600">`
- Line 261: `className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-bold text-white shadow"`
- Line 303: `<div className="mb-3 flex items-start justify-between gap-2">`
- Line 324: `<div className="mt-4 flex items-center justify-between gap-2">`
- Line 331: `className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all hover:opacity-80"`
- Line 422: `<Link to="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900">`
- Line 437: `className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-bold text-white shadow-lg"`
- Line 444: `className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-[14px] font-bold text-gray-700"`
- Line 452: `<div key={item} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-700 shadow-sm">`
- Line 481: `<div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">`
- Line 490: `className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white"`
- Line 545: `<p className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-amber-700">`
- Line 552: `<span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-[12px] font-bold text-green-700">`
- Line 584: `<div className="flex h-48 items-center justify-center gap-3 text-gray-400">`
- Line 633: `<p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]">`
- Line 647: `<div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">`
- Line 655: `className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[14px] font-black"`
- Line 675: `<div className="flex items-center justify-between gap-3">`

### `src\pages\landing\LandingCoursesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 114: `<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto">`
- Line 132: `<button className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm self-end">`
- Line 193: `<div className="absolute left-4 top-4 flex gap-2">`
- Line 195: `<div className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-[10px] uppercase font-black text-white shadow-lg animate-pulse">`
- Line 218: `<div className="flex items-center gap-3">`
- Line 226: `<div className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600 border border-blue-100">`
- Line 231: `<div className="mt-6 flex items-center gap-4 border-t border-gray-50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">`
- Line 232: `<span className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">`

### `src\pages\landing\StudyMaterialPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 141: `<span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/80 backdrop-blur-sm">`
- Line 177: `className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/10 px-4 py-2 backdrop-blur-sm">`
- Line 191: `<div className="flex items-center justify-between gap-8 h-20">`
- Line 192: `<div className="flex items-center gap-1 overflow-x-auto no-scrollbar">`
- Line 205: `<div className="hidden lg:flex items-center gap-2">`
- Line 249: `<div className="flex items-center gap-2 text-[12px] font-bold text-gray-400">`
- Line 254: `className="flex items-center gap-2 text-[13px] font-black text-gray-900 hover:text-blue-600 transition-colors"`
- Line 282: `<div className="flex items-center gap-2 text-[12px] font-bold text-gray-400">`
- Line 285: `<button className="flex items-center gap-2 text-[13px] font-black text-gray-900 hover:text-blue-600 transition-colors">`

### `src\pages\live\LiveClassRoom.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 159: `<div className="absolute top-3 right-3 flex items-center gap-1.5">`
- Line 161: `<div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1">`
- Line 166: `<div className="px-2 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md flex items-center gap-1">`
- Line 174: `<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">`
- Line 175: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md max-w-[70%]">`
- Line 240: `<div className="flex items-center gap-1.5 mb-1 px-1">`
- Line 281: `<div className="flex gap-2 items-center">`
- Line 334: `className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"`
- Line 351: `<span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">`
- Line 386: `className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200"`
- Line 429: `className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm"`
- Line 480: `<div className="flex items-start justify-between gap-2 mb-3">`
- Line 524: `<div className="flex items-center gap-2">`
- Line 602: `<div className="flex items-center gap-3">`
- Line 638: `<div key={i} className="flex items-center gap-2">`
- Line 680: `className="w-full h-10 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1.5"`
- Line 689: `<div className="px-6 pb-6 flex gap-3">`
- Line 699: `className="flex-1 h-11 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"`
- Line 1651: `className="flex items-center gap-3 w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left hover:bg-emerald-100 transition-colors"`
- Line 1662: `<div className="flex items-center gap-3 w-full bg-amber-50 border border-amber-200 rounded-2xl p-4">`
- Line 1719: `<div className="flex items-center gap-2 mb-5">`
- Line 1721: `<div className="flex items-center gap-2">`
- Line 1741: `className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"`
- Line 1749: `className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black disabled:opacity-50 transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"`
- Line 1756: `<div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">`
- Line 1781: `className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"`
- Line 1788: `<div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-50 border border-amber-200">`
- Line 1798: `className="w-full mt-3 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"`
- Line 1820: `<div className="flex items-center gap-3 min-w-0">`
- Line 1839: `<div className="flex items-center gap-2">`
- Line 1841: `<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30">`
- Line 1852: `<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">`
- Line 1892: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600/90 backdrop-blur-md">`
- Line 1901: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md">`
- Line 1921: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/80 backdrop-blur-md">`
- Line 1930: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md">`
- Line 1979: `<div className="shrink-0 h-24 flex gap-2 overflow-x-auto">`
- Line 2039: `<div className="mx-auto max-w-3xl bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 flex items-center justify-center gap-1.5 sm:gap-3 shadow-2xl">`
- Line 2090: `className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-2xl px-3 py-2 flex gap-1 shadow-2xl"`
- Line 2138: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/20">`
- Line 2144: `<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20">`

### `src\pages\LoginPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 35: `className="flex items-center gap-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"`
- Line 403: `className="mb-5 flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3">`
- Line 432: `<label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">`
- Line 449: `<label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">`
- Line 480: `className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-blue-500/20 transition-all disabled:opacity-50 overflow-hidden"`
- Line 507: `className="inline-flex items-center gap-1.5 text-[13px] font-bold mb-5 hover:gap-2.5 transition-all"`
- Line 522: `<label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">`
- Line 534: `className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg disabled:opacity-60"`
- Line 563: `<label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">`
- Line 579: `<label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">`
- Line 593: `<p className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${setPwNew === setPwConfirm ? "text-emerald-600" : "text-red-500"}`}>`
- Line 604: `className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50"`
- Line 637: `<label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">`
- Line 653: `<label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">`
- Line 667: `<p className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${newPassword === confirmPw ? "text-green-600" : "text-red-500"}`}>`
- Line 678: `className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg disabled:opacity-60"`
- Line 697: `<div className="mt-16 flex items-center justify-center gap-2 border-t border-slate-200/60 pt-8">`
- Line 754: `<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-5 py-2 backdrop-blur-sm shadow-sm ring-4 ring-blue-500/5">`

### `src\pages\LoginPage2.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 188: `<label className="flex items-center gap-2 cursor-pointer group">`
- Line 208: `className="group relative w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"`

### `src\pages\RegisterWithOtpPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 23: `<div className="flex items-center gap-0 mb-10">`
- Line 98: `<div className="flex gap-2.5 justify-center">`
- Line 140: `className="flex items-center gap-1.5 mx-auto text-sm font-bold text-blue-600 hover:underline disabled:opacity-50"`
- Line 159: `className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5"`
- Line 304: `<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">`
- Line 311: `<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">`
- Line 318: `<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">`
- Line 326: `<label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">`
- Line 339: `className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[15px] font-black text-white shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"`
- Line 364: `<div className="flex gap-3 mt-8">`
- Line 366: `className="flex h-12 items-center gap-1.5 px-5 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">`
- Line 372: `className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-black text-white shadow-lg disabled:opacity-50"`
- Line 395: `<div className="flex gap-3 mt-8">`
- Line 397: `className="flex h-12 items-center gap-1.5 px-5 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">`
- Line 403: `className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-black text-white shadow-lg disabled:opacity-50"`
- Line 428: `<span className="flex items-center gap-2 text-emerald-600 font-semibold">`
- Line 431: `<span className="flex items-center gap-2 text-emerald-600 font-semibold">`
- Line 438: `className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-black text-white shadow-xl shadow-blue-500/20"`
- Line 443: `<div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">`

### `src\pages\ResetPasswordPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 26: `className="flex items-center gap-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"`
- Line 135: `className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3"`
- Line 146: `<label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">`
- Line 174: `<label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">`
- Line 193: `<p className={`text-[11px] font-bold flex items-center gap-1 ml-1 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>`
- Line 206: `className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-blue-500/20 transition-all disabled:opacity-50"`
- Line 238: `className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg"`
- Line 267: `className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg"`
- Line 278: `<div className="mt-16 flex items-center justify-center gap-2 border-t border-slate-200/60 pt-8">`
- Line 320: `<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-5 py-2 backdrop-blur-sm shadow-sm ring-4 ring-blue-500/5">`

### `src\pages\school\admin\AcademicCalendar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 525: `'group flex w-full items-center justify-between gap-1.5 rounded-xl border px-2 py-1 text-left text-[10px] font-bold shadow-sm transition hover:shadow-md hover:scale-[1.02] hover:underline cursor-pointer active:scale-[0.99] ring-1 ring-slate-100',`
- Line 552: `<p className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-blue-700 dark:text-sky-300"><Sparkles className="h-3.5 w-3.5" /> {calendarLabel}</p>`
- Line 564: `'inline-flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] transition',`
- Line 581: `<button onClick={() => setSummaryModalOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">`
- Line 595: `}} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40">`
- Line 600: `<button onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">`
- Line 708: `<div className="flex items-start justify-between gap-4">`
- Line 716: `<div className="flex gap-2">`
- Line 738: `<span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`
- Line 739: `{event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>}`
- Line 740: `{event.meetingPlatform && <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {event.meetingPlatform}</span>}`
- Line 771: `<div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>`
- Line 835: `<div className="flex items-center gap-3 min-w-0">`
- Line 935: `<label className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">`
- Line 940: `<div className="flex gap-3">`
- Line 946: `<div className="ml-auto flex gap-3">`
- Line 978: `<div className="flex items-center gap-2">`
- Line 988: `<div className="flex items-center gap-2">`
- Line 994: `<div className="flex items-center gap-2">`

### `src\pages\school\admin\Academics.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 218: `className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"`
- Line 255: `className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"`
- Line 292: `<div className="flex justify-center gap-2">`
- Line 308: `<div className="flex items-center gap-2">`
- Line 365: `<div className="flex items-center gap-5">`

### `src\pages\school\admin\AdminDashboard.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 36: `<p key={entry.name} className="flex items-center gap-2 text-sm font-bold" style={{ color: entry.color }}>`
- Line 58: `<div className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">`

### `src\pages\school\admin\AdminSettings.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 71: `className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold transition ${`
- Line 84: `<div className="flex items-center gap-4">`
- Line 135: `<div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4">`
- Line 169: `<button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">`
- Line 315: `className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-all shadow-md shadow-blue-500/20"`
- Line 389: `<label className="flex items-center gap-2.5 cursor-pointer">`
- Line 400: `<div className="flex gap-3 pt-3">`
- Line 450: `<span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5">`
- Line 454: `<span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">`
- Line 460: `<div className="flex gap-2 justify-end">`

### `src\pages\school\admin\AiUsage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 104: `<div key={i} className="flex gap-4 px-2 py-3">`
- Line 387: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"`
- Line 481: `<div className="flex items-start gap-2">`
- Line 506: `<div className="flex items-center gap-3">`
- Line 706: `<h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">`
- Line 715: `<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">`
- Line 756: `<div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">`
- Line 761: `className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${`
- Line 816: `<span className="flex items-center gap-3 text-xs text-slate-400">`
- Line 867: `<h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 871: `<div className="flex items-center gap-2">`
- Line 990: `className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"`
- Line 1004: `className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"`

### `src\pages\school\admin\Analytics.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 200: `<div className="flex items-center gap-2.5 min-w-0">`
- Line 204: `<div className="flex items-center gap-3 pl-2 flex-shrink-0">`

### `src\pages\school\admin\Assignments.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 150: `<div className="flex items-center gap-2">`
- Line 172: `<h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">`
- Line 177: `<Button onClick={() => handleOpenModal()} className="flex items-center gap-2">`
- Line 183: `<div className="flex items-center gap-4 mb-6">`
- Line 269: `<div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">`

### `src\pages\school\admin\Attendance.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 143: `<div className="flex items-center gap-2">`
- Line 286: `<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">`
- Line 290: `<span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">`
- Line 319: `<div className="flex gap-2">`

### `src\pages\school\admin\AuditLogs.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 252: `className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 text-sm disabled:cursor-not-allowed group border border-indigo-500/50"`
- Line 507: `<div className="flex items-center gap-3">`
- Line 558: `<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">`
- Line 563: `<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/50" title={l.description}>`
- Line 580: `<div className="flex items-center gap-4">`
- Line 602: `<div className="flex items-center gap-1.5">`

### `src\pages\school\admin\Calendar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 151: `<div className="flex gap-3">`
- Line 165: `className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold tracking-tight text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"`
- Line 270: `<div className="mt-2 flex items-center gap-3">`
- Line 272: `<div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">`
- Line 296: `<div className="flex items-center gap-2 mb-4">`
- Line 395: `<div className="flex gap-4 pt-4">`

### `src\pages\school\admin\ClassSections.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 122: `className="mb-5 inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-white"`
- Line 141: `className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"`
- Line 162: `className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"`
- Line 188: `className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"`
- Line 215: `className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"`
- Line 231: `<div className="flex justify-center gap-2">`
- Line 289: `<div className="flex items-center gap-5">`

### `src\pages\school\admin\ClassSubjects.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 208: `className="mb-5 inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-white"`
- Line 227: `className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"`
- Line 237: `className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"`
- Line 276: `className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"`
- Line 303: `className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"`
- Line 319: `<div className="flex justify-center gap-2">`
- Line 401: `<div className="flex justify-end gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">`
- Line 431: `<div className="flex items-center gap-5">`

### `src\pages\school\admin\Communications.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 727: `<div className="flex items-center gap-2 text-blue-600">`
- Line 763: `<div className="mt-1.5 flex items-baseline gap-2">`
- Line 773: `<div className={`${isSuperAdmin ? '' : 'mt-3'} flex w-fit max-w-full shrink-0 gap-1.5 rounded-2xl border border-slate-100/60 bg-slate-50/50 p-1`}>`
- Line 813: `<div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100/60 shadow-xs animate-pulse">`
- Line 843: `className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${active`
- Line 892: `<div className="flex items-center gap-3 min-w-0">`
- Line 903: `<div className="flex items-center gap-2">`
- Line 906: `<span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">`
- Line 918: `<div className="flex items-center gap-1">`
- Line 974: `<p className={`mb-1 flex items-center gap-1 text-[9px] font-bold uppercase ${mine ? 'text-blue-600' : 'text-slate-400'}`}>`
- Line 995: `<div className="flex items-center gap-2">`
- Line 1001: `<div className="flex gap-1 shrink-0">`
- Line 1029: `<div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-85">`
- Line 1067: `<div className="flex items-center gap-2 text-slate-600">`
- Line 1103: `<div className="flex gap-2">`
- Line 1124: `<div className="flex items-center gap-2">`
- Line 1243: `<div key={file.id} className="flex items-center gap-2 rounded-xl bg-white p-2 border border-slate-100 shadow-xs">`
- Line 1326: `className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-slate-50 transition"`
- Line 1386: `className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"`
- Line 1431: `<div className="mt-2 flex items-center justify-center gap-1.5">`
- Line 1504: `className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 font-bold text-slate-700 hover:bg-slate-50 transition"`
- Line 1514: `className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 font-bold text-slate-700 hover:bg-slate-50 transition"`
- Line 1653: `<div className="mt-6 flex gap-2">`
- Line 1862: `<div className="mt-6 flex gap-2">`
- Line 1930: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1939: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1950: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1959: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1993: `<div className="flex items-center gap-3 min-w-0">`
- Line 2002: `<div className="flex gap-2">`
- Line 2100: `<div className="mt-4 flex gap-3">`
- Line 2104: `className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 transition"`
- Line 2123: `className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'`

### `src\pages\school\admin\Complaints.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 409: `<button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">`
- Line 477: `<span className="inline-flex items-center gap-2">`
- Line 486: `<div className="flex items-center justify-end gap-2">`
- Line 494: `className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"`
- Line 567: `<div className="flex items-center gap-3">`
- Line 574: `<span className="inline-flex items-center gap-2">`
- Line 583: `<div className="flex items-center justify-end gap-2">`
- Line 603: `className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"`
- Line 685: `<div className="mt-2 flex items-center gap-2">`
- Line 693: `<p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">`
- Line 713: `<div className="flex items-center gap-4">`
- Line 720: `<p className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">`
- Line 733: `<h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">`
- Line 784: `<h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">`
- Line 802: `<div className="flex gap-2 justify-end">`
- Line 807: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition"`
- Line 822: `<div className="flex items-center gap-2">`
- Line 862: `<div className="flex items-center gap-2">`
- Line 863: `<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">`
- Line 879: `<div className="flex items-center gap-2">`
- Line 884: `className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"`

### `src\pages\school\admin\Fees.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 102: `<div className="flex gap-3">`
- Line 105: `className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold tracking-tight text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all"`
- Line 110: `<button className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold tracking-tight text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">`
- Line 128: `<div className="flex items-center gap-2">`
- Line 169: `<div className="flex items-center gap-4">`
- Line 230: `<div className="flex items-center gap-2 mb-6">`
- Line 274: `<div key={f._id} className="flex items-center gap-4 group">`
- Line 311: `<span className={cn("text-[10px] font-bold tracking-tight uppercase tracking-widest flex items-center gap-1", trend.startsWith('+') ? "text-emerald-600" : "text-rose-600")}>`
- Line 492: `<div className="flex gap-4 pt-4">`

### `src\pages\school\admin\Finance.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 55: `<p key={entry.name} className="flex items-center gap-2 text-sm font-bold" style={{ color: entry.color }}>`
- Line 67: `<div className="mb-5 flex items-start justify-between gap-4">`
- Line 71: `<span className={cn('inline-flex items-center gap-1 text-[10px] font-bold tracking-tight uppercase tracking-[0.25em]', positive ? 'text-emerald-600' : 'text-rose-600')}>`
- Line 148: `<div className="flex items-center gap-3">`
- Line 197: `<div className="mb-6 flex items-center justify-between gap-4">`
- Line 202: `<span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">`
- Line 227: `<div className="mb-6 flex items-center justify-between gap-4">`
- Line 252: `<div className="mb-6 flex items-center justify-between gap-4">`
- Line 299: `<div className="mb-4 flex items-center justify-between gap-4">`
- Line 309: `<div className="flex items-start justify-between gap-3">`

### `src\pages\school\admin\InstituteDashboardWorkspace.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 75: `<p key={entry.name} className="flex items-center gap-2 font-bold" style={{ color: entry.color }}>`
- Line 122: `<div className="flex items-center gap-4 mb-4">`
- Line 135: `<div className="flex items-baseline gap-1 mt-0.5">`
- Line 343: `<div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 backdrop-blur-md shadow-sm">`
- Line 449: `<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20">`
- Line 494: `className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 p-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"`
- Line 496: `<div className="flex-1 min-w-0 flex items-center gap-3">`
- Line 512: `className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 transition hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-900"`
- Line 540: `<div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900/35 bg-emerald-50 dark:bg-emerald-950/15 px-3 py-2.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">`
- Line 562: `className="flex items-center gap-4 text-sm font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase"`

### `src\pages\school\admin\Institutes.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<span className="flex items-center gap-1 text-xs text-red-600">`
- Line 71: `<span className="flex items-center gap-1 text-xs text-amber-600">`
- Line 77: `<span className="flex items-center gap-1 text-xs text-green-600">`
- Line 670: `<button onClick={() => navigate('/school/admin/institutes/new')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors">`
- Line 749: `<div className="flex items-center gap-3">`
- Line 776: `<span className="flex items-center gap-1 text-xs text-blue-600 font-medium">`
- Line 785: `<div className="flex items-center justify-end gap-2">`
- Line 791: `className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"`
- Line 800: `className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors"`
- Line 848: `<div className="flex items-center gap-2">`
- Line 859: `<div className="mb-8 flex items-center gap-4">`
- Line 932: `<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-700">`
- Line 951: `className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"`
- Line 1028: `<div className="flex items-center gap-2">`
- Line 1038: `<div className="flex items-center gap-2">`
- Line 1043: `<div className="flex items-center gap-2">`
- Line 1050: `<p className="flex items-center gap-3"><Mail className="h-4 w-4 text-brand-600" /> {selectedInstitute.email}</p>`
- Line 1051: `<p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand-600" /> {selectedInstitute.principalName || 'Principal not provided'}</p>`
- Line 1057: `<p className="flex gap-3 text-sm font-medium leading-6 text-surface-700">`
- Line 1090: `<div className="flex items-center gap-3">`
- Line 1129: `<div className="flex gap-2">`
- Line 1154: `<button onClick={() => openWorkspace(selectedInstitute.tenantDomain)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white shadow-md hover:bg-indigo-700 transition-colors">`
- Line 1184: `<label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm">`
- Line 1262: `<p className={`text-xs font-semibold flex items-center gap-1.5 col-span-2 -mt-2 ${createForm.adminPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'`
- Line 1288: `<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-700">`
- Line 1312: `<div className="flex items-center gap-3">`
- Line 1335: `<div className="flex justify-end gap-3 border-t border-surface-200 bg-surface-50 p-5">`

### `src\pages\school\admin\Notices.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 137: `<div className="flex shrink-0 gap-2">`
- Line 183: `className="inline-flex max-w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"`

### `src\pages\school\admin\Reports.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 117: `className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700"`

### `src\pages\school\admin\Settings.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 64: `<div className="flex items-center gap-6">`
- Line 73: `<div className="mt-2 flex items-center gap-3">`
- Line 84: `className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-tight text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"`
- Line 103: `"w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 border text-left group",`
- Line 155: `className="absolute bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 text-white font-bold tracking-tight text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20"`
- Line 172: `<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold tracking-tight uppercase tracking-widest">`
- Line 189: `<div className="flex items-center gap-4 mb-6">`
- Line 213: `<div className="flex items-center gap-8 mb-10 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">`
- Line 231: `<div className="mt-4 flex gap-2">`
- Line 297: `<div className="flex items-center gap-4">`
- Line 353: `<div className="flex items-center gap-4">`
- Line 362: `<div className="flex items-center gap-6">`
- Line 433: `<div className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-start gap-6 relative overflow-hidden group">`

### `src\pages\school\admin\StudentProfile.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 28: `flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200`
- Line 41: `<div className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">`
- Line 334: `className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"`
- Line 339: `<div className="flex gap-3">`
- Line 343: `className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"`
- Line 356: `className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all"`
- Line 371: `<div className="flex items-center gap-3">`
- Line 389: `<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-4">`
- Line 439: `<div className="flex gap-3 pt-2">`
- Line 449: `className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"`
- Line 503: `className="flex items-center gap-2 outline-none group cursor-pointer"`
- Line 526: `<div className="flex items-center gap-2"><GraduationCap size={18} className="text-blue-500" /> Class {profile.section?.class?.name || '—'} - {profile.section?.name || '—'}</div>`
- Line 527: `<div className="flex items-center gap-2"><Smartphone size={18} className="text-blue-500" /> {student.phone || '—'}</div>`
- Line 528: `<div className="flex items-center gap-2"><Mail size={18} className="text-blue-500" /> {student.email}</div>`
- Line 579: `<h4 className="text-xs font-bold tracking-tight uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">`
- Line 616: `<div className="flex items-center gap-3">`
- Line 630: `className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all"`
- Line 644: `<div className="flex items-center gap-3 mb-4">`
- Line 663: `<div className="flex items-center gap-3 mb-4">`
- Line 683: `<div className="flex items-center gap-3 mb-4">`
- Line 704: `<div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center gap-4">`
- Line 734: `<div key={row.subjectId || row.subjectName} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">`
- Line 735: `<div className="flex items-center gap-3 min-w-0">`
- Line 763: `<div className="flex items-center gap-3">`

### `src\pages\school\admin\StudentPromotion.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 189: `<span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-blue-100">`
- Line 238: `<label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">`
- Line 306: `<div className="flex items-center gap-3">`
- Line 355: `className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"`
- Line 372: `<div className="flex items-center gap-3">`

### `src\pages\school\admin\StudentRegistration.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 68: `<div className="flex min-w-0 items-center gap-2 sm:gap-3">`
- Line 90: `<div className="flex min-h-[520px] items-center justify-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">`

### `src\pages\school\admin\Students.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 433: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 445: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 452: `className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"`
- Line 506: `<div className="flex items-start justify-between gap-3">`
- Line 525: `<div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">`
- Line 530: `<div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">`
- Line 597: `<div className="flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">`
- Line 617: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 648: `<div className="flex items-center gap-4">`
- Line 683: `className="flex items-center gap-1.5 outline-none group cursor-pointer"`
- Line 706: `<div className="flex items-center gap-2">`
- Line 771: `className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"`
- Line 808: `<div className="flex gap-4 text-sm font-bold">`
- Line 818: `<div key={idx} className="p-2 flex justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">`
- Line 829: `<div className="flex gap-3 pt-2">`
- Line 833: `className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"`

### `src\pages\school\admin\StudyMaterials.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 238: `<a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">`
- Line 249: `<div className="flex items-center gap-2">`
- Line 271: `<h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">`
- Line 276: `<Button onClick={() => handleOpenModal()} className="flex items-center gap-2">`
- Line 282: `<div className="flex items-center gap-4 mb-6">`
- Line 377: `<div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">`

### `src\pages\school\admin\Subjects.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 218: `className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"`
- Line 243: `className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"`
- Line 283: `<div className="flex justify-center gap-2">`
- Line 403: `<div className="flex justify-end gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">`
- Line 433: `<div className="flex items-center gap-5">`

### `src\pages\school\admin\SuperAdminCommunication.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 52: `<div className="flex items-center gap-3">`
- Line 275: `<div className="flex items-center gap-3 mb-5">`
- Line 321: `className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${`
- Line 347: `<h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">`
- Line 363: `className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"`
- Line 442: `<div className="flex gap-3">`
- Line 451: `className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${`
- Line 507: `className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${`
- Line 526: `<div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">`
- Line 531: `<div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">`
- Line 536: `<div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">`
- Line 547: `className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-60"`
- Line 561: `<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 flex-1 min-w-48">`

### `src\pages\school\admin\SuperAdminDashboardWorkspace.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 72: `<p key={entry.name} className="flex items-center gap-2 font-semibold" style={{ color: entry.color }}>`
- Line 96: `<div className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-2 py-1">`
- Line 119: `<div className="flex items-start justify-between gap-3">`
- Line 123: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">`
- Line 244: `<div className="mb-5 flex items-start justify-between gap-4">`
- Line 333: `<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">`
- Line 509: `<div className="flex items-start justify-between gap-3">`
- Line 521: `className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"`
- Line 530: `<div className="flex items-start justify-between gap-3">`
- Line 542: `className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-600 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"`
- Line 551: `<div className="flex items-start justify-between gap-3">`
- Line 563: `className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"`

### `src\pages\school\admin\Syllabus.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 183: `<div className="flex items-center gap-2">`
- Line 205: `<h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">`
- Line 210: `<Button onClick={() => handleOpenModal()} className="flex items-center gap-2">`
- Line 216: `<div className="flex items-center gap-4 mb-6">`
- Line 288: `<div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">`

### `src\pages\school\admin\TeacherProfile.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 22: `flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200`
- Line 35: `<div className="flex items-center gap-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">`
- Line 295: `className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"`
- Line 304: `className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold tracking-tight uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"`
- Line 338: `className="flex items-center gap-2 outline-none group cursor-pointer"`
- Line 361: `<div className="flex items-center gap-2"><Briefcase size={18} className="text-blue-500" /> {profile.role || 'Designation not set'}</div>`
- Line 362: `<div className="flex items-center gap-2"><Building size={18} className="text-blue-500" /> {profile.department || 'Department not set'}</div>`
- Line 363: `<div className="flex items-center gap-2"><Mail size={18} className="text-blue-500" /> {teacher.email}</div>`
- Line 476: `<div className="flex items-center justify-between gap-4">`
- Line 519: `<div className="flex items-center gap-3">`
- Line 885: `<div className="flex items-center gap-2 mb-2">`
- Line 968: `<div className="flex items-center gap-4 shrink-0">`
- Line 989: `className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"`
- Line 995: `<div className="flex items-center gap-2 shrink-0">`
- Line 999: `className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"`
- Line 1006: `<span className="flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600">`
- Line 1013: `className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"`
- Line 1022: `className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40 transition-all"`
- Line 1039: `<div className="flex items-center gap-4">`
- Line 1083: `<p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">`
- Line 1088: `<li key={i} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">`
- Line 1098: `<p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">`
- Line 1103: `<li key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">`
- Line 1177: `<div className="flex items-center gap-6 bg-slate-900 px-4 py-2.5 border-t border-slate-800">`

### `src\pages\school\admin\TeacherRegistration.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 72: `<div className="flex min-w-0 items-center gap-2 sm:gap-3">`
- Line 94: `<div className="flex min-h-[520px] items-center justify-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">`

### `src\pages\school\admin\Teachers.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 418: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 425: `className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"`
- Line 479: `<div className="flex items-start justify-between gap-3">`
- Line 498: `<div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">`
- Line 503: `<div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">`
- Line 571: `<div className="flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">`
- Line 593: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 625: `<div className="flex items-center gap-4">`
- Line 675: `className="flex items-center gap-1.5 outline-none group cursor-pointer"`
- Line 698: `<div className="flex items-center gap-2">`
- Line 764: `className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"`
- Line 801: `<div className="flex gap-4 text-sm font-bold">`
- Line 811: `<div key={idx} className="p-2 flex justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">`
- Line 822: `<div className="flex gap-3 pt-2">`
- Line 826: `className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"`

### `src\pages\school\admin\TeacherStudentBracketList.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 166: `className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors outline-none"`
- Line 195: `<div className="flex gap-4 shrink-0">`
- Line 230: `className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 shadow-sm transition disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 263: `<div className="flex items-center gap-4">`
- Line 270: `className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 group transition-colors"`

### `src\pages\school\admin\Timetable.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 688: `<div className="flex items-center gap-3">`
- Line 691: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-[0.99]"`
- Line 698: `className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"`
- Line 738: `<div className="flex items-center gap-3">`
- Line 770: `className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.99] transition"`
- Line 776: `<div className="flex items-center gap-2">`
- Line 780: `className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3 text-sm font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.99] transition"`
- Line 790: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition"`
- Line 800: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"`
- Line 811: `<div className="flex gap-2 text-red-800 dark:text-red-300 font-bold text-sm mb-2">`
- Line 830: `<div className="flex items-center gap-2">`
- Line 1011: `<div className="flex items-center justify-between gap-1.5">`
- Line 1025: `<div className="opacity-0 group-hover:opacity-100 transition flex gap-1">`
- Line 1054: `<div className="flex items-center justify-between gap-1.5">`
- Line 1076: `<div className="opacity-0 group-hover:opacity-100 transition flex gap-1">`
- Line 1146: `<div className="flex min-w-max gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">`
- Line 1186: `<div className="flex items-start justify-between gap-3">`
- Line 1190: `<div className="flex items-center gap-2">`
- Line 1198: `<div className="flex gap-1">`
- Line 1223: `<span className="inline-flex items-center gap-2">`
- Line 1227: `<span className="inline-flex items-center gap-2">`
- Line 1277: `<div className="flex items-start justify-between gap-3">`
- Line 1278: `<div className="flex items-center gap-3">`
- Line 1302: `<p className="inline-flex items-center gap-1">`
- Line 1309: `<p className="inline-flex items-center gap-1">`
- Line 1464: `<div className="flex items-center gap-2">`
- Line 1509: `className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-950/50 dark:bg-blue-950/30 dark:text-blue-300"`
- Line 1553: `<div className="flex items-start justify-between gap-4">`
- Line 1557: `<div className="flex gap-1">`
- Line 1579: `<div className="flex items-center gap-2">`
- Line 1586: `<span className="inline-flex items-center gap-1">`
- Line 1590: `<div className="flex items-center gap-1">`
- Line 1638: `<div className="flex gap-3 pt-4">`

### `src\pages\school\admin\TopInstitutes.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 82: `<div className="flex items-center gap-3">`
- Line 90: `<h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white flex items-center gap-2">`
- Line 139: `<div className="flex items-center gap-4">`
- Line 230: `<div className="flex items-center gap-3">`
- Line 256: `<span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">`

### `src\pages\school\admin\Users.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 166: `className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-surface-700 transition hover:bg-surface-50 hover:text-brand-600"`
- Line 244: `<div className="flex items-center gap-3">`
- Line 289: `<div className="flex items-center gap-2">`

### `src\pages\school\MaterialViewPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 152: `<div key={lineIndex} className={`flex items-start gap-3 rounded-xl border p-3 ${`
- Line 155: `<div className="flex shrink-0 gap-1">`
- Line 184: `<li key={i} className="flex gap-3 text-sm font-medium leading-7 text-slate-700">`
- Line 276: `className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm"`
- Line 281: `<div className="flex h-64 items-center justify-center gap-2 text-sm font-semibold text-slate-500">`
- Line 290: `<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-600">`
- Line 297: `<a href={resolveFileUrl(material.fileUrl ?? material.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">`

### `src\pages\school\parent\Child.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 68: `<div className="flex items-center gap-3">`
- Line 264: `<div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">`
- Line 287: `<div className="flex items-start gap-4">`
- Line 382: `<div className="flex items-center gap-2 mt-1">`

### `src\pages\school\parent\Communication.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 681: `<div className="flex items-center gap-2 text-blue-600">`
- Line 735: `className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${active ? "bg-blue-50/80 border border-blue-100/50 shadow-xs" : "hover:bg-slate-50/60 border border-transparent"`
- Line 773: `<div className="flex items-center gap-3 min-w-0">`
- Line 782: `<div className="flex items-center gap-2">`
- Line 785: `<span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">`
- Line 795: `<div className="flex items-center gap-1">`
- Line 845: `<p className={`mb-1 flex items-center gap-1 text-[9px] font-bold uppercase ${mine ? 'text-blue-600' : 'text-slate-400'}`}>`
- Line 867: `<div className="flex items-center gap-2">`
- Line 873: `<div className="flex gap-1 shrink-0">`
- Line 901: `<div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-85">`
- Line 937: `<div className="flex items-center gap-2 text-slate-600">`
- Line 973: `<div className="flex gap-2">`
- Line 994: `<div className="flex items-center gap-2">`
- Line 1119: `<div key={file.id} className="flex items-center gap-2 rounded-xl bg-white p-2 border border-slate-100 shadow-xs">`
- Line 1208: `className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"`
- Line 1255: `className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-slate-50 transition"`
- Line 1308: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1317: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1328: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1337: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1421: `<div className="mt-6 flex gap-2">`
- Line 1500: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1509: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1554: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1563: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1574: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1583: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1617: `<div className="flex items-center gap-3 min-w-0">`
- Line 1626: `<div className="flex gap-2">`
- Line 1724: `<div className="mt-4 flex gap-3">`
- Line 1728: `className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 transition"`
- Line 1747: `className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'`
- Line 1838: `<div className="flex gap-4">`
- Line 1876: `<span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${['Accepted', 'Scheduled', 'Completed'].includes(prettyStatus(m.status)) ? 'bg-emerald-100 text-emerald-700' :`
- Line 2242: `<div className="flex items-center gap-2">`
- Line 2276: `className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"`
- Line 2284: `className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-blue-700 transition hover:bg-blue-100"`
- Line 2351: `<p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">`
- Line 2363: `<h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">`
- Line 2395: `<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">`
- Line 2408: `<div className="flex items-center gap-2">`
- Line 2412: `className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"`

### `src\pages\school\parent\Dashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 163: `className="mt-4 self-start inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 shadow-sm"`
- Line 313: `<div className="flex items-start gap-4">`
- Line 336: `<div className="mb-5 flex items-center justify-between gap-4">`
- Line 384: `<div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-3 text-slate-900 shadow-sm">`

### `src\pages\school\parent\Login.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 125: `className="flex items-start gap-3 overflow-hidden rounded-xl border border-red-100 bg-red-50 p-4"`
- Line 136: `<label className="ml-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">`
- Line 152: `<label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">`

### `src\pages\school\parent\Profile.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 83: `<div className="flex items-center justify-between gap-4 mb-6">`
- Line 150: `<div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">`
- Line 157: `<div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">`
- Line 203: `<h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">`
- Line 210: `<div className="flex items-center gap-4">`
- Line 236: `<h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">`
- Line 242: `<div className="flex items-center gap-3">`
- Line 255: `<div className="flex items-center gap-3">`
- Line 271: `className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-red-50 py-4 text-[15px] font-black text-red-600 hover:bg-red-100 transition-colors border border-red-100"`

### `src\pages\school\student\Analytics.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 43: `<h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 122: `<h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 139: `<h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`

### `src\pages\school\student\Announcements.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 114: `<div className="flex gap-2 overflow-x-auto pb-1">`
- Line 190: `className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"`
- Line 204: `className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"`

### `src\pages\school\student\Assessments.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 348: `'flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition',`
- Line 447: `<div className="flex min-w-max gap-1">`
- Line 459: `'inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',`
- Line 489: `<div className="flex gap-6">`
- Line 545: `<div className="mb-4 flex items-center gap-4 text-xs font-semibold text-slate-500">`
- Line 546: `<div className="flex items-center gap-1">`
- Line 555: `<div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">`
- Line 565: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"`
- Line 576: `'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors',`
- Line 591: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100"`
- Line 681: `<div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/20">`
- Line 707: `className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition dark:bg-blue-900/20 dark:text-blue-400"`
- Line 723: `<div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">`
- Line 804: `className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"`
- Line 813: `className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"`
- Line 865: `<div className="flex justify-end gap-3 border-t border-slate-100 p-5 dark:border-slate-800">`

### `src\pages\school\student\AssessmentView.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 77: `className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"`
- Line 93: `<span className="inline-flex items-center gap-1">`
- Line 108: `className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"`
- Line 118: `className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"`
- Line 127: `className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"`
- Line 138: `<div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">`

### `src\pages\school\student\Assignments.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 215: `<div className="flex items-center justify-between gap-3">`
- Line 254: `<div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60 ml-1">`
- Line 325: `<div className="flex items-center gap-2">`
- Line 330: `<div className="flex items-center gap-2">`
- Line 334: `<div className="flex items-center gap-2">`
- Line 339: `<div className="flex items-center gap-2">`
- Line 347: `<div className="mb-4 flex gap-3">`
- Line 352: `className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"`
- Line 362: `className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"`
- Line 373: `<div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800/50">`
- Line 381: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"`
- Line 390: `<div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800/50">`
- Line 398: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"`
- Line 409: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"`
- Line 426: `<div className="mb-4 flex items-start justify-between gap-3">`
- Line 471: `<div className="mt-6 flex justify-end gap-3">`

### `src\pages\school\student\Attendance.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 155: `<span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-600">`
- Line 163: `<div className="flex items-center gap-2">`
- Line 242: `<div className="flex items-start justify-between gap-3">`
- Line 250: `<div className="mt-5 flex items-end gap-3">`
- Line 276: `<span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">`
- Line 286: `<div className="flex items-start justify-between gap-3">`
- Line 306: `<div key={item.id || `${item.date}-${item.status}`} className={`relative flex gap-3 ${isLast ? '' : 'pb-4'}`}>`
- Line 317: `<div className="flex items-start justify-between gap-2">`
- Line 351: `className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${s.tw.bg} ${s.tw.text} ${s.tw.border}`}`

### `src\pages\school\student\BattleArena.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 49: `<h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 97: `<div className="flex gap-2">`
- Line 129: `<button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 transition hover:bg-blue-50">`
- Line 140: `<h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 150: `<div className="flex items-center gap-3">`

### `src\pages\school\student\Calendar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 176: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-[0.99]"`
- Line 183: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-[0.99]"`
- Line 298: `<div className="flex items-center gap-3 min-w-0">`
- Line 326: `<div className="flex items-center gap-2 mb-4">`
- Line 353: `<div className="flex items-center gap-2">`
- Line 363: `<div className="flex items-center gap-2">`
- Line 369: `<div className="flex items-center gap-2">`

### `src\pages\school\student\career\CareerDetail.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 22: `<div className="flex items-center gap-2">`
- Line 92: `<button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600">`
- Line 98: `<div className="flex items-start justify-between gap-3">`
- Line 100: `<div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">`
- Line 119: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">`
- Line 126: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">`
- Line 136: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 group-hover:text-purple-600 transition-colors">`
- Line 145: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">`
- Line 155: `<h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 169: `<h2 className="mb-6 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 193: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">`
- Line 297: `<button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600">`
- Line 303: `<div className="flex items-start justify-between gap-3">`
- Line 307: `<div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">`
- Line 336: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">`
- Line 344: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">`
- Line 355: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 group-hover:text-purple-600 transition-colors">`
- Line 367: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">`
- Line 380: `<h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 396: `<h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 425: `<div className="flex items-center gap-3 text-sm">`
- Line 428: `<span className={`inline-flex items-center gap-1 font-bold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>`
- Line 443: `<h2 className="mb-6 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 475: `<h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 492: `<h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 506: `<h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">`
- Line 511: `<li key={col} className="flex items-center gap-2.5 text-sm text-slate-700">`
- Line 527: `<h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-emerald-600">`
- Line 532: `<li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">`
- Line 544: `<h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-rose-500">`
- Line 549: `<li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">`
- Line 562: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">`

### `src\pages\school\student\career\CareerExplorer.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 46: `<button onClick={() => navigate('/school/student/career')} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> Career Home</button>`
- Line 86: `<span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600">Learn More <ChevronRight className="h-3.5 w-3.5" /></span>`

### `src\pages\school\student\career\CareerHome.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 93: `<h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">`
- Line 108: `<div className="flex gap-3 overflow-x-auto pb-1">`
- Line 126: `<div className="flex items-start gap-4">`
- Line 147: `<button onClick={() => navigate('/school/student/career/quiz')} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">`
- Line 160: `<div className="flex gap-3 overflow-x-auto">`
- Line 167: `<div className="flex gap-3 overflow-x-auto pb-1">`
- Line 197: `<div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-600" /><h3 className="text-lg font-bold text-slate-900">Your Career Report</h3></div>`
- Line 204: `<button onClick={() => navigate('/school/student/career/report')} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">`
- Line 214: `<button onClick={() => navigate('/school/student/career/report')} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">`
- Line 221: `<div className="flex items-start gap-4 opacity-80">`

### `src\pages\school\student\career\CareerQuiz.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 74: `<button onClick={() => navigate('/school/student/career/report')} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">`
- Line 90: `<div className="flex items-center gap-3">`
- Line 109: `className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition`
- Line 125: `className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50">`
- Line 130: `<button onClick={handleSubmit} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">`
- Line 135: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700">`

### `src\pages\school\student\career\CareerQuizResult.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 78: `<div key={l} className="flex items-center gap-3">`
- Line 92: `className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">`

### `src\pages\school\student\career\CareerReport.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 159: `<div key={label} className="flex items-center gap-2.5 text-sm">`
- Line 193: `<button onClick={handleGenerate} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">`
- Line 205: `<div className="flex items-start justify-between gap-3">`
- Line 207: `<button onClick={() => navigate('/school/student/career')} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> Career Home</button>`
- Line 237: `<div className="flex items-start justify-between gap-3">`
- Line 238: `<div className="flex items-center gap-2">`
- Line 266: `<li key={i} className="flex gap-2 text-sm text-slate-600">`
- Line 276: `className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">`
- Line 287: `<div key={i} className="flex items-start gap-2.5 text-sm text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">`
- Line 303: `<p className="mt-3 flex items-center gap-1.5 text-sm font-bold opacity-90"><Trophy className="h-4 w-4" /> {(user as { name?: string } | null)?.name || 'Student'}</p>`

### `src\pages\school\student\career\_shared.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 41: `<button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">`

### `src\pages\school\student\Chat.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 46: `<div className="flex gap-2">`

### `src\pages\school\student\ClassDetails.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 56: `<Link to="/school/student/classes" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">`
- Line 62: `<div className="flex items-center gap-3 mb-2">`
- Line 73: `<div className="flex items-center gap-6 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">`
- Line 103: `<div className="flex items-center gap-4">`
- Line 112: `<div className="flex items-center gap-4">`
- Line 141: `<div className="flex items-center gap-3">`
- Line 156: `<div className="flex gap-3 text-xs font-semibold text-slate-400">`
- Line 157: `<span className="flex items-center gap-1"><PlayCircle size={14} /> {topic.lectures?.total || 0}</span>`
- Line 158: `<span className="flex items-center gap-1"><FileText size={14} /> {Object.values(topic.resourceCounts || {}).reduce((a,b)=>a+b,0)}</span>`

### `src\pages\school\student\Classes.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 143: `<span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">`
- Line 152: `<span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">`
- Line 161: `<span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">`
- Line 169: `<span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">`
- Line 181: `<h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-rose-600">`
- Line 191: `<div className="flex items-center justify-between gap-3 bg-gradient-to-r from-rose-600 to-red-500 px-5 py-3 text-white">`
- Line 192: `<span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]"><Radio size={14} /> Live</span>`
- Line 202: `className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"`
- Line 228: `<div className="flex items-start justify-between gap-4">`
- Line 230: `<span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">`
- Line 243: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">`
- Line 247: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">`
- Line 259: `className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"`
- Line 326: `<div className="flex gap-4">`
- Line 376: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">`
- Line 380: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">`
- Line 385: `<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">`
- Line 391: `<span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">`
- Line 401: `className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"`
- Line 491: `<div className="mb-6 flex items-center gap-4 text-xs font-semibold text-slate-500">`
- Line 492: `<div className="flex items-center gap-1">`
- Line 496: `<div className="flex items-center gap-1">`
- Line 516: `className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-blue-900/20"`

### `src\pages\school\student\Dashboard.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 264: `<div className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-400">`
- Line 312: `<div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-inner">`
- Line 323: `<div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-inner">`
- Line 338: `className="mt-4 self-start inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 shadow-sm"`
- Line 398: `<div key={`${item.id || item.subject || item.title}-${index}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">`

### `src\pages\school\student\Doubts.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 64: `<p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">`
- Line 83: `className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"`
- Line 91: `className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"`
- Line 102: `<p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">`
- Line 284: `<div className="flex items-start gap-3">`
- Line 399: `className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-40"`
- Line 408: `className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40"`
- Line 425: `<div className="flex items-start justify-between gap-4">`
- Line 440: `className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"`
- Line 460: `className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"`

### `src\pages\school\student\Feedback.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 53: `<h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 63: `<h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 97: `<h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 109: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"`
- Line 115: `<div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">`

### `src\pages\school\student\game-zone\MathSprintHome.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 25: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 42: `<h2 className="text-sm font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">`
- Line 46: `<li className="flex items-center gap-2">⏱️ <strong>60-Second Blitz</strong>: Answer as many equations as you can before time runs out.</li>`
- Line 47: `<li className="flex items-center gap-2">✨ <strong>Base Loot</strong>: +10 XP and +1 Coin per correct answer.</li>`
- Line 48: `<li className="flex items-center gap-2">🔥 <strong>Fever Mode (3+ Streak)</strong>: Score is doubled (x2 multiplier / +20 XP per sum)!</li>`
- Line 49: `<li className="flex items-center gap-2">⚡ <strong>Supercharge (5+ Streak)</strong>: Score is tripled (x3 multiplier / +30 XP per sum)!</li>`
- Line 50: `<li className="flex items-center gap-2">❌ <strong>Striking Out</strong>: A wrong answer immediately resets your multiplier back to 1x.</li>`
- Line 51: `<li className="flex items-center gap-2 text-rose-600 dark:text-rose-400">🏆 <strong>Speedster Milestone</strong>: Reach a score of <strong>150+</strong> in a single run to claim the <strong className="font-black">Math Speedster Badge</strong>!</li>`
- Line 59: `<label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">`
- Line 91: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/10 transition hover:bg-rose-700 disabled:opacity-50"`
- Line 107: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`

### `src\pages\school\student\game-zone\MathSprintLeaderboard.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 69: `<div className="flex items-center gap-3">`
- Line 83: `<div className="flex items-center gap-4 text-right">`
- Line 85: `<p className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1 justify-end text-rose-500">`
- Line 103: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-505 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`

### `src\pages\school\student\game-zone\MathSprintPlay.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 130: `<div className="flex items-center gap-4">`
- Line 146: `<div className="flex items-center gap-4 text-xs font-black">`
- Line 147: `<div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">`
- Line 151: `<div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-rose-400">`
- Line 168: `<span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badgeColor} self-start`}>`
- Line 178: `<div className="mt-4 flex items-center justify-center gap-2 text-sm font-black animate-fade-in">`
- Line 180: `<span className="text-emerald-400 flex items-center gap-1.5">`
- Line 184: `<span className="text-rose-400 flex items-center gap-1.5">`
- Line 221: `className={`flex items-center gap-4 rounded-2xl border p-5 text-left text-base font-black transition-all active:scale-[0.98] ${cardStyle}`}`

### `src\pages\school\student\game-zone\MathSprintResult.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 28: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 45: `<div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 p-5 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-bounce-short">`
- Line 96: `<span className="text-rose-600 dark:text-rose-450 flex items-center gap-1">`
- Line 107: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-black text-white hover:bg-rose-700 shadow-md transition"`
- Line 114: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-450 transition"`

### `src\pages\school\student\game-zone\MemoryMatchHome.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 105: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 122: `<h2 className="text-sm font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">`
- Line 126: `<li className="flex items-start gap-2">`
- Line 130: `<li className="flex items-start gap-2">`
- Line 134: `<li className="flex items-start gap-2">`
- Line 138: `<li className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">`
- Line 183: `<div className="flex items-center gap-3 shrink-0">`
- Line 205: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-700 disabled:opacity-50"`
- Line 212: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`
- Line 246: `className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${`
- Line 256: `<div className="flex items-center gap-2">`
- Line 281: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-700 disabled:opacity-50"`
- Line 292: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`

### `src\pages\school\student\game-zone\MemoryMatchLeaderboard.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 75: `<div className="flex items-center gap-3">`
- Line 83: `<div className="flex items-center gap-2 mt-0.5">`
- Line 95: `<div className="flex items-center gap-4 text-right">`
- Line 97: `<p className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1 justify-end text-emerald-600 dark:text-emerald-400">`
- Line 115: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-505 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`

### `src\pages\school\student\game-zone\MemoryMatchPlay.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 147: `<div className="flex items-center gap-2">`
- Line 158: `<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">`
- Line 166: `<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">`
- Line 174: `<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">`

### `src\pages\school\student\game-zone\MemoryMatchResult.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 31: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 48: `<div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-bounce">`
- Line 62: `<div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 p-5 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-pulse">`
- Line 117: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 shadow-md transition"`
- Line 124: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 transition"`

### `src\pages\school\student\game-zone\QuizRushHome.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 102: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 119: `<h2 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-2">`
- Line 123: `<li className="flex items-center gap-2">⏱️ <strong>30-Second Limit</strong>: Answer each question before time runs out.</li>`
- Line 124: `<li className="flex items-center gap-2">✨ <strong>Base Points</strong>: +10 XP &amp; +1 EDDVA Coin per correct answer.</li>`
- Line 125: `<li className="flex items-center gap-2">⚡ <strong>Speed Bonus</strong>: +5 XP if you answer correctly within 5 seconds!</li>`
- Line 126: `<li className="flex items-center gap-2">🔥 <strong>Combo Streak</strong>: Build streaks for ultimate bragging rights.</li>`
- Line 127: `<li className="flex items-center gap-2">🏆 <strong>Perfect Score</strong>: Solve all 5 correctly for +50 XP, +5 Coins, and the <strong className="text-indigo-600 dark:text-indigo-400">Quiz Master Badge</strong>!</li>`
- Line 135: `<label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">`
- Line 153: `<label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">`
- Line 173: `<label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">`
- Line 205: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-black text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"`
- Line 217: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`

### `src\pages\school\student\game-zone\QuizRushLeaderboard.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 92: `<p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-semibold">`
- Line 93: `<span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5 text-yellow-500 fill-current" /> Streak: {user.maxStreak}</span>`
- Line 94: `<span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5 text-slate-400" /> Time: {user.timeTakenSeconds}s</span>`
- Line 109: `<div className="text-right text-sm text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1 font-black">`
- Line 123: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition"`

### `src\pages\school\student\game-zone\QuizRushPlay.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 132: `<div className="flex items-center gap-4">`
- Line 148: `<div className="flex items-center gap-6 text-xs font-black">`
- Line 149: `<div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">`
- Line 153: `<div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-amber-400">`
- Line 197: `<div className="mt-8 flex items-center gap-3 animate-fade-in p-4 rounded-xl border bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800">`
- Line 255: `className={`flex items-center gap-4 rounded-2xl border-b-4 p-5 text-left text-sm font-black transition shadow-sm hover:shadow active:translate-y-0.5 ${buttonClass}`}`
- Line 273: `className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700 shadow-md transition disabled:opacity-50"`

### `src\pages\school\student\game-zone\QuizRushResult.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 36: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 59: `<div className="flex items-center gap-1.5 text-amber-500">`
- Line 68: `<div className="flex items-center gap-1.5 text-yellow-500">`
- Line 79: `<span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-yellow-400 fill-current" /> Max Combo Streak</span>`
- Line 83: `<span className="flex items-center gap-1">⚡ Speed Bonuses</span>`
- Line 87: `<span className="flex items-center gap-1">⏱️ Total Time Taken</span>`
- Line 96: `<h2 className="text-xl font-black text-indigo-950 dark:text-white flex items-center justify-center gap-2">`
- Line 122: `<h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">`
- Line 140: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-black text-white shadow transition hover:bg-indigo-700"`
- Line 147: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`

### `src\pages\school\student\game-zone\TreasureChallenge.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">`
- Line 90: `<div className="flex items-center gap-2 mb-4">`
- Line 111: `<div className={`mt-6 flex items-start gap-3 p-4 rounded-xl border animate-fade-in ${`
- Line 163: `className={`flex items-center gap-4 rounded-xl border p-4 text-left text-sm font-black transition-all duration-200 active:scale-[0.98] ${cardStyle}`}`
- Line 188: `className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10 transition"`

### `src\pages\school\student\game-zone\TreasureChest.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 31: `<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">`
- Line 70: `className="flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-sm font-black text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition hover:translate-y-[-2px] active:translate-y-0"`
- Line 111: `<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">`
- Line 145: `<span className="text-white flex items-center gap-1">`
- Line 153: `<span className="text-yellow-400 flex items-center gap-1">`
- Line 160: `<div className="flex items-center gap-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-left">`
- Line 174: `className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition"`

### `src\pages\school\student\game-zone\TreasureHunt.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 134: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 174: `<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-1 ${accentColor}`}>`
- Line 179: `<span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">`
- Line 213: `className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-black text-white shadow transition ${btnBg}`}`

### `src\pages\school\student\game-zone\TreasureMap.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 60: `className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition mb-6 group"`
- Line 66: `<span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 ${accentColor}`}>`
- Line 78: `<div className="flex items-center gap-3">`
- Line 88: `<div className="flex items-center gap-3">`

### `src\pages\school\student\game-zone\WordMasterHome.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 107: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 124: `<h2 className="text-sm font-black uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-2">`
- Line 128: `<li className="flex items-start gap-2">`
- Line 132: `<li className="flex items-start gap-2">`
- Line 136: `<li className="flex items-start gap-2">`
- Line 140: `<li className="flex items-start gap-2 text-violet-600 dark:text-violet-400">`
- Line 185: `<div className="flex items-center gap-3 shrink-0">`
- Line 207: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/10 transition hover:bg-violet-700 disabled:opacity-50"`
- Line 214: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`
- Line 248: `className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${`
- Line 258: `<div className="flex items-center gap-2">`
- Line 283: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/10 transition hover:bg-violet-700 disabled:opacity-50"`
- Line 294: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`

### `src\pages\school\student\game-zone\WordMasterLeaderboard.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 74: `<div className="flex items-center gap-3">`
- Line 82: `<div className="flex items-center gap-2 mt-0.5">`
- Line 94: `<div className="flex items-center gap-4 text-right">`
- Line 96: `<p className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1 justify-end text-violet-650 dark:text-violet-400">`
- Line 114: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-505 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`

### `src\pages\school\student\game-zone\WordMasterPlay.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 151: `<div className="flex items-center gap-2">`
- Line 161: `<div className="flex items-center gap-4">`
- Line 162: `<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">`
- Line 202: `<span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">`
- Line 264: `className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition disabled:opacity-50"`
- Line 272: `className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"`
- Line 281: `className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 text-xs font-black text-white hover:bg-violet-700 transition disabled:opacity-50 shadow-md"`

### `src\pages\school\student\game-zone\WordMasterResult.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 32: `className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"`
- Line 49: `<div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-bounce">`
- Line 63: `<div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 p-5 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-pulse">`
- Line 105: `<span className="text-violet-600 dark:text-violet-400 font-mono flex items-center gap-1">`
- Line 125: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-black text-white hover:bg-violet-700 shadow-md transition"`
- Line 132: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 transition"`

### `src\pages\school\student\Gamification.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 104: `<div className="flex items-center gap-3 mb-2">`
- Line 110: `<div className="flex items-center gap-3">`
- Line 120: `<div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">`
- Line 127: `<div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">`
- Line 134: `<div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">`
- Line 141: `<div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">`
- Line 153: `<div className="flex items-center justify-between gap-3 mb-5">`
- Line 165: `<div className="flex items-center gap-3">`
- Line 191: `<div className="flex items-center gap-3">`
- Line 217: `<div className="flex items-center gap-3">`
- Line 243: `<div className="flex items-center gap-3">`
- Line 269: `<div className="flex items-center gap-3">`

### `src\pages\school\student\live\StudentLivePlayer.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 263: `className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"`
- Line 274: `<div className="flex items-center gap-3">`
- Line 275: `<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${phase === 'live' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>`
- Line 278: `<span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">`
- Line 285: `className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"`
- Line 324: `<span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white"><span className="h-2 w-2 rounded-full bg-white" /> LIVE · auto</span>`
- Line 334: `className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${handRaised ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}`
- Line 338: `<div className="ml-auto flex items-center gap-1">`
- Line 366: `className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${rightPanel === 'polls' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}`
- Line 381: `<div key={m.id} className={`flex gap-2 rounded-lg p-2 ${i % 2 ? 'bg-white/5' : ''}`}>`
- Line 384: `<div className="flex items-baseline gap-2">`
- Line 394: `<div className="flex items-center gap-2 border-t border-white/10 p-2.5">`
- Line 445: `labelSuffix = <span className="inline-flex items-center gap-0.5 rounded bg-emerald-950/40 px-1.5 py-0.2 text-[8px] font-black text-emerald-400">✓ Correct</span>;`
- Line 449: `<span className="inline-flex items-center gap-0.5 rounded bg-red-950/40 px-1.5 py-0.2 text-[8px] font-black text-red-400">`
- Line 457: `labelSuffix = <span className="inline-flex items-center gap-0.5 rounded bg-emerald-950/40 px-1.5 py-0.2 text-[8px] font-black text-emerald-400">Your choice</span>;`
- Line 464: `<span className="truncate pr-1.5 flex items-center gap-1">`
- Line 497: `<span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">`
- Line 529: `<span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">`
- Line 536: `<span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-black text-red-700 dark:bg-red-950/40 dark:text-red-300">`
- Line 557: `<span className="truncate pr-2 flex items-center gap-1.5">`

### `src\pages\school\student\Profile.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 15: `<p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">`
- Line 136: `<span className="flex items-center gap-1">`
- Line 151: `<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-700 text-xs font-extrabold uppercase tracking-wider dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/5">`
- Line 166: `<p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">`
- Line 170: `<div className="mt-3 flex items-baseline gap-2">`
- Line 195: `<p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">`
- Line 199: `<div className="mt-3 flex items-baseline gap-2">`
- Line 214: `<p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">`
- Line 218: `<div className="mt-3 flex items-baseline gap-2">`
- Line 241: `<div className="flex items-center gap-3">`
- Line 260: `<h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">`
- Line 308: `<div className="flex items-center gap-3">`
- Line 323: `className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:scale-102 active:scale-98"`
- Line 340: `<h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">`
- Line 351: `<span className="flex items-center gap-3 text-sm">`
- Line 364: `<span className="flex items-center gap-3 text-sm">`

### `src\pages\school\student\RecordedClassDetails.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 249: `<span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">`
- Line 258: `<span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">`
- Line 267: `<span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">`
- Line 275: `<span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">`
- Line 334: `<div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white z-10">`
- Line 350: `<div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">`
- Line 351: `<div className="flex items-center gap-2 text-xs text-slate-500">`
- Line 374: `className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"`
- Line 455: `<div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl text-white">`
- Line 486: `<div className="flex items-start gap-3">`
- Line 499: `<span className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-350">`
- Line 523: `<div className="flex items-start gap-3">`
- Line 556: `className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold ${`
- Line 585: `<p className="font-bold text-slate-700 mb-1 flex items-center gap-1">`
- Line 592: `<div className="flex items-center gap-2 text-xs font-semibold">`
- Line 639: `className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"`
- Line 659: `<div className="flex w-full items-center gap-3">`
- Line 676: `className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"`
- Line 713: `<span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">`
- Line 721: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 725: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 733: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 738: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600">`
- Line 743: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 759: `className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${`
- Line 771: `className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${`
- Line 783: `className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${`
- Line 795: `className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${`

### `src\pages\school\student\SchoolStudentAiStudyPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 264: `className="w-full flex items-center gap-4 p-5 text-left transition-colors"`
- Line 283: `<p className="text-[11px] font-semibold text-indigo-700 mb-2 flex items-center gap-2">`
- Line 293: `<p className="text-[11px] font-semibold text-blue-700 mb-2 flex items-center gap-2">`
- Line 341: `<p className="text-[11px] font-semibold text-emerald-700 mb-2 flex items-center gap-2">`
- Line 350: `<p className="text-[11px] font-semibold text-amber-600 mb-2 flex items-center gap-2">`
- Line 361: `className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"`
- Line 725: `<div className="flex items-start gap-4 sm:gap-5">`
- Line 735: `<span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">`
- Line 740: `<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">`
- Line 766: `<div className="flex gap-2 overflow-x-auto pb-1">`
- Line 772: `"inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",`
- Line 814: `<div className="flex items-center justify-between gap-3">`
- Line 828: `"inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors",`
- Line 843: `"inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors",`
- Line 860: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"`
- Line 880: `<div className="flex items-center justify-between gap-2">`
- Line 887: `<div className="mt-3 flex items-center gap-2">`
- Line 919: `className="flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium text-slate-700"`
- Line 946: `<div className="flex items-center justify-between gap-2">`
- Line 1023: `<div className="flex items-start justify-between gap-4">`
- Line 1052: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"`
- Line 1066: `<div className="flex gap-3">`
- Line 1079: `<span className="inline-flex items-center gap-2">`
- Line 1084: `<span className="inline-flex items-center gap-2">`
- Line 1096: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"`
- Line 1103: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"`
- Line 1118: `<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">`
- Line 1126: `<div className="flex items-center gap-2">`
- Line 1238: `<h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">`
- Line 1263: `<div className="flex items-center gap-3">`
- Line 1273: `<div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">`
- Line 1316: `<div className="mr-auto bg-slate-100 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-medium flex items-center gap-2">`
- Line 1339: `<div className="flex gap-2">`
- Line 1366: `<h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">`
- Line 1411: `<div className="flex items-center justify-between gap-3 mb-4">`
- Line 1412: `<h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">`
- Line 1418: `<div className="bg-emerald-50 border border-emerald-100 rounded-[1.25rem] p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">`
- Line 1470: `className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"`
- Line 1486: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"`
- Line 1524: `<div className="flex items-center gap-3">`
- Line 1542: `<div className="mb-4 flex items-center justify-between gap-3">`
- Line 1562: `<div className="mt-6 flex items-center justify-between gap-3">`
- Line 1581: `className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"`
- Line 1611: `<div className="flex gap-2">`
- Line 1651: `<CardGlass className="flex items-center gap-6 border-amber-300 bg-amber-500 px-8 py-5 text-white shadow-[0_32px_80px_-18px_rgba(245,158,11,0.55)]">`

### `src\pages\school\student\SchoolStudentTopicQuizPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 76: `<div className="ml-auto flex items-center gap-2">`
- Line 99: `"flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all sm:gap-4 sm:py-3",`
- Line 150: `<div className="flex items-center justify-center sm:justify-start gap-4">`
- Line 181: `<div className="flex items-center gap-6">`
- Line 191: `<div className="flex items-center gap-2 sm:gap-4">`
- Line 201: `"flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",`
- Line 233: `<div className="flex items-center justify-between gap-3">`
- Line 237: `className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"`
- Line 245: `"inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors bg-purple-600 hover:bg-purple-500"`
- Line 553: `<div className="flex items-center justify-center gap-3"><Sparkles className="w-4 h-4 text-purple-500" /><p className="text-xs font-black text-purple-500 uppercase tracking-widest">AI Synthesis Result</p></div>`
- Line 565: `<CardGlass className="p-8 border-amber-400/20 bg-amber-50/60 flex items-center gap-6 mb-10 h-fit">`
- Line 576: `<div className="flex items-center gap-4"><Info className="w-5 h-5 text-slate-400" /><span className="text-sm font-black text-slate-900 uppercase italic">Review Logic Patterns</span></div>`
- Line 594: `<div className="flex gap-4 mb-4">`
- Line 627: `<button onClick={() => navigate(-1)} className="w-full py-8 rounded-[3rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6">Return to Planner <ArrowRight className="w-6 h-6" /></button>`

### `src\pages\school\student\SessionResult.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 210: `className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"`
- Line 291: `<div className="flex items-center gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">`
- Line 304: `<div className="flex items-center gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">`
- Line 315: `<div className="flex items-center gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">`
- Line 351: `<div className="mb-3 flex items-center gap-2">`
- Line 366: `<div className="mb-5 flex items-center justify-between gap-4">`
- Line 367: `<div className="flex items-center gap-2">`
- Line 389: `<div className="flex items-center gap-2">`
- Line 400: `<div className="flex items-center gap-2">`
- Line 478: `<div className="flex items-start gap-3">`
- Line 492: `<div className="flex items-start gap-3">`

### `src\pages\school\student\Settings.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 34: `<div className="flex items-center gap-3">`
- Line 61: `<div className="flex items-center gap-3">`
- Line 79: `className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"`
- Line 96: `<div className="flex items-center gap-3">`
- Line 104: `<button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">`
- Line 108: `<button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">`
- Line 116: `<div className="flex items-center gap-3">`
- Line 125: `<div className="flex items-center gap-3">`
- Line 134: `<div className="flex items-center gap-3">`

### `src\pages\school\student\StudyMaterials.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 586: `<span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">`
- Line 594: `<div className="flex shrink-0 items-center gap-3">`
- Line 604: `<div className="flex items-center gap-2 border-b border-slate-200 pb-2">`
- Line 619: `<div className="flex items-center gap-2 border-b border-slate-200 pb-2">`
- Line 634: `<div className="flex items-center gap-2 border-b border-slate-200 pb-2">`
- Line 663: `<p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">`
- Line 710: `className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100"`
- Line 718: `<div className="ml-auto flex items-center gap-2 text-sm">`
- Line 721: `className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"`
- Line 849: `<div className="flex items-start justify-between gap-3">`
- Line 857: `className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition group-hover:opacity-80"`
- Line 903: `<div className="flex items-center gap-3 mt-2">`
- Line 933: `<div className="flex items-center gap-2 mb-3">`
- Line 950: `<div className="flex items-center gap-1.5 text-slate-400">`
- Line 971: `<div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">`
- Line 1008: `<div className="flex items-center justify-between gap-2 mb-3">`
- Line 1014: `<span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${meta.bg} ${meta.color} border-current/20`}>`
- Line 1018: `<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">`
- Line 1030: `<div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-auto">`
- Line 1035: `<div className="flex gap-1.5">`
- Line 1040: `className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:opacity-90 ${meta.grad}`}`
- Line 1050: `className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:opacity-90 ${meta.grad}`}`
- Line 1059: `className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"`
- Line 1140: `className={`flex items-start gap-3 rounded-xl border p-3 transition ${`
- Line 1148: `<div className="flex shrink-0 gap-1">`
- Line 1201: `<div className={`flex items-center gap-4 px-6 py-4 bg-gradient-to-r ${meta.grad} bg-opacity-10`}>`
- Line 1209: `<div className="flex items-center gap-2">`

### `src\pages\school\student\StudyPlanner.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 127: `<div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">`
- Line 335: `<div className={`flex-1 flex items-center gap-3 py-2 px-3 ml-1 rounded-xl transition-all border border-transparent`
- Line 343: `<div className="flex items-center gap-2 min-w-0">`
- Line 350: `<div className="flex items-center gap-3 mt-1.5">`
- Line 351: `<div className="flex items-center gap-1.5" title="Lectures">`
- Line 359: `<div className="flex items-center gap-1.5" title="Practice">`
- Line 367: `<div className="flex items-center gap-1.5" title="AI Session">`
- Line 413: `className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all`
- Line 418: `<div className="flex items-center gap-2 shrink-0">`
- Line 462: `className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all shadow-sm`
- Line 473: `<div className="flex items-center gap-2">`
- Line 477: `<div className="flex items-center gap-2 mt-1">`
- Line 538: `className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-xl border border-indigo-200 transition-colors">`
- Line 593: `<div key={l.label} className="flex items-center gap-1.5">`
- Line 639: `className={`flex gap-2.5 p-2.5 rounded-lg border transition-all ${showReview ? "cursor-pointer" : ""}`
- Line 647: `<div className="flex items-center justify-between gap-2">`
- Line 649: `<div className="flex items-center gap-1 shrink-0">`
- Line 662: `<span className="text-[11px] text-gray-400 flex items-center gap-0.5">`
- Line 668: `<div className="flex items-center gap-1 shrink-0">`
- Line 704: `<div className="p-3 flex items-center gap-3">`
- Line 710: `<div className="flex items-center gap-1.5 mt-0.5">`
- Line 719: `<div className="flex items-center gap-2 shrink-0">`
- Line 728: `className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"`
- Line 747: `<div className="flex items-start gap-3">`
- Line 802: `<div className="flex items-center gap-3">`
- Line 813: `<div className="flex items-center gap-1.5 ml-1">`
- Line 814: `{hlCount > 0 && <span className="text-[9px] font-medium bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> {hlCount}</span>}`
- Line 815: `{cmCount > 0 && <span className="text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" /> {cmCount}</span>}`
- Line 816: `{dbCount > 0 && <span className="text-[9px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" /> {dbCount}</span>}`
- Line 822: `<div className="flex items-center gap-2 shrink-0">`
- Line 922: `<div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">`
- Line 926: `<div className="flex items-center gap-2">`
- Line 945: `<div key={g.id} className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${done ? "bg-gray-50" : "hover:bg-amber-50/30"}`}>`
- Line 1043: `<div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">`
- Line 1063: `<div className="flex items-start gap-2">`
- Line 1068: `<span className="mt-0.5 text-[11px] font-semibold text-indigo-500 flex items-center gap-0.5">`
- Line 1219: `<div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-2">`
- Line 1244: `<div key={i} className={`flex gap-2 items-start text-xs px-2.5 py-2 rounded-lg border ${SEV_STYLE[ins.sev]} leading-snug`}>`
- Line 1280: `className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"`
- Line 1327: `className={`w-full flex items-center gap-3 px-4 py-3 text-left ${ac.header}`}>`
- Line 1378: `<div className="p-3.5 flex items-start gap-3">`
- Line 1394: `<div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">`
- Line 1403: `<div className="flex gap-1">`
- Line 1405: `className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-semibold hover:bg-teal-700 flex items-center gap-1">`
- Line 1409: `className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors`
- Line 1420: `<div className="flex items-center gap-1.5">`
- Line 1432: `className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 flex items-center justify-center gap-1.5">`
- Line 2178: `<div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700">`
- Line 2230: `className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${`
- Line 2236: `<span className="flex min-w-0 items-center gap-2">`
- Line 2353: `<div className="mb-3 flex items-center justify-between gap-3 px-1">`
- Line 2554: `<div className="mb-3 flex items-center justify-between gap-3 px-1">`
- Line 2748: `<div className="mb-4 flex items-center justify-between gap-3">`
- Line 2851: `<div className="mb-3 flex items-center gap-2 text-sm font-black text-teal-700">`
- Line 2883: `className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-blue-50/60"`
- Line 2891: `<div className="flex shrink-0 items-center gap-3">`
- Line 2912: `className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-slate-50"`
- Line 2918: `<div className="flex shrink-0 items-center gap-3">`
- Line 2976: `className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"`
- Line 2988: `<div className="flex items-center justify-between gap-3">`
- Line 3004: `className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-3 text-left transition hover:bg-blue-50"`
- Line 3030: `<div className={`flex items-center justify-between gap-3 px-4 py-3 ${cfg.bg}`}>`
- Line 3031: `<div className="flex min-w-0 items-center gap-2">`
- Line 3064: `<div className="flex items-center justify-between gap-3">`
- Line 3080: `<div className="flex items-center justify-between gap-3">`
- Line 3100: `<div className="flex items-center justify-between gap-3">`
- Line 3118: `className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"`
- Line 3142: `className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:brightness-95 ${item.tone}`}`
- Line 3162: `className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"`
- Line 3207: `<span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs">`
- Line 3211: `<span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs">`
- Line 3215: `<span className="flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2.5 py-1 rounded-full text-xs">`
- Line 3220: `<div className="flex items-center gap-3">`
- Line 3222: `<div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2 border border-white/10">`
- Line 3250: `className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium border-b-2 transition-all`
- Line 3299: `className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mx-auto flex items-center gap-2">`
- Line 3316: `<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">`
- Line 3357: `<div className="flex items-center gap-1.5">`
- Line 3361: `<div className="flex items-center gap-1.5 text-xs text-gray-500">`
- Line 3396: `<div className="flex items-center gap-1.5">`
- Line 3400: `<div className="flex items-center gap-1.5 text-xs text-gray-500">`
- Line 3425: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 3439: `<div className="flex items-center gap-2 mb-2">`
- Line 3445: `className="w-full py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">`
- Line 3483: `className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"`
- Line 3520: `<div className="mt-4 flex items-center gap-2">`
- Line 3526: `<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">`
- Line 3559: `<div className="flex items-center gap-2">`
- Line 3613: `<div className="flex items-center gap-2">`
- Line 3633: `className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">`
- Line 3683: `<div className="flex items-center gap-2">`
- Line 3703: `className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer">`
- Line 3707: `<div className="flex items-center gap-2 mt-1">`
- Line 3749: `<div className="flex items-center gap-2">`
- Line 3769: `className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">`
- Line 3773: `<div className="flex items-center gap-2 mt-1">`
- Line 3815: `<div className="flex items-center gap-2">`
- Line 3833: `className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">`
- Line 3837: `<div className="flex items-center gap-2 mt-1">`
- Line 3879: `<div className="flex items-center gap-2">`
- Line 3901: `className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">`
- Line 3904: `<div className="flex items-center gap-2 mb-0.5">`
- Line 3908: `<div className="flex items-center gap-2">`
- Line 3950: `<div className="flex items-center gap-2">`
- Line 3971: `className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer">`
- Line 3976: `{durationMinutes > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{durationMinutes} min</span>}`
- Line 4001: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 4007: `<div className="font-semibold text-amber-700 text-sm mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Backlog Tip</div>`
- Line 4027: `className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"`
- Line 4052: `<div className="mt-4 flex items-center gap-2">`
- Line 4090: `<div className="flex items-center gap-2">`
- Line 4108: `<div key={ch.chapterId} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-200 hover:shadow-sm transition-all flex items-center gap-3">`
- Line 4128: `className="shrink-0 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors flex items-center gap-1">`
- Line 4174: `<div className="flex items-center gap-2">`
- Line 4192: `<div key={topic.topicId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all">`
- Line 4198: `className="shrink-0 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1">`
- Line 4244: `<div className="flex items-center gap-2">`
- Line 4262: `<div key={t.topicId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-violet-200 hover:shadow-sm transition-all">`
- Line 4274: `className="shrink-0 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1">`
- Line 4320: `<div className="flex items-center gap-2">`
- Line 4338: `<div key={t.topicId} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all flex items-center gap-3">`
- Line 4341: `<div className="flex items-center gap-3 mt-2 text-[11px]">`
- Line 4350: `className="shrink-0 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1">`
- Line 4373: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 4379: `<div className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Weakness Engine</div>`
- Line 4382: `<div key={label} className="flex justify-between gap-2"><span className="text-red-400 shrink-0">{label}</span><span className="font-medium text-right">{desc}</span></div>`
- Line 4412: `className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"`
- Line 4426: `<div className="mt-4 flex items-center gap-2">`
- Line 4440: `<div className="mt-4 flex items-center gap-2">`
- Line 4446: `<span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 flex items-center gap-1">`
- Line 4459: `<div className="mt-4 flex items-center gap-2">`
- Line 4472: `<div className="mt-4 flex items-center gap-2">`
- Line 4486: `<div className="flex items-center gap-2 mb-2">`
- Line 4496: `<div key={di} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">`
- Line 4503: `<div className={`px-4 py-2.5 flex items-center gap-3 border-b border-gray-100 ${di === 0 ? "bg-indigo-50" : "bg-gray-50"}`}>`
- Line 4513: `<div key={topic.topicId} className="px-4 py-3 flex items-center gap-3">`
- Line 4519: `<div className="flex items-center gap-2 mt-0.5">`
- Line 4533: `className="shrink-0 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 flex items-center gap-1">`
- Line 4566: `<div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl border border-orange-100 text-sm font-bold">`
- Line 4636: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 4650: `<div className="font-semibold text-teal-700 text-sm mb-3 flex items-center gap-1.5">`
- Line 4660: `<div key={interval} className="flex items-center gap-2">`
- Line 4708: `<h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">`
- Line 4726: `<div className="font-semibold text-indigo-700 text-sm mb-1 flex items-center gap-1.5">`
- Line 4734: `className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">`
- Line 4738: `className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">`

### `src\pages\school\student\SupportTickets.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 99: `<div className="flex items-center gap-3">`
- Line 141: `className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"`

### `src\pages\school\student\TestEngine.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 287: `'flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all',`
- Line 396: `className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600"`
- Line 417: `className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"`
- Line 456: `className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"`
- Line 465: `className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"`
- Line 517: `<div className="mb-6 flex items-center gap-3">`

### `src\pages\school\student\Timetable.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 112: `<div className="flex items-center gap-3 mb-6">`
- Line 138: `<div className="flex items-center gap-2">`
- Line 158: `<div className="flex items-center gap-2">`
- Line 280: `<div className="mt-auto flex items-center justify-between gap-2">`
- Line 281: `<div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 truncate">`

### `src\pages\school\student\TopicDetails.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 49: `<Link to={`/school/student/classes/${batchId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">`
- Line 53: `<div className="flex items-center gap-3 mb-2">`
- Line 64: `<div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30">`
- Line 76: `<h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 85: `<div key={lec.id} className="flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">`
- Line 98: `<div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">`
- Line 101: `<span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12}/> Watched</span>`
- Line 117: `<h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">`
- Line 133: `<div className="flex items-center gap-3">`

### `src\pages\school\teacher\Announcements.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 149: `<div className="flex gap-2 overflow-x-auto pb-1">`
- Line 225: `className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"`
- Line 239: `className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"`

### `src\pages\school\teacher\AssessmentDetails.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 1021: `<div className="flex items-center gap-2">`
- Line 1058: `<div className="mb-6 flex items-center gap-2">`
- Line 1167: `<div className="mb-3 flex items-center gap-2">`
- Line 1259: `className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"`
- Line 1277: `<div className="flex items-center gap-2">`
- Line 1321: `<div className="mb-2 flex items-center gap-3">`
- Line 1326: `<p className="mt-1 flex items-center gap-3 text-sm font-medium text-gray-500">`
- Line 1361: `<div className="mb-3 flex items-center justify-between gap-3">`
- Line 1368: `className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"`
- Line 1425: `<label className="flex items-center gap-2 text-sm font-semibold text-gray-700">`

### `src\pages\school\teacher\AssessmentSubmissionReview.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 179: `className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-900"`
- Line 195: `<div className="mb-3 flex items-center justify-between gap-3">`
- Line 202: `className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"`
- Line 226: `<div className="flex items-center gap-4">`
- Line 227: `<div className="flex items-center gap-2">`
- Line 246: `<div className="flex items-center gap-1">`
- Line 326: `<label className="flex items-center gap-2 text-sm font-semibold text-gray-700">`

### `src\pages\school\teacher\AssessmentSystem.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 43: `className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors ${item.active`
- Line 79: `<div className="flex items-start justify-between gap-3">`
- Line 83: `<p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">`
- Line 137: `<div className="flex items-center gap-2 bg-blue-50 px-3 py-2 border-b border-blue-100">`
- Line 152: `<div className="flex items-center gap-2 bg-amber-50 px-3 py-2 border-b border-amber-100">`
- Line 167: `<div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">`
- Line 179: `<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">`
- Line 994: `className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${contentMode === mode.id`
- Line 1095: `<div className="flex justify-end gap-3 pt-4 border-t border-gray-100">`

### `src\pages\school\teacher\AssignmentManagement.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 78: `className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors ${`
- Line 99: `<div className="flex items-start justify-between gap-3">`
- Line 103: `<p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">`
- Line 567: `<div className="flex gap-2 rounded-xl bg-gray-100 p-1 max-w-md">`
- Line 571: `className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${`
- Line 580: `className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${`
- Line 673: `<div className="flex items-center gap-2 shrink-0">`
- Line 833: `<div className="flex items-center gap-2">`
- Line 837: `<div className="flex items-center gap-2">`
- Line 949: `<div className="flex gap-2 rounded-xl bg-gray-100 p-1">`
- Line 959: `className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${`
- Line 1035: `<div className="flex justify-end gap-3 pt-4 border-t border-gray-100">`
- Line 1058: `<div className="flex items-center gap-3 mb-2">`
- Line 1076: `<div className="flex items-center gap-4 text-sm text-gray-500 mt-2">`
- Line 1077: `<span className="flex items-center gap-1">`
- Line 1080: `<span className="flex items-center gap-1">`
- Line 1087: `<div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-5">`
- Line 1120: `<div className="flex items-center gap-3 overflow-hidden">`
- Line 1131: `<div className="flex gap-2">`
- Line 1184: `<div className="flex items-center justify-between gap-3">`
- Line 1191: `<div className="flex items-center gap-2 shrink-0">`
- Line 1205: `<div className="flex items-center gap-3">`
- Line 1207: `<div className="flex items-center gap-3">`
- Line 1210: `className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"`
- Line 1217: `className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"`
- Line 1234: `<div className="flex gap-2">`
- Line 1251: `<div className="flex gap-2">`

### `src\pages\school\teacher\AttendanceSystem.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 650: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">`
- Line 663: `className="flex items-center gap-2 self-start md:self-auto px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 shadow-sm"`
- Line 673: `<div className="tabs-navigation-bar flex gap-2 border-b border-slate-100 dark:border-slate-800 mb-6 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm max-w-md">`
- Line 676: `className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${`
- Line 687: `className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${`
- Line 711: `<div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">`
- Line 772: `<Badge variant="purple" className="flex items-center gap-1.5 py-1.5 px-3">`
- Line 879: `className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 transition-all flex items-center gap-1.5 ml-auto"`
- Line 915: `<div className="mt-1 flex items-center gap-2">`
- Line 928: `<div className="inline-flex gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">`
- Line 1009: `<div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">`
- Line 1126: `<div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">`
- Line 1183: `className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"`
- Line 1230: `<div className="flex gap-1.5 justify-end">`
- Line 1361: `<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${`
- Line 1380: `<div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 mt-4">`

### `src\pages\school\teacher\ChatSystem.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 881: `<div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100/60 shadow-xs animate-pulse">`
- Line 909: `className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${active`
- Line 960: `<div className="flex items-start justify-between gap-2">`
- Line 973: `<div className="mt-2 flex gap-2">`
- Line 997: `<div className="mt-2 flex gap-2">`
- Line 1028: `<div className="flex items-center gap-2 text-blue-600">`
- Line 1076: `<div className="flex gap-1.5 px-3 py-2 bg-slate-50/50 overflow-x-auto no-scrollbar border-b border-slate-100/60">`
- Line 1087: `className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap ${active`
- Line 1110: `<div className="flex items-center gap-3 min-w-0">`
- Line 1121: `<div className="flex items-center gap-2">`
- Line 1124: `<span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">`
- Line 1138: `<div className="flex items-center gap-1">`
- Line 1183: `<p className={`mb-1 flex items-center gap-1 text-[9px] font-bold uppercase ${mine ? 'text-blue-600' : 'text-slate-400'}`}>`
- Line 1205: `<div className="flex items-center gap-2">`
- Line 1211: `<div className="flex gap-1 shrink-0">`
- Line 1239: `<div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-85">`
- Line 1278: `<div className="flex items-center gap-2 text-slate-600">`
- Line 1289: `<div className="relative border-t border-slate-100 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pt-4 bg-white flex items-center gap-2 shrink-0 z-10">`
- Line 1314: `<div className="flex w-full gap-2">`
- Line 1467: `<div key={file.id} className="flex items-center gap-2 rounded-xl bg-white p-2 border border-slate-100 shadow-xs">`
- Line 1556: `className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"`
- Line 1603: `className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-slate-50 transition"`
- Line 1654: `<div className="mt-2 flex items-center justify-center gap-1.5">`
- Line 1711: `className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 font-bold text-slate-700 hover:bg-slate-50 transition"`
- Line 1721: `className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 font-bold text-slate-700 hover:bg-slate-50 transition"`
- Line 1860: `<div className="mt-6 flex gap-2">`
- Line 1928: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1937: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1948: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1957: `className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"`
- Line 1991: `<div className="flex items-center gap-3 min-w-0">`
- Line 2000: `<div className="flex gap-2">`
- Line 2098: `<div className="mt-4 flex gap-3">`
- Line 2102: `className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 transition"`
- Line 2121: `className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'`

### `src\pages\school\teacher\ClassManagement.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 45: `<span className="inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> {label}</span>`
- Line 64: `<button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">`
- Line 76: `<div className="inline-flex items-center gap-1">`
- Line 77: `<button onClick={onView} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">`
- Line 94: `<button onClick={onCopy} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">`
- Line 838: `<div className="flex items-start justify-between gap-3">`
- Line 839: `<div className="flex items-start gap-3 min-w-0 flex-1">`
- Line 864: `<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">`
- Line 870: `<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">`
- Line 880: `<span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600">`
- Line 888: `<span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">`
- Line 892: `<span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-600">`
- Line 900: `<div className="mt-3 flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2">`
- Line 909: `<div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">`
- Line 912: `className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"`
- Line 920: `'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors',`
- Line 1004: `<div className="flex items-start gap-4">`
- Line 1024: `<div className="flex items-start justify-between gap-3">`
- Line 1031: `className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">`
- Line 1046: `className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">`
- Line 1068: `<div className="flex items-center gap-2">`
- Line 1071: `<span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">`
- Line 1081: `<div className="flex gap-2">`
- Line 1101: `<div className="flex items-center justify-between gap-3">`
- Line 1162: `<span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">`
- Line 1169: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 1173: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 1181: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 1186: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600">`
- Line 1191: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 1216: `className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${`
- Line 1293: `<div className="flex items-center gap-2">`
- Line 1300: `className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"`
- Line 1315: `className="fixed z-[260] flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-2xl border border-slate-200"`
- Line 1325: `className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"`
- Line 1331: `className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"`
- Line 1341: `className="fixed z-[250] flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-2xl border border-slate-200"`
- Line 1349: `<div className="flex items-center gap-1.5 px-1">`
- Line 1372: `className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors flex items-center gap-1.5"`
- Line 1401: `<span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">`
- Line 1408: `<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">`
- Line 1412: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">`
- Line 1417: `<div className="ml-auto flex items-center gap-2">`
- Line 1422: `className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"`
- Line 1437: `<div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700">`
- Line 1458: `<p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Generating AI notes from the transcript…</p>`
- Line 1480: `<span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">`
- Line 1488: `className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"`
- Line 1503: `className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"`
- Line 1509: `<p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Transcribing… check back shortly.</p>`
- Line 1558: `<p className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">`
- Line 1582: `className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"`
- Line 1591: `<div className="mt-2.5 flex items-center gap-3">`
- Line 1618: `<div className="flex items-center gap-2 mb-1.5">`
- Line 1637: `<div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">`
- Line 1664: `<div className="flex items-center gap-3 p-3">`
- Line 1670: `<div className="flex items-center gap-2 mt-0.5">`
- Line 1689: `className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold cursor-default",`
- Line 1714: `<p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Generating in-video quiz…</p>`
- Line 1747: `<div className="flex items-center gap-3">`
- Line 1858: `<p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">`
- Line 1869: `<div key={i} className="flex items-start gap-3">`
- Line 1896: `<div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">`
- Line 1904: `className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"`
- Line 1919: `<div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">`
- Line 1929: `<div className="flex gap-3">`
- Line 1930: `<button onClick={() => setShowKey((s) => !s)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">`
- Line 1933: `<button onClick={() => copyText(activeCreds.streamKey, 'Stream key')} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">`
- Line 2062: `className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold transition ${videoSource === opt.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}`
- Line 2094: `<label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><ImageIcon size={14} /> Thumbnail (optional)</label>`

### `src\pages\school\teacher\Dashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 186: `<div className="mt-8 self-start inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 shadow-sm">`
- Line 294: `className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"`
- Line 368: `className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700"`

### `src\pages\school\teacher\DoubtQueue.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 92: `<p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">`
- Line 123: `className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"`
- Line 149: `className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"`
- Line 177: `className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700"`
- Line 286: `className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"`
- Line 319: `'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition',`

### `src\pages\school\teacher\GrievanceHandling.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 295: `<div className="flex items-center gap-3">`
- Line 427: `<p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">`
- Line 442: `<h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">`
- Line 471: `<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">`
- Line 486: `<div className="flex items-center gap-2">`
- Line 490: `className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400"`

### `src\pages\school\teacher\live\TeacherCreateLive.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 36: `<div className="mb-6 flex items-center gap-3">`
- Line 59: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"`
- Line 66: `<div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">`
- Line 79: `<div className="flex gap-2">`
- Line 80: `<button onClick={() => setShowKey((s) => !s)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">`
- Line 83: `<button onClick={() => copy('key', created.streamKey)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">`
- Line 102: `className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"`
- Line 118: `<button onClick={onCopy} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">`

### `src\pages\school\teacher\live\TeacherLiveDashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 50: `<div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">`
- Line 99: `<button onClick={() => navigate('/school/teacher/classes')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700">`
- Line 106: `<div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">`
- Line 134: `<div className="mb-6 flex items-start justify-between gap-4">`
- Line 138: `className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"`
- Line 184: `<div key={r.emoji} className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5">`
- Line 201: `<div className="flex items-center gap-2">`
- Line 222: `<div className="flex items-center gap-2">`
- Line 243: `<div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">`
- Line 267: `<span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-700">`
- Line 273: `<span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-black text-red-700">`
- Line 283: `<span className="truncate pr-2 flex items-center gap-1.5">`
- Line 311: `<div className="flex items-center gap-2">`
- Line 608: `className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"`
- Line 618: `<div className="flex items-center gap-3">`
- Line 619: `<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${live ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>`
- Line 622: `<span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">`
- Line 639: `<div key={m.id} className={`flex gap-2 rounded-lg p-2 ${i % 2 ? 'bg-white/5' : ''}`}>`
- Line 642: `<div className="flex items-baseline gap-2">`
- Line 654: `<div className="flex items-center gap-2 border-t border-white/10 p-2.5">`
- Line 674: `<div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">`
- Line 677: `className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${`
- Line 689: `className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${`
- Line 701: `className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${`
- Line 718: `<span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">`
- Line 732: `<span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">`
- Line 748: `<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">`
- Line 766: `<span className="truncate pr-2 flex items-center gap-1.5">`
- Line 769: `<span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">`
- Line 819: `<div key={idx} className="flex items-center gap-2">`
- Line 889: `<span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 px-1 py-0.2 text-[8px] font-black text-emerald-700 dark:text-emerald-400">`
- Line 895: `<span className="inline-flex items-center gap-0.5 rounded bg-red-100 dark:bg-red-950/40 px-1 py-0.2 text-[8px] font-black text-red-700 dark:text-red-400">`
- Line 905: `<span className="truncate pr-1.5 flex items-center gap-1">`
- Line 939: `<div className="flex justify-end gap-2">`
- Line 941: `<button onClick={endClass} disabled={ending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">`

### `src\pages\school\teacher\Meetings.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 262: `<div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">`

### `src\pages\school\teacher\Profile.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 215: `<span className="flex items-center gap-1.5"><Award size={14} className="text-blue-500" /> Qualifications</span>`
- Line 228: `<span className="flex items-center gap-1.5"><Globe size={14} className="text-blue-500" /> Nationality</span>`
- Line 244: `<span className="flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> Address Information</span>`
- Line 288: `<div className="flex items-center justify-between gap-4 w-full">`
- Line 326: `<div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">`
- Line 333: `<div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">`

### `src\pages\school\teacher\Reports.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 531: `<div className="flex items-center gap-4">`
- Line 532: `<div className="flex items-center gap-2">`
- Line 550: `<div className="flex items-center gap-1">`

### `src\pages\school\teacher\Settings.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 29: `<div className="flex items-center gap-3">`
- Line 56: `<div className="flex items-center gap-3">`
- Line 77: `className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"`
- Line 94: `<div className="flex items-center gap-3">`
- Line 102: `<button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">`
- Line 106: `<button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">`
- Line 114: `<div className="flex items-center gap-3">`
- Line 123: `<div className="flex items-center gap-3">`

### `src\pages\school\teacher\StudentsModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 110: `<DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">`
- Line 193: `<div className="flex items-center gap-3">`
- Line 210: `<div className="flex items-center gap-2">`
- Line 221: `<div className="flex items-center gap-2">`

### `src\pages\school\teacher\TopicManagement.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 530: `<div className="flex items-center gap-2">`
- Line 535: `<div className="flex items-center gap-2">`
- Line 598: `<div className="mt-6 flex justify-end gap-3">`
- Line 619: `<div className="mt-6 flex justify-end gap-3">`
- Line 631: `<div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">`
- Line 632: `<div className="flex items-center gap-2 text-white">`
- Line 681: `<div className="flex items-start justify-between gap-3">`
- Line 686: `<p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-surface-500">`
- Line 724: `className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors ${it.active ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:hover:bg-surface-800'`
- Line 814: `<div className="group flex items-center gap-2 bg-white px-3 py-2.5 transition-colors hover:bg-surface-50 dark:bg-surface-900/40 dark:hover:bg-surface-800">`
- Line 815: `<button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">`
- Line 821: `<div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">`
- Line 836: `className={`group/chmat flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${selectedScopeId === chapter.id ? 'bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-900/30' : 'hover:bg-white dark:hover:bg-surface-800'}`}`
- Line 847: `className={`group/topic flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${active ? 'bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-900/30' : 'hover:bg-white dark:hover:bg-surface-800'}`}`
- Line 853: `<div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/topic:opacity-100">`
- Line 862: `<button onClick={onAddTopic} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-surface-400 transition-colors hover:bg-white hover:text-brand-600 dark:hover:bg-surface-800">`
- Line 980: `<div className="flex items-center gap-2">`
- Line 989: `className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-sm font-bold text-surface-600 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"`
- Line 998: `className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"`
- Line 1023: `className={`flex items-center gap-2 rounded-xl border border-surface-100 p-3 text-left transition-all hover:shadow-sm dark:border-surface-700 ${mt.soft}`}>`
- Line 1031: `<div className="mt-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-surface-300">`
- Line 1035: `className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300">`
- Line 1049: `<div className="mb-2 flex items-center gap-2">`
- Line 1064: `<div className="group flex items-center gap-3 p-3">`
- Line 1068: `<div className="flex items-center gap-2">`
- Line 1070: `<span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-500">`
- Line 1079: `className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">`
- Line 1085: `className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30">`
- Line 1090: `className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">`
- Line 1096: `className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">`
- Line 1245: `<div className="absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-semibold text-surface-400">`
- Line 1285: `<div className="mt-4 flex flex-1 gap-5 overflow-hidden">`
- Line 1288: `<li key={i} className="flex gap-2.5 text-sm font-medium leading-snug text-surface-700 dark:text-surface-200">`
- Line 1301: `<div className="flex items-center justify-between gap-2">`
- Line 1303: `className="inline-flex items-center gap-1 rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-bold text-surface-600 transition-colors disabled:opacity-40 dark:border-surface-700 dark:text-surface-300">`
- Line 1314: `className="inline-flex items-center gap-1 rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-bold text-surface-600 transition-colors disabled:opacity-40 dark:border-surface-700 dark:text-surface-300">`
- Line 1471: `<div className="flex items-center justify-between gap-3 border-b border-surface-100 px-6 py-4 dark:border-surface-700">`
- Line 1476: `<div className="flex items-center gap-2">`
- Line 1487: `className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 px-3 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-200">`
- Line 1492: `className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 px-3 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-200">`
- Line 1539: `className="fixed z-[250] flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl border border-surface-200 dark:bg-surface-800 dark:border-surface-700 animate-in fade-in zoom-in-95"`
- Line 1545: `<div className="flex items-center gap-1.5 px-1">`
- Line 1563: `className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-700 flex items-center gap-1.5"`
- Line 1753: `<div className="flex min-w-0 items-center gap-3">`
- Line 1758: `<div className="flex items-center gap-2">`
- Line 1788: `{saving ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Publishing…</span> : 'Confirm & publish to students'}`
- Line 1799: `<div className="flex items-center gap-2">`
- Line 1853: `<div className="flex items-center justify-center gap-2 rounded-2xl border border-surface-100 bg-surface-50 py-10 text-sm font-semibold text-surface-500 dark:border-surface-700 dark:bg-surface-800">`
- Line 1875: `<div className="flex gap-2 border-t border-surface-100 p-4 dark:border-surface-700">`
- Line 1877: `{generating ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Generating…</span> : (content ? 'Regenerate' : 'Generate')}`
- Line 1881: `{saving ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving…</span> : 'Save for students'}`
- Line 1959: `<div className="flex items-center gap-2">`
- Line 1977: `className={`flex items-center gap-3 rounded-2xl border border-surface-100 p-4 text-left transition-all hover:shadow-sm dark:border-surface-700 ${mt.soft}`}>`
- Line 1988: `<div className="flex gap-2">`
- Line 1989: `<button onClick={() => setSource('file')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'file' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>`
- Line 1992: `<button onClick={() => setSource('link')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'link' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>`
- Line 2000: `<div className={`flex items-center gap-3 rounded-2xl border-2 border-surface-200 p-3 dark:border-surface-700 ${cfg.soft}`}>`
- Line 2025: `{busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {source === 'file' ? 'Uploading…' : 'Saving…'}</span> : (source === 'file' ? 'Upload & Save' : 'Save Link')}`
- Line 2157: `<div className="flex items-start justify-between gap-3">`
- Line 2200: `<div className="flex justify-end gap-3 pt-1">`
- Line 2203: `{busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Importing…</span>`

### `src\pages\student\BattleArena.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 841: `<div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white border border-slate-100 shadow-lg">`
- Line 891: `<div className="flex items-center gap-5 relative z-10">`
- Line 920: `"px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl",`
- Line 939: `<div className="flex gap-1.5">`
- Line 959: `<button onClick={() => onEnd()} className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-red-50 transition-all">`
- Line 1074: `<div className="mb-12 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">`
- Line 1130: `<div className="flex items-center gap-6">`
- Line 1203: `className="w-full h-16 rounded-[2.5rem] bg-slate-900 border-none text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"`
- Line 1218: `<div className="flex items-center gap-4 mb-6">`
- Line 1238: `<div className="flex gap-1 mt-1.5">`
- Line 1304: `className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"`
- Line 1406: `<div className="flex items-center gap-6">`
- Line 1555: `<div className="mb-4 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">`
- Line 1565: `className="w-full h-16 rounded-[2.5rem] bg-slate-900 text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"`
- Line 1594: `<div className="flex items-center gap-6">`
- Line 1631: `<div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">`
- Line 1659: `<div className="flex items-center gap-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">`
- Line 1671: `<div className="flex items-start gap-4 px-6 py-5 rounded-2xl bg-slate-50 border border-slate-100">`
- Line 1787: `<div className="flex items-center justify-center gap-3 px-4 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">`
- Line 1803: `className="w-full flex items-center justify-between gap-6 px-8 py-5 rounded-2xl bg-white text-white shadow-2xl hover:bg-blue-600 transition-all border border-gray-200"`
- Line 1846: `<div className="flex items-center gap-3 mb-8">`
- Line 1862: `<div className="flex items-center gap-3">`
- Line 1873: `<div key={entry.studentId} className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100/50 hover:bg-slate-50 transition-all group">`
- Line 1893: `<div className="flex items-center gap-3">`
- Line 1914: `<div className="flex items-center gap-4">`
- Line 2010: `<div className="flex items-center gap-3">`
- Line 2012: `<span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">`
- Line 2017: `<span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">`
- Line 2109: `<div className="flex items-center gap-6">`
- Line 2248: `className="w-full h-16 rounded-[2rem] bg-slate-900 border-none text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"`
- Line 2393: `<div className="flex items-center gap-4">`
- Line 2537: `<div className="flex justify-center gap-4 pt-4">`
- Line 2615: `"flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",`
- Line 2625: `"flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",`
- Line 2635: `"flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",`
- Line 2880: `<div className="mt-2 flex items-center gap-4 text-xs">`
- Line 2899: `<div className="flex items-center gap-2">`
- Line 2937: `<div className="flex items-center gap-4">`
- Line 2951: `<div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">`
- Line 2956: `<div className="flex items-center gap-3">`
- Line 2980: `<div className="mb-2 flex items-center gap-2">`
- Line 2991: `<div className="mb-2 flex items-center gap-2">`
- Line 3003: `<span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 sm:self-auto">`
- Line 3064: `<div className="flex min-w-0 items-center gap-3">`
- Line 3074: `<div className="mt-1 flex items-center gap-2">`
- Line 3077: `<span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${status.cls}`}>`
- Line 3549: `<div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600">`
- Line 3568: `<div className="flex items-center justify-center gap-3">`
- Line 3649: `<button onClick={reset} className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg">`

### `src\pages\student\DiagnosticTestPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 66: `<div className="flex items-center justify-center gap-3 mb-4">`
- Line 95: `<div className="flex items-center gap-6">`
- Line 201: `"w-full flex items-center gap-6 px-8 py-6 rounded-[2rem] border-2 text-left transition-all",`
- Line 248: `<div className="flex items-center gap-10">`
- Line 268: `<div className="flex items-center gap-4">`
- Line 279: `<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Cognitive Drift Analysis</h3>`
- Line 327: `className="w-full py-8 rounded-[3rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6"`
- Line 456: `<div className="flex items-center gap-6">`
- Line 466: `<div className="flex items-center gap-10">`
- Line 468: `"flex items-center gap-4 px-6 py-2.5 rounded-xl border transition-all shadow-xl",`
- Line 507: `<CardGlass className="p-5 border-white bg-white/60 flex items-center justify-between gap-10 shadow-2xl">`
- Line 516: `<div className="flex-1 flex justify-center items-center gap-3 overflow-x-auto scrollbar-none px-4">`

### `src\pages\student\StudentAiStudyPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 269: `<div className="flex items-start justify-between gap-3">`
- Line 311: `className="w-full flex items-center gap-4 p-5 text-left transition-colors"`
- Line 333: `<p className="text-[11px] font-semibold text-blue-700 mb-2 flex items-center gap-2">`
- Line 372: `<p className="text-[11px] font-semibold text-emerald-700 mb-2 flex items-center gap-2">`
- Line 381: `<p className="text-[11px] font-semibold text-amber-600 mb-2 flex items-center gap-2">`
- Line 392: `className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"`
- Line 736: `<div className="flex items-start gap-4 sm:gap-5">`
- Line 746: `<span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">`
- Line 751: `<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">`
- Line 777: `<div className="flex gap-2 overflow-x-auto pb-1">`
- Line 783: `"inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",`
- Line 825: `<div className="flex items-center justify-between gap-3">`
- Line 839: `"inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors",`
- Line 854: `"inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors",`
- Line 871: `className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"`
- Line 891: `<div className="flex items-center justify-between gap-2">`
- Line 898: `<div className="mt-3 flex items-center gap-2">`
- Line 949: `<div className="flex items-center justify-between gap-2">`
- Line 1014: `<div className="flex items-start justify-between gap-4">`
- Line 1043: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"`
- Line 1057: `<div className="flex gap-3">`
- Line 1070: `<span className="inline-flex items-center gap-2">`
- Line 1075: `<span className="inline-flex items-center gap-2">`
- Line 1087: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"`
- Line 1094: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"`
- Line 1109: `<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">`
- Line 1152: `className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"`
- Line 1231: `className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"`
- Line 1265: `<div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">`
- Line 1297: `"flex gap-3 sm:gap-4",`
- Line 1303: `"flex max-w-[92%] gap-3 sm:max-w-[80%]",`
- Line 1338: `<div className="flex justify-start gap-3">`
- Line 1342: `<div className="flex items-center gap-2 rounded-[1.75rem] rounded-tl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">`
- Line 1361: `<div className="flex gap-2 mb-3">`
- Line 1478: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"`
- Line 1489: `<div className="flex gap-3">`
- Line 1509: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"`
- Line 1516: `className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"`
- Line 1556: `<div className="flex items-center gap-3">`
- Line 1574: `<div className="mb-4 flex items-center justify-between gap-3">`
- Line 1594: `<div className="mt-6 flex items-center justify-between gap-3">`
- Line 1613: `className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"`
- Line 1639: `<div className="flex gap-2">`
- Line 1679: `<CardGlass className="flex items-center gap-6 border-amber-300 bg-amber-500 px-8 py-5 text-white shadow-[0_32px_80px_-18px_rgba(245,158,11,0.55)]">`

### `src\pages\student\StudentCourseDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 138: `"flex items-center gap-4 p-4 rounded-2xl border bg-white hover:shadow-md transition-all group cursor-pointer",`
- Line 148: `<div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">`
- Line 262: `<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">`
- Line 278: `"px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all flex items-center gap-2",`
- Line 383: `"flex items-center gap-4 px-5 py-4 cursor-pointer transition-all group",`
- Line 409: `<span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">`
- Line 414: `<span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">`
- Line 431: `"flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-transform hover:scale-[1.02]",`
- Line 491: `className="flex-1 min-w-0 flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"`
- Line 520: `<div className="hidden sm:flex items-center gap-2 shrink-0 pr-2">`
- Line 591: `className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"`
- Line 604: `<div className="flex items-center gap-3 mt-0.5">`
- Line 612: `<div className="hidden sm:flex items-center gap-2 shrink-0">`
- Line 779: `className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors group"`
- Line 817: `<p className="text-indigo-200 text-sm font-medium mb-6 flex items-center gap-2">`
- Line 824: `<span className="flex items-center gap-1.5">`
- Line 828: `<span className="flex items-center gap-1.5">`
- Line 842: `className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/90"`
- Line 868: `<div key={i} className="flex items-center gap-2 text-slate-600">{item.icon}{item.text}</div>`
- Line 874: `className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:from-amber-600 hover:to-orange-600 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"`
- Line 893: `<div key={i} className="flex items-center gap-2 text-slate-600">{item.icon}{item.text}</div>`
- Line 899: `className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"`
- Line 923: `<div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">`
- Line 948: `<div className="flex items-start gap-3">`
- Line 957: `<div className="flex items-start gap-3">`
- Line 967: `<div className="flex items-start gap-3">`
- Line 974: `<div className="flex items-start gap-3">`
- Line 992: `<div key={s.id} className="flex items-center gap-3">`
- Line 1031: `className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"`
- Line 1042: `<div className="flex items-center gap-3 mt-0.5">`
- Line 1104: `className="w-full flex items-center gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"`
- Line 1128: `<span key={type} className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border opacity-70", meta.bg, meta.color)}>`
- Line 1136: `<span key={type} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-400">`
- Line 1165: `className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-slate-100 bg-white"`
- Line 1174: `<span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">`
- Line 1179: `<span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">`
- Line 1189: `<span key={type} className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border opacity-70", meta.bg, meta.color)}>`
- Line 1197: `<span key={type} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-400">`
- Line 1256: `<span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">`
- Line 1262: `"absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold rounded-lg",`
- Line 1269: `: <span className="flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube</span>}`
- Line 1578: `<div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">`
- Line 1624: `"px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",`
- Line 1644: `<div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">`
- Line 1707: `<div className="flex items-start gap-4 p-5">`
- Line 1718: `<div className="flex items-start justify-between gap-2">`
- Line 1720: `<div className="flex items-center gap-1.5 shrink-0">`
- Line 1742: `<span className="flex items-center gap-1 text-[11px] text-slate-500">`
- Line 1745: `<span className="flex items-center gap-1 text-[11px] text-slate-500">`
- Line 1749: `<span className="flex items-center gap-1 text-[11px] text-slate-500">`
- Line 1795: `"flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm",`
- Line 1980: `<div className="flex items-center justify-between gap-4">`
- Line 1981: `<div className="flex items-center gap-3 min-w-0">`
- Line 1989: `<p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">`
- Line 1995: `<div className="flex items-center gap-2 shrink-0">`
- Line 1999: `className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm"`
- Line 2010: `className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md"`
- Line 2019: `<div className="flex gap-6 items-start">`
- Line 2033: `"w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",`
- Line 2065: `<div className="flex items-center gap-2 mb-1.5">`
- Line 2069: `<div className="flex items-center gap-2">`
- Line 2117: `<span className={cn("flex items-center gap-1.5", r.color)}>{r.icon}{r.label}</span>`
- Line 2131: `<div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 flex items-center justify-between gap-4 text-white shadow-lg">`
- Line 2141: `className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-md text-sm whitespace-nowrap"`
- Line 2150: `<div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">`
- Line 2163: `"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",`
- Line 2185: `<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">`
- Line 2220: `<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pl-1">`
- Line 2262: `<p className="text-sm font-bold text-amber-900 flex items-center gap-2">`
- Line 2274: `className="inline-flex items-center gap-2 text-sm font-semibold text-amber-950 hover:underline"`

### `src\pages\student\StudentCoursesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 68: `<p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">`
- Line 73: `<p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-2">`
- Line 95: `className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5">`
- Line 99: `className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-1">`
- Line 103: `className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1">`
- Line 107: `className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-violet-600 rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-1">`
- Line 111: `className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-1">`
- Line 246: `className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">`
- Line 266: `<div className="flex items-center gap-1 border-b border-slate-200">`
- Line 270: `"px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",`

### `src\pages\student\StudentCourseTopicPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 86: `className="group relative flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg cursor-pointer transition-all duration-200"`
- Line 145: `<span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">`
- Line 150: `<span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">`
- Line 155: `<span className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">`
- Line 214: `className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"`
- Line 280: `className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg">`
- Line 318: `<div className="flex items-center gap-4 pt-2">`
- Line 320: `className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm hover:shadow"`
- Line 349: `<div className="flex items-center gap-2 mb-3">`
- Line 381: `<div className="flex gap-3 shrink-0">`
- Line 407: `className="relative z-10 mt-6 flex items-center gap-3 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-900/40 group w-fit"`
- Line 422: `<h2 className="text-base font-black text-slate-800 flex items-center gap-2">`
- Line 466: `"flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all",`
- Line 503: `<div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span></div>`
- Line 509: `<div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">`

### `src\pages\student\StudentDashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 66: `<div className="relative z-10 flex items-center justify-between gap-4">`
- Line 67: `<div className="flex items-center gap-3 min-w-0">`
- Line 72: `<p className="text-xs font-black text-red-100 uppercase tracking-widest flex items-center gap-1.5">`
- Line 82: `<div className="flex items-center gap-2 flex-shrink-0">`
- Line 85: `className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-red-700 shadow hover:bg-red-50 transition-colors"`
- Line 118: `<button onClick={action} className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">`
- Line 220: `<div className="relative z-10 flex items-center justify-between gap-6">`
- Line 255: `<div className="flex items-center gap-3 pt-2">`
- Line 281: `hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2"`
- Line 290: `<div className="hidden lg:flex items-center gap-6">`
- Line 312: `className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl`

### `src\pages\student\StudentDoubtsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 121: `className="w-full flex items-start gap-4 p-5 text-left"`
- Line 131: `<span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", s.bg)} style={{ color: s.color }}>`
- Line 183: `<div className="flex items-center gap-2 mb-2">`
- Line 202: `<div className="flex items-center gap-2">`
- Line 215: `<div className="flex gap-0.5 bg-blue-100/70 p-0.5 rounded-lg shrink-0">`
- Line 253: `<div className="flex items-center gap-1.5 mb-2">`
- Line 347: `<div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">`
- Line 353: `<div className="flex gap-1.5 mr-2 bg-indigo-100/50 p-1 rounded-xl shrink-0">`
- Line 383: `className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"`
- Line 400: `<div className="flex gap-2">`
- Line 407: `className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"`
- Line 417: `className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"`
- Line 426: `<div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">`
- Line 435: `className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"`
- Line 450: `className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 transition-colors text-left"`
- Line 469: `<div className="flex gap-2">`
- Line 489: `className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"`
- Line 627: `<div className="flex items-center gap-3">`
- Line 709: `className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"`
- Line 716: `<div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">`
- Line 725: `<div className="flex gap-2">`
- Line 759: `<div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">`
- Line 778: `className="h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"`
- Line 789: `className="h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"`
- Line 839: `<h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">`
- Line 847: `className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"`
- Line 870: `<div className="flex items-center gap-2">`
- Line 871: `<div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none flex-1">`
- Line 887: `<div className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600">`
- Line 917: `className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors"`

### `src\pages\student\StudentLeaderboardPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 46: `<div className={cn("flex items-center gap-3 rounded-xl border p-3", colors[color])}>`
- Line 122: `<div className="flex items-end gap-2 px-4 pb-0">`
- Line 161: `<div className="flex items-center gap-1.5 min-w-0">`
- Line 167: `<p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">`
- Line 206: `<div className="flex items-center gap-2 mb-2">`
- Line 238: `<div className="flex items-center gap-1.5">`
- Line 257: `<div className="flex items-center gap-1.5 mb-1">`
- Line 266: `<div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-3">`
- Line 332: `<div className="flex items-center gap-2 mb-0.5">`
- Line 348: `<div className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5">`
- Line 354: `<div className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5", zoneCls(stats?.zone))}>`
- Line 371: `<div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm w-fit">`
- Line 385: `<div className="ml-1 flex gap-1 border-l border-slate-100 pl-2">`
- Line 425: `<div className="flex h-40 items-center justify-center gap-3">`

### `src\pages\student\StudentLearnPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 180: `<div className="absolute top-3 right-3 flex gap-1.5 items-center">`
- Line 182: `<span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">`
- Line 202: `<p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-2">`
- Line 222: `<p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-2">`
- Line 228: `<div className="flex items-center gap-1 text-xs text-slate-400 font-medium mb-4">`
- Line 236: `"w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",`

### `src\pages\student\StudentLecturePage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 187: `<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">`
- Line 191: `<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">`
- Line 195: `<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">`
- Line 199: `<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl">`
- Line 209: `<p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">`
- Line 246: `<p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">`
- Line 260: `<div className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg mb-3", cfg.bg, cfg.text)}>`
- Line 270: `"flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group",`
- Line 368: `"w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left text-sm font-semibold transition-all",`
- Line 395: `className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-40">`
- Line 400: `<div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 border",`
- Line 417: `className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">`
- Line 759: `className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm">`
- Line 798: `className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/20 text-white/80 text-sm font-semibold hover:bg-white/10 transition-all"`
- Line 805: `className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-900/50"`
- Line 829: `className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all border border-white/20">`
- Line 850: `<div className="flex items-center gap-3">`
- Line 861: `<div className="flex items-center gap-1.5">`
- Line 924: `<p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">`
- Line 942: `<p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">`
- Line 949: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",`
- Line 1100: `<div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl">`
- Line 1131: `<div className="flex items-start gap-3">`
- Line 1144: `<span className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-350">`
- Line 1167: `<div className="flex items-start gap-3">`
- Line 1201: `"flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold",`
- Line 1231: `<p className="font-bold text-slate-700 mb-1 flex items-center gap-1">`
- Line 1238: `<div className="flex items-center gap-2 text-xs font-semibold">`
- Line 1305: `<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">`
- Line 1309: `className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",`
- Line 1365: `className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/50 transition-all text-left group">`
- Line 1422: `"w-full flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm group text-left",`
- Line 1470: `<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">`
- Line 1474: `<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">`
- Line 1477: `<span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">`
- Line 1481: `<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">`
- Line 1723: `<div className="flex items-center gap-2 mb-3">`
- Line 1748: `"flex items-center gap-1 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0",`
- Line 1773: `<div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center gap-3">`
- Line 1786: `<div className="flex items-center gap-2">`
- Line 1789: `<span className="shrink-0 flex items-center gap-1 text-red-500 text-xs font-bold">`
- Line 1798: `<div className="hidden sm:flex items-center gap-2 shrink-0">`
- Line 1814: `"hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0",`
- Line 1888: `className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"`
- Line 1899: `<div className="flex items-center gap-3 sm:hidden px-1">`
- Line 1916: `<div className="flex items-center gap-3">`
- Line 1973: `<div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">`
- Line 1974: `<div className="flex items-center gap-3 min-w-0">`
- Line 2001: `"flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0",`
- Line 2042: `<div className="flex items-center gap-3">`
- Line 2062: `<div className="flex items-center gap-2.5">`
- Line 2079: `"flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-2.5 text-[11px] xl:text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0",`

### `src\pages\student\StudentLecturesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 135: `"flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all shadow-sm whitespace-nowrap",`
- Line 160: `"flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors text-left",`
- Line 227: `<div className="flex items-center gap-2.5 mb-4">`
- Line 241: `<div key={i} className="flex items-center gap-3">`
- Line 259: `<div className="flex items-center gap-2.5 mb-4">`
- Line 273: `<div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100">`
- Line 290: `<div className="flex items-center gap-2 mb-3">`
- Line 300: `className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors w-full justify-center"`
- Line 313: `<div className="flex items-center gap-2.5">`
- Line 324: `className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"`
- Line 440: `<div className="absolute top-3 left-3 flex gap-1.5">`
- Line 442: `<span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">`
- Line 447: `<span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">`
- Line 452: `<span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase">`
- Line 478: `"absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full",`
- Line 495: `<span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">`
- Line 503: `<div className="flex items-start gap-1.5 mb-3">`
- Line 513: `"flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all",`
- Line 555: `className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/30">`
- Line 559: `className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors">`
- Line 729: `<div className="flex items-center gap-2 mb-1.5">`
- Line 745: `className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"`
- Line 757: `className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors"`
- Line 830: `"flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all shadow-sm whitespace-nowrap",`
- Line 854: `"flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all shadow-sm whitespace-nowrap",`
- Line 905: `<div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">`

### `src\pages\student\StudentLiveClassesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 28: `<span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-black text-red-600 dark:text-red-400">`
- Line 34: `<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">`
- Line 40: `<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-500">`
- Line 46: `<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-bold text-green-600 dark:text-green-400">`
- Line 52: `<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-500">`
- Line 73: `<span className="flex items-center gap-1.5 text-xs text-muted-foreground">`
- Line 86: `className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"`
- Line 113: `<div className="flex items-start justify-between gap-2">`
- Line 122: `<span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">`
- Line 127: `<span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">`
- Line 137: `<span className="flex items-center gap-1.5">`
- Line 142: `<span className="flex items-center gap-1.5">`
- Line 148: `<span className="flex items-center gap-1.5">`
- Line 158: `className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2"`
- Line 173: `<p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">`
- Line 231: `<h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">`
- Line 253: `<h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500">`

### `src\pages\student\StudentLiveRoomPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 363: `<header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">`
- Line 371: `<span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-black text-white flex-shrink-0 animate-pulse">`
- Line 380: `<span className="inline-flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">`
- Line 387: `className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors flex-shrink-0"`
- Line 414: `<span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white pointer-events-none">`
- Line 461: `className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"`
- Line 479: `<div className="flex gap-1.5">`
- Line 492: `className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${`
- Line 516: `className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors relative ${`
- Line 540: `<div key={m.id} className={`flex gap-2 rounded-lg p-2 ${i % 2 ? 'bg-white/5' : ''}`}>`
- Line 545: `<div className="flex items-baseline gap-2">`
- Line 555: `<div className="p-2.5 border-t border-gray-800 flex-shrink-0 flex gap-2">`
- Line 582: `<div className="flex items-center gap-1.5 mb-2">`
- Line 661: `<span className="flex items-center gap-1 truncate pr-1.5">`
- Line 693: `<span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">`
- Line 732: `<span className="flex items-center gap-1.5 truncate pr-2">{opt} {labelSuffix}</span>`

### `src\pages\student\StudentMockTestPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 183: `<div className="ml-auto flex items-center gap-2">`
- Line 237: `className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 pr-1"`
- Line 292: `"flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all sm:gap-4 sm:py-3",`
- Line 331: `<div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">`
- Line 355: `<div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">`
- Line 371: `<span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">`
- Line 461: `className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"`
- Line 538: `className="w-full py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-sm flex items-center justify-center gap-2"`
- Line 564: `<div className="flex items-start gap-3">`
- Line 656: `"flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border",`
- Line 696: `<div className="flex gap-3">`
- Line 699: `className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center gap-2"`
- Line 705: `className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md"`
- Line 967: `<button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">`
- Line 999: `<p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">`
- Line 1013: `className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"`
- Line 1026: `<div className="flex items-center gap-2">`
- Line 1080: `<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">`
- Line 1100: `<div className="flex shrink-0 items-center gap-2 sm:gap-4">`
- Line 1112: `"flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",`
- Line 1172: `<div className="flex items-center justify-between gap-3">`
- Line 1180: `className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"`
- Line 1189: `"inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",`

### `src\pages\student\StudentNotificationsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 44: `"flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm",`
- Line 86: `className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"`

### `src\pages\student\StudentOnboardingPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 77: `<div className="flex items-center gap-2">`
- Line 225: `className="mt-6 w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"`
- Line 244: `"flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border",`
- Line 280: `<div className="flex gap-3">`
- Line 289: `className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"`
- Line 336: `className="flex items-center gap-2 text-sm text-slate-600"`
- Line 360: `<div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">`

### `src\pages\student\StudentProfilePage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 119: `<span className={cn("flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",`
- Line 146: `<div className="flex items-center gap-4">`
- Line 175: `<div key={i} className="flex items-center gap-2.5">`
- Line 270: `className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"`
- Line 333: `className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"`
- Line 386: `<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"`
- Line 390: `<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">`
- Line 394: `<span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">`
- Line 431: `<div className="flex gap-1.5">`
- Line 433: `className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">`
- Line 473: `<div className="flex items-center gap-2.5">`
- Line 503: `<div className="flex items-center gap-2.5 mb-5">`
- Line 546: `<div className="flex items-center gap-2">`
- Line 555: `<div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15">`
- Line 566: `className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center gap-2 border border-white/20">`
- Line 576: `<div className="flex items-center gap-2.5 mb-4">`
- Line 592: `className="flex items-center gap-3 p-3 rounded-xl border mb-2 last:mb-0"`
- Line 612: `<div className="flex items-center gap-2.5 mb-4">`
- Line 622: `<div className="flex items-end gap-1.5 h-14">`

### `src\pages\student\StudentProgressPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 54: `<div className="flex items-center gap-3 mb-6">`
- Line 104: `<p key={i} className="flex items-center gap-2" style={{ color: p.color }}>`
- Line 166: `<h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">`
- Line 172: `<div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">`
- Line 536: `<div className="relative z-10 flex gap-4 pt-4">`
- Line 558: `<DialogTitle className="text-2xl font-black flex items-center gap-3">`
- Line 628: `<DialogTitle className="text-2xl font-black flex items-center gap-3">`

### `src\pages\student\StudentPYQPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 68: `<div className="flex items-center justify-between gap-6">`
- Line 69: `<div className="flex items-center gap-4 flex-1">`
- Line 80: `<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 italic">`
- Line 139: `className={cn("flex items-center gap-6 rounded-2xl border-2 px-6 py-5 transition-all select-none cursor-pointer", cardStyle)}`
- Line 154: `<button onClick={handleSubmit} disabled={!canSubmit || submitMutation.isPending} className="w-full py-6 rounded-3xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-xl">`
- Line 159: `<div className={cn("flex items-center gap-6 p-8 rounded-3xl border-2", submitResult.isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>`
- Line 165: `{submitResult.xpAwarded > 0 && <div className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 text-white shadow-lg"><Zap className="w-4 h-4 fill-white" /><span className="text-sm font-black uppercase tracking-widest">+{submitResult.xpAwarded} XP</span></div>}`
- Line 170: `<div className="flex items-center gap-3 mb-6"><Brain className="w-5 h-5 text-blue-500" /><div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Synthesis</p><p className="text-base font-black text-slate-900 uppercase italic leading-none">Path Reconstruction</p></div></div>`
- Line 177: `<button onClick={() => onNext({ questionId: question.id, isCorrect: submitResult.isCorrect, xpAwarded: submitResult.xpAwarded })} className="w-full py-6 rounded-3xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl">`
- Line 216: `<button onClick={onRestart} className="flex items-center gap-4 px-12 py-6 rounded-3xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest shadow-xl"><RotateCcw className="w-5 h-5" /> New Session</button>`
- Line 217: `<button onClick={() => window.history.back()} className="flex items-center gap-4 px-12 py-6 rounded-3xl bg-white border border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest">Return to Nexus</button>`
- Line 269: `<div className="flex items-center gap-6">`
- Line 272: `<div className="flex items-center gap-3 mb-1"><Monitor className="w-4 h-4 text-blue-600" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Archive Lab</span></div>`
- Line 277: `<div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white shadow-xl border border-white">`
- Line 288: `<div className="flex items-center gap-6 mb-12">`
- Line 299: `<button className="mt-16 w-full py-8 rounded-3xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-blue-500/20" onClick={handleStart} disabled={startSession.isPending}>{startSession.isPending ? <><Loader2 className="w-6 h-6 animate-spin" /> DISPATCHING QUERY…</> : <><Play className="w-6 h-6" /> INITIALIZE SIMULATION</>}</button>`

### `src\pages\student\StudentStudyPlanPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 261: `className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left`
- Line 291: `className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left`
- Line 364: `className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left`
- Line 410: `className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all`
- Line 456: `<div className="flex items-start gap-2">`
- Line 472: `<span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">`
- Line 481: `<div className="flex gap-3 mt-6">`
- Line 491: `className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm">`
- Line 535: `className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3.5 border border-white/20"`
- Line 734: `<div className={`flex-1 flex items-center gap-3 py-2 px-3 ml-1 rounded-xl transition-all border border-transparent`
- Line 742: `<div className="flex items-center gap-2 min-w-0">`
- Line 749: `<div className="flex items-center gap-3 mt-1.5">`
- Line 750: `<div className="flex items-center gap-1.5" title="Lectures">`
- Line 758: `<div className="flex items-center gap-1.5" title="Practice">`
- Line 766: `<div className="flex items-center gap-1.5" title="AI Session">`
- Line 812: `className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all`
- Line 817: `<div className="flex items-center gap-2 shrink-0">`
- Line 861: `className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all shadow-sm`
- Line 872: `<div className="flex items-center gap-2">`
- Line 876: `<div className="flex items-center gap-2 mt-1">`
- Line 937: `className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-xl border border-indigo-200 transition-colors">`
- Line 992: `<div key={l.label} className="flex items-center gap-1.5">`
- Line 1036: `<div className={`flex gap-2.5 p-2.5 rounded-lg border transition-all`
- Line 1043: `<div className="flex items-center justify-between gap-2">`
- Line 1045: `<div className="flex items-center gap-1 shrink-0">`
- Line 1058: `<span className="text-[11px] text-gray-400 flex items-center gap-0.5">`
- Line 1064: `<div className="flex items-center gap-1 shrink-0">`
- Line 1099: `<div className="p-3 flex items-center gap-3">`
- Line 1105: `<div className="flex items-center gap-1.5 mt-0.5">`
- Line 1116: `className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"`
- Line 1134: `<div className="flex items-start gap-3">`
- Line 1194: `<div className="flex items-center gap-3">`
- Line 1205: `<div className="flex items-center gap-1.5 ml-1">`
- Line 1206: `{hlCount > 0 && <span className="text-[9px] font-medium bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> {hlCount}</span>}`
- Line 1207: `{cmCount > 0 && <span className="text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" /> {cmCount}</span>}`
- Line 1208: `{dbCount > 0 && <span className="text-[9px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" /> {dbCount}</span>}`
- Line 1214: `<div className="flex items-center gap-2 shrink-0">`
- Line 1314: `<div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">`
- Line 1318: `<div className="flex items-center gap-2">`
- Line 1337: `<div key={g.id} className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${done ? "bg-gray-50" : "hover:bg-amber-50/30"}`}>`
- Line 1423: `<div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">`
- Line 1443: `<div className="flex items-start gap-2">`
- Line 1448: `<span className="mt-0.5 text-[11px] font-semibold text-indigo-500 flex items-center gap-0.5">`
- Line 1599: `<div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-2">`
- Line 1624: `<div key={i} className={`flex gap-2 items-start text-xs px-2.5 py-2 rounded-lg border ${SEV_STYLE[ins.sev]} leading-snug`}>`
- Line 1661: `className={`w-full flex items-center gap-3 px-4 py-3 text-left ${ac.header}`}>`
- Line 1712: `<div className="p-3.5 flex items-start gap-3">`
- Line 1728: `<div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">`
- Line 1737: `<div className="flex gap-1">`
- Line 1739: `className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-semibold hover:bg-teal-700 flex items-center gap-1">`
- Line 1743: `className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors`
- Line 1754: `<div className="flex items-center gap-1.5">`
- Line 1766: `className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 flex items-center justify-center gap-1.5">`
- Line 2456: `<div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 text-indigo-600 text-sm font-bold mb-4">`
- Line 2472: `<div className="flex items-center gap-2 text-gray-500">`
- Line 2476: `<div className="flex items-center gap-2 text-gray-500">`
- Line 2484: `className="mt-auto w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-200"`
- Line 2554: `<div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20">`
- Line 2563: `<div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20">`
- Line 2573: `<div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20">`
- Line 2634: `<div className="flex overflow-x-auto px-4 sm:px-6 pt-1 gap-1 scrollbar-hide">`
- Line 2639: `className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${`
- Line 2666: `className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"`
- Line 2702: `className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mx-auto flex items-center gap-2">`
- Line 2719: `<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">`
- Line 2762: `<div className="flex items-center gap-1.5">`
- Line 2766: `<div className="flex items-center gap-1.5 text-xs text-gray-500">`
- Line 2801: `<div className="flex items-center gap-1.5">`
- Line 2805: `<div className="flex items-center gap-1.5 text-xs text-gray-500">`
- Line 2830: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 2844: `<div className="flex items-center gap-2 mb-2">`
- Line 2850: `className="w-full py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">`
- Line 2888: `className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"`
- Line 2900: `className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"`
- Line 2931: `<div className="mt-4 flex items-center gap-2">`
- Line 2937: `<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">`
- Line 2957: `<div className="flex items-center gap-2">`
- Line 2982: `<div key={lec.id} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all">`
- Line 3011: `<div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-amber-200 hover:shadow-sm transition-all">`
- Line 3015: `<div className="flex items-center gap-2 mt-1">`
- Line 3038: `<div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all">`
- Line 3042: `<div className="flex items-center gap-2 mt-1">`
- Line 3064: `<div key={t.topicId} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-violet-200 hover:shadow-sm transition-all">`
- Line 3068: `<div className="flex items-center gap-2 mt-1">`
- Line 3092: `<div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-teal-200 hover:shadow-sm transition-all">`
- Line 3095: `<div className="flex items-center gap-2 mb-0.5">`
- Line 3099: `<div className="flex items-center gap-2">`
- Line 3118: `<div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-rose-200 hover:shadow-sm transition-all">`
- Line 3123: `{t.durationMinutes > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{t.durationMinutes} min</span>}`
- Line 3138: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 3144: `<div className="font-semibold text-amber-700 text-sm mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Backlog Tip</div>`
- Line 3165: `className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"`
- Line 3177: `className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"`
- Line 3197: `<div className="mt-4 flex items-center gap-2">`
- Line 3226: `<div className="flex items-center gap-3">`
- Line 3242: `className="shrink-0 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors flex items-center gap-1">`
- Line 3262: `<div key={topic.topicId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all">`
- Line 3273: `className="shrink-0 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1">`
- Line 3291: `<div key={t.topicId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-violet-200 hover:shadow-sm transition-all">`
- Line 3304: `className="shrink-0 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1">`
- Line 3323: `<div className="flex items-center gap-3">`
- Line 3330: `<div className="flex items-center gap-3 mt-2 text-[11px]">`
- Line 3339: `className="shrink-0 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1">`
- Line 3350: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 3356: `<div className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Weakness Engine</div>`
- Line 3359: `<div key={label} className="flex justify-between gap-2"><span className="text-red-400 shrink-0">{label}</span><span className="font-medium text-right">{desc}</span></div>`
- Line 3382: `className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"`
- Line 3394: `className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"`
- Line 3408: `<div className="mt-4 flex items-center gap-2">`
- Line 3422: `<div className="mt-4 flex items-center gap-2">`
- Line 3428: `<span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 flex items-center gap-1">`
- Line 3441: `<div className="mt-4 flex items-center gap-2">`
- Line 3454: `<div className="mt-4 flex items-center gap-2">`
- Line 3468: `<div className="flex items-center gap-2 mb-2">`
- Line 3478: `<div key={di} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">`
- Line 3485: `<div className={`px-4 py-2.5 flex items-center gap-3 border-b border-gray-100 ${di === 0 ? "bg-indigo-50" : "bg-gray-50"}`}>`
- Line 3495: `<div key={topic.topicId} className="px-4 py-3 flex items-center gap-3">`
- Line 3501: `<div className="flex items-center gap-2 mt-0.5">`
- Line 3515: `className="shrink-0 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 flex items-center gap-1">`
- Line 3548: `<div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl border border-orange-100 text-sm font-bold">`
- Line 3618: `<div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">`
- Line 3632: `<div className="font-semibold text-teal-700 text-sm mb-3 flex items-center gap-1.5">`
- Line 3642: `<div key={interval} className="flex items-center gap-2">`
- Line 3690: `<h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">`
- Line 3708: `<div className="font-semibold text-indigo-700 text-sm mb-1 flex items-center gap-1.5">`
- Line 3716: `className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">`
- Line 3720: `className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">`

### `src\pages\student\StudentTestsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 113: `className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"`
- Line 162: `"px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",`
- Line 208: `<div className="flex items-center gap-2">`
- Line 236: `<p className="text-xs text-slate-500 font-medium line-clamp-1 flex items-center gap-1.5 mt-2">`
- Line 245: `<div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">`
- Line 249: `<div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">`
- Line 258: `"w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",`

### `src\pages\student\StudentTopicQuizPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 89: `<div className="ml-auto flex items-center gap-2">`
- Line 143: `"flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all sm:gap-4 sm:py-3",`
- Line 195: `<div className="flex items-center justify-center sm:justify-start gap-4">`
- Line 208: `<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center gap-2">`
- Line 260: `<div className="flex items-center gap-6">`
- Line 270: `<div className="flex items-center gap-2 sm:gap-4">`
- Line 281: `"flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",`
- Line 313: `<div className="flex items-center justify-between gap-3">`
- Line 317: `className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"`
- Line 325: `"inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",`
- Line 605: `<div className="flex gap-4 mb-10">`
- Line 678: `<div className="flex items-center gap-4"><Info className="w-5 h-5 text-slate-400" /><span className="text-sm font-black text-slate-900 uppercase italic">Review Answers</span></div>`
- Line 730: `<button onClick={() => navigate(-1)} className="w-full py-8 rounded-[3rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6">Return to Directory <ArrowRight className="w-6 h-6" /></button>`
- Line 745: `<div className="flex items-center justify-center gap-3"><Sparkles className="w-4 h-4 text-purple-500" /><p className="text-xs font-black text-purple-500 uppercase tracking-widest">AI Synthesis Result</p></div>`
- Line 751: `<div className="flex items-center gap-4"><Info className="w-5 h-5 text-slate-400" /><span className="text-sm font-black text-slate-900 uppercase italic">Review Logic Patterns</span></div>`
- Line 769: `<div className="flex gap-4 mb-4">`
- Line 807: `<CardGlass className="p-8 border-amber-400/20 bg-amber-50/60 flex items-center gap-6">`
- Line 811: `<button onClick={() => navigate(-1)} className="p-8 rounded-[2.5rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6">Return to Sector <ArrowRight className="w-6 h-6" /></button>`

### `src\pages\StudentRegisterPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 52: `flex items-center gap-2.5 rounded-lg border bg-white transition-colors duration-150`
- Line 88: `flex items-center gap-2.5 rounded-lg border bg-white transition-colors duration-150`
- Line 132: `<span className="relative z-10 flex items-center justify-center gap-2">`
- Line 145: `className="flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white px-5 py-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"`
- Line 188: `<div className="flex items-center gap-2">`
- Line 193: `<div className="flex items-center gap-2.5">`
- Line 225: `className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors ${selectedId === inst.id ? "bg-blue-50/50" : ""}`}`
- Line 502: `<div className="flex items-center gap-3">`
- Line 536: `<div className="mt-8 flex items-center gap-2 text-emerald-600 font-black text-xs bg-emerald-50 px-5 py-2.5 rounded-2xl">`
- Line 557: `className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border-2 border-red-100/50 px-5 py-4 text-red-600">`
- Line 568: `<div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 flex items-center gap-3 mb-2">`
- Line 618: `<div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors">`
- Line 637: `<div className="flex gap-1.5 mb-2">`
- Line 657: `<div className={`flex items-center gap-2 px-1 text-[12px] font-black uppercase tracking-tight ${form.password === form.confirmPassword ? "text-emerald-500" : "text-red-500"}`}>`
- Line 669: `<div className="flex items-center gap-3">`
- Line 719: `<div className="flex items-center gap-3">`
- Line 764: `<div className="mt-10 flex items-center gap-4">`
- Line 852: `<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-5 py-2 backdrop-blur-sm shadow-sm ring-4 ring-blue-500/5">`

### `src\pages\StudentRegisterPage2.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 180: `<div className="flex items-center justify-center gap-2 mb-8 mt-4">`
- Line 331: `<span className="text-emerald-600 flex items-center gap-1"><FiCheckCircle /> Passwords match</span>`
- Line 333: `<span className="text-rose-500 flex items-center gap-1">❌ Passwords do not match yet</span>`
- Line 376: `<div className="flex gap-4 pt-4">`
- Line 381: `className="w-1/3 inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold transition-all duration-200 hover:bg-slate-50"`
- Line 389: `className="group relative flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden"`

### `src\pages\super-admin\AnnouncementsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 106: `className={`h-10 md:h-12 px-6 md:px-8 rounded-2xl font-semibold flex gap-2 transition-all active:scale-95 text-sm shadow-lg ${`
- Line 119: `<div className="flex items-center gap-3 mb-7 text-slate-900">`
- Line 127: `<div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium">`
- Line 185: `<Button onClick={handlePublish} disabled={saving || !form.title || !form.body} className="h-16 px-10 bg-white text-gray-900 rounded-2xl font-semibold text-[16px] hover:bg-gray-100 shadow-lg transition-all flex gap-3">`
- Line 198: `<div className="flex items-center gap-3">`
- Line 217: `<div className="flex items-start gap-4">`
- Line 229: `<div className="flex items-center gap-8 pt-2">`
- Line 230: `<div className="flex items-center gap-2 text-slate-400">`
- Line 235: `<div className="flex items-center gap-2 text-slate-400">`
- Line 257: `<div className="mt-16 p-8 rounded-[36px] bg-slate-50 border border-slate-100 flex items-center gap-6">`

### `src\pages\super-admin\CourseDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 58: `<button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[11px] font-medium uppercase tracking-wider mb-5">`
- Line 62: `<div className="flex items-start gap-5">`
- Line 69: `<div className={`text-[10px] font-medium px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 uppercase tracking-wider ${statusColor}`}>`
- Line 90: `className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${`
- Line 127: `<h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">`
- Line 133: `<p className="text-sm font-semibold text-slate-800 flex items-center gap-2">`
- Line 140: `<p className="text-sm font-semibold text-slate-800 flex items-center gap-2">`
- Line 147: `<p className="text-sm font-semibold text-slate-800 flex items-center gap-2">`
- Line 154: `<p className="text-sm font-semibold text-slate-800 flex items-center gap-2">`
- Line 338: `<div key={lec.id} className="p-4 rounded-2xl border border-slate-100 flex items-start gap-4 group hover:border-indigo-200 transition-colors cursor-pointer">`
- Line 344: `<div className="flex items-center gap-3 text-xs text-slate-500">`
- Line 345: `<span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lec.scheduledAt || lec.createdAt ? new Date(lec.scheduledAt || lec.createdAt).toLocaleDateString() : "N/A"}</span>`

### `src\pages\super-admin\CreateSchoolPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 265: `className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"`
- Line 291: `<label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-brand-700 shadow-sm">`
- Line 342: `<p className={`-mt-2 flex items-center gap-1.5 text-xs font-semibold sm:col-span-2 ${form.adminPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>`
- Line 363: `<label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-700">`
- Line 381: `<div key={feature.key} className="flex items-center justify-between gap-4 py-2">`
- Line 399: `<div className="flex justify-end gap-3 border-t border-surface-200 bg-surface-50 p-5">`
- Line 403: `<button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-60">`

### `src\pages\super-admin\EnrollmentsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 41: `<div className="flex items-center gap-1.5">`
- Line 125: `<div className="flex gap-3 shrink-0">`
- Line 142: `<div key={s.label} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">`
- Line 173: `className={`h-11 px-4 flex items-center gap-2 rounded-2xl border text-sm font-medium transition-all ${showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"}`}`
- Line 184: `className="h-11 px-4 flex items-center gap-1.5 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors">`
- Line 281: `<div className="flex items-center gap-3">`
- Line 300: `<div className="flex items-center gap-2">`
- Line 313: `<div className="flex items-center gap-2">`
- Line 345: `<div className="flex items-center gap-2">`

### `src\pages\super-admin\FeatureFlagsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 56: `<div className="flex items-center gap-3 min-w-0 flex-1 mr-4">`
- Line 60: `<div className="flex items-baseline gap-2 min-w-0 flex-1">`
- Line 77: `<div className="flex items-center gap-2 min-w-0 flex-1 mr-3">`
- Line 107: `<div className="flex items-center gap-3 min-w-0 flex-1 mr-4">`
- Line 111: `<div className="flex items-baseline gap-2 min-w-0 flex-1">`
- Line 181: `<div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">`
- Line 192: `className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-[14px] font-semibold hover:bg-blue-100 transition-colors"`
- Line 224: `<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">`

### `src\pages\super-admin\InstituteDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 178: `<button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[11px] font-medium uppercase tracking-wider mb-5">`
- Line 182: `<div className="flex items-center gap-4">`
- Line 193: `<p className="text-slate-400 font-bold text-sm uppercase tracking-tight flex items-center gap-2">`
- Line 198: `<div className="flex items-center gap-3">`
- Line 240: `<div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 inline-flex gap-1">`
- Line 255: `<h3 className="text-base md:text-lg font-bold text-slate-900 mb-7 flex items-center gap-2">`
- Line 268: `<div className="flex items-center gap-4">`
- Line 280: `<h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">`
- Line 306: `<h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">`
- Line 312: `<div className="flex items-center gap-2">`
- Line 323: `<div className="flex items-center gap-2 mt-1">`
- Line 336: `<h3 className="text-sm font-bold text-rose-900 mb-2 flex items-center gap-2">`
- Line 357: `<h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">`
- Line 414: `<div className="flex items-center gap-4">`
- Line 441: `className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${checked ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"`
- Line 464: `<div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">`
- Line 480: `className="h-11 px-8 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20 flex gap-2"`
- Line 513: `<h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">`

### `src\pages\super-admin\InstitutesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 17: `<span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">`
- Line 22: `<span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">`
- Line 27: `<span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">`
- Line 96: `className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"`
- Line 103: `className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"`
- Line 110: `className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"`
- Line 118: `className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"`
- Line 256: `className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors"`
- Line 361: `<div className="flex items-center gap-3">`
- Line 377: `<div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">`
- Line 381: `<div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">`
- Line 390: `<div className="flex items-center gap-1.5">`
- Line 431: `<span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">`
- Line 441: `<div className="flex items-center justify-end gap-2">`
- Line 447: `className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"`
- Line 480: `<div className="flex items-center gap-1.5">`

### `src\pages\super-admin\NewInstitutePage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 273: `<button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-2 mb-4 transition-colors">`
- Line 280: `<div className="flex gap-2">`
- Line 293: `<div className="mb-8 flex items-start gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">`
- Line 307: `<div className="flex items-center gap-4">`
- Line 338: `<div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">`
- Line 421: `<div className="flex items-center gap-4">`
- Line 467: `<span key={role} className="text-xs text-slate-700 font-semibold flex items-center gap-1">`
- Line 522: `<span key={role} className="text-xs text-slate-700 font-semibold flex items-center gap-1">`
- Line 593: `<div className="flex items-start gap-4 mr-4">`
- Line 601: `<div className="flex items-center gap-2">`
- Line 657: `<div key={p.key} className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">`
- Line 694: `<div className="flex gap-4">`
- Line 701: `className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-semibold shadow-lg flex gap-3"`
- Line 714: `<div className="flex items-center gap-4">`
- Line 724: `<div className="flex gap-3">`
- Line 756: `<div className="flex justify-between gap-2">`
- Line 786: `<div className="flex gap-3">`
- Line 804: `<div className="flex items-center gap-3">`
- Line 835: `className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${checked ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"`
- Line 860: `<div className="flex gap-4">`
- Line 864: `<Button type="submit" disabled={emailOtpStep !== "verified" || createTenant.isPending || form.adminPhone.length < 10} className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-semibold shadow-lg flex gap-3">`

### `src\pages\super-admin\PaymentsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 84: `<div className="flex items-center gap-3">`
- Line 94: `<div className="flex items-center gap-3">`
- Line 110: `className="h-11 px-5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-60"`
- Line 220: `<div key={s.label} className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4">`
- Line 255: `className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"`
- Line 314: `<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${sm.cls}`}>`
- Line 334: `<div className="flex items-center gap-2">`

### `src\pages\super-admin\PlatformStatsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 57: `<div className="flex items-baseline gap-2 mt-1">`
- Line 61: `<span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">`
- Line 134: `<div key={p.name} className="flex items-center gap-3">`
- Line 170: `<div className="flex items-center gap-4">`

### `src\pages\super-admin\SchoolDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 343: `className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"`
- Line 350: `<div className="flex gap-4">`
- Line 367: `<button onClick={approve} className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100">`
- Line 372: `<button onClick={reject} className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100">`
- Line 376: `<button onClick={remove} className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100">`
- Line 411: `className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${`
- Line 445: `<div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">`

### `src\pages\super-admin\SchoolPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 94: `<Button onClick={() => navigate("/super-admin/school/new")} className="flex items-center gap-2 font-bold">`
- Line 151: `<div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>`
- Line 184: `<div className="flex gap-2">`

### `src\pages\super-admin\SettingsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 78: `className="h-10 md:h-12 px-6 md:px-8 bg-white text-gray-900 rounded-2xl font-semibold flex gap-2 shadow-lg hover:bg-gray-100 transition-all text-sm"`
- Line 92: `className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left border-2 ${`
- Line 138: `<h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">`
- Line 170: `<div className="flex items-center gap-6">`
- Line 193: `<div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">`
- Line 204: `<div className="flex items-center gap-3">`
- Line 225: `<h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">`
- Line 228: `<div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">`
- Line 242: `<h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">`
- Line 251: `<div className="flex items-center gap-2 text-sm text-slate-400">`
- Line 256: `<div className="flex items-center gap-3">`
- Line 272: `className="h-12 px-6 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-60"`
- Line 315: `className="fixed bottom-8 right-8 bg-white text-gray-900 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 z-50 border border-gray-200"`

### `src\pages\super-admin\SuperAdminDashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 90: `<p key={entry.name} className="flex items-center gap-2 font-semibold" style={{ color: entry.color }}>`
- Line 130: `<div className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-2 py-1">`
- Line 180: `<div className="flex items-center gap-3 mb-4">`
- Line 191: `<span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-500 shrink-0 mb-0.5">`
- Line 232: `<div className="flex items-start justify-between gap-3">`
- Line 237: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">`
- Line 271: `<div className="mb-5 flex items-start justify-between gap-4">`
- Line 479: `<div className="flex items-center gap-2 mb-3">`
- Line 480: `<span className="inline-flex items-center gap-1.5 text-xs font-semibold border border-white/20 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm" style={{ color: '#93C5FD' }}>`
- Line 484: `<h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-2">`
- Line 492: `<div className="relative z-10 flex flex-row items-center gap-4 sm:gap-6 shrink-0 self-start sm:self-auto">`
- Line 503: `className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg shadow-blue-950/20 hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto justify-center"`
- Line 512: `<div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold mt-4">`
- Line 591: `<div className="flex items-center gap-1.5">`
- Line 610: `<div className="flex items-start justify-between gap-3">`
- Line 622: `className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60"`
- Line 631: `<div className="flex items-start justify-between gap-3">`
- Line 643: `className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-600 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"`
- Line 652: `<div className="flex items-start justify-between gap-3">`
- Line 664: `className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"`

### `src\pages\super-admin\UsersPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 67: `<div className="flex gap-3">`
- Line 89: `<div className="flex items-center gap-3">`
- Line 139: `<div className="flex items-center gap-3 md:gap-4">`
- Line 150: `<span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[10px] font-medium uppercase tracking-[0.1em] shadow-sm ${config.color}`}>`
- Line 159: `<div className="flex items-center gap-2">`
- Line 170: `<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">`

### `src\pages\SuspendedPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 24: `className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"`

### `src\pages\teacher\TeacherAIToolsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 42: `<div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">`
- Line 134: `<div className="flex items-center gap-2">`
- Line 160: `<li key={i} className="text-sm text-foreground flex items-start gap-2">`
- Line 173: `<li key={i} className="text-sm text-foreground flex items-start gap-2">`
- Line 536: `<li key={i} className="text-sm text-foreground flex items-start gap-2">`
- Line 703: `<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">`
- Line 732: `<div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">`

### `src\pages\teacher\TeacherAnalyticsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 64: `<div className="flex items-center gap-2">`
- Line 133: `<CardContent className="p-5 flex items-center gap-4">`
- Line 342: `<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">`
- Line 348: `<div className="flex items-start gap-3">`
- Line 395: `<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">`
- Line 503: `<div key={t.topicId} className="flex items-center gap-3">`
- Line 521: `<div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">`
- Line 524: `<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">`

### `src\pages\teacher\TeacherBatchesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 76: `<div className="flex items-center gap-2">`
- Line 107: `<div key={s.studentId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">`
- Line 116: `<div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">`
- Line 125: `<span className="flex items-center gap-0.5">`
- Line 216: `<div className="flex items-center gap-3">`
- Line 230: `<div className="flex items-center gap-1">`
- Line 291: `<h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">`
- Line 297: `<div className="flex items-center gap-2">`
- Line 308: `<h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">`
- Line 314: `<div className="flex items-center gap-2">`
- Line 369: `<div className="flex items-center gap-4 text-left">`
- Line 378: `<div className="flex items-center gap-4">`
- Line 379: `<div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">`

### `src\pages\teacher\TeacherContentPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 103: `<div className="flex items-center gap-4">`
- Line 130: `<div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">`
- Line 157: `className="group flex items-center gap-3 p-4 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"`
- Line 164: `<div className="flex items-center gap-2 mt-1">`
- Line 166: `{ytId && <span className="text-[10px] text-red-500 font-black uppercase tracking-wider flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube</span>}`
- Line 167: `{r.description && !r.fileUrl && !r.externalUrl && <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Generated</span>}`
- Line 170: `<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">`
- Line 173: `className="h-8 px-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm">`
- Line 178: `className="h-8 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center gap-1.5 shadow-sm">`
- Line 198: `<div className="flex items-center gap-2 py-2">`
- Line 207: `<div className="flex gap-1.5">`
- Line 275: `<div className="flex items-center gap-3 mb-2">`
- Line 295: `"flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all",`
- Line 313: `<div className="flex gap-2">`
- Line 335: `<button onClick={handleSave} disabled={saveAiRes.isPending} className="w-full h-14 rounded-3xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">`
- Line 342: `<button onClick={handleGenerate} disabled={generating} className="w-full h-14 rounded-3xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3">`
- Line 396: `<div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">`
- Line 401: `<div className="flex items-end justify-between gap-6">`
- Line 427: `<button onClick={() => setShowAi(true)} className="h-12 px-6 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0">`
- Line 511: `<div className="flex items-center gap-3">`
- Line 531: `<div className="flex items-center gap-2">`
- Line 549: `<div className="flex items-center gap-2 mt-1">`
- Line 550: `<div className="flex items-center gap-1">`
- Line 557: `<div className="flex items-center gap-1 mr-2">`
- Line 640: `<div className="flex items-center gap-4">`
- Line 691: `<div className="flex items-center gap-2 text-slate-400">`

### `src\pages\teacher\TeacherDashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 56: `<p key={i} className="flex items-center gap-1.5 font-medium" style={{ color: p.fill || p.color }}>`
- Line 178: `<div className="flex items-center gap-3">`
- Line 213: `<div className="flex items-center gap-2">`
- Line 233: `<div className="flex gap-2">`
- Line 316: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 332: `<div className="flex gap-3 mt-4">`
- Line 352: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 370: `<div key={d.name} className="flex items-center gap-2">`
- Line 399: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 434: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 480: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 496: `<div className="flex items-start gap-2">`
- Line 519: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 526: `className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors cursor-pointer gap-4">`
- Line 551: `className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">`
- Line 566: `<div className="flex items-center gap-3">`
- Line 593: `className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-sm font-medium text-foreground">`
- Line 603: `<div className="flex items-center gap-2 mb-2">`

### `src\pages\teacher\TeacherDoubtsPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 113: `<span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full", m.bg, m.text)}>`
- Line 141: `<div className="flex items-start justify-between gap-2">`
- Line 146: `<span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">`
- Line 151: `<span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">`
- Line 156: `<span className={cn("text-xs flex items-center gap-1", urgencyColor(mins))}>`
- Line 164: `<div className="flex items-center gap-2 text-xs text-muted-foreground">`
- Line 264: `className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"`
- Line 276: `className="w-full flex items-center justify-center gap-2 py-2 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-50/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"`
- Line 293: `<div className="mt-3 flex items-center gap-2 text-xs text-blue-600 border border-blue-200 bg-blue-50 dark:bg-blue-50/20 rounded-lg px-3 py-2">`
- Line 316: `<label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">`
- Line 329: `<label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">`
- Line 350: `className="inline-flex shrink-0 items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"`
- Line 371: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"`
- Line 428: `<div className="flex items-start justify-between gap-3">`
- Line 433: `<span className={cn("text-xs flex items-center gap-1.5", urgencyColor(mins))}>`
- Line 439: `<div className="flex items-center gap-2 text-sm">`
- Line 453: `<div className="flex items-center gap-1.5">`
- Line 474: `<div className="flex items-center gap-3 mb-3">`
- Line 486: `<div className="flex gap-3">`
- Line 497: `className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"`
- Line 542: `<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">`
- Line 548: `<div className="flex gap-0.5 bg-blue-100/70 dark:bg-blue-900/30 p-0.5 rounded-lg shrink-0">`
- Line 624: `<div className="flex items-center gap-1.5 text-xs text-red-600 border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">`
- Line 650: `"w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",`
- Line 669: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"`
- Line 679: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"`
- Line 692: `<div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">`
- Line 713: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"`
- Line 724: `<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">`
- Line 731: `<div className="flex items-center gap-2 mb-1">`
- Line 742: `<div className="flex items-center gap-2">`
- Line 754: `<div className="flex items-center gap-2 text-xs text-blue-600 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-50/20 rounded-lg px-3 py-2">`
- Line 769: `"flex items-center gap-2 text-xs rounded-xl px-3 py-2 border",`
- Line 782: `<p className="text-xs text-muted-foreground flex items-center gap-1.5">`
- Line 859: `<div className="flex items-center justify-between gap-4">`
- Line 868: `<div className="flex items-center gap-3">`
- Line 870: `<div className="hidden sm:flex items-center gap-3">`
- Line 903: `className={cn("flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2",`
- Line 916: `className={cn("flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2",`
- Line 936: `<div className="flex items-center gap-2">`
- Line 983: `<div className="flex items-center justify-center py-16 text-muted-foreground gap-2">`
- Line 1015: `className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"`

### `src\pages\teacher\TeacherLecturesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 487: `<div className="flex items-center gap-2.5">`
- Line 517: `<div className="flex items-center gap-2.5">`
- Line 523: `<span className={cn("text-xs flex items-center gap-1.5",`
- Line 545: `<div className="flex items-center gap-1.5">`
- Line 550: `<div className="flex items-center gap-1.5">`
- Line 557: `<span className="text-[11px] text-muted-foreground flex items-center gap-1">`
- Line 913: `<div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">`
- Line 934: `<div className={cn("flex items-center gap-1.5", editorMode !== "brush" && "opacity-50 pointer-events-none")}>`
- Line 945: `<div className={cn("flex items-center gap-2", editorMode !== "brush" && "opacity-50 pointer-events-none")}>`
- Line 956: `<div className={cn("flex items-center gap-2", editorMode !== "brush" && "opacity-50 pointer-events-none")}>`
- Line 970: `<div className="flex items-center gap-2">`
- Line 1019: `<div className="absolute -top-6 left-0 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">`
- Line 1034: `<div className="flex justify-end gap-2 pt-2 border-t border-border shrink-0">`
- Line 1067: `h2: ({ children }) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2 flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block shrink-0"/>{children}</h2>,`
- Line 1212: `<div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">`
- Line 1222: `<div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">`
- Line 1230: `<div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">`
- Line 1241: `<div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">`
- Line 1248: `<div className="flex items-center gap-0.5">`
- Line 1719: `<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">`
- Line 1724: `<div className="flex items-center gap-2 ml-4 shrink-0">`
- Line 1740: `<div className="flex items-center gap-0 px-4 border-b border-border bg-secondary/20 shrink-0 overflow-x-auto">`
- Line 1750: `"flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",`
- Line 1763: `<span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">`
- Line 1915: `<div className="flex items-center gap-2 text-xs text-muted-foreground">`
- Line 1984: `<div className="flex items-center justify-between gap-3">`
- Line 1989: `<div className="flex items-center gap-2 shrink-0">`
- Line 2016: `<div className="flex items-center gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 text-xs text-violet-700 dark:text-violet-400">`
- Line 2021: `<div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-400">`
- Line 2027: `<div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">`
- Line 2065: `<div className="flex items-center gap-2 mb-1">`
- Line 2085: `<div key={opt.label} className={cn("flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors",`
- Line 2145: `<div className="flex items-center justify-end gap-2 pt-1">`
- Line 2159: `<div className="flex items-start justify-between gap-2">`
- Line 2161: `<div className="flex items-center gap-2 mb-1.5">`
- Line 2167: `<div className="flex items-center gap-0.5 shrink-0">`
- Line 2181: `className={cn("px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1.5",`
- Line 2210: `className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">`
- Line 2258: `<div className="flex items-center justify-between gap-2 mb-1.5">`
- Line 2290: `<div key={s.studentId} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-3">`
- Line 2296: `<div className="flex items-center gap-1.5 mt-0.5">`
- Line 2327: `<div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between gap-3">`
- Line 2331: `<div className="flex items-center gap-2">`
- Line 2356: `<div className="flex items-center gap-3">`
- Line 2428: `<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex gap-3 text-destructive">`
- Line 2438: `<div className="flex justify-end gap-2 pt-2">`
- Line 2483: `<div className="flex justify-end gap-2 pt-2 border-t border-border">`
- Line 2522: `<div className="flex justify-end gap-2 pt-2 border-t border-border shrink-0">`
- Line 2573: `<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">`
- Line 2579: `<div className="flex justify-end gap-2 pt-2 border-t border-border">`
- Line 2740: `<div className="flex gap-1.5">`
- Line 2779: `<div className="flex items-center justify-between gap-1.5">`
- Line 2802: `<div className="flex gap-2 text-[9px] text-muted-foreground font-semibold">`
- Line 2803: `<div className="flex-1 flex items-center gap-1">`
- Line 2819: `<div className="flex-1 flex items-center gap-1">`
- Line 2843: `<div className="flex justify-end gap-2 pt-2 border-t border-border shrink-0">`
- Line 2881: `<div className="flex items-center gap-3">`
- Line 2946: `<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">`
- Line 2953: `<div className="flex justify-end gap-2 p-4 border-t border-border shrink-0 bg-secondary/10">`
- Line 3015: `<div key={i} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">`
- Line 3162: `<div className="flex items-center justify-between gap-3">`
- Line 3176: `<div className="flex items-center gap-2 shrink-0">`
- Line 3233: `<span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>`
- Line 3246: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 3250: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">`
- Line 3255: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 font-poppins">`
- Line 3261: `<span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600 uppercase">`
- Line 3280: `className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${`
- Line 3333: `<div key={i} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">`
- Line 3353: `<span className="text-xs text-violet-600 font-bold flex items-center gap-1.5 animate-pulse">`
- Line 3367: `<div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-2xl p-4">`
- Line 3377: `<div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200/70 rounded-2xl p-4">`
- Line 3386: `<div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs border border-red-200/60 flex items-center justify-between gap-3">`
- Line 3390: `className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 shrink-0"`
- Line 3399: `<span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">`
- Line 3403: `<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">`
- Line 3407: `<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">`
- Line 3411: `<div className="ml-auto flex items-center gap-2">`
- Line 3416: `className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"`
- Line 3433: `className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"`
- Line 3441: `<div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700">`
- Line 3470: `<span className="text-xs text-blue-600 font-bold flex items-center gap-1.5 animate-pulse">`
- Line 3488: `<div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs border border-red-200/60 flex items-center justify-between gap-3">`
- Line 3492: `className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 shrink-0"`
- Line 3501: `<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">`
- Line 3507: `className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:underline flex items-center gap-1"`
- Line 3581: `className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:underline flex items-center gap-1 ml-3 shrink-0 pb-1"`
- Line 3606: `className="w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/35 transition-colors"`
- Line 3624: `<div className="flex items-center gap-2">`
- Line 3652: `<div key={s.studentId} className="flex items-center gap-3 border border-border/80 rounded-xl p-3 bg-background">`
- Line 3846: `<div className="flex items-center gap-1.5 mt-1">`
- Line 3927: `<div className="flex gap-2">`
- Line 3987: `<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">`
- Line 4009: `<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">`
- Line 4032: `<div className="flex gap-3 items-center">`
- Line 4081: `<span className="flex items-center gap-1.5">`
- Line 4101: `<p className="text-sm font-semibold text-foreground flex items-center gap-2">`
- Line 4130: `<div key={i} className="flex items-start gap-3">`
- Line 4256: `<div className="flex items-center gap-3">`
- Line 4339: `<div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-border bg-card">`
- Line 4392: `className="flex items-center gap-1.5 min-w-0 w-full"`
- Line 4425: `<div className={cn("flex items-center gap-1 min-w-0", compact && "max-w-full")}>`
- Line 4525: `<div className="flex items-start gap-4">`
- Line 4564: `<div className="flex items-start justify-between gap-3">`
- Line 4574: `className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"`
- Line 4588: `<span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-violet-500/10 text-violet-600 border-violet-500/20">`
- Line 4594: `<span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border", tsBadge.cls)}>`
- Line 4610: `<span className="text-[11px] text-blue-500 font-medium flex items-center gap-1">`
- Line 4629: `<span className="text-[11px] text-violet-600 font-medium flex items-center gap-1">`
- Line 4677: `<div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-1.5">`
- Line 4682: `<div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200/70 rounded-lg px-3 py-1.5">`
- Line 4729: `<div className="flex gap-2">`
- Line 4784: `<div className="flex items-start gap-3">`
- Line 4797: `className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-colors"`
- Line 4811: `<div className="flex gap-2">`
- Line 4815: `className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"`
- Line 4864: `<div className="flex items-start justify-between gap-2">`
- Line 4869: `<span className="text-xs text-muted-foreground flex items-center gap-1">`
- Line 4874: `{dur && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{dur}</span>}`
- Line 4878: `<span className="inline-flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-600 shrink-0">`
- Line 4882: `<span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-500 shrink-0">Ended</span>`
- Line 4884: `<span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 shrink-0">`
- Line 4891: `<div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2">`
- Line 4915: `<span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">OBS</span>`
- Line 4970: `<div className="flex items-start justify-between gap-2">`
- Line 4976: `<span className="text-xs text-muted-foreground flex items-center gap-1">`
- Line 4982: `<span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border shrink-0", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>`
- Line 4990: `className="flex items-center gap-2 text-xs text-primary font-medium hover:underline">`
- Line 4997: `<div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">`
- Line 5032: `<div className="flex gap-2">`
- Line 5046: `className="flex items-center gap-2 text-xs text-primary font-medium hover:underline">`
- Line 5052: `<div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/20 rounded-xl px-3 py-2">`
- Line 5649: `<div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">`
- Line 5665: `className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">`
- Line 5675: `<div className="flex items-center gap-2">`
- Line 5676: `<button onClick={() => setObsShowKey(s => !s)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">`
- Line 5680: `className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">`
- Line 5715: `<div className="flex items-center gap-2">`
- Line 5718: `className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"`
- Line 5724: `className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90"`
- Line 5734: `<div className="flex bg-slate-100 rounded-2xl p-1 gap-1">`
- Line 5741: `"flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",`
- Line 5775: `<span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 inline-flex items-center gap-1.5">`
- Line 5894: `<div className="flex items-center gap-2">`

### `src\pages\teacher\TeacherLiveDashboard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 87: `<header className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">`
- Line 431: `<header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">`
- Line 451: `<div className="flex items-center gap-2 text-gray-300 text-sm flex-shrink-0">`
- Line 540: `className={`flex-1 py-2 flex items-center justify-center gap-1 text-xs font-medium transition-colors relative ${`
- Line 572: `<div className="p-2 border-t border-gray-800 flex-shrink-0 flex gap-2">`
- Line 594: `<div key={s.userId} className="flex items-center gap-2 text-sm">`
- Line 612: `<div key={h.userId} className="flex items-center gap-2 p-2 bg-yellow-900/30 rounded-lg border border-yellow-800/50">`
- Line 681: `<div key={i} className="flex items-center gap-2">`
- Line 722: `<div className="flex gap-2">`
- Line 759: `<div className="flex justify-center gap-2 p-3 border-t border-gray-800 flex-shrink-0">`

### `src\pages\teacher\TeacherOnboardingPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 130: `className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"`
- Line 143: `<div className="flex gap-2">`
- Line 404: `"flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",`
- Line 500: `"flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",`
- Line 540: `<div className="flex gap-3">`
- Line 545: `"flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm flex-1 justify-center transition-colors",`
- Line 646: `<div className="flex items-center gap-3">`

### `src\pages\teacher\TeacherProfilePage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 48: `<div className="flex items-center gap-2.5">`
- Line 87: `<span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">`
- Line 95: `<div className="flex gap-2">`
- Line 162: `className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"`
- Line 170: `<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">`
- Line 183: `<div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium w-fit", overallColor)}>`
- Line 381: `<div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">`
- Line 456: `<div className="flex items-center gap-2">`
- Line 474: `<span className="flex items-center gap-1 text-xs text-muted-foreground">`
- Line 480: `<span className="flex items-center gap-1 text-xs text-muted-foreground">`
- Line 516: `"flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",`
- Line 612: `<div className="flex gap-2">`
- Line 676: `<div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">`

### `src\pages\teacher\TeacherQuizzesPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 161: `<div className="flex items-center gap-0 mb-6">`
- Line 169: `"flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",`
- Line 341: `<div className="sm:col-span-2 flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-400">`
- Line 347: `<div className="sm:col-span-2 flex items-center gap-2 bg-violet-500/8 border border-violet-500/20 rounded-lg px-3 py-2 text-xs text-violet-700 dark:text-violet-400">`
- Line 353: `<div className="sm:col-span-2 flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">`
- Line 392: `className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">`
- Line 442: `<div className="flex items-center gap-3">`
- Line 502: `<div key={i} className={cn("flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors cursor-pointer",`
- Line 528: `className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"`
- Line 588: `<div className="flex items-center justify-center py-8 text-muted-foreground gap-2">`
- Line 604: `<div className="flex items-start gap-3">`
- Line 611: `<div className="flex items-center gap-2 mt-1.5">`
- Line 629: `<div className="flex items-center gap-2">`
- Line 776: `<div className="flex items-center gap-2">`
- Line 783: `<div className="flex items-center gap-2">`
- Line 799: `className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"`
- Line 822: `className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 select-none"`
- Line 887: `<div className="flex gap-2 mt-1">`
- Line 912: `"flex items-center gap-3 border rounded-xl px-4 py-2.5 transition-colors",`
- Line 1023: `<div className="flex items-center gap-2 text-primary">`
- Line 1029: `<div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-50/20 border border-amber-200 rounded-lg px-3 py-2">`
- Line 1065: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"`
- Line 1191: `<div className="flex items-center gap-2">`
- Line 1203: `<div className="flex items-center gap-2 text-xs text-muted-foreground">`
- Line 1218: `<div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-50/20 border border-amber-200 rounded-lg px-3 py-2">`
- Line 1269: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">`
- Line 1422: `<div className="flex items-center gap-3 text-sm">`
- Line 1444: `<div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">`
- Line 1507: `<div key={q._localId} className="flex items-start gap-2 p-3">`
- Line 1536: `<button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">`
- Line 1540: `className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">`
- Line 1627: `<div className="flex gap-3">`
- Line 1668: `<button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">`
- Line 1674: `className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"`
- Line 1697: `<div className="flex items-start justify-between gap-3">`
- Line 1706: `<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">`
- Line 1707: `<span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{quiz.questionIds?.length ?? 0} Qs</span>`
- Line 1708: `<span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.durationMinutes} min</span>`
- Line 1709: `<span className="flex items-center gap-1"><Target className="w-3 h-3" />{quiz.totalMarks} marks</span>`
- Line 1712: `<p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">`
- Line 1718: `<div className="flex items-center gap-1 shrink-0">`
- Line 1790: `<div className="flex items-center gap-2">`
- Line 1794: `<button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors">`
- Line 1834: `<div className="flex items-center justify-center py-12 text-muted-foreground gap-2">`
- Line 1907: `<div className="flex items-center gap-2">`
- Line 1945: `<div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-50/20 border border-blue-200 rounded-lg px-3 py-2">`
- Line 1961: `className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"`
- Line 2199: `className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"`
- Line 2215: `<div className="flex gap-1 bg-muted p-1 rounded-lg">`
- Line 2233: `<div key={label} className="border border-border rounded-xl p-4 flex items-center gap-3 bg-card">`
- Line 2247: `<div className="flex items-center justify-center py-16 text-muted-foreground gap-2">`
- Line 2259: `className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">`

### `src\pages\teacher\TeacherStudentDetailPage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 67: `<div className="flex items-center gap-2">`
- Line 78: `<div className="flex items-center gap-3 mb-6">`
- Line 155: `<p key={i} className="flex items-center gap-2" style={{ color: p.color }}>`
- Line 174: `<div className="flex items-center gap-3">`
- Line 213: `<div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border border-border/50">`
- Line 217: `<div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border border-border/50">`
- Line 222: `<div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-full border border-primary/10 text-primary/90">`
- Line 233: `<span className="text-sm font-black text-foreground flex items-center gap-1.5">`
- Line 240: `<span className="text-sm font-black text-foreground flex items-center gap-1.5">`
- Line 247: `<span className="text-sm font-black text-foreground flex items-center gap-1.5">`
- Line 254: `<span className="text-sm font-black text-foreground flex items-center gap-1.5">`
- Line 261: `<span className="text-sm font-black text-foreground flex items-center gap-1.5">`
- Line 435: `<div key={i} className="flex items-center gap-4">`

### `src\pages\TenantHomePage.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 25: `className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-gray-200 px-4 py-3 shadow-lg"`
- Line 170: `className="mb-5 flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3">`
- Line 196: `<label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">`
- Line 199: `<div className="flex gap-2">`
- Line 221: `className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all disabled:opacity-60"`
- Line 262: `<div className="flex justify-between gap-2">`
- Line 294: `className="flex items-center gap-1 text-[12px] font-bold transition-colors disabled:opacity-50"`
- Line 308: `className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all disabled:opacity-60"`
- Line 328: `<div className="mt-12 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-6">`
- Line 353: `<div className="absolute top-8 right-8 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-gray-200 px-4 py-2.5">`
- Line 386: `<div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-5">`
- Line 398: `<div className="mt-10 flex items-center justify-center gap-6">`

### `src\components\ai\AiFeatureGate.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 59: `<div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-4 py-2">`

### `src\components\auth\SchoolGuard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 35: `<div className="flex gap-3">`

### `src\components\DppContentRenderer.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 151: `<div className="flex gap-3 p-4 pb-3 bg-slate-50/80 border-b border-slate-100">`
- Line 165: `"flex items-start gap-2 p-2.5 rounded-xl border",`
- Line 187: `<div key={i} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">`

### `src\components\home-page\Cta.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 125: `className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"`
- Line 136: `className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-slate-50 hover:border-[#0066cc]/40 hover:shadow-lg"`

### `src\components\home-page\DownloadApp.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 133: `className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-slate-950 text-white px-7 py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 transition-all duration-300 overflow-hidden min-w-[220px]"`
- Line 165: `className="group w-full sm:w-auto inline-flex items-center justify-center gap-4 border-2 border-slate-200 bg-white text-slate-700 px-7 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-[#0066cc]/50 hover:shadow-lg transition-all duration-300 min-w-[220px]"`
- Line 203: `<div className="flex items-center gap-3">`
- Line 228: `<div className="flex items-center gap-3">`
- Line 250: `<div className="flex items-center gap-2">`
- Line 266: `<div className="relative flex items-center justify-center gap-6 lg:gap-10">`

### `src\components\home-page\FeaturesSec.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 281: `<div className="flex items-center justify-center gap-4 mt-4">`
- Line 403: `<div className="flex items-start gap-6">`

### `src\components\home-page\Why.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 174: `<div className="pt-6 mt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wider uppercase relative z-10" />`

### `src\components\landing\about\AboutMarketing.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 204: `className="absolute bottom-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2 text-slate-600 text-xs font-semibold tracking-widest uppercase z-20"`
- Line 409: `className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"`
- Line 418: `className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:border-[#0066cc]/40 hover:text-slate-900 px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-md"`
- Line 425: `<div className="flex items-center gap-2 text-xs text-slate-400 font-medium">`

### `src\components\landing\about\components\ui\breadcrumb.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 31: `<li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />`

### `src\components\landing\about\components\ui\button.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 8: `"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",`

### `src\components\landing\about\components\ui\calendar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 43: `"absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",`
- Line 61: `"flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",`
- Line 73: `: "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",`

### `src\components\landing\about\components\ui\chart.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 261: `"flex items-center justify-center gap-4",`
- Line 276: `"flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",`

### `src\components\landing\about\components\ui\command.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 114: `"relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",`

### `src\components\landing\about\components\ui\dropdown-menu.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 30: `"flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",`
- Line 85: `"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",`

### `src\components\landing\about\components\ui\input-otp.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 14: `"flex items-center gap-2 has-[:disabled]:opacity-50",`

### `src\components\landing\about\components\ui\pagination.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 19: `<ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />`

### `src\components\landing\about\components\ui\sidebar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 504: `"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",`
- Line 650: `className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}`
- Line 706: `"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",`

### `src\components\landing\about\components\ui\toggle-group.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 22: `className={cn("flex items-center justify-center gap-1", className)}`

### `src\components\landing\about\components\ui\toggle.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 8: `"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",`

### `src\components\landing\CookieConsentBar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 42: `<div className="flex flex-shrink-0 items-center gap-2 sm:pl-4">`

### `src\components\landing\LandingFooter.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 82: `className="mt-6 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"`
- Line 89: `{/* <div className="mt-8 flex gap-4">`
- Line 132: `<p className="flex items-center gap-2">`

### `src\components\landing\LandingNavbar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 39: `<div className="hidden lg:flex items-center gap-8">`
- Line 54: `<Link to="/" className="flex items-center gap-3 p-1">`
- Line 65: `<div className="hidden lg:flex items-center gap-8">`
- Line 86: `<span className="relative z-10 flex items-center gap-2">`
- Line 135: `className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"`

### `src\components\landing\LandingPrimitives.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 14: `className={`flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white px-3.5 py-2.5 shadow-xl backdrop-blur-sm ${className}`}>`
- Line 53: `className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[16px] font-bold uppercase tracking-widest ${isPreset ? styles[color] : ""}`}`

### `src\components\LanguageSelector.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 18: `<div className={cn("flex items-center gap-1.5", className)}>`

### `src\components\layout\DashboardLayout.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 773: `<div className={cn("flex items-center px-2", sidebarOpen ? "gap-4" : "justify-center")}>`
- Line 897: `<div className="flex min-w-0 items-center gap-3 sm:gap-6">`
- Line 909: `<div data-tour="nav-header-controls" className="flex min-w-0 items-center gap-1.5 sm:gap-3">`
- Line 915: `className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"`
- Line 935: `"w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50",`
- Line 1008: `className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"`
- Line 1016: `className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"`
- Line 1091: `className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"`
- Line 1163: `className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"`

### `src\components\layout\UnifiedSidebar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 435: `<div className="flex items-center gap-1.5 mt-0.5">`

### `src\components\lecture\AskDoubtPanel.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 174: `<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">`
- Line 178: `<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full max-w-[180px]">`
- Line 191: `"flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all",`
- Line 239: `className="flex gap-2 mb-3 overflow-hidden"`
- Line 264: `"w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all",`
- Line 296: `<div className="flex items-center gap-2">`
- Line 305: `<div className="flex items-center gap-1">`
- Line 395: `<div className="flex items-center gap-2 pt-3 border-t border-violet-100">`
- Line 401: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",`
- Line 413: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",`

### `src\components\lecture\DownloadNotesButton.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 108: `className="text-xs px-2.5 py-1 rounded transition-colors flex items-center gap-1"`

### `src\components\lecture\FormulasTab.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 26: `<div className="flex items-center gap-2 mb-2">`

### `src\components\lecture\NextLectureCard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 21: `<div className="flex items-center gap-3 mb-3">`
- Line 32: `<div className="flex items-center gap-2 mt-0.5">`
- Line 34: `<span className="text-xs flex items-center gap-1" style={{ color: "#8B949E" }}>`
- Line 44: `<div className="flex items-center gap-3">`

### `src\components\lecture\RevisionModeBanner.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 8: `<div className="flex items-center gap-3 px-5 py-2.5"`

### `src\components\lecture\WatchProgressBar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 30: `<div className="mt-2 flex items-center gap-3">`
- Line 36: `<div className="flex items-center gap-3 flex-1">`

### `src\components\onboarding\NavTourCard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 87: `<div className="flex items-start gap-3 p-4 pb-3">`
- Line 110: `<div className="mx-4 mb-3 flex items-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-100">`
- Line 119: `<div className="flex items-center gap-1.5">`
- Line 132: `className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"`

### `src\components\onboarding\PageTourCard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 44: `<div className="flex items-center gap-2">`
- Line 78: `<div className="flex items-center gap-1 px-4 pb-3 pt-1">`
- Line 94: `className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"`

### `src\components\onboarding\WelcomeWalkthrough.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 157: `<li key={b} className="flex items-start gap-3 text-sm text-foreground">`
- Line 188: `<div className="flex items-center gap-2">`
- Line 229: `<div className="flex items-center gap-2">`
- Line 239: `<li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">`
- Line 314: `<div className="px-8 py-5 border-t border-border flex items-center justify-between gap-4">`
- Line 315: `<div className="flex items-center gap-1.5">`
- Line 329: `<div className="flex items-center gap-2">`
- Line 340: `className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"`

### `src\components\resources\FlashcardViewer.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 84: `<div className="flex items-center gap-4 mb-8">`
- Line 114: `<div className="mt-6 flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-widest animate-pulse shrink-0">`
- Line 130: `<div className="mt-6 flex items-center gap-2 text-white/60 font-bold text-[10px] uppercase tracking-widest shrink-0">`
- Line 137: `<div className="flex items-center gap-4 mt-10">`
- Line 149: `className="px-8 h-12 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-indigo-600"`

### `src\components\resources\PdfHighlightOverlay.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 209: `<div className="flex items-center gap-2 mb-2">`
- Line 246: `<button onClick={() => setEditMode("category")} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-xl transition-colors">`
- Line 249: `<button onClick={() => setEditMode("note")} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-xl transition-colors">`
- Line 253: `<button onClick={() => setEditMode("delete")} className="flex items-center gap-3 px-3 py-2 hover:bg-red-50 text-sm font-medium text-red-600 rounded-xl transition-colors">`
- Line 274: `"flex items-center gap-2 p-2 text-xs font-medium rounded-lg transition-colors hover:bg-slate-50",`
- Line 294: `<div className="flex justify-end gap-2 mt-1">`
- Line 320: `<div className="flex gap-2">`
- Line 369: `className="flex items-center gap-2 px-2.5 py-2 hover:bg-white rounded-xl transition-all hover:shadow-sm group text-left"`
- Line 397: `<div className="flex items-center gap-2 mb-3">`
- Line 408: `<div className="flex gap-2 justify-end">`
- Line 417: `className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition-colors flex items-center gap-1.5"`

### `src\components\resources\ResourceViewerModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 96: `<div className="flex items-center gap-2">`
- Line 133: `"flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all group",`
- Line 364: `<div className="flex items-center justify-center h-full w-full gap-3 text-indigo-600 font-bold p-10">`
- Line 505: `<div className={cn("flex items-center gap-4 px-6 py-4 border-b shrink-0", meta.bg, meta.border)}>`
- Line 511: `<div className="flex items-center gap-2 mt-0.5">`
- Line 523: `<div className="flex items-center gap-2">`
- Line 527: `className="px-3 h-10 rounded-xl flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm font-bold text-sm"`
- Line 599: `className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"`
- Line 632: `<div className="flex items-center gap-3">`
- Line 655: `<div className="flex items-center gap-3">`

### `src\components\school\admin\AddStudentMultiStep.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\AddTeacherMultiStep.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 572: `<label key={option.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>`
- Line 833: `<div className="md:col-span-2 flex gap-2">`
- Line 840: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 886: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 921: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 971: `<div className="relative z-10 flex items-center gap-8">`
- Line 984: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 985: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 986: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 1009: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1038: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1057: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1078: `<div className="flex items-center gap-2">`
- Line 1113: `<div className="flex gap-3">`
- Line 1116: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1125: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1135: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1144: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1211: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1276: `<div className="flex gap-3 pt-4">`
- Line 1280: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1302: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1408: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1467: `<div className="flex gap-3 pt-4">`
- Line 1471: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1709: `<div className="flex items-center justify-between gap-8">`
- Line 1710: `<div className="flex items-center gap-3">`
- Line 1754: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1769: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1794: `<div className="flex items-center gap-3">`
- Line 1806: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1812: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1819: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1829: `<div className="flex items-center gap-2">`
- Line 1884: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1980: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2082: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2108: `<div className="flex gap-3 pt-4">`
- Line 2112: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2245: `<div className="flex gap-3 pt-4">`
- Line 2249: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2358: `<div className="flex items-center gap-1">`
- Line 2380: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2394: `<div className="flex items-center gap-3">`
- Line 2408: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2438: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2458: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2465: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2588: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2767: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2771: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2849: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2886: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2900: `<div className="flex gap-3 pt-4">`
- Line 2904: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3028: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3124: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3141: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3155: `<div className="flex gap-3 pt-4">`
- Line 3159: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3256: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3368: `<div className="flex gap-3 pt-4">`
- Line 3372: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\AttendanceForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\ClassForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50"`

### `src\components\school\admin\forms\AddStudentMultiStep.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 158: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 181: `<div className={compact ? 'flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0' : 'space-y-3'}>`
- Line 191: `className={`${compact ? 'min-w-[220px] sm:min-w-0' : 'w-full'} flex items-center gap-3 rounded-[22px] p-3 text-left transition-all ${isActive ? 'bg-white shadow-sm ring-1 ring-blue-100 dark:bg-slate-800 dark:ring-slate-700' : 'hover:bg-white/70 dark:hover:bg-slate-800/70'}`}`
- Line 615: `<div className="flex gap-2">`
- Line 619: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 665: `<div className="mt-4 flex items-center gap-2 text-sm text-slate-500">`
- Line 727: `className={`flex min-w-[110px] items-center justify-center gap-2 px-4 py-2.5`
- Line 834: `<label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">`
- Line 843: `<label className={`flex items-center gap-2 text-xs ${!formData.parentEmail ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>`
- Line 897: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 942: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 949: `<h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">`
- Line 1040: `<div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">`
- Line 1041: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 sm:px-5 sm:py-3"><ChevronLeft size={16} /> Back</button>}`
- Line 1059: `className={`${currentStep === 1 ? 'col-span-2 sm:col-span-1' : ''} inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50 sm:px-6 sm:py-3`}`

### `src\components\school\admin\forms\AddTeacherMultiStep.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 149: `<div className="flex items-center gap-3 mb-1">`
- Line 167: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 dark:border-slate-800 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 194: `<div className={compact ? 'flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0' : 'space-y-3'}>`
- Line 205: `className={`${compact ? 'min-w-[230px] sm:min-w-0' : 'w-full'} flex items-center gap-3 rounded-[22px] p-3 text-left transition-all ${isActive ? 'bg-white shadow-sm ring-1 ring-blue-100 dark:bg-slate-800 dark:ring-slate-700' : 'hover:bg-white/70 dark:hover:bg-slate-800/70'}`}`
- Line 655: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"`
- Line 746: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"`
- Line 768: `className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1"`
- Line 838: `<div className="flex items-center gap-2">`
- Line 885: `<div className="md:col-span-2 flex gap-2">`
- Line 892: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 918: `className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110"`
- Line 1026: `<label key={day} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all">`
- Line 1066: `<div className="flex items-center gap-2 pl-1">`
- Line 1108: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 1209: `<div className="flex items-center gap-1.5"><Mail size={14} /> {formData.email || '—'}</div>`
- Line 1210: `<div className="flex items-center gap-1.5"><Smartphone size={14} /> {formData.phone || '—'}</div>`
- Line 1211: `<div className="flex items-center gap-1.5"><Shield size={14} /> {formData.employeeCode || '—'}</div>`
- Line 1265: `<div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 1330: `className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black tracking-widest text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 sm:px-5 sm:py-3"`
- Line 1340: `className={`${currentStep === 1 ? 'col-span-2 sm:col-span-1' : ''} inline-flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black tracking-widest text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 sm:px-6 sm:py-3`}`
- Line 1349: `className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-600/25 transition-all hover:brightness-110 disabled:opacity-50 sm:px-6 sm:py-3"`

### `src\components\school\admin\forms\AttendanceForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 57: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 122: `<div className="flex gap-3 pt-4">`
- Line 126: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\forms\ClassForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 52: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 131: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\forms\NoticeForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 87: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 195: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 229: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all duration-200"`
- Line 246: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\forms\SearchableMultiSelect.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 83: `className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-sky-400"`

### `src\components\school\admin\forms\SectionForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 47: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 102: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\forms\StudentForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 98: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 305: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\forms\SubjectForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 79: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 150: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\forms\TeacherForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 109: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 205: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 222: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 240: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\forms\TimetableForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 209: `<div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">`
- Line 415: `<div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">`
- Line 430: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\admin\Navbar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 306: `<div className="flex items-center justify-between gap-8">`
- Line 308: `<div className="flex items-center gap-3">`
- Line 317: `<div className="flex items-center gap-2.5">`
- Line 358: `className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"`
- Line 394: `"group relative flex items-start gap-3 px-5 py-4 border-b border-slate-50 dark:border-slate-850/40 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors",`
- Line 459: `className="flex items-center gap-2 outline-none group"`
- Line 487: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 500: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 513: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 532: `className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"`
- Line 552: `<div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">`
- Line 603: `className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-450 transition-colors"`
- Line 629: `className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-450 transition-colors"`
- Line 658: `className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-450 transition-colors"`

### `src\components\school\admin\NoticeForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\SectionForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\Sidebar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 192: `<div className="flex flex-row items-center gap-3 w-full px-4 pt-4 pb-1 text-left">`
- Line 233: `<div className="flex items-center gap-3 w-full justify-between">`
- Line 234: `<div className="flex items-center gap-2.5">`

### `src\components\school\admin\StudentForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\SubjectForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 774: `<div className="md:col-span-2 flex gap-2">`
- Line 781: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 798: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 870: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 905: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 955: `<div className="relative z-10 flex items-center gap-8">`
- Line 968: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 969: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 970: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 993: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1022: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1041: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1062: `<div className="flex items-center gap-2">`
- Line 1097: `<div className="flex gap-3">`
- Line 1100: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1109: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1119: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1128: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1195: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1260: `<div className="flex gap-3 pt-4">`
- Line 1264: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1286: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1392: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1451: `<div className="flex gap-3 pt-4">`
- Line 1455: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1693: `<div className="flex items-center justify-between gap-8">`
- Line 1694: `<div className="flex items-center gap-3">`
- Line 1738: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1753: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1778: `<div className="flex items-center gap-3">`
- Line 1790: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1796: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1803: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1813: `<div className="flex items-center gap-2">`
- Line 1868: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1964: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2066: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2092: `<div className="flex gap-3 pt-4">`
- Line 2096: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2179: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2229: `<div className="flex gap-3 pt-4">`
- Line 2233: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2342: `<div className="flex items-center gap-1">`
- Line 2364: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2378: `<div className="flex items-center gap-3">`
- Line 2392: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2422: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2442: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2449: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2572: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2751: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2755: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2833: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2870: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2884: `<div className="flex gap-3 pt-4">`
- Line 2888: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3012: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3108: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3125: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3139: `<div className="flex gap-3 pt-4">`
- Line 3143: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3240: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3352: `<div className="flex gap-3 pt-4">`
- Line 3356: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\TeacherForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div className="flex items-center gap-3 mb-1">`
- Line 81: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 238: `<div className="flex gap-2">`
- Line 240: `<button type="button" onClick={generateEnrollmentNo} className="px-4 rounded-2xl bg-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 flex items-center gap-2">`
- Line 334: `<div className="flex gap-2 mt-2 relative z-20">`
- Line 366: `<div className="flex items-center gap-8">`
- Line 379: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">`
- Line 399: `<button key={step.id} onClick={() => setCurrentStep(step.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50' : 'hover:bg-slate-200/50'}`}>`
- Line 421: `<div className="flex gap-3">`
- Line 422: `{currentStep > 1 && <button onClick={() => setCurrentStep(s => s - 1)} className="px-6 py-3 rounded-2xl border-2 border-slate-100 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2">Back</button>}`
- Line 426: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"`
- Line 512: `<div className="flex items-center gap-3 mb-1">`
- Line 528: `className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 flex gap-4 items-start"`
- Line 778: `<div className="md:col-span-2 flex gap-2">`
- Line 785: `className="px-6 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold tracking-tight uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"`
- Line 802: `<h6 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-3 flex items-center gap-2">`
- Line 874: `<label key={shift} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">`
- Line 909: `<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-tight uppercase">`
- Line 959: `<div className="relative z-10 flex items-center gap-8">`
- Line 972: `<div className="flex items-center gap-2"><Mail size={16} /> {formData.email || '—'}</div>`
- Line 973: `<div className="flex items-center gap-2"><Smartphone size={16} /> {formData.phone || '—'}</div>`
- Line 974: `<div className="flex items-center gap-2"><Shield size={16} /> {formData.employeeCode || '—'}</div>`
- Line 997: `<div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8">`
- Line 1026: `<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">`
- Line 1045: `w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left`
- Line 1066: `<div className="flex items-center gap-2">`
- Line 1101: `<div className="flex gap-3">`
- Line 1104: `className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-tight uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"`
- Line 1113: `className="px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-bold tracking-tight uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300"`
- Line 1123: `className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-blue-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1132: `className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold tracking-tight uppercase tracking-widest shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"`
- Line 1199: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1264: `<div className="flex gap-3 pt-4">`
- Line 1268: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1290: `<div className={cn('flex items-center gap-3', className)}>`
- Line 1396: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 1455: `<div className="flex gap-3 pt-4">`
- Line 1459: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 1697: `<div className="flex items-center justify-between gap-8">`
- Line 1698: `<div className="flex items-center gap-3">`
- Line 1742: `<Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1757: `<Link key={s.id} to={`/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">`
- Line 1782: `<div className="flex items-center gap-3">`
- Line 1794: `<Link to="/students" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1800: `<Link to="/teachers" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1807: `<Link to="/notices" className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>`
- Line 1817: `<div className="flex items-center gap-2">`
- Line 1872: `<div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">`
- Line 1968: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2070: `<span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">`
- Line 2096: `<div className="flex gap-3 pt-4">`
- Line 2100: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2183: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2233: `<div className="flex gap-3 pt-4">`
- Line 2237: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2346: `<div className="flex items-center gap-1">`
- Line 2368: `'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all',`
- Line 2382: `<div className="flex items-center gap-3">`
- Line 2396: `className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"`
- Line 2426: `'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',`
- Line 2446: `'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',`
- Line 2453: `<div className="mt-1 flex items-center gap-1.5">`
- Line 2576: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2755: `<div className="flex gap-3 pt-4 border-t border-surface-200 mt-4">`
- Line 2759: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 2837: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 2874: `<label key={cls.id} className="flex items-center gap-2 cursor-pointer">`
- Line 2888: `<div className="flex gap-3 pt-4">`
- Line 2892: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3016: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3112: `<label key={subject.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3129: `<label key={section.id} className="flex items-center gap-2 cursor-pointer">`
- Line 3143: `<div className="flex gap-3 pt-4">`
- Line 3147: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`
- Line 3244: `<div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">`
- Line 3356: `<div className="flex gap-3 pt-4">`
- Line 3360: `className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"`

### `src\components\school\admin\TimetableForm.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 197: `<div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">`
- Line 396: `<div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">`
- Line 411: `className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"`

### `src\components\school\DoubtImageAttach.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 57: `className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"`
- Line 66: `className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"`

### `src\components\school\parent\DashboardChatCard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 35: `<div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">`
- Line 36: `<div className="flex items-center gap-3">`
- Line 45: `<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100">`
- Line 64: `<div className="flex items-center gap-3 min-w-0">`
- Line 90: `<div className="flex items-center gap-2.5 min-w-0">`
- Line 114: `className="w-full mt-4 flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition"`

### `src\components\school\parent\ParentLayout.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 160: `<div className="flex items-center justify-between gap-4">`
- Line 161: `<div className="flex min-w-0 items-center gap-3">`
- Line 186: `<div className="flex items-center gap-3">`
- Line 187: `<div className="relative flex items-center gap-2" ref={notifRef}>`
- Line 215: `className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"`
- Line 250: `className={`group relative flex items-start gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/20 dark:bg-blue-900/10" : ""`
- Line 306: `className="flex items-center gap-2 outline-none"`
- Line 345: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 361: `className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"`

### `src\components\school\SchoolAskDoubtPanel.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 146: `<span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">`
- Line 150: `<span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full max-w-[180px]">`
- Line 163: `"flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all",`
- Line 209: `"w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all",`
- Line 247: `<div className="flex items-center gap-2">`
- Line 253: `<div className="flex items-center gap-1">`
- Line 294: `<div className="flex items-center gap-2 pt-3 border-t border-violet-100">`
- Line 300: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",`
- Line 312: `"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",`

### `src\components\school\SchoolVideoPlayer.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 104: `"w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left text-sm font-semibold transition-all",`
- Line 131: `className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-40">`
- Line 136: `<div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 border",`
- Line 153: `className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">`
- Line 452: `<div className="flex items-center gap-3">`
- Line 463: `<div className="flex items-center gap-1.5">`

### `src\components\school\SmartCalendar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 201: `<div className="flex items-center gap-1.5">`
- Line 321: `className="w-full text-left flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:scale-[1.01] hover:underline cursor-pointer group"`

### `src\components\school\student\IntensiveRevisionSection.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 180: `<div className="flex items-center gap-3">`
- Line 205: `<div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">`
- Line 211: `<div key={d} className={`flex items-center gap-3 px-4 py-2.5`
- Line 237: `<div className="flex items-center gap-2">`
- Line 285: `<div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">`
- Line 309: `className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors`
- Line 337: `className="w-full flex items-center gap-3 px-3 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"`
- Line 462: `<div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">`
- Line 486: `<div className="flex items-center gap-2 px-1">`

### `src\components\school\student\Navbar.jsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 212: `<div className="flex items-center justify-between gap-8">`
- Line 213: `<div className="flex items-center gap-3">`
- Line 258: `className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group"`
- Line 280: `<div className="flex items-center gap-3">`
- Line 281: `<div className="relative flex items-center gap-2" ref={notifRef}>`
- Line 309: `className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"`
- Line 345: `"group relative flex items-start gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors",`
- Line 407: `className="flex items-center gap-2 outline-none"`
- Line 442: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 454: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 466: `className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"`
- Line 482: `className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"`

### `src\components\school\student\RevisionSessionModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 96: `className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3`
- Line 118: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors"`
- Line 166: `className="w-full px-3.5 py-2.5 border-t border-gray-100 bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"`
- Line 178: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"`
- Line 250: `<div className="flex gap-1">`
- Line 279: `className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all flex items-start gap-2.5 ${cls}`}`
- Line 301: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors"`
- Line 378: `<div className="flex items-center gap-2">`
- Line 409: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"`
- Line 470: `<div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">`
- Line 482: `<p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">`

### `src\components\shared\AiBadge.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 4: `<span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-ai/10 text-ai border border-ai/20 rounded-full">`

### `src\components\shared\MaintenanceBroadcastBanner.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 58: `<div className="flex items-start gap-3">`

### `src\components\shared\MaintenanceNotice.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 13: `<div className="mx-auto flex max-w-screen-2xl items-start gap-3">`

### `src\components\shared\MarkdownRenderer.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 34: `<div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">`
- Line 73: `<figcaption className="flex items-start gap-2 border-t border-slate-100 px-4 py-2.5 text-xs font-medium leading-relaxed text-slate-500">`
- Line 483: `<div className="my-2.5 flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/10 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-slate-900/30 dark:hover:border-slate-700/60 transition-all select-none shadow-sm/5">`
- Line 496: `<div className="my-2.5 flex items-start gap-3.5 rounded-2xl border border-emerald-100/60 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50/40 hover:border-emerald-200/60 transition-all select-none">`
- Line 539: `<div className="relative group my-3 flex items-start gap-3.5 rounded-2xl border border-sky-100/60 dark:border-sky-950/20 bg-sky-50/20 dark:bg-sky-950/5 px-4 py-3 pr-28 text-sm font-black text-slate-800 dark:text-slate-200 hover:bg-sky-50/40 hover:border-sky-200/60 transition-all select-none">`

### `src\components\shared\PageErrorBoundary.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 72: `<div className="flex gap-3">`
- Line 76: `className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"`
- Line 86: `className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"`

### `src\components\shared\PageHeader.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 16: `<div className="flex items-center gap-3">`
- Line 30: `{actions && <div className="flex items-center gap-2">{actions}</div>}`

### `src\components\shared\ProgressReportTree.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 24: `<div className="flex items-center gap-1.5 min-w-0">`
- Line 53: `className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"`
- Line 59: `<div className="hidden sm:flex items-center gap-3 mr-2">`
- Line 61: `<div className="flex items-center gap-1 text-xs">`
- Line 69: `<div className="flex items-center gap-1 text-xs">`
- Line 75: `<div className="flex items-center gap-1 text-xs">`
- Line 103: `<div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">`
- Line 119: `<div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">`
- Line 137: `<div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">`
- Line 153: `<div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">`
- Line 183: `className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"`
- Line 187: `<div className="hidden sm:flex items-center gap-3">`
- Line 228: `className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left"`
- Line 235: `<div className="hidden sm:flex items-center gap-3 mr-2">`

### `src\components\shared\StatCard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 23: `<div className={cn("flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>`

### `src\components\student\BatchDiscoveryModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 80: `<div className="flex items-center gap-3 text-[10px] text-white/40 mb-3">`
- Line 81: `<span className="flex items-center gap-1">`
- Line 85: `<span className="flex items-center gap-1">`
- Line 96: `"w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",`
- Line 174: `<div className="flex items-center gap-2 mb-2">`
- Line 175: `<span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">`
- Line 236: `className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"`

### `src\components\student\course\CourseFeedbackWidget.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 46: `className="bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-full px-6 py-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-all group"`
- Line 78: `<div className="flex items-center gap-1">`
- Line 100: `<label className="text-xs font-semibold text-slate-500 flex items-center gap-1">`

### `src\components\student\dashboard\ContinueLearning.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 39: `className="group flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"`
- Line 53: `<p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">`
- Line 57: `<div className="mt-2 flex items-center gap-2">`

### `src\components\student\dashboard\LeaderboardPreview.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 70: `<div className="flex items-end gap-2 px-2 pt-2">`
- Line 108: `<div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm w-fit">`
- Line 135: `<div className="flex h-24 items-center justify-center gap-2">`
- Line 145: `<div className="flex h-24 items-center justify-center gap-2">`
- Line 157: `<div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">`

### `src\components\student\dashboard\QuickActions.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 81: `<div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600">`

### `src\components\student\dashboard\Recommendations.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 96: `<li key={`${s}-${i}`} className="text-xs text-indigo-800 flex items-start gap-2">`
- Line 109: `className="group flex gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"`
- Line 126: `<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">`

### `src\components\student\dashboard\TodayStudyPlan.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 38: `className="text-primary font-semibold flex items-center gap-0.5 hover:underline">`
- Line 53: `className={cn("flex items-center gap-3 p-3.5 rounded-xl border border-border/50 transition-all",`
- Line 60: `<div className="flex items-center gap-2 mt-0.5">`

### `src\components\student\IntensiveRevisionSection.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 180: `<div className="flex items-center gap-3">`
- Line 205: `<div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">`
- Line 211: `<div key={d} className={`flex items-center gap-3 px-4 py-2.5`
- Line 237: `<div className="flex items-center gap-2">`
- Line 285: `<div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">`
- Line 309: `className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors`
- Line 337: `className="w-full flex items-center gap-3 px-3 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"`
- Line 462: `<div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">`
- Line 486: `<div className="flex items-center gap-2 px-1">`

### `src\components\student\leaderboard\LeaderboardCharts.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 38: `<div className="flex items-center gap-2 mb-1">`
- Line 178: `<div className="flex items-center justify-end gap-2 mt-3">`

### `src\components\student\lecture\LectureAssignmentsSection.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 93: `<div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">`
- Line 94: `<div className="flex items-center gap-3 min-w-0">`
- Line 119: `<div className="flex justify-between items-start gap-4">`
- Line 125: `<div className="flex items-center gap-3 mt-2">`
- Line 127: `<span className="text-xs font-medium text-slate-500 flex items-center gap-1">`
- Line 148: `<div className="flex gap-2">`
- Line 176: `<p className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">`

### `src\components\student\RevisionSessionModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 95: `className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3`
- Line 117: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors"`
- Line 165: `className="w-full px-3.5 py-2.5 border-t border-gray-100 bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"`
- Line 177: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"`
- Line 249: `<div className="flex gap-1">`
- Line 278: `className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all flex items-start gap-2.5 ${cls}`}`
- Line 300: `className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors"`
- Line 375: `<div className="flex items-center gap-2">`
- Line 443: `<div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">`
- Line 455: `<p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">`

### `src\components\student\XPToast.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 45: `"flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-2xl",`

### `src\components\teacher\AdvancedMetricCard.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 47: `<div className="flex items-center gap-1.5">`
- Line 66: `<div className="flex items-baseline gap-2">`

### `src\components\teacher\AssignmentManagerModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 88: `<div className="flex gap-2">`
- Line 199: `<p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">`
- Line 204: `<div className="flex gap-2">`
- Line 245: `<div className="pt-4 flex gap-2 justify-end border-t">`

### `src\components\teacher\FlagStudentModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 84: `<DialogTitle className="flex items-center gap-2">`
- Line 99: `className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors`

### `src\components\teacher\QuizAnalyticsModal.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 65: `<div key={label} className="flex items-center gap-3 text-sm">`
- Line 101: `<div key={key} className="flex items-center gap-3 text-sm">`
- Line 197: `<h4 className="text-sm font-semibold mb-3 flex items-center gap-2">`
- Line 203: `<h4 className="text-sm font-semibold mb-3 flex items-center gap-2">`
- Line 289: `className={cn("flex items-center gap-1 hover:text-foreground transition-colors",`
- Line 299: `<div className="flex items-center gap-3">`
- Line 308: `className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors shrink-0"`
- Line 365: `<div className="flex items-center justify-end gap-2">`
- Line 411: `<div className="flex items-center gap-2">`
- Line 455: `<div className="flex items-center justify-center py-16 text-muted-foreground gap-2">`
- Line 506: `className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"`
- Line 573: `<div className="flex items-center gap-2.5">`
- Line 587: `<div className="border border-amber-200 bg-amber-50 dark:bg-amber-50/20 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">`
- Line 595: `className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"`
- Line 616: `<div className="border border-border rounded-xl p-4 bg-card flex items-center gap-3">`
- Line 679: `<div className="flex items-center gap-1.5 ml-3 shrink-0">`
- Line 709: `<span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Overview</span>`
- Line 712: `<span className="flex items-center gap-1.5">`
- Line 722: `<span className="flex items-center gap-1.5"><ListOrdered className="w-3.5 h-3.5" /> Questions</span>`
- Line 725: `<span className="flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Settings</span>`
- Line 732: `<div className="flex items-center justify-center py-16 text-muted-foreground gap-2">`

### `src\components\teacher\RemoveStudentDialog.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 60: `<AlertDialogTitle className="flex items-center gap-2 text-destructive">`

### `src\components\teacher\StudentRiskSignals.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 49: `<div className={`p-4 rounded-2xl border flex items-center gap-4 animate-pulse-subtle ${topConfig.color}`}>`
- Line 52: `<div className="flex items-center gap-2 mb-1">`
- Line 70: `className="card-surface p-4 flex items-start gap-4 hover:border-primary/20 transition-all group"`

### `src\components\ui\breadcrumb.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 31: `<li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />`

### `src\components\ui\button.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 7: `"inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",`

### `src\components\ui\chart.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 247: `className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}`
- Line 256: `className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}`

### `src\components\ui\input-otp.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 11: `containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}`

### `src\components\ui\pagination.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 19: `<ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />`

### `src\components\ui\sidebar.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 415: `"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",`
- Line 543: `className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}`
- Line 599: `"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",`

### `src\components\ui\toggle-group.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 17: `<ToggleGroupPrimitive.Root ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props}>`

### `src\components\upload\LectureVideoUpload.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 124: `<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">`
- Line 131: `className="ml-auto inline-flex items-center gap-1 text-xs font-medium underline hover:text-red-700"`

### `src\components\upload\MaterialsUpload.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 59: `className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 group"`
- Line 66: `<div className="flex items-center justify-between gap-2">`
- Line 74: `<div className="flex items-center gap-1.5 shrink-0">`
- Line 77: `<div className="flex items-center gap-1">`
- Line 177: `<div className="flex items-center gap-3 text-xs text-slate-500">`
- Line 179: `<span className="flex items-center gap-1">`
- Line 185: `<span className="flex items-center gap-1 text-emerald-600 font-medium">`
- Line 190: `<span className="flex items-center gap-1 text-amber-600 font-medium">`

### `src\components\upload\ThumbnailUpload.tsx`
**Ambiguous Flex Containers (Requires Manual Review):**
- Line 118: `<div className="flex items-center gap-2 text-white">`
- Line 156: `className="mt-2 text-xs text-red-500 flex items-center gap-1"`

