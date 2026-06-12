import * as Icons from "lucide-react";

const ICON_MAP = {
  Shirt: Icons.Shirt,
  Smartphone: Icons.Smartphone,
  Home: Icons.Home,
  Heart: Icons.Heart,
  ShoppingBag: Icons.ShoppingBag,
  Activity: Icons.Activity,
  Building: Icons.Building,
  Car: Icons.Car,
  Briefcase: Icons.Briefcase,
  Wrench: Icons.Wrench,
  Sprout: Icons.Sprout,
  Camera: Icons.Camera,
  Sparkles: Icons.Sparkles,
  Package: Icons.Package,
  Music: Icons.Music,
  Gem: Icons.Gem,
  Zap: Icons.Zap,
  Book: Icons.Book,
  Printer: Icons.Printer,
  Dog: Icons.Dog,
  Monitor: Icons.Monitor,
  Trophy: Icons.Trophy,
  Refrigerator: Icons.Refrigerator,
  Truck: Icons.Truck,
  Ticket: Icons.Ticket,
};

export default function CategoryIcon({ iconName, className = "h-5 w-5" }) {
  const IconComponent = ICON_MAP[iconName] || Icons.Package;
  return <IconComponent className={className} />;
}
