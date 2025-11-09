"use client";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Suspense } from "react";

function InvoicesContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const { data, error } = useSWR(
    search ? `/invoices?search=${encodeURIComponent(search)}` : "/invoices",
    fetcher
  );

  if (error) return <div className="p-8 text-red-500">Failed to load invoices</div>;
  if (!data)
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );

  const invoices = data.data || [];

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {search ? `Search Results for "${search}"` : "All Invoices"}
              </h2>
              <p className="text-sm text-gray-500">
                {invoices.length} invoice(s) found
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Vendor
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Invoice Code
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">
                    Total Amount (€)
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr
                      key={inv.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {inv.vendor?.name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{inv.invoiceCode}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        €{" "}
                        {inv.totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}