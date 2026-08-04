let loggingOut = false;

export const forceLogout = (expired = false) => {
  if (loggingOut) return;
  loggingOut = true;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  const currentPath = window.location.pathname;
  const isAdmissionPath = currentPath.startsWith('/admission');
  const targetLogin = isAdmissionPath ? '/admission/login' : '/login';

  if (currentPath === targetLogin) {
    loggingOut = false;
    return;
  }

  const targetUrl = expired ? `${targetLogin}?expired=true` : targetLogin;
  window.location.replace(targetUrl);
};
