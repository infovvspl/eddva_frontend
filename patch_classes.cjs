const fs = require('fs');
const content = fs.readFileSync('src/pages/school/student/Classes.jsx', 'utf8');

const updatedContent = content.replace(
  `  const obsScheduledLectures = obsLive.filter((l) => l.status === 'SCHEDULED');`,
  `  const obsScheduledLectures = obsLive.filter((l) => l.status === 'SCHEDULED');
  const pastLiveRecordings = recordings.filter(r => r.source === 'live_stream');
  const uploadedRecordings = recordings.filter(r => r.source !== 'live_stream');`
);

let finalContent = updatedContent.replace(
  `{liveRecordings.map((rec) => (
              <LiveRecordingCard key={rec.id} rec={rec} />
            ))}`,
  `{pastLiveRecordings.map(renderRecordingCard)}`
);

finalContent = finalContent.replace(
  `{liveRecordings.length > 0 && (`,
  `{pastLiveRecordings.length > 0 && (`
);

const regexRecorded = /\{recordings\.map\(\(recording\) => \{[\s\S]*?\}\)\}/;
finalContent = finalContent.replace(regexRecorded, `{uploadedRecordings.map(renderRecordingCard)}`);

finalContent = finalContent.replace(
  `{recordings.length === 0 ? (`,
  `{uploadedRecordings.length === 0 ? (`
);

const renderRecordingCardCode = `
  const renderRecordingCard = (recording) => {
    const hasNotes = !!recording.notes;
    const hasTranscript = !!recording.transcript;
    const canWatch = !!recording.video_url;

    return (
      <div
        key={recording.id}
        className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex gap-4">
          <Link
            to={\`/school/student/recorded-classes/\${recording.id}?play=1\`}
            className="group/thumb relative flex h-28 w-36 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900"
            aria-label={\`Watch \${recording.title}\`}
          >
            {recording.thumbnail_url ? (
              <img
                src={recording.thumbnail_url}
                alt={recording.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                loading="lazy"
              />
            ) : (
              <PlayCircle className="h-10 w-10 text-white/70" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all group-hover/thumb:bg-slate-950/35 group-hover/thumb:opacity-100">
              <PlayCircle className="h-9 w-9 text-white drop-shadow-lg" />
            </span>
            {recording.duration && (
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {parseFloat(recording.duration) >= 1 ? \`\${Math.round(parseFloat(recording.duration))} min\` : \`\${Math.round(parseFloat(recording.duration) * 60)}s\`}
              </span>
            )}
            {recording.subject_name && (
              <span className="absolute left-1.5 top-1.5 rounded bg-blue-600/85 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                {recording.subject_name}
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
                {recording.subject_name || 'Lecture'}
              </span>
            </div>

            <h3 className="mt-3 line-clamp-2 text-base font-black text-slate-900">{recording.title}</h3>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
              {recording.chapter_name || 'General chapter'}
              {recording.topic_name ? \` · \${recording.topic_name}\` : ''}
            </p>

            <div className="mt-3">{renderRecordingStatus(recording)}</div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <Clock3 size={12} />
                {recording.duration ? \`\${recording.duration} mins\` : 'Pending'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <CalendarDays size={12} />
                {recording.recorded_date ? new Date(recording.recorded_date).toLocaleDateString('en-GB') : 'No date'}
              </span>
              {hasNotes && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                  <Sparkles size={12} />
                  Notes
                </span>
              )}
              {!hasNotes && hasTranscript && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">
                  <Download size={12} />
                  Transcript
                </span>
              )}
            </div>

            <div className="mt-4">
              <Link
                to={\`/school/student/recorded-classes/\${recording.id}\${canWatch ? '?play=1' : ''}\`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {canWatch ? <PlayCircle size={15} /> : <FileText size={15} />}
                {canWatch ? 'Watch Video' : 'Open Details'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };
`;

finalContent = finalContent.replace(
  `  const renderRecordingStatus = (recording) => {`,
  renderRecordingCardCode + `\n  const renderRecordingStatus = (recording) => {`
);

fs.writeFileSync('src/pages/school/student/Classes.jsx', finalContent);
console.log('done');
