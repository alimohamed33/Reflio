import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import '@/assets/main.css';
import '@/assets/chrome-bug.css';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import SEOMeta from '@/components/SEOMeta'; 

export default function MyApp({ Component, pageProps }) {
  const UserContextProvider = dynamic(() =>
    import("@/utils/useUser").then((module) => module.UserContextProvider)
  );
  const CompanyContextProvider = dynamic(() =>
    import("@/utils/CompanyContext").then((module) => module.CompanyContextProvider)
  );
  const CampaignContextProvider = dynamic(() =>
    import("@/utils/CampaignContext").then((module) => module.CampaignContextProvider)
  );
  const AffiliateContextProvider = dynamic(() =>
    import("@/utils/AffiliateContext").then((module) => module.AffiliateContextProvider)
  );
  const router = useRouter();
  
  useEffect(() => {
    document.body.classList?.remove('loading');

    if(router?.asPath?.indexOf("&token_type=bearer&type=recovery") > 0) {
      let access_token = router?.asPath?.split("access_token=")[1].split("&")[0];
      router.push('/reset-password?passwordReset=true&access_token='+access_token+'');
    }
  }, []);

  if(typeof window !== 'undefined' && window.location.href.includes('sign') && window.location.href.includes('reflio.com') && !window.location.href.includes('staging')){
    router.replace('/');
  }

  return (
    <>
      <SEOMeta/>
      <div>
        {
          router.pathname.indexOf('/dashboard') > -1 ?
            <UserContextProvider>
              <CompanyContextProvider>
                <CampaignContextProvider>
                  <AffiliateContextProvider>
                    <Layout>
                      <Component {...pageProps} />
                    </Layout>
                  </AffiliateContextProvider>
                </CampaignContextProvider>
              </CompanyContextProvider>
            </UserContextProvider>
          :
            <UserContextProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </UserContextProvider>
        }
      </div>
    </>
  );
}