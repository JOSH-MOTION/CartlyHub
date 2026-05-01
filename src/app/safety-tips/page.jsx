"use client";

import LegalContent from "@/components/LegalContent";
import { ShieldCheck, MapPin, Eye, Zap, MessageCircle } from "lucide-react";

export default function SafetyTipsPage() {
  const tips = [
    {
      icon: ShieldCheck,
      title: "No Advance Payments",
      desc: "Never pay in advance, even for delivery. Only pay once you have seen and inspected the item."
    },
    {
      icon: MapPin,
      title: "Meet in Public",
      desc: "Meet the seller in a safe, public place such as a mall, gas station, or restaurant. Avoid meeting in secluded areas."
    },
    {
      icon: Eye,
      title: "Inspect Everything",
      desc: "Thoroughly check the item to ensure it matches the description and is in the condition you expect. For electronics, test them before paying."
    },
    {
      icon: Zap,
      title: "Beware of 'Too Good' Deals",
      desc: "If a price seems suspiciously low, exercise extra caution. Scammers often use low prices to lure buyers into making quick, unsafe decisions."
    },
    {
      icon: MessageCircle,
      title: "Use Platform Chat",
      desc: "Keep your communications within our platform or via our official WhatsApp links to maintain a record of your interaction."
    }
  ];

  return (
    <LegalContent title="Safety Tips" lastUpdated="May 1, 2026">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {tips.map((tip, i) => (
          <div key={i} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 flex flex-col items-start space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm">
              <tip.icon className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black">{tip.title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>

      <section className="bg-red-50 rounded-3xl p-8 border border-red-100">
        <h2 className="text-xl font-black text-red-900 mb-4">When to walk away?</h2>
        <ul className="space-y-4">
          <li className="flex items-start">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-red-800 font-bold uppercase tracking-tight text-sm">The seller insists on payment before you see the item.</p>
          </li>
          <li className="flex items-start">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-red-800 font-bold uppercase tracking-tight text-sm">The seller asks for your personal financial information or OTPs.</p>
          </li>
          <li className="flex items-start">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-red-800 font-bold uppercase tracking-tight text-sm">The meeting place feels unsafe or the seller refuses a public venue.</p>
          </li>
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-black mb-4">Reporting Abuse</h2>
        <p>
          If you encounter any suspicious activity, fraudulent listings, or unprofessional behavior, please report it immediately via the "Report Abuse" button on the product page or contact our support team at <a href="mailto:cartlyhub@gmail.com" className="text-emerald-600 hover:underline"><strong>cartlyhub@gmail.com</strong></a>.
        </p>
      </section>
    </LegalContent>
  );
}
