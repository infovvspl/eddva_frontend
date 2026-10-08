// TEMPORARY — manual verification harness for BlogBodyEditor, deleted after use.
import { useState } from 'react';
import BlogBodyEditor from './BlogBodyEditor';

export default function DevTestEditor() {
  const [html, setHtml] = useState('<p>Some <strong>existing</strong> content.</p>');
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Dev test</h1>
      <BlogBodyEditor value={html} onChange={setHtml} docxFilename="dev-test-section" />
      <pre id="html-output" style={{ marginTop: 16, whiteSpace: 'pre-wrap', background: '#eee', padding: 8 }}>{html}</pre>
    </div>
  );
}
