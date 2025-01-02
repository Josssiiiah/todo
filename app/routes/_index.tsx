import { Link, useNavigate } from '@remix-run/react';
import { Button } from '~/components/ui/button';

export default function Index() {
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    navigate(`${route}`);
  };
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] overflow-hidden">
      <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col items-center p-4 px-8 max-w-[1440px] mx-auto">
        <div className="w-full max-w-8xl flex pt-8 rounded-2xl justify-between items-center mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">TodoAI</h1>
          <Button
            className="bg-black text-white h-8 sm:h-10"
            onClick={() => handleNavigate('/login')}
          >
            Log in
          </Button>
        </div>

        <div className="flex flex-row gap-12 pt-48">
          <Link
            to="/login"
            className="px-4 py-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded bg-green-500 text-white font-medium hover:bg-green-600"
          >
            Sign Up
          </Link>
          <Link
            to="/logout"
            className="px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600"
          >
            Logout
          </Link>
          <Link
            to="/protected"
            className="px-4 py-2 rounded bg-black text-white font-medium hover:bg-gray-600"
          >
            Protected
          </Link>
          <Link
            to="/app"
            className="px-4 py-2 rounded bg-purple-500 text-white font-medium hover:bg-purple-600"
          >
            App
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-4 pt-10">Welcome to TodoAI</h1>
      </div>
    </div>
  );
}
