// ── Student Credentials Vault ─────────────────────────────────────────────
// Allows teachers to view, copy, manage, and export student login credentials.

const STORAGE_KEY = 'hometask_student_credentials_vault_v1';

// Seed credentials for known test accounts & initial students
const SEED_CREDENTIALS = {
  'eldor@ilmla.uz': 'password123',
  'student@example.com': 'password123',
  'ali@example.com': 'password123',
  'madina@example.com': 'password123',
  'sardor@example.com': 'password123',
  'mohira@example.com': 'password123',
  'azizbek@example.com': 'password123',
};

function getVault() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...SEED_CREDENTIALS };
    return { ...SEED_CREDENTIALS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Error reading credentials vault from localStorage:', e);
    return { ...SEED_CREDENTIALS };
  }
}

function saveVault(vault) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
  } catch (e) {
    console.warn('Error saving credentials vault to localStorage:', e);
  }
}

/**
 * Get password for a student by id or email.
 * Falls back to a deterministic or seeded password if not set.
 */
export function getStudentPassword(student) {
  if (!student) return 'password123';
  if (student.studentPassword) return student.studentPassword;
  if (student.initialPassword) return student.initialPassword;

  const vault = getVault();
  const emailKey = (student.email || '').trim().toLowerCase();
  const idKey = student.id;

  if (emailKey && vault[emailKey]) return vault[emailKey];
  if (idKey && vault[idKey]) return vault[idKey];

  // Default fallback password for students created without recorded password
  return 'password123';
}

/**
 * Save / update password for a student.
 */
export function saveStudentPassword(student, newPassword) {
  if (!student || !newPassword) return;
  const vault = getVault();
  const emailKey = (student.email || '').trim().toLowerCase();
  const idKey = student.id;

  if (emailKey) vault[emailKey] = newPassword.trim();
  if (idKey) vault[idKey] = newPassword.trim();

  saveVault(vault);
}

/**
 * Format a single student's credentials for messaging apps (Telegram, WhatsApp, SMS).
 */
export function formatStudentInvite(student, password) {
  const pw = password || getStudentPassword(student);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hometask.uz';
  return [
    `🎓 *HomeTask Student Login Credentials*`,
    `👤 *Student:* ${student.firstName || ''} ${student.lastName || ''}`.trim(),
    `📧 *Email:* ${student.email || ''}`,
    `🔑 *Password:* ${pw}`,
    `🔗 *Login URL:* ${origin}/student/login`,
  ].join('\n');
}

/**
 * Format all students and their passwords as a clean text list.
 */
export function formatAllStudentsRoster(students) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hometask.uz';
  let out = `🎓 HomeTask — Student Roster & Credentials\nLogin URL: ${origin}/student/login\n` + '═'.repeat(45) + '\n\n';
  
  students.forEach((s, idx) => {
    const pw = getStudentPassword(s);
    out += `${idx + 1}. ${s.firstName} ${s.lastName}\n   Email: ${s.email}\n   Password: ${pw}\n\n`;
  });

  return out;
}

/**
 * Export students credentials as a downloadable CSV file.
 */
export function downloadCredentialsCsv(students) {
  const headers = ['First Name', 'Last Name', 'Email', 'Password', 'Role', 'Status'];
  const rows = students.map(s => [
    `"${(s.firstName || '').replace(/"/g, '""')}"`,
    `"${(s.lastName || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${getStudentPassword(s).replace(/"/g, '""')}"`,
    `"${s.role || 'STUDENT'}"`,
    `"${s.isActive !== false ? 'Active' : 'Inactive'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `students_roster_passwords_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
