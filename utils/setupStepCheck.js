import { useRouter } from 'next/router';
import { useCompany } from '@/utils/CompanyContext';
import { useCampaign } from '@/utils/CampaignContext';

export default function setupStepCheck() {
  const router = useRouter();
  const { activeCompany } = useCompany();
  const { userCampaignDetails } = useCampaign();

  if(activeCompany){
    if(activeCompany?.stripe_account_data === null || activeCompany?.stripe_id === null){
      router.replace(`/dashboard/${router?.query?.companyId}/setup/stripe`);
    }
  
    if(activeCompany?.stripe_account_data !== null && activeCompany?.stripe_id !== null && activeCompany?.company_currency === null){
      router.replace(`/dashboard/${router?.query?.companyId}/setup/currency`);
    }
  
    if(activeCompany?.stripe_account_data !== null && activeCompany?.stripe_id !== null && activeCompany?.company_currency !== null && userCampaignDetails?.length === 0){
      router.replace(`/dashboard/${router?.query?.companyId}/setup/campaign`);
    }
  
    if(activeCompany?.stripe_account_data !== null && activeCompany?.stripe_id !== null && activeCompany?.company_currency !== null && userCampaignDetails !== null && userCampaignDetails?.length > 0){
      router.replace(`/dashboard/${router?.query?.companyId}/setup/add`);
    }

    if(activeCompany?.domain_verified === true){
      router.replace(`/dashboard/${router?.query?.companyId}/setup/verify`);
    }
  }
  
}