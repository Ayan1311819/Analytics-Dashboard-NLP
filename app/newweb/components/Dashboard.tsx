"use client";
import OverviewCards from "./OverviewCards";
import InvoiceTrendsChart from "./charts/InvoiceTrendsChart";
import TopVendorsChart from "./charts/TopVendorsChart";
import CategoryPieChart from "./charts/CategoryPieChart";
import CashOutflowChart from "./charts/CashOutflowChart";
import InvoicesTable from "./InvoicesTable";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Overview Cards */}
        <OverviewCards />

        {/* First Row: Invoice Trends + Top Vendors */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Volume × Value Trend</h2>
            <p className="text-sm text-gray-500 mb-4">Invoice count and total spend over 12 months.</p>
            <div className="h-[300px]">
              <InvoiceTrendsChart />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Spend by Vendor (Top 10)</h2>
            <p className="text-sm text-gray-500 mb-4">Vendors ranked by total spend distribution.</p>
            <div className="h-[300px]">
              <TopVendorsChart />
            </div>
          </div>
        </div>

        {/* Second Row: Category Pie + Cash Outflow */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Spend by Category</h2>
            <p className="text-sm text-gray-500 mb-4">Distribution of spend across different categories.</p>
            <div className="h-[300px] flex items-center justify-center">
              <CategoryPieChart />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Cash Outflow Forecast</h2>
            <p className="text-sm text-gray-500 mb-4">Projected outflow based on due dates.</p>
            <div className="h-[300px]">
              <CashOutflowChart />
            </div>
          </div>
        </div>

        {/* Third Row: Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm">
          <InvoicesTable />
        </div>
      </div>
    </div>
  );
}