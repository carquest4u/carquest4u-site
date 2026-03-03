(function(){
  const key = 'cqx_admin_ok';
  const expected = window.CQX_ADMIN_PASSWORD || 'carquest4u-admin';
  if (sessionStorage.getItem(key) === '1') return;
  const pwd = window.prompt('Admin password required');
  if (pwd === expected){
    sessionStorage.setItem(key, '1');
    return;
  }
  document.body.innerHTML = '<main style="font-family:Arial,sans-serif;padding:2rem;max-width:760px;margin:0 auto;"><h1>Access denied</h1><p>Invalid password. Reload page and try again.</p></main>';
  throw new Error('Unauthorized');
})();
