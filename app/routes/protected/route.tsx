import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/cloudflare";
import { Form, Link, Outlet, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { resources } from "app/drizzle/schema.server";
import { Navbar } from "../app/navbar";
import { useToast } from "~/components/ui/use-toast";
import { doTheAuthThing } from "lib/authThing";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";

// This function fetches resources from D1 and images from R2
export async function loader({ request, context }: LoaderFunctionArgs) {
  // call this at the top of all your loaders that need auth and db
  const { user, session, db } = await doTheAuthThing({ request, context });
  // now you just have to condition all these queires on the user id
  if (user) {
    const userId = user.id;
    console.log("LOGGED IN!!")
    return(true);

  } else {
    console.log("NOT LOGGED IN!!");
    return(false);
  }
}

export default function Protected() {
  const data = useLoaderData<typeof loader>();
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  if (!toastShownRef.current) {
    toastShownRef.current = true;
    toast({
      title: data ? "Logged In" : "Not Logged In",
      description: data ? "You are logged in." : "You are not logged in.",
      variant: data ? "default" : "destructive",
    });
  }

  return (
    <div className="flex items-center justify-center">
    </div>
  );
}