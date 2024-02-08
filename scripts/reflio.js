const ReflioDomainRoot = 'http://localhost:3000';
const ReflioAPIRoot = ReflioDomainRoot+'/api/v1';
const rootDomain = window.location.host;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const reflioVerifyParam = urlParams.get("reflioVerify");
const reflioReferralParam = urlParams.get("via") ? urlParams.get("via") : urlParams.get("ref") ? urlParams.get("ref") : null;
let reflioReferralObject = localStorage.getItem('reflioReferral');
const reflioInnerScript = document.querySelector("script[data-reflio]");
let scrolledPercentage = (((document.documentElement.scrollTop + document.body.scrollTop) / (document.documentElement.scrollHeight - document.documentElement.clientHeight) * 100).toFixed(0));

//Define base Reflio class.
class rfl {
  details(){
    return({
      companyId: reflioInnerScript.getAttribute("data-reflio") ? reflioInnerScript.getAttribute("data-reflio") : null,
      rootDomain: rootDomain,
      domains: reflioInnerScript.getAttribute("data-domains") ? reflioInnerScript.getAttribute("data-domains") : null,
      hidePopup: reflioInnerScript.getAttribute("hidePopup") ? true : false,
      consentBypass: reflioInnerScript.getAttribute("consentBypass") ? true : false,
    })
  }
  async checkDomainVerification(){
    return await fetch(ReflioAPIRoot+'/verify-company').then(function(response) {
      return response.json();
    });
  }
  async impression(referralCode, companyId){
    if(!referralCode || !companyId) console.warn("Reflio: could not track impression. Referral code / companyId not found.");
    
    return await fetch(ReflioAPIRoot+'/record-impression', {
      method: 'POST',
      body: JSON.stringify({
        referralCode: referralCode,
        companyId: companyId
      }),
    }).then(function (response) {
      return response.json();
    })
  }
  async campaignDetails(referralCode, companyId){
    if(!referralCode || !companyId) console.warn("Reflio: could not get campaign details. Referral code / companyId not found.");
    
    return await fetch(ReflioAPIRoot+'/campaign-details', {
      method: 'POST',
      body: JSON.stringify({
        referralCode: referralCode,
        companyId: companyId
      }),
    }).then(function (response) {
      return response.json();
    })
  }
  checkCookie(){
    let name = "reflioData=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        try {
          return JSON.parse(c.substring(name.length, c.length))
        } catch (error) {
          return {
            "error": true
          };
        }
      }
    }
    return null;
  }
  deleteCookie(){
    document.cookie = 'reflioData=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    return "cookie_deleted";
  }
  consentRequired(){
    if(Reflio.details().consentBypass === true){
      return false;
    }

    if(Intl.DateTimeFormat().resolvedOptions().timeZone && Intl.DateTimeFormat().resolvedOptions().timeZone.indexOf("Europe") >= 0 && Reflio.details().consentBypass === false){
      return true;
    }

    return false;
  }
  cookieEligible(){
    if(reflioReferralParam !== null && Reflio.details().companyId !== null && Reflio.checkCookie() === null){
      return true;
    }

    return false;
  }
  cookieExists(){
    if(Reflio.checkCookie() === null){
      return false;
    }

    return true;
  }
  consentCleanup(){
    if(document.getElementById('reflio-confirm-modal')){
      document.getElementById('reflio-confirm-modal').parentNode.removeChild(document.getElementById('reflio-confirm-modal'));
    }
    if(document.getElementById('reflio-confirm')){
      document.getElementById('reflio-confirm').parentNode.removeChild(document.getElementById('reflio-confirm'));
    }
    if(document.getElementById('reflio-confirm-styles')){
      document.getElementById('reflio-confirm-styles').parentNode.removeChild(document.getElementById('reflio-confirm-styles'));
    }
    if(document.getElementById('reflio-consent')){
      document.getElementById('reflio-consent').parentNode.removeChild(document.getElementById('reflio-consent'));
    }
  }
  async register(){
    if(Reflio.cookieEligible() === true){
      if(document.getElementById('reflio-confirm-button')){
        document.getElementById('reflio-confirm-button').innerText = "Loading...";
      }

      const trackImpression = await Reflio.impression(reflioReferralParam, Reflio.details().companyId);
  
      //If multiple domains, add referral to other domain
      if(trackImpression?.referral_details && Reflio.details().domains){
        document.querySelectorAll("[href]").forEach(link => {
          if(Reflio.details().domains?.includes(",")){
            Reflio.details().domains.split(',').map(domain => {
              if(link.href?.includes(domain.trim()) && !link.href.includes(Reflio.details().rootDomain)){
                let baseUrl = new URL(link.href);
                let searchParams = baseUrl.searchParams;
                
                searchParams.set('ref', reflioReferralParam);
                
                baseUrl.search = searchParams.toString();
                
                let newUrl = baseUrl.toString();
        
                link.href = newUrl;
              }
            })
          }
        });
  
        if(trackImpression?.referral_details){
          //Set cookie
          document.cookie = `reflioData=${JSON.stringify(trackImpression?.referral_details)}; expires=${trackImpression?.referral_details?.cookie_date}`;
        } else {
          Reflio.consentCleanup();
        }
      }
    }    
  }
  async showPopup(){

    //If already denied popup, don't get campaign details etc and show popup again.
    if(localStorage.getItem('reflioNoConsent')) return false;

    //Gets public campaign details and discounts from API
    const campaign = await Reflio.campaignDetails(reflioReferralParam, Reflio.details().companyId);

    //If API call is invalid, don't show popup.
    if(!campaign?.campaign_details) return false;
    
    //Add cookie poup to body
    const popupHtml = `
      <div id="reflio-confirm-modal">
        <div id="reflio-confirm">
          <div id="reflio-content-top">
          ${campaign?.campaign_details?.discount_value !== null && campaign?.campaign_details?.discount_type === 'fixed' && campaign?.campaign_details?.company_currency ?
              "<p id='reflio-content-title'>You've earned <span>"+campaign?.campaign_details?.company_currency+""+campaign?.campaign_details?.discount_value+" off</span> from a referral.</p>"
            : campaign?.campaign_details?.discount_value !== null ?
              "<p id='reflio-content-title'>You've earned <span>"+campaign?.campaign_details?.discount_value+"% off</span> from a referral.</p>"
            :
              "<p id='reflio-content-title'>The person who sent you here can earn a referral."
          }
            <p id="reflio-content-subtitle">To receive the discount code, please confirm that you consent to using cookies.</p>
          </div>
          <div id="reflio-buttons">
            <div id="reflio-confirm-button">Accept cookie & get discount</div>
            <div id="reflio-cancel-button">No thanks</div>
          </div>
          <div id="reflio-content-bottom">
            <p>Please confirm that you're ok for a cookie to be set for our <span>privacy-friendly referral system</span>. The person who sent you here will earn a referral reward, and you'll be given a discount code to use on this site.</p>
          </div>
        </div>
      </div>
    `;
    if(!document.getElementById('reflio-confirm')){
      document.body.innerHTML += popupHtml;
    }
    
    setTimeout(() => {
      document.getElementById('reflio-confirm-modal').classList.add('reflio-appear');
    }, 500);

    //Add fresh stylesheet to body
    if(!document.getElementById('reflio-confirm-styles')){
      const popupStyles = `
        #reflio-confirm-modal {
          position: fixed;
          z-index: 2147483646;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          transition: all 0.4s ease-in-out;
          transition-delay: 1s;
        }
        #reflio-confirm-modal.reflio-appear {
          background-color: rgba(0,0,0,0.5);
        }
        #reflio-confirm {
          position: fixed;
          bottom: 0%;
          left: 50%;
          margin-bottom: 30px;
          transform: translate(-50%, 15%);
          text-align: center;
          font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";
          border-radius: 15px;
          overflow: hidden;
          z-index: 2147483647;
          background-color: #FFFFFF;
          border: 4px solid #c2c2c2;
          padding: 18px;
          width: 92%;
          max-width: 320px;
          box-shadow: 0 0 250px rgba(255,255,255,0.60);
          color: #000000;
          opacity: 0;
          transition: all 0.8s ease-in-out;
          transition-delay: 1.5s;
        }
        #reflio-confirm-modal.reflio-appear #reflio-confirm{
          opacity: 1;
          transform: translate(-50%, 0%);
        }
        #reflio-confirm * {
          box-sizing: border-box;
        }
        #reflio-content-top {
          width: 100%;
        }
        #reflio-content-title {
          font-size: 16px;
          line-height: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        #reflio-content-title span {
          text-decoration: underline; 
        }
        #reflio-content-subtitle {
          font-size: 15px;
          line-height: 20px;
        }
        #reflio-confirm-button {
          padding: 15px;
          border-radius: 15px;
          font-size: 16px;
          font-weight: bold;
          background: #ddd;
          cursor: pointer;
          margin-top: 15px;
          border: 2px solid #cccccc;
          color: #000;
        }
        #reflio-confirm-button:hover {
          background-color: #cccccc;
        }
        #reflio-cancel-button {
          margin-top: 10px;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
        }
        #reflio-content-bottom {
          width: 100%;
          margin-top: 15px;
          padding-bottom: 10px;
          border-top: 4px solid #e3e3e3;
        }
        #reflio-content-bottom p {
          margin-top: 15px;
          font-size: 13px;
          line-height: 18px;
          color: #848484;
        }
        #reflio-content-bottom span {
          font-weight: bold;
        }
        #reflio-buttons {
          width: 100%;
        }
        #reflio-discount-code {
          width: 100%;
        }
        #reflio-discount-code-input {
          font-size: 18px;
          font-weight: bold;
          padding: 10px 20px;
          background: #efefef;
          border: 4px solid #cccccc;
          width: 100%;
          display: block;
          margin-top: 10px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          text-align: center;
          color: #000;
        }
        #reflio-discount-code-text {
          margin-top: 10px;
        }
        #reflio-discount-code-text p {
          font-size: 14px;
          line-height: 19px;
          font-style: italic;
          font-weight: bold;
          color: #848484;
        }
        #reflio-close-button {
          margin-top: 10px;
          font-size: 16px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
          text-decoration: underline;
        }
      `;
      let styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.innerText = popupStyles;
      styleSheet.setAttribute('id','reflio-confirm-styles');
      document.head.appendChild(styleSheet);
    }

    //On popup confirm button click
    if(document.getElementById('reflio-confirm-button')){
      document.getElementById('reflio-confirm-button').addEventListener("click", function() {
        if(document.getElementById('reflio-buttons')){
          const buttonsReplace = `
            <div id="reflio-discount-code">
              <input value="${campaign?.campaign_details?.discount_code}" id="reflio-discount-code-input" type="text" name="reflio-discount-code-input"/>
            </div>
            <div>
              <div id="reflio-close-button">Close popup</div>
            </div>
          `;
          document.getElementById('reflio-buttons').innerHTML = buttonsReplace;

          if(document.getElementById('reflio-content-subtitle')){
            document.getElementById('reflio-content-subtitle').innerText = 'Use the below discunt code at checkout:';
          }

          if(document.getElementById('reflio-discount-code-input') && campaign?.campaign_details?.discount_code){
            document.getElementById('reflio-discount-code-input').addEventListener("click", function() {
              document.getElementById('reflio-discount-code-input').select();
              document.execCommand('copy');
              document.getElementById('reflio-discount-code').innerHTML += `
                <div id="reflio-discount-code-text">
                  <p>Copied to clipboard</p>
                </div>
              `;
            });
          }

          if(document.getElementById('reflio-close-button')){
            document.getElementById('reflio-close-button').addEventListener("click", function() {
              Reflio.consentCleanup();
            });
          }
        }
        Reflio.register();
      });
    }

    //On popup cancel button click
    if(document.getElementById('reflio-cancel-button')){
      document.getElementById('reflio-cancel-button').addEventListener("click", function() {
        Reflio.consentCleanup();
        localStorage.setItem('reflioNoConsent', true);
      });
    }
  }
  async convert(email){
    if(!email || Reflio.checkCookie() === null || !Reflio.checkCookie().referral_id || !Reflio.checkCookie().campaign_id || !Reflio.checkCookie().affiliate_id || !Reflio.checkCookie().cookie_date){
      console.warn("Reflio: Conversion could not be tracked.")
      return false;
    }
    
    const convertData = await fetch(ReflioAPIRoot+'/convert-referral', {
      method: 'POST',
      body: JSON.stringify({
        referralId: Reflio.checkCookie().referral_id,
        campaignId: Reflio.checkCookie().campaign_id,
        affiliateId: Reflio.checkCookie().affiliate_id,
        cookieDate: Reflio.checkCookie().cookie_date,
        email: email
      }),
    }).then(function (response) {
      return response.json();
    });

    if(convertData?.conversion_details !== "error"){
      Reflio.deleteCookie();
    }

    return convertData;
  }
}

//Activate global class.
const Reflio = new rfl;

function activatePopup(){
  if(scrolledPercentage >= 33 && Reflio.details().hidePopup === false && Reflio.consentRequired() === true && Reflio.cookieExists() === false){
    setTimeout(() => {
      Reflio.showPopup();
    }, 2000);
  }
}

//Tracking script verification from server 
if(reflioVerifyParam !== null){
  if(reflioVerifyParam === "true"){
    const verifyDomain = Reflio.checkDomainVerification();

    if(verifyDomain?.verified === true){
      window.location.href = `${ReflioDomainRoot}/dashboard/${Reflio.details().companyId}/setup/verify`
    }
  }
}

if(Reflio.consentRequired() === false && Reflio.cookieEligible() === true){
  Reflio.register();
}

//Initially activate the function to check if already scrolled past 33% of the page.
activatePopup();

//Continually checks if 33% of the page has been scrolled etc.
window.addEventListener("scroll", function checkScrollPercentage() {
  scrolledPercentage = (((document.documentElement.scrollTop + document.body.scrollTop) / (document.documentElement.scrollHeight - document.documentElement.clientHeight) * 100).toFixed(0));

  if(scrolledPercentage >= 33){
    window.removeEventListener("scroll", checkScrollPercentage, false);
    activatePopup();
  }

}, false);

console.log("consentBypass")
console.log(Reflio.details().consentBypass);

//If cookie already exists, double check and remove all consent banners.
if(Reflio.cookieExists() === true){
  Reflio.consentCleanup();
}

if(!reflioInnerScript) {
  console.error("Could not load Reflio: make sure the <script> tag includes data-reflio='<companyId>'")
}