import { useNavigate } from "react-router";
import Navbar from "@/components/Navbar";
import Wishlist from "@/components/Wishlist";

export default function WishlistPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <Wishlist navigate={navigate} />
    </div>
  );
}
