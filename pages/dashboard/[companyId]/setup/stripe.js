import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUser } from '@/utils/useUser';
import SetupProgress from '@/components/ui/SetupProgress'; 
import Button from '@/components/ui/Button'; 
import StripeConnect from '@/components/icons/StripeConnect'; 
import { useCompany } from '@/utils/CompanyContext';
import SEOMeta from '@/components/SEOMeta'; 

export default function StripeSetupPage() {
  const router = useRouter();
  const { user, userFinderLoaded } = useUser();
  const { activeCompany } = useCompany();

  useEffect(() => {
    if(userFinderLoaded){
      if (!user) router.replace('/signin');
    }
  }, [userFinderLoaded, user]);
  
  return (
    <>
      <SEOMeta title="Connect Stripe Account"/>
      <div className="py-12 border-b-4 border-gray-300">
        <div className="wrapper">
          <SetupProgress/>
        </div>
      </div>
      <div className="pt-12 mb-6">
        <div className="wrapper">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-extrabold">Connect your Stripe account</h1>
        </div>
      </div>
      <div className="wrapper">
        <div className="rounded-xl bg-white max-w-2xl overflow-hidden shadow-lg border-4 border-gray-300 p-6">
          {
            activeCompany?.stripe_account_data !== null && activeCompany?.stripe_id !== null ?
              <div>
                <p className="text-lg mb-3">Your Stripe account is connected.</p>
                <div className="mb-3">
                  <p className="text-xl leading-6 font-semibold text-gray-900">Account name:</p>
                  <p>{activeCompany?.stripe_account_data?.business_profile?.name}</p>
                </div>
                <div className="mb-8 pb-8 border-b-4">
                  <p className="text-xl leading-6 font-semibold text-gray-900">Stripe ID:</p>
                  <p>{activeCompany?.stripe_id}</p>
                </div>
                <Button
                  large
                  primary
                  href={`/dashboard/${router?.query?.companyId}/setup/currency`}
                >
                  <span>Next Step</span>
                </Button>
              </div>
            :
              <div>
                <a 
                  href={`https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&scope=read_write`}
                  target="_blank"
                >
                  <StripeConnect className="w-52 h-auto"/>
                </a>
              </div>
          }
        </div>
      </div>
    </>
  );
}