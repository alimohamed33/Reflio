import Logo from '@/components/icons/Logo';
import Link from 'next/link';
import { useUser } from '@/utils/useUser';

export default function SimpleNav() {
  const { signOut } = useUser();

  return (
    <nav className="py-5 flex justify-between items-center wrapper bg-transparent">
      <Link href="/">
        <Logo className="h-10 w-auto mx-auto" />
      </Link>
      <a onClick={() => signOut()} href="#" className="underline text-lg">
        Sign out
      </a>
    </nav>
  );
}
