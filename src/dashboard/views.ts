const LAYOUT_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #f4f6fb;
  color: #1f2933;
  min-height: 100vh;
}
a { color: #2563eb; text-decoration: none; }
.header {
  background: #111827;
  color: #fff;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header .brand { font-weight: 700; font-size: 18px; }
.header .brand span { color: #60a5fa; }
.header .actions { display: flex; align-items: center; gap: 16px; }
.btn {
  display: inline-block; border: none; cursor: pointer;
  padding: 8px 14px; border-radius: 6px; font-size: 14px; font-weight: 600;
}
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-danger { background: #dc2626; color: #fff; }
.btn-danger:hover { background: #b91c1c; }
.btn-outline { background: transparent; color: #d1d5db; border: 1px solid #4b5563; }
.btn-outline:hover { color: #fff; border-color: #9ca3af; }
.btn-sm { padding: 5px 10px; font-size: 13px; }
.container { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 13px; font-weight: 600; color: #4b5563; }
.field input, .field select {
  padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;
}
.field input:focus, .field select:focus { outline: none; border-color: #2563eb; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eef1f6; font-size: 14px; }
th { color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 12px; }
tr:hover td { background: #f9fafb; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge-active { background: #dcfce7; color: #15803d; }
.badge-inactive { background: #fee2e2; color: #b91c1c; }
.badge-admin { background: #dbeafe; color: #1d4ed8; }
.badge-user { background: #f3f4f6; color: #374151; }
.pagination { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
.pagination a { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
.toast { position: fixed; top: 16px; right: 16px; padding: 12px 18px; border-radius: 8px; color: #fff; display: none; z-index: 50; }
.toast-success { background: #16a34a; }
.toast-error { background: #dc2626; }
.meta { color: #6b7280; font-size: 13px; margin-top: 10px; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; z-index: 40; }
.modal.open { display: flex; }
.modal-box { background: #fff; border-radius: 10px; padding: 24px; width: 420px; max-width: 90vw; }
.modal-box h3 { margin-bottom: 16px; }
.modal-box .field { margin-bottom: 12px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
a.page-link.disabled { pointer-events: none; opacity: .4; }
`;

const DASHBOARD_JS = `
let currentPage = 1;
const limit = 20;

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
  t.style.display = 'block';
  setTimeout(() => (t.style.display = 'none'), 3000);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function loadUsers() {
  const search = document.getElementById('search').value;
  const role = document.getElementById('filterRole').value;
  const status = document.getElementById('filterStatus').value;
  const qs = new URLSearchParams({ page: currentPage, limit });
  if (search) qs.set('search', search);
  if (role) qs.set('role', role);
  if (status) qs.set('status', status);

  let data;
  try {
      data = await api('/dashboard/api/users?' + qs.toString());
  } catch (e) {
    showToast(e.message || 'Failed to load users', 'error');
    return;
  }
  renderRows(data.data, data.meta);
}

function renderRows(users, meta) {
  const tbody = document.getElementById('usersBody');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">No users found.</td></tr>';
  } else {
    tbody.innerHTML = users.map((u) => \`
      <tr>
        <td>\${esc(u.email)}</td>
        <td>\${esc(u.firstName || '')} \${esc(u.lastName || '')}</td>
        <td>\${esc(u.phone || '—')}</td>
        <td><span class="badge badge-\${u.role.toLowerCase()}">\${u.role}</span></td>
        <td><span class="badge badge-\${u.status.toLowerCase()}">\${u.status}</span></td>
        <td>\${u.emailVerified ? '✔' : '✖'}</td>
        <td>\${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-primary btn-sm" onclick="openEdit('\${u.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUser('\${u.id}')">Del</button>
        </td>
      </tr>\`).join('');
  }
  renderPagination(meta);
}

function renderPagination(meta) {
  const el = document.getElementById('pagination');
  el.innerHTML = '';
  const prev = meta.page > 1 ? \`<a href="#" onclick="goPage(\${meta.page - 1});return false\">Prev</a>\` : '<a href="#" class="page-link disabled">Prev</a>';
  const next = meta.page < meta.totalPages ? \`<a href="#" onclick="goPage(\${meta.page + 1});return false\">Next</a>\` : '<a href="#" class="page-link disabled">Next</a>';
  el.innerHTML = prev + \`<span>Page \${meta.page} of \${meta.totalPages} (\${meta.total} total)</span>\` + next;
}

function goPage(p) { currentPage = p; loadUsers(); }
function applyFilters() { currentPage = 1; loadUsers(); }
function resetFilters() {
  document.getElementById('search').value = '';
  document.getElementById('filterRole').value = '';
  document.getElementById('filterStatus').value = '';
  currentPage = 1;
  loadUsers();
}

// Create user
function openCreate() {
  document.getElementById('modalTitle').textContent = 'Create User';
  document.getElementById('createForm').reset();
  document.getElementById('createForm').style.display = 'block';
  document.getElementById('editSelects').style.display = 'none';
  document.getElementById('userModal').classList.add('open');
}

// Edit user
function openEdit(id) {
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit User';
  document.getElementById('createForm').style.display = 'none';
  document.getElementById('editSelects').style.display = 'block';
  document.getElementById('userModal').classList.add('open');
}

function closeModal() { document.getElementById('userModal').classList.remove('open'); }

async function submitCreate(ev) {
  ev.preventDefault();
  const f = document.getElementById('createForm');
  const body = {
    email: f.email.value,
    password: f.password.value,
    firstName: f.firstName.value || undefined,
    lastName: f.lastName.value || undefined,
    phone: f.phone.value || undefined,
    role: f.role.value,
    status: f.status.value,
  };
  try {
    await api('/dashboard/api/users', { method: 'POST', body: JSON.stringify(body) });
    showToast('User created');
    closeModal();
    loadUsers();
  } catch (e) { showToast(e.message, 'error'); }
}

async function submitEdit() {
  const role = document.getElementById('editRole').value;
  const status = document.getElementById('editStatus').value;
  try {
    await api('/dashboard/api/users/' + currentEditId, {
      method: 'PATCH',
      body: JSON.stringify({ role, status }),
    });
    showToast('User updated');
    closeModal();
    loadUsers();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteUser(id) {
  if (!confirm('Delete this user permanently?')) return;
  try {
    await api('/dashboard/api/users/' + id, { method: 'DELETE' });
    showToast('User deleted');
    loadUsers();
  } catch (e) { showToast(e.message, 'error'); }
}

async function logout() {
  await fetch('/dashboard/logout', { method: 'POST' });
  location.href = '/';
}

let currentEditId = null;
loadUsers();
`;

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | User Service</title>
  <style>${LAYOUT_CSS}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}

export function renderLoginPage(): string {
  const body = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#111827,#1e3a8a)">
    <div class="card" style="width:380px;max-width:90vw;padding:32px">
      <h2 style="margin-bottom:4px">User Service</h2>
      <p style="color:#6b7280;margin-bottom:20px;font-size:14px">Admin dashboard</p>
      <div class="field" style="margin-bottom:14px">
        <label>Username</label>
        <input id="username" type="text" autocomplete="username" />
      </div>
      <div class="field" style="margin-bottom:20px">
        <label>Password</label>
        <input id="password" type="password" autocomplete="current-password" />
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="login()">Sign in</button>
      <div id="error" style="color:#dc2626;margin-top:12px;font-size:13px;display:none"></div>
    </div>
  </div>
  <div id="toast" class="toast"></div>
  <script>
    async function login() {
      document.getElementById('error').style.display = 'none';
      const res = await fetch('/dashboard/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value,
        }),
      });
      if (res.ok) { window.location.href = '/dashboard'; }
      else {
        const e = document.getElementById('error');
        e.textContent = 'Invalid username or password.';
        e.style.display = 'block';
      }
    }
    document.getElementById('password').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') login(); });
  </script>`;
  return layout('Login', body);
}

export function renderDashboardPage(): string {
  const body = `
  <div class="header">
    <div class="brand">User <span>Service</span> <small style="font-weight:400;font-size:13px;color:#9ca3af">Admin Dashboard</small></div>
    <div class="actions">
      <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
    </div>
  </div>
  <div class="container">
    <div class="card">
      <div class="row" style="margin-bottom:8px">
        <div class="field">
          <label>Search</label>
          <input id="search" placeholder="email, name, phone" style="width:220px" onkeydown="if(event.key==='Enter')applyFilters()" />
        </div>
        <div class="field">
          <label>Role</label>
          <select id="filterRole" onchange="applyFilters()">
            <option value="">All</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
        </div>
        <div class="field">
          <label>Status</label>
          <select id="filterStatus" onchange="applyFilters()">
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <button class="btn btn-outline" style="color:#374151;border-color:#d1d5db" onclick="applyFilters()">Apply</button>
        <button class="btn btn-outline" style="color:#374151;border-color:#d1d5db" onclick="resetFilters()">Reset</button>
        <button class="btn btn-primary" style="margin-left:auto" onclick="openCreate()">+ Create User</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="usersBody"><tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">Loading…</td></tr></tbody>
      </table>
      <div id="pagination" class="pagination"></div>
      <div class="meta">Use the REST API at <code>/api/users</code> with a Bearer token for programmatic access.</div>
    </div>
  </div>

  <div class="modal" id="userModal">
    <div class="modal-box">
      <h3 id="modalTitle">Create User</h3>
      <form id="createForm" onsubmit="submitCreate(event)">
        <div class="field"><label>Email</label><input name="email" type="email" required /></div>
        <div class="field"><label>Password (min 8, upper/lower/number)</label><input name="password" type="password" required minlength="8" /></div>
        <div class="field"><label>First name</label><input name="firstName" /></div>
        <div class="field"><label>Last name</label><input name="lastName" /></div>
        <div class="field"><label>Phone</label><input name="phone" /></div>
        <div style="display:flex;gap:12px">
          <div class="field" style="flex:1"><label>Role</label><select name="role"><option value="USER">User</option><option value="ADMIN">Admin</option></select></div>
          <div class="field" style="flex:1"><label>Status</label><select name="status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" style="color:#374151;border-color:#d1d5db" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>

      <div id="editSelects" style="display:none">
        <div class="field"><label>Role</label><select id="editRole"><option value="USER">User</option><option value="ADMIN">Admin</option></select></div>
        <div class="field"><label>Status</label><select id="editStatus"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
        <div class="modal-actions">
          <button class="btn btn-outline" style="color:#374151;border-color:#d1d5db" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitEdit()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast toast-success"></div>
  <script>${DASHBOARD_JS}</script>`;
  return layout('Dashboard', body);
}