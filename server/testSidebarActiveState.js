const assert = require('assert');

function isItemActive(itemPath, pathname) {
  const ROUTES = {
    DASHBOARD: '/dashboard',
    COMPANIES: '/companies',
    LIBRARY: '/library',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    ADMIN_COMPANY_ADD: '/admin/companies/add',
  };

  // Admin Routes
  if (itemPath === '/admin/companies') {
    return (
      pathname === '/admin' ||
      pathname === '/admin/companies' ||
      (pathname.startsWith('/admin/companies/') && pathname !== '/admin/companies/add' && pathname !== ROUTES.ADMIN_COMPANY_ADD)
    );
  }
  if (itemPath === '/admin/companies/add' || itemPath === ROUTES.ADMIN_COMPANY_ADD) {
    return pathname === '/admin/companies/add' || pathname === ROUTES.ADMIN_COMPANY_ADD;
  }
  if (itemPath === '/admin/students') {
    return pathname === '/admin/students' || pathname.startsWith('/admin/students/');
  }
  if (itemPath === '/admin/settings') {
    return pathname === '/admin/settings' || pathname.startsWith('/admin/settings/');
  }

  // Student Platform Routes
  if (itemPath === ROUTES.COMPANIES) {
    return (
      pathname === ROUTES.COMPANIES ||
      (pathname.startsWith('/companies/') && !pathname.startsWith('/admin'))
    );
  }
  if (itemPath === ROUTES.DASHBOARD) {
    return pathname === ROUTES.DASHBOARD;
  }
  if (itemPath === ROUTES.LIBRARY) {
    return pathname === ROUTES.LIBRARY;
  }
  if (itemPath === ROUTES.PROFILE) {
    return pathname === ROUTES.PROFILE || pathname.startsWith('/profile');
  }
  if (itemPath === ROUTES.SETTINGS) {
    return pathname === ROUTES.SETTINGS;
  }

  return pathname === itemPath;
}

const adminItems = [
  { name: 'Company Management', path: '/admin/companies' },
  { name: 'Add Company', path: '/admin/companies/add' },
  { name: 'Student Directory', path: '/admin/students' },
  { name: 'Admin Settings', path: '/admin/settings' },
];

function getActiveAdminItems(pathname) {
  return adminItems.filter((item) => isItemActive(item.path, pathname)).map((i) => i.name);
}

console.log('Testing Admin Sidebar Route Active States:');

// Test Case 1: /admin/companies
let active = getActiveAdminItems('/admin/companies');
console.log('Route /admin/companies -> Active:', active);
assert.deepStrictEqual(active, ['Company Management']);

// Test Case 2: /admin/companies/add
active = getActiveAdminItems('/admin/companies/add');
console.log('Route /admin/companies/add -> Active:', active);
assert.deepStrictEqual(active, ['Add Company']);

// Test Case 3: /admin/companies/:id (Detail page)
active = getActiveAdminItems('/admin/companies/2397948c-b9a8-4e28-a23e-1804722dd0e9');
console.log('Route /admin/companies/:id -> Active:', active);
assert.deepStrictEqual(active, ['Company Management']);

// Test Case 4: /admin/students
active = getActiveAdminItems('/admin/students');
console.log('Route /admin/students -> Active:', active);
assert.deepStrictEqual(active, ['Student Directory']);

// Test Case 5: /admin/settings
active = getActiveAdminItems('/admin/settings');
console.log('Route /admin/settings -> Active:', active);
assert.deepStrictEqual(active, ['Admin Settings']);

// Test Case 6: /admin root
active = getActiveAdminItems('/admin');
console.log('Route /admin -> Active:', active);
assert.deepStrictEqual(active, ['Company Management']);

// Test Case 7: /companies (student route)
active = getActiveAdminItems('/companies');
console.log('Route /companies -> Active Admin Items:', active);
assert.deepStrictEqual(active, []);

console.log('\n🎉 ALL ADMIN SIDEBAR ACTIVE ROUTE TESTS PASSED 100%!');
