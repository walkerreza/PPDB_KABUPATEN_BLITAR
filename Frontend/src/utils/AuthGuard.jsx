import { Navigate, useLocation } from 'react-router-dom';

const getUserData = () => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

export const AuthGuard = ({ children, allowedGroups }) => {
  const location = useLocation();
  const userData = getUserData();

  if (!userData || !userData.token) {
    // Redirect ke login jika tidak ada token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedGroups.includes(userData.id_grup_user)) {
    // Redirect ke halaman sesuai dengan peran pengguna
    const id_grup_user = userData.id_grup_user;
    
    switch(parseInt(id_grup_user)) {
      case 1: // Dinas
        return <Navigate to="/superadmin" replace />;
      case 2: // Sekolah
        return <Navigate to="/admin" replace />;
      case 3: // Pendaftar
        return <Navigate to="/user" replace />;
      case 4: // Operator Bidang PAUD/TK
      case 5: // Operator Bidang SD
      case 6: // Operator Bidang SMP
      case 7: // Operator Bidang KEMENAG
        return <Navigate to="/superadmin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Guard untuk Pendaftar (User)
export const UserGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[3]}>{children}</AuthGuard>;
};

// Guard untuk Admin Dinas dan Operator Bidang
export const SuperAdminGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[1, 4, 5, 6, 7]}>{children}</AuthGuard>;
};

// Guard untuk Admin Sekolah
export const AdminGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[2]}>{children}</AuthGuard>;
};

// Guard untuk Operator Bidang PAUD/TK
export const PaudTkGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[1, 4]}>{children}</AuthGuard>;
};

// Guard untuk Operator Bidang SD
export const SdGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[1, 5]}>{children}</AuthGuard>;
};

// Guard untuk Operator Bidang SMP
export const SmpGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[1, 6]}>{children}</AuthGuard>;
};

// Guard untuk Operator Bidang KEMENAG
export const KemenagGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[1, 7]}>{children}</AuthGuard>;
};

// Guard untuk Media & Informasi (hanya DINAS)
export const MediaInfoGuard = ({ children }) => {
  return <AuthGuard allowedGroups={[1]}>{children}</AuthGuard>;
};
