import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { IconChart, IconDrop, IconGear, IconGrid, IconReceipt, IconRoom, IconSplit } from './Icons';
import LanguageSwitch from './LanguageSwitch';

const links = [
  { to: '/', label: 'nav.dashboard', icon: IconGrid, end: true },
  { to: '/wash', label: 'nav.wash', icon: IconDrop },
  { to: '/expenses', label: 'nav.expenses', icon: IconReceipt },
  { to: '/distribution', label: 'nav.distribution', icon: IconSplit },
  { to: '/rent', label: 'nav.rent', icon: IconRoom },
  { to: '/reports', label: 'nav.reports', icon: IconChart },
  { to: '/settings', label: 'nav.settings', icon: IconGear },
];

export default function Layout() {
  const { user, logout, computerName } = useAuth();
  const { t } = useI18n();
  const computer = computerName || t('computer.this');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo light">
          <span className="logo-mark" aria-hidden="true">Z</span>
          <span>
            <strong>{t('brand.name')}</strong>
            <small>{t('brand.sub')}</small>
          </span>
        </div>
        <p className="shop-name">{computer}</p>
        <nav className="nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <Icon />
                <span>{t(link.label)}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <LanguageSwitch />
          <span>{t('nav.signedIn')} {user?.username}</span>
          <button type="button" className="btn ghost tiny" onClick={logout}>{t('nav.signOut')}</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
        <p className="storage-note">{t('nav.offline', { computer })}</p>
      </main>
    </div>
  );
}
