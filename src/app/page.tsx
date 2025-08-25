import { AuthProvider } from "@/components/auth/auth-provider";
import { HomePage } from "@/components/home/home-page";

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}