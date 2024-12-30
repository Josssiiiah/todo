import { Link } from "@remix-run/react";

export function Navbar({ user }: any) {
  console.log("user", user);
  return (
    <div className="flex flex-row justify-between pt-8 w-full">
      <Link to="/">
        <h2 className="font-bold text-lg">Peer Profiles</h2>
      </Link>{" "}
      <div>
        {user ? (
          <Link
            to="/logout"
            className="px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600"
          >
            Logout
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded bg-black text-white font-medium hover:bg-blue-600"
          >
            Login
          </Link>
        )}
      </div>
      {/* <div>
        <Link
          to="/login"
          className="px-4 py-2 rounded bg-black text-white font-medium hover:bg-blue-600"
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
            to="/app"
            className="px-4 py-2 rounded bg-purple-500 text-white font-medium hover:bg-purple-600"
          >
            App
          </Link>
      </div> */}
    </div>
  );
}
