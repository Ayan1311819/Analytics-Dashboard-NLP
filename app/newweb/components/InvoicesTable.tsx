"use client";
import useSWR from "swr";
import fetcher from "../lib/fetcher";

export default function InvoicesTable() {
  const { data, error } = useSWR("/invoices", fetcher);

  if (error) return <div className="p-4 text-red-500">Failed to load invoices</div>;
  if (!data) return (
    <div className="p-8 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const invoices = data.data || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Invoices by Vendor</h2>
          <p className="text-sm text-gray-500">Top vendors by invoice count and total value.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Vendor</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700"># Invoices</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Invoice Code</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-700">Date</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Net Value</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 10).map((inv: any) => (
              <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{inv.vendor?.name || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-600">1</td>
                <td className="py-3 px-4 text-gray-600">{inv.invoiceCode}</td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  € {inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}