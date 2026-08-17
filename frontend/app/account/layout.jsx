import AccountSidebar from '../../components/AccountSidebar';

// Below `lg` this renders as a plain pass-through (no extra markup effect
// on layout), so mobile keeps its existing full-page nav-in/back-out
// behavior exactly as before. From `lg` up, the sidebar becomes visible
// and the page content sits beside it as the right-hand pane.
export default function AccountLayout({ children }) {
  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <AccountSidebar />
      <div className="lg:min-w-0 lg:flex-1">{children}</div>
    </div>
  );
}
