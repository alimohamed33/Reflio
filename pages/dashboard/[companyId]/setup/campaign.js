import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUser } from '@/utils/useUser';
import SetupProgress from '@/components/ui/SetupProgress'; 
import SEOMeta from '@/components/SEOMeta'; 
import Button from '@/components/ui/Button'; 
import { useCompany } from '@/utils/CompanyContext';
import { useCampaign } from '@/utils/CampaignContext';
import CampaignForm from '@/components/ui/Forms/CampaignForm'; 

export default function AddCompany() {
  const router = useRouter();
  const { user, userFinderLoaded } = useUser();
  const { activeCompany } = useCompany();
  const { userCampaignDetails } = useCampaign();

  useEffect(() => {
    if(userFinderLoaded){
      if (!user) router.replace('/signin');
    }
  }, [userFinderLoaded, user]);

  return (
    <>
      <SEOMeta title="Create a Campaign"/>
      <div className="py-12 border-b-4 border-gray-300">
        <div className="wrapper">
          <SetupProgress/>
        </div>
      </div>
      <div className="pt-12 mb-6">
        <div className="wrapper">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-extrabold">Create a campaign</h1>
        </div>
      </div>
      <div className="wrapper">
        {
          userCampaignDetails !== null && userCampaignDetails?.length > 0 ?
            <div>
              <p className="text-lg mb-3">Your first campaign is ready.</p>
              <div className="mb-3">
                <p className="text-xl leading-6 font-semibold text-gray-900">Campaign name:</p>
                <p>{userCampaignDetails[0]?.campaign_name}</p>
              </div>
              <div className="mb-3">
                <p className="text-xl leading-6 font-semibold text-gray-900">Commission:</p>
                {
                  userCampaignDetails[0]?.commission_type === "percentage" ?
                    <p>{userCampaignDetails[0]?.commission_value}%</p>
                  :
                    <p>{activeCompany?.company_currency}{userCampaignDetails[0]?.commission_value}</p>
                }
                <p>{userCampaignDetails[0]?.commi}</p>
              </div>
              <div className="mb-8">
                <a className="underline font-semibold" href={`/dashboard/${router?.query?.companyId}/campaigns/${userCampaignDetails[0]?.campaign_id}`}>Edit campaign</a>
              </div>
              <div className="pt-8 border-t-4">
                <Button
                  large
                  primary
                  href={`/dashboard/${router?.query?.companyId}/setup/add`}
                >
                  <span>Next step</span>
                </Button>
              </div>
            </div>
          :
            <CampaignForm setupMode={true}/>
        }
      </div>
    </>
  );
}