import useAuth from "@/utils/useAuth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut({
      callbackUrl: "/",
      redirect: true,
    });
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-black" />
        <p className="text-gray-600 font-medium">Signing you out...</p>
      </div>
    </div>
  );
}

export default LogoutPage;
