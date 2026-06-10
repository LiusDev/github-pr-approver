const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #0d1117;
    color: #e6edf3;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 480px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.5rem;
  }

  .logo svg { color: #58a6ff; }

  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #e6edf3;
  }

  label {
    display: block;
    font-size: 0.875rem;
    color: #8b949e;
    margin-bottom: 0.4rem;
  }

  .field { margin-bottom: 1rem; }

  input, select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus, select:focus { border-color: #58a6ff; }
  input::placeholder { color: #484f58; }

  select option { background: #161b22; }

  button {
    width: 100%;
    padding: 0.7rem;
    background: #238636;
    border: 1px solid #2ea043;
    border-radius: 6px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 0.5rem;
  }

  button:hover:not(:disabled) { background: #2ea043; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }

  .button-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .button-row button { margin-top: 0; }
  #approveMergeBtn { background: #1f6feb; border-color: #388bfd; }
  #approveMergeBtn:hover:not(:disabled) { background: #388bfd; }

  #status {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    display: none;
  }

  #status.success {
    background: #0d4a1a;
    border: 1px solid #238636;
    color: #3fb950;
  }

  #status.error {
    background: #3d0a0a;
    border: 1px solid #da3633;
    color: #f85149;
  }

  .pr-info { margin-top: 0.4rem; font-size: 0.8rem; color: #8b949e; }
  .pr-info strong { color: #e6edf3; }
`

const script = `
  async function loadUsers() {
    const res = await fetch('/api/users');
    const users = await res.json();
    const select = document.getElementById('user');
    users.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  }

  function setButtonsDisabled(disabled) {
    document.getElementById('approveBtn').disabled = disabled;
    document.getElementById('approveMergeBtn').disabled = disabled;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showStatus(type, html) {
    const el = document.getElementById('status');
    el.className = type;
    el.innerHTML = html;
    el.style.display = 'block';
  }

  async function approve() {
    const btn = document.getElementById('approveBtn');
    const statusEl = document.getElementById('status');
    const prUrl = document.getElementById('prUrl').value.trim();
    const userName = document.getElementById('user').value;

    statusEl.style.display = 'none';
    statusEl.className = '';

    if (!prUrl) { showStatus('error', 'Please paste a PR URL.'); return; }

    setButtonsDisabled(true);
    btn.textContent = 'Approving…';

    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl, userName }),
      });
      const data = await res.json();
      if (data.success) {
        showStatus('success',
          '✓ Approved successfully!<div class="pr-info"><strong>#' + data.prNumber + '</strong> ' + escHtml(data.prTitle) + '<br>' + escHtml(data.repoFullName) + '</div>'
        );
        document.getElementById('prUrl').value = '';
      } else {
        showStatus('error', '✗ ' + escHtml(data.message));
      }
    } catch {
      showStatus('error', '✗ Network error. Is the server running?');
    } finally {
      setButtonsDisabled(false);
      btn.textContent = 'Approve PR';
    }
  }

  async function approveAndMerge() {
    const btn = document.getElementById('approveMergeBtn');
    const statusEl = document.getElementById('status');
    const prUrl = document.getElementById('prUrl').value.trim();
    const userName = document.getElementById('user').value;

    statusEl.style.display = 'none';
    statusEl.className = '';

    if (!prUrl) { showStatus('error', 'Please paste a PR URL.'); return; }

    setButtonsDisabled(true);
    btn.textContent = 'Approving & merging…';

    try {
      const res = await fetch('/api/approve-and-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl, userName }),
      });
      const data = await res.json();
      if (data.success) {
        showStatus('success',
          '✓ Approved and merged!<div class="pr-info"><strong>#' + data.prNumber + '</strong> ' + escHtml(data.prTitle) + '<br>' + escHtml(data.repoFullName) + '</div>'
        );
        document.getElementById('prUrl').value = '';
      } else {
        showStatus('error', '✗ ' + escHtml(data.message));
      }
    } catch {
      showStatus('error', '✗ Network error. Is the server running?');
    } finally {
      setButtonsDisabled(false);
      btn.textContent = 'Approve & Merge';
    }
  }

  document.getElementById('approveBtn').addEventListener('click', approve);
  document.getElementById('approveMergeBtn').addEventListener('click', approveAndMerge);
  document.getElementById('prUrl').addEventListener('keydown', e => {
    if (e.key === 'Enter') approve();
  });

  loadUsers();
`

export function Home() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GitHub PR Approver</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <h1>PR Auto Approver</h1>
          </div>

          <div class="field">
            <label for="user">Approving as</label>
            <select id="user" />
          </div>

          <div class="field">
            <label for="prUrl">Pull Request URL</label>
            <input
              id="prUrl"
              type="url"
              placeholder="https://github.com/owner/repo/pull/123"
              autocomplete="off"
              spellcheck={false}
            />
          </div>

          <div class="button-row">
            <button id="approveBtn">Approve PR</button>
            <button id="approveMergeBtn">Approve & Merge</button>
          </div>

          <div id="status" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </body>
    </html>
  )
}
