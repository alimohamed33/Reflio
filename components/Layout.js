import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Navbar from '@/components/ui/Navbar';

export default function Layout({ children, meta: pageMeta }) {
  const Toaster = dynamic(() =>
    import("react-hot-toast").then((module) => module.Toaster)
  );
  const Footer = dynamic(() => import('@/components/ui/Footer'));
  const AdminMobileNav = dynamic(() => import('@/components/ui/AdminNavbar/AdminMobileNav'));
  const AdminDesktopNav = dynamic(() => import('@/components/ui/AdminNavbar/AdminDesktopNav'));
  const SimpleNav = dynamic(() => import('@/components/ui/SimpleNav'));
  const StripeDisconnectNotice = dynamic(() => import('@/components/ui/StripeDisconnectNotice'));
  const router = useRouter();
  let defaultPage = true;
  let dashboardPage = false;
  let simplePage = false;

  if(router.pathname.indexOf('/dashboard') === -1 && router.pathname.indexOf('/dashboard/add-company') === -1 && router.pathname.indexOf('/dashboard/create-team') === -1){
    defaultPage = true;
    dashboardPage = false;
    simplePage = false;
  }

  if(router.pathname === '/dashboard/add-company' || router.pathname === '/dashboard/create-team'){
    defaultPage = false;
    dashboardPage = false;
    simplePage = true;
  }

  if(router.pathname.indexOf('/dashboard') > -1 && simplePage !== true){
    defaultPage = false;
    dashboardPage = true;
    simplePage = false;
  }

  return (
    <>
      <>
        <Toaster
          position="bottom-center"
          reverseOrder={true}
          gutter={20}
          toastOptions={{
            className: '',
            duration: 5000,
            style: {
              background: '#fff',
              color: '#111827',
            },
            // Default options for specific types
            success: {
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              style: {
                background: '#DC2626',
                color: 'white',
              },
            },
          }}
        />
        {
          defaultPage === true &&
          <Navbar />
        }
        { 
          simplePage === true &&
          <SimpleNav/>
        }
        {
          defaultPage === true ?
            <main id="skip">{children}</main>
          : simplePage === true ?
            <main id="skip">{children}</main>
          : dashboardPage === true ?
            <div className="h-screen flex overflow-hidden">
              <AdminDesktopNav/>
              <div className="flex-1 overflow-auto focus:outline-none">
                <StripeDisconnectNotice/>
                <AdminMobileNav/>
                <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
                  <>
                    {children}
                  </>
                </main>
              </div>
            </div>
          : <main id="skip">{children}</main>
        }
        {
          defaultPage === true &&
          <Footer />
        }
      </>
    </>
  );
}
