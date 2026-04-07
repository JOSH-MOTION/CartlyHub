'use client';
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Info } from 'lucide-react';

const GHANA_LOCATIONS = [
  // Accra Regions
  "Accra Central", "Osu", "Labone", "Abelenkpe", "Adenta", "Ashongman", "Berekuso", "Dawhenya", "Ga East", "Ga West", "Kasoa", "La", "Tema", "Teshie", "Weija",
  
  // Kumasi Regions  
  "Kumasi Central", "Aboabo", "Asokwa", "Asokore Mampong", "Atwima", "Bekwai", "Ejisu", "Ejura", "Kwadaso", "Mampong", "Manso Adubia", "Manso Nkwanta", "Obuasi", "Offinso", "Oforikrom", "Sepase", "Suame",
  
  // Ashanti Region
  "Konongo", "Mampong", "Obuasi", "Bekwai", "Ejisu", "Ejura", "Juaben", "Kenyasi", "Kumawuodwo", "Mankranso", "Nsuta", "Nsuta Kumawu", "Ofoase", "Amanokrom", "Bodomase", "Bosome", "Dompoase", "Fomena", "Kwabre", "Mfram", "Wiamo",
  
  // Bono East Region
  "Kintampo", "Duayaw Nkwanta", "Kintampo", "Jaman", "Krobo", "Mpraeso", "Nkoranza", "Seikwa", "Suhum", "Techiman", "Wenchi", "Yamfo",
  
  // Bono West Region  
  "Berekum", "Dormaa Ahenkro", "Japekrom", "Kenyasi", "Nkoranza", "Sefwi Bekwai", "Sefwi Wiawso", "Sunyani",
  
  // Ahafo Region
  "Goaso", "Mankessim", "Tepa", "Kukuom", "Ahafo Ano", "Akatsi", "Asutsuare", "Fomena", "Gomoa",
  
  // Central Region  
  "Techiman", "Nkoranza", "Prang", "Banda", "Nkoranza", "Savelugu", "Yapei", "Yeji",
  
  // Upper West Region  
  "Sefwi Wiawso", "Wa", "Bibiani", "Sefwi Bekwai", "Sefwi Wiaso", "Jomoro", "Bia", "Juaboso", "Bodi", "Oseikojookrom", "Saman", "Sowodadzem",
  
  // Upper East Region  
  "Bawku", "Bongo", "Garu Tempane", "Jasikan", "Kintampo", "Kpasenkpe", "Zuarungu", "Yendi", "Bimbilla", "Tumu", "Sogakope", "Walewale",
  
  // Northern Region  
  "Tamale", "Gushiegu", "Karaga", "Mion", "Nasia", "Nanton", "Nanchala", "Savelugu", "Tolon", "Wungu", "Yendi",
  
  // Savannah Region  
  "Bawku", "Bongo", "Garu Tempane", "Jasikan", "Kintampo", "Yapei", "Bimbilla", "Tumu", "Sogakope", "Walewale", "Gushiegu",
  
  // Volta Region
  "Ho", "Hohoe", "Jasikan", "Keta", "Kpando", "Kpandu", "Sogakofe", "Taviefe", "Torkor", "Weta", "Ziope",
  
  // Oti Region
  "Dambai", "Denu", "Jasikan", "Kete Krachi", "Kadjebi", "Nkwanta", "Nkwakaw", "Kwabikrom", "Nkonya", "Nkonya", "Tepa", "Wassa",
  
  // Western North Region
  "Sefwi Wiawso", "Wa", "Bibiani", "Sefwi Bekwai", "Sefwi Wiaso", "Jomoro", "Bia", "Juaboso", "Bodi", "Oseikojookrom", "Saman", "Sowodadzem",
  
  // Western South Region
  "Agona Nkwanta", "Agona", "Ahanta West", "Ahanta East", "Axim", "Elubo", "Jomoro", "Mumford", "Shama", "Sefwi Wiawso", "Tarkwa", "Wassa East", "Wassa Amenfi",
  
  // Greater Accra
  "Aburi", "Adenta", "Ashongman", "Berekuso", "Dawhenya", "Ga East", "Ga West", "Kasoa", "La", "Tema", "Teshie", "Weija",
  "Tema Community 1", "Tema Community 25", "Spintex Road", "Dansoman", "Cantonments", "Labone", "Ridge", "Airport Residential",
  "Dzorwulu", "Abelemkpe", "Kaneshie", "Achimota", "Lapaz", "Haatso", "Adenta",
  "Teshie", "Nungua", "Sakumono", "Lashibi", "Ashongman", "Kwabenya", "Pokuase",
  "Kumasi", "Abokobi", "Amansie", "Asokwa", "Obuasi", "Beposo", "Deduako", "Ejisu", "Ejura", "Juaben", "Kenyasi", "Kumawuodwo", "Mankranso", "Nsuta", "Nsuta Kumawu", "Ofoase", "Amanokrom", "Bodomase", "Bosome", "Dompoase", "Fomena", "Kwabre", "Mfram", "Wiamo",
  "Takoradi", "Tamale", "Cape Coast", "Koforidua", "Sunyani", "Obuasi", "Techiman", "Wa", "Bolgatanga", "Berekum", "Nsawam", "Ho", "Keta",
  "Medaase", "Ashongman", "Berekuso", "Accra", "Tema", "Kumasi", "Takoradi", "Wa", "Ho", "Bolgatanga", "Koforidua", "Cape Coast", "Sunyani", "Obuasi"
];

interface LocationSearchProps { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string; 
  minimal?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ value, onChange, placeholder, minimal }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomHint, setShowCustomHint] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value); 
    }
  }, [value, isOpen]);

  useEffect(() => {
    if (query && query.length >= 1 && isOpen) {
      const filtered = GHANA_LOCATIONS.filter(loc => 
        loc.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { 
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false); 
        setShowCustomHint(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: string) => {
    setQuery(loc);
    onChange(loc);
    setIsOpen(false);
    setShowCustomHint(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val); // This ensures any location typed works, even if not in suggestions list
    setShowCustomHint(val.length > 0 && !GHANA_LOCATIONS.some(l => l.toLowerCase() === val.toLowerCase()));
  };

  const showCustomHintOnly = query && !GHANA_LOCATIONS.some(l => l.toLowerCase() === query.toLowerCase()) && isOpen;

  if (minimal) {
    return (
      <div className="relative w-full">
        <div className="flex items-center gap-3 pb-2 border-b border-stone-100 group-focus-within:border-stone-900 transition-all">
          <MapPin className="text-stone-300 group-focus-within:text-stone-900 transition-colors" size={18} />
          <input 
            type="text" 
            value={query} 
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-transparent outline-none text-sm font-bold text-stone-900 placeholder:text-stone-200"
            placeholder={placeholder || "Anywhere in Ghana (e.g. Sapieman)..."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative group w-full" ref={wrapperRef}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none">
        <MapPin size={20} />
      </div>
      <input 
        type="text" 
        value={query} 
        onChange={e => handleInputChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || "Enter any location in Ghana..."}
        className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-stone-200 rounded-3xl outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-bold text-stone-900 placeholder:text-stone-200 shadow-sm"
      />
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="sticky top-0 bg-stone-50 border-b border-stone-200 p-2 mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-stone-500" />
                <input
                  type="text" 
                  placeholder="Search Ghana locations..." 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-stone-900 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {suggestions.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-stone-500 font-medium px-3 py-2 bg-stone-50 border-b border-stone-200 sticky top-0 z-10">
                    POPULAR LOCATIONS
                  </div>
                  {suggestions.map((location, index) => (
                    <button
                      key={location}
                      onClick={() => handleSelect(location)}
                      className="w-full text-left px-4 py-3 hover:bg-stone-100 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-stone-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-stone-500" />
                        <div className="text-left">
                          <span className="text-sm font-medium text-stone-900">{location}</span>
                          <span className="text-xs text-stone-400 block">{
                            location.includes('Accra') ? ' • Greater Accra' :
                            location.includes('Kumasi') ? ' • Ashanti Region' :
                            location.includes('Tamale') ? ' • Northern Region' :
                            location.includes('Takoradi') ? ' • Western Region' :
                            location.includes('Ho') ? ' • Volta Region' :
                            location.includes('Wa') ? ' • Upper West Region' :
                            ' • Ghana'
                          }</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-stone-500">
                  <p>No locations found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showCustomHintOnly && (
        <div className="absolute bottom-full left-0 right-0 mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 z-40 shadow-xl">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-orange-500" />
            <span className="text-[10px] text-orange-700 font-medium">Using your specific location entry</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
