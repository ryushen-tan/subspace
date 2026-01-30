import { Link } from 'react-router-dom';
import { useAuthStore } from '../state/useAuthStore';

/**
 * Link for "su3" / "Try su3" entry: signed in → dashboard, not signed in → signup.
 */
const Su3EntryLink = ({ children, className, ...rest }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const to = isAuthenticated ? '/dashboard' : '/signup';
  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  );
};

export default Su3EntryLink;
