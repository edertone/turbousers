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
.btn-clear { background: transparent; color: #374151; border: 1px solid #d1d5db; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.tab {
  padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;
  background: #fff; color: #4b5563; border: 1px solid #d1d5db; cursor: pointer;
}
.tab.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.container { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.field label { font-size: 13px; font-weight: 600; color: #4b5563; }
.field input, .field select, .field textarea {
  padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;
  font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #2563eb; }
.field textarea { resize: vertical; min-height: 80px; font-family: ui-monospace, Menlo, Consolas, monospace; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eef1f6; font-size: 14px; vertical-align: top; }
th { color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 12px; }
tr:hover td { background: #f9fafb; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin: 2px 4px 2px 0; display: inline-block; }
.badge-active { background: #dcfce7; color: #15803d; }
.badge-inactive { background: #fee2e2; color: #b91c1c; }
.badge-role { background: #dbeafe; color: #1d4ed8; }
.pagination { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
.pagination a { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; }
.toast { position: fixed; top: 16px; right: 16px; padding: 12px 18px; border-radius: 8px; color: #fff; display: none; z-index: 50; }
.toast-success { background: #16a34a; }
.toast-error { background: #dc2626; }
.meta { color: #6b7280; font-size: 13px; margin-top: 10px; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; z-index: 40; }
.modal.open { display: flex; }
.modal-box { background: #fff; border-radius: 10px; padding: 24px; width: 480px; max-width: 90vw; max-height: 90vh; overflow-y: auto; }
.modal-box h3 { margin-bottom: 16px; }
.modal-box .field { margin-bottom: 12px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
a.page-link.disabled { pointer-events: none; opacity: .4; }
.role-select { display: flex; flex-wrap: wrap; gap: 10px; }
.role-select label { display: flex; align-items: center; gap: 6px; font-weight: 500; color: #374151; font-size: 14px; }
.data-hint { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
`;

const DASHBOARD_JS = `
let currentPage = 1;
const limit = 20;
let rolesCache = [];
let currentEditUser = null;
let currentEditRole = null;

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

function parseJson(text, label) {
  if (!text || !text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(label + ' is not valid JSON: ' + e.message);
  }
}

function switchTab(name) {
  document.getElementById('usersPane').style.display = name === 'users' ? 'block' : 'none';
  document.getElementById('rolesPane').style.display = name === 'roles' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  if (name === 'roles') loadRoles();
}

function fillRoleFilter() {
  const r = document.getElementById('filterRole');
  if (!r) return;
  r.innerHTML = '<option value="">All</option>' + rolesCache.map((x) => '<option value="' + esc(x.name) + '">' + esc(x.name) + '</option>').join('');
}

async function loadRolesForSelect(sel) {
  try {
    rolesCache = await api('/dashboard/api/roles');
  } catch (e) {
    rolesCache = [];
  }
  fillRoleFilter();
  const target = sel || document.getElementById('createRoles');
  if (!target) return;
  target.innerHTML = '';
  rolesCache.forEach((r) => {
    const o = document.createElement('option');
    o.value = r.id;
    o.textContent = r.name;
    target.appendChild(o);
  });
}

// ============ USERS ============

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

function roleBadges(roles) {
  if (!roles || !roles.length) return '<span style="color:#9ca3af">none</span>';
  return roles.map((r) => '<span class="badge badge-role">' + esc(r.name) + '</span>').join('');
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
        <td>\${roleBadges(u.roles)}</td>
        <td><span class="badge badge-\${u.status.toLowerCase()}">\${u.status}</span></td>
        <td>\${u.emailVerified ? '✔' : '✖'}</td>
        <td>\${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-primary btn-sm" onclick="openEditUser('\${u.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUser('\${u.id}')">Del</button>
        </td>
      </tr>\`).join('');
  }
  renderPagination(meta);
}

function renderPagination(meta) {
  const el = document.getElementById('pagination');
  el.innerHTML = '';
  const prev = meta.page > 1 ? \`<a onclick="goPage(\${meta.page - 1});return false">Prev</a>\` : '<a class="page-link disabled">Prev</a>';
  const next = meta.page < meta.totalPages ? \`<a onclick="goPage(\${meta.page + 1});return false">Next</a>\` : '<a class="page-link disabled">Next</a>';
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

function openCreateUser() {
  loadRolesForSelect(document.getElementById('createRoles'));
  document.getElementById('userModalTitle').textContent = 'Create User';
  document.getElementById('createFormWrap').style.display = 'block';
  document.getElementById('editFormWrap').style.display = 'none';
  document.getElementById('userCreateForm').reset();
  document.getElementById('userCreateData').value = '{}';
  document.getElementById('userModal').classList.add('open');
}

async function openEditUser(id) {
  let user;
  try {
    user = await api('/dashboard/api/users/' + id);
  } catch (e) {
    showToast(e.message, 'error');
    return;
  }
  await loadRolesForSelect();
  currentEditUser = user;
  document.getElementById('userModalTitle').textContent = 'Edit User: ' + user.email;
  document.getElementById('createFormWrap').style.display = 'none';
  document.getElementById('editFormWrap').style.display = 'block';
  document.getElementById('editStatus').value = user.status;
  document.getElementById('editData').value = user.data ? JSON.stringify(user.data, null, 2) : '';
  const currentRoleIds = new Set((user.roles || []).map((r) => r.id));
  const box = document.getElementById('editRoles');
  box.innerHTML = '';
  rolesCache.forEach((r) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = r.id;
    cb.checked = currentRoleIds.has(r.id);
    cb.classList.add('edit-role-cb');
    label.appendChild(cb);
    label.appendChild(document.createTextNode(r.name));
    box.appendChild(label);
  });
  document.getElementById('userModal').classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function selectedEditRoleIds() {
  return Array.from(document.querySelectorAll('.edit-role-cb:checked')).map((cb) => cb.value);
}

async function submitCreateUser(ev) {
  ev.preventDefault();
  const f = document.getElementById('userCreateForm');
  let data;
  try {
    data = parseJson(f.data.value, 'User data');
  } catch (e) { showToast(e.message, 'error'); return; }
  const body = {
    email: f.email.value,
    password: f.password.value,
    firstName: f.firstName.value || undefined,
    lastName: f.lastName.value || undefined,
    phone: f.phone.value || undefined,
    roleIds: Array.from(f.roles.selectedOptions).map((o) => o.value),
    status: f.status.value,
    data,
  };
  try {
    await api('/dashboard/api/users', { method: 'POST', body: JSON.stringify(body) });
    showToast('User created');
    closeModal('userModal');
    loadUsers();
  } catch (e) { showToast(e.message, 'error'); }
}

async function submitEditUser() {
  let data;
  try {
    data = parseJson(document.getElementById('editData').value, 'User data');
  } catch (e) { showToast(e.message, 'error'); return; }
  const body = {
    status: document.getElementById('editStatus').value,
    roleIds: selectedEditRoleIds(),
    data,
  };
  try {
    await api('/dashboard/api/users/' + currentEditUser.id, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    showToast('User updated');
    closeModal('userModal');
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

// ============ ROLES ============

async function loadRoles() {
  let roles;
  try {
    roles = await api('/dashboard/api/roles');
  } catch (e) {
    showToast(e.message, 'error');
    return;
  }
  rolesCache = roles;
  const tbody = document.getElementById('rolesBody');
  if (!roles.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:24px">No roles yet. Create one to get started.</td></tr>';
  } else {
    tbody.innerHTML = roles.map((r) => \`
      <tr>
        <td><span class="badge badge-role">\${esc(r.name)}</span></td>
        <td>\${esc(r.description || '—')}</td>
        <td>\${r.userCount}</td>
        <td>\${r.data ? '<code style="font-size:12px">' + esc(JSON.stringify(r.data).slice(0, 60)) + '</code>' : '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-primary btn-sm" onclick="openEditRole('\${r.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRole('\${r.id}')">Del</button>
        </td>
      </tr>\`).join('');
  }
}

function openCreateRole() {
  document.getElementById('roleModalTitle').textContent = 'Create Role';
  document.getElementById('roleCreateFormWrap').style.display = 'block';
  document.getElementById('roleEditFormWrap').style.display = 'none';
  document.getElementById('roleCreateForm').reset();
  document.getElementById('roleCreateData').value = '{}';
  document.getElementById('roleModal').classList.add('open');
}

async function openEditRole(id) {
  let role;
  try {
    role = await api('/dashboard/api/roles/' + id);
  } catch (e) {
    showToast(e.message, 'error');
    return;
  }
  currentEditRole = role;
  document.getElementById('roleModalTitle').textContent = 'Edit Role';
  document.getElementById('roleCreateFormWrap').style.display = 'none';
  document.getElementById('roleEditFormWrap').style.display = 'block';
  document.getElementById('roleEditName').value = role.name;
  document.getElementById('roleEditDesc').value = role.description || '';
  document.getElementById('roleEditData').value = role.data ? JSON.stringify(role.data, null, 2) : '';
  document.getElementById('roleModal').classList.add('open');
}

async function submitCreateRole(ev) {
  ev.preventDefault();
  const f = document.getElementById('roleCreateForm');
  let data;
  try {
    data = parseJson(f.data.value, 'Role data');
  } catch (e) { showToast(e.message, 'error'); return; }
  const body = {
    name: f.name.value,
    description: f.description.value || undefined,
    data,
  };
  try {
    await api('/dashboard/api/roles', { method: 'POST', body: JSON.stringify(body) });
    showToast('Role created');
    closeModal('roleModal');
    loadRoles();
  } catch (e) { showToast(e.message, 'error'); }
}

async function submitEditRole() {
  let data;
  try {
    data = parseJson(document.getElementById('roleEditData').value, 'Role data');
  } catch (e) { showToast(e.message, 'error'); return; }
  const body = {
    name: document.getElementById('roleEditName').value,
    description: document.getElementById('roleEditDesc').value || undefined,
    data,
  };
  try {
    await api('/dashboard/api/roles/' + currentEditRole.id, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    showToast('Role updated');
    closeModal('roleModal');
    loadRoles();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteRole(id) {
  if (!confirm('Delete this role? Users assigned to it must be reassigned first.')) return;
  try {
    await api('/dashboard/api/roles/' + id, { method: 'DELETE' });
    showToast('Role deleted');
    loadRoles();
  } catch (e) { showToast(e.message, 'error'); }
}

async function logout() {
  await fetch('/dashboard/logout', { method: 'POST' });
  location.href = '/';
}

// init
(async () => {
  await loadRolesForSelect();
  fillRoleFilter();
  loadUsers();
})();
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
    <div class="tabs">
      <button class="tab active" data-tab="users" onclick="switchTab('users')">Users</button>
      <button class="tab" data-tab="roles" onclick="switchTab('roles')">Roles</button>
    </div>

    <div id="usersPane">
      <div class="card">
        <div class="row" style="margin-bottom:8px">
          <div class="field">
            <label>Search</label>
            <input id="search" placeholder="email, name, phone" style="width:220px" onkeydown="if(event.key==='Enter')applyFilters()" />
          </div>
          <div class="field">
            <label>Role</label>
            <select id="filterRole" onchange="applyFilters()"><option value="">Loading…</option></select>
          </div>
          <div class="field">
            <label>Status</label>
            <select id="filterStatus" onchange="applyFilters()">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button class="btn btn-clear" onclick="applyFilters()">Apply</button>
          <button class="btn btn-clear" onclick="resetFilters()">Reset</button>
          <button class="btn btn-primary" style="margin-left:auto" onclick="openCreateUser()">+ Create User</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="usersBody"><tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">Loading…</td></tr></tbody>
        </table>
        <div id="pagination" class="pagination"></div>
        <div class="meta">Use the REST API at <code>/api/users</code> and <code>/api/roles</code> with a Bearer token for programmatic access.</div>
      </div>
    </div>

    <div id="rolesPane" style="display:none">
      <div class="card">
        <div class="row" style="margin-bottom:8px">
          <div class="field">
            <label>Roles</label>
            <small class="data-hint">Create, edit or delete configurable roles with arbitrary JSON data.</small>
          </div>
          <button class="btn btn-primary" style="margin-left:auto" onclick="openCreateRole()">+ Create Role</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Users</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="rolesBody"><tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:24px">Loading…</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- User modal -->
  <div class="modal" id="userModal">
    <div class="modal-box">
      <h3 id="userModalTitle">User</h3>
      <div id="createFormWrap">
        <form id="userCreateForm" onsubmit="submitCreateUser(event)">
          <div class="field"><label>Email</label><input name="email" type="email" required /></div>
          <div class="field"><label>Password (min 8, upper/lower/number)</label><input name="password" type="password" required minlength="8" /></div>
          <div class="field"><label>First name</label><input name="firstName" /></div>
          <div class="field"><label>Last name</label><input name="lastName" /></div>
          <div class="field"><label>Phone</label><input name="phone" /></div>
          <div class="field"><label>Roles</label><select id="createRoles" name="roles" multiple size="4"></select><small class="data-hint">Ctrl/Cmd to select multiple</small></div>
          <div class="field"><label>Status</label><select name="status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
          <div class="field"><label>User data (JSON)</label><textarea id="userCreateData" name="data">{}</textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-clear" onclick="closeModal('userModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>

      <div id="editFormWrap" style="display:none">
        <div class="field"><label>Roles</label><div id="editRoles" class="role-select">Loading…</div></div>
        <div class="field"><label>Status</label><select id="editStatus"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
        <div class="field"><label>User data (JSON)</label><textarea id="editData"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-clear" onclick="closeModal('userModal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitEditUser()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Role modal -->
  <div class="modal" id="roleModal">
    <div class="modal-box">
      <h3 id="roleModalTitle">Role</h3>
      <div id="roleCreateFormWrap">
        <form id="roleCreateForm" onsubmit="submitCreateRole(event)">
          <div class="field"><label>Name</label><input name="name" required maxlength="64" placeholder="e.g. MODERATOR" /></div>
          <div class="field"><label>Description</label><input name="description" maxlength="255" /></div>
          <div class="field"><label>Data (JSON)</label><textarea id="roleCreateData" name="data">{}</textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-clear" onclick="closeModal('roleModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
      <div id="roleEditFormWrap" style="display:none">
        <div class="field"><label>Name</label><input id="roleEditName" required maxlength="64" /></div>
        <div class="field"><label>Description</label><input id="roleEditDesc" maxlength="255" /></div>
        <div class="field"><label>Data (JSON)</label><textarea id="roleEditData"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-clear" onclick="closeModal('roleModal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitEditRole()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast toast-success"></div>
  <script>${DASHBOARD_JS}</script>`;
  return layout('Dashboard', body);
}
