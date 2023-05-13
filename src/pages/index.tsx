import { type NextPage } from "next";
import Head from "next/head";
import { useContext, useEffect } from "react";
import { UserContext } from "~/contexts/UserProvider";
import { useRouter } from "next/router";
import { ROLE } from "~/types";

const Home: NextPage = () => {
  const {user, logout} = useContext(UserContext);

  const router = useRouter();

  // Show login screen if user is not defined
  useEffect(() => {
    if(!user) {
      router.push("/login");
    } else if (user.role === ROLE.FACULTY) {
      router.push("/facultyDisplayPage");
    } else if (user.role === ROLE.ADMIN) {
      router.push("/admin");
    }
  }, [user])
  // Main App UI
  
  return (
    <>
      <Head>
        <title>Course Binder</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          Hello {user?.firstName}!
          <button onClick={logout}>Logout</button>
          <SampleChild/>
        </div>

      </main>

    </>
  );
};

export default Home;

const SampleChild = () => {
  const { user } = useContext(UserContext);
  return <div>Hello {user?.firstName}! from child. You are a {user?.role}.</div>
}
