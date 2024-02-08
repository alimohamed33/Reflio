import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { updateUserName } from '@/utils/supabase-client';
import { useUser } from '@/utils/useUser';
import { LockClosedIcon } from '@heroicons/react/solid';
// import Twitter from '@/components/icons/Twitter';
import Google from '@/components/icons/Google';
import SEOMeta from '@/components/SEOMeta';

const SignUp = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const router = useRouter();
  const { signUp, signIn } = useUser();

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage({});
    const { error, user } = await signUp({ email, password });
    if (error) {
      setMessage({ type: 'error', content: error.message });
    } else {
      if (user) {
        setUser(user);
      } else {
        setMessage({
          type: 'note',
          content: 'Check your email for the confirmation link.'
        });
      }
    }
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    const { error } = await signIn({ provider });
    if (error) {
      setMessage({ type: 'error', content: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user]);

  return (
    <>
      <SEOMeta title="Sign Up" />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white rounded-xl p-10 shadow-lg border-4 border-primary-2">
          <div>
            <h1 className="text-center text-3xl font-extrabold text-gray-900">
              Get Started
            </h1>
          </div>
          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              {/* <div>
                <label htmlFor="email-address" className="sr-only">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-none relative block w-full p-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none  focus:z-10 sm:text-sm"
                  placeholder="Name"
                  onChange={e=>{setName(e.target.value)}}
                />
              </div> */}
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full p-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none  focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full p-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none  focus:z-10 sm:text-sm"
                  placeholder="Password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                />
              </div>
            </div>

            <div>
              <button
                disabled={loading}
                type="button"
                className="group relative w-full flex justify-center py-3 px-5 border border-transparent text-md font-medium rounded-md text-white bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 "
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 " aria-hidden="true" />
                </span>
                Sign Up
              </button>
            </div>

            <div className="mt-3 text-center text-sm">
              <span className="text-accents-2">Already have an account?</span>
              {` `}
              <Link href="/signin">
                {/* <a className="text-accents-1 font-bold hover:underline cursor-pointer"> */}
                Sign in.
                {/* </a> */}
              </Link>
            </div>

            {/* <button
              type="button"
              className="flex align-center justify-center h-full min-h-full w-full font-medium rounded-lg m-0 p-3 px-5 border-2 hover:bg-accents-9 bg-white"
              disabled={loading}
              onClick={() => handleOAuthSignIn('twitter')}
            >
              <Twitter />
              <span className="ml-2">Sign up with Twitter</span>
            </button> */}

            {/* <button
              type="button"
              className="flex align-center justify-center h-full min-h-full w-full font-medium rounded-lg m-0 p-3 px-5 border-2 hover:bg-accents-9 bg-white text-primary"
              disabled={loading}
              onClick={() => handleOAuthSignIn('google')}
            >
              <Google />
              <span className="ml-2">Sign up with Google</span>
            </button> */}

            {message.content && (
              <div
                className={`${
                  message.type === 'error' ? 'text-pink' : 'text-green'
                } border ${
                  message.type === 'error' ? 'border-pink' : 'border-green'
                } p-3`}
              >
                {message.content}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUp;
