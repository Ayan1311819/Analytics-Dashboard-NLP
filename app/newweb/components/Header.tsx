"use client";
import { Search, Bell, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Show search only on /invoices page
  const showSearch = pathname === "/invoices";

  useEffect(() => {
    // Set initial search value from URL
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/invoices?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/invoices");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search - Only show on invoices page */}
        {showSearch ? (
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search invoices, vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {pathname === "/" && "Dashboard"}
              {pathname === "/chat" && "Chat with Data"}
              {pathname === "/settings" && "Settings"}
            </h2>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-4 ml-6">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Ayan Choudhary</p>
              <p className="text-xs text-gray-500">Developer</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}