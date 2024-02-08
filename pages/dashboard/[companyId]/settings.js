import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useUser, deleteCompany, disableEmails, editCompanyWebsite, uploadLogoImage, editCompanyHandle } from '@/utils/useUser';
import { useCompany } from '@/utils/CompanyContext';
import SEOMeta from '@/components/SEOMeta'; 
import { Switch } from '@headlessui/react';
import { classNames, checkValidUrl, slugifyString } from '@/utils/helpers';
import Button from '@/components/ui/Button'; 
import toast from 'react-hot-toast';

export default function companiesettingsPage() {
  const router = useRouter();
  const { user, userFinderLoaded } = useUser();
  const { activeCompany } = useCompany();
  const [urlLoading, setUrlLoading] = useState(false);
  const [handleLoading, setHandleLoading] = useState(false);
  const [websiteUrlInput, setWebsiteUrlInput] = useState(null);
  const [companyHandleInput, setCompanyHandleInput] = useState(null);
  const [urlValid, setUrlValid] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const fileInput = useRef(null);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this company?')){
      await deleteCompany(router?.query?.companyId).then((result) => {
        if(result === "success"){
          window.location.href = "/dashboard";
        } else {
          toast.error('There was an error saving your changes.');
        }
      });
    }
  };

  const handleFileUpload = async (e) => {
    if(e.target.files[0].name?.includes("png") && e.target.files[0].size < 2000000){
      await uploadLogoImage(router?.query?.companyId, e.target.files[0]).then((result) => {
        console.log("UPlOADED!!!!")
        console.log(result)
        if(result){
          setLogoError(false);
          router.replace(window.location.href);
        } else {
          toast.error('There was an error when uploading your image. Please make sure that it is a PNG file and is less than 2mb.');
        }
      });
    } else {
      setLogoError(true);
      return false;
    }
  };

  const handleDisableEmails = async (type) => {    
    await disableEmails(router?.query?.companyId, type).then((result) => {
      if(result === "success"){
        window.location.href = window.location.href;
      } else {
        toast.error('Unable to change email notification status. Please try again later.');
      }
    });
  };

  const handleWebsiteUpdate = async (e) => {

    e.preventDefault();

    if(urlLoading === true){
      return false;
    }

    const formData = new FormData(e.target);
    const data = {};
 
    for (let entry of formData.entries()) {
      data[entry[0]] = entry[1];
    }

    setUrlLoading(true);

    await editCompanyWebsite(router?.query?.companyId, data).then((result) => {
      if(result === "success"){
        router.replace(window.location.href);

      } else {
        toast.error('There was an error saving your changes.');
      }

      setUrlLoading(false);
    });

  };

  const handleCompanyHandleUpdate = async (e) => {

    e.preventDefault();

    if(handleLoading === true){
      return false;
    }

    const formData = new FormData(e.target);
    const data = {};
 
    for (let entry of formData.entries()) {
      data[entry[0]] = entry[1];
    }

    setHandleLoading(true);

    await editCompanyHandle(router?.query?.companyId, data).then((result) => {
      if(result === "success"){
        router.replace(window.location.href);

      } else {
        if(result === "duplicate"){
          toast.error('This handle already exists. Please try another.');
        } else {
          toast.error('There was an error saving your changes.');
        }
      }

      setHandleLoading(false);
    });

  };

  useEffect(() => {
    if(userFinderLoaded){
      if (!user) router.replace('/signin');
    }
  }, [userFinderLoaded, user, activeCompany]);
  
  return (
    <>
      <SEOMeta title="Settings"/>
      <div className="pb-10 mb-12 border-b-4">
        <div className="pt-10 wrapper">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-extrabold">Company Settings</h1>
        </div>
      </div>
      <div className="wrapper">
        <div className="bg-white shadow-lg rounded-xl mt-5 max-w-3xl border-4 border-gray-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Company logo</h3>
            <div className="mt-2 max-w-2xl text-gray-500">
              <p>This will be shown when inviting new affiliates, as well as inside your affiliates dashboard.</p>
            </div>
            <div>
              <div className="mt-3 flex items-center">
                {
                  activeCompany?.company_image !== null &&
                  <img alt="Logo" src={process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL+activeCompany?.company_image} className="w-24 h-auto mr-4"/>
                }
                <input
                  onChange={handleFileUpload}
                  type="file"
                  accept="image/png"
                  style={{display: 'none'}}
                  multiple={false}
                  ref={fileInput}
                />
                <button 
                  type="button"
                  className="bg-white py-3 px-5 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" 
                  onClick={() => fileInput.current.click()}
                >
                  Upload File
                </button>
              </div>
              <p className="mt-2 text-gray-500">
                Must be a .PNG file and less than 2mb.
              </p>
              {
                logoError &&
                <div className="mt-4 bg-red p-4 rounded-lg text-md text-white text-center">
                  There was an error when uploading your file.
                </div>
              }
            </div>
          </div>
        </div>
        <form action="#" method="POST" onSubmit={handleWebsiteUpdate} className="bg-white shadow-lg rounded-xl mt-5 max-w-3xl border-4 border-gray-200">
          <div className="p-6 sm:p-8">
            <div>
              <label for="company_url" className="text-lg leading-6 font-medium text-gray-900 mb-2">Company Website</label>
              <div>
                <div className="mt-1 flex items-center h-14 mb-3">
                  <div className="h-full bg-gray-100 flex items-center justify-center p-3 rounded-lg rounded-tr-none rounded-br-none border-2 border-r-0 border-gray-300">
                    <span>https://</span>
                  </div>
                  <input
                    minLength="3"
                    maxLength="25"
                    required
                    defaultValue={activeCompany?.company_url}
                    placeholder="https://mywebsite.com"
                    type="text"
                    name="company_url"
                    id="company_url"
                    autoComplete="company_url"
                    className="flex-1 block w-full min-w-0 h-full focus:outline-none sm:text-md rounded-lg rounded-tl-none rounded-bl-none border-2 border-l-0 border-gray-300"
                    onChange={e=>{setUrlValid(checkValidUrl(e.target.value)), urlValid ? setWebsiteUrlInput(e.target.value) : setWebsiteUrlInput(null)}}
                  />
                </div>
                <p className="text-gray-500">Please only include the base domain of your website (e.g. google.com). You do not need to include https:// or www. We will automatically do this on our end.</p>
              </div>
            </div>
          </div>
          {
            websiteUrlInput !== null && websiteUrlInput !== activeCompany?.company_url && urlValid &&
            <div className="border-t-4 p-6 bg-white flex items-center justify-start">
              <Button
                medium
                primary
                disabled={urlLoading}
              >
                <span>{urlLoading ? 'Saving Changes...' : 'Save Changes'}</span>
              </Button>
            </div>
          }
          {
            !urlValid && urlValid !== null &&
            <div className="border-t-4 p-6 bg-white flex items-center justify-start">
              <div className="bg-red-600 text-center p-4 rounded-lg">
                <p className="text-white text-sm font-medium">The URL you entered is not valid. Please check it and try again.</p>
              </div>
            </div>
          }
        </form>
        <form action="#" method="POST" onSubmit={handleCompanyHandleUpdate} className="bg-white shadow-lg rounded-xl mt-5 max-w-3xl border-4 border-gray-200">
          <div className="p-6 sm:p-8">
            <div>
              <label for="company_handle" className="text-lg leading-6 font-medium text-gray-900 mb-2">Company Handle</label>
              <div>
                <div className="mt-1 flex items-center h-14 mb-3">
                  <div className="h-full bg-gray-100 flex items-center justify-center p-3 rounded-lg rounded-tr-none rounded-br-none border-2 border-r-0 border-gray-300">
                    <span>{process.env.NEXT_PUBLIC_AFFILIATE_SITE_URL}/</span>
                  </div>
                  <input
                    minLength="3"
                    maxLength="25"
                    required
                    value={companyHandleInput !== null ? companyHandleInput : activeCompany?.company_handle && activeCompany?.company_handle}
                    placeholder="companyHandle"
                    type="text"
                    name="company_handle"
                    id="company_handle"
                    autoComplete="company_handle"
                    className="flex-1 block w-full min-w-0 h-full focus:outline-none sm:text-md rounded-lg rounded-tl-none rounded-bl-none border-2 border-l-0 border-gray-300"
                    onChange={e=>{setCompanyHandleInput(slugifyString(e.target.value))}}
                  />
                </div>
                <p className="text-gray-500">Your company handle is used for shareable links, including the link that affiliates see to join your campaign.</p>
              </div>
            </div>
          </div>
          {
            companyHandleInput !== null && companyHandleInput !== activeCompany?.company_handle &&
            <div className="border-t-4 p-6 bg-white flex items-center justify-start">
              <Button
                medium
                primary
                disabled={handleLoading}
              >
                <span>{handleLoading ? 'Saving Changes...' : 'Save Changes'}</span>
              </Button>
            </div>
          }
          {
            !urlValid && urlValid !== null &&
            <div className="border-t-4 p-6 bg-white flex items-center justify-start">
              <div className="bg-red-600 text-center p-4 rounded-lg">
                <p className="text-white text-sm font-medium">The URL you entered is not valid. Please check it and try again.</p>
              </div>
            </div>
          }
        </form>
        <div className="bg-white shadow-lg rounded-xl mt-5 max-w-3xl border-4 border-gray-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Email notifications</h3>
            <div className="mt-2 max-w-2xl text-gray-500">
              <p>When enabled, you will receive email notifications for this company whenever you receive a new sale via commission or affiliate signup.</p>
            </div>
            <div className="mt-5">
              <Switch
                checked={!activeCompany?.disable_emails}
                onChange={e=>{handleDisableEmails(activeCompany?.disable_emails ? false  : true)}}
                className={classNames(
                  !activeCompany?.disable_emails ? 'bg-green-600' : 'bg-red-600',
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200'
                )}
              >
                <span className="sr-only">Use setting</span>
                <span
                  aria-hidden="true"
                  className={classNames(
                    !activeCompany?.disable_emails ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                  )}
                />
              </Switch>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl mt-6 max-w-3xl border-4 border-gray-200">
          <div className="p-6 sm:p-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danger zone</h3>
            <div className="mt-2 max-w-2xl text-gray-500">
              <p>Once you delete your company, you will lose all data, including all campaigns and affiliates associated with it.</p>
            </div>
            <div className="mt-5">
              <button
                onClick={e=>{handleDelete()}}
                type="button"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete company
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}