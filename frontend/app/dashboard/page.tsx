"use client"; 

import { useState, useEffect } from "react";
import { DashboardCard } from "@/components/ui/DashboardCard";
import {
  getDashboardStats, DashboardStats,
  getMonthlyRevenue, MonthlyRevenue, 
  getTopConsumers, TopConsumer 
} from "@/lib/api"; 
import {
  Users,
  Database,
  FileWarning,
  CircleDollarSign,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { MonthlyRevenueChart } from "@/components/ui/MonthlyRevenueChart";
import { TopConsumersChart } from "@/components/TopConsumersChart";

export default function Dashboard() {
  // Create state to hold your data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [consumerData, setConsumerData] = useState<TopConsumer[]>([]);
  const [loading, setLoading] = useState(true);


  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Use Promise.all to fetch all data in parallel
      const [statsData, revenueData, consumerData] = await Promise.all([
        getDashboardStats(),
        getMonthlyRevenue(),
        getTopConsumers()
      ]);
      setStats(statsData);
      setRevenueData(revenueData);
      setConsumerData(consumerData);
      setLoading(false);
    };

    fetchData();
  }, []);

  // --- (keep formatCurrency function) ---
  const formatCurrency = (value: number | null) => {
    if (value === null || value === 0) return "Rs. 0";
    return `Rs. ${value.toLocaleString()}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Dashboard Overview
      </h1>

      {loading ? (
        <p className="text-muted-foreground">Loading stats...</p>
      ) : stats ? (
        // Render cards once data is loaded
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Total Customers"
            value={stats.totalCustomers}
            description="Total registered users"
            Icon={Users}
          />

            <DashboardCard 
            title="Active Meters" 
            value={stats.totalActiveMeters} 
            description="All utility meters" 
            Icon={Database}/>
          
         
          <DashboardCard
            title="Pending Bills"
            value={stats.pendingBills}
            description="Bills awaiting payment"
            Icon={FileWarning}
          />
          <DashboardCard
            title="Open Complaints"
            value={stats.openComplaints}
            description="Unresolved issues"
            Icon={AlertCircle}
          />
          <DashboardCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            description="Revenue this month"
            Icon={FileCheck}
          />

           <DashboardCard
            title="Total Outstanding"
            value={formatCurrency(stats.totalOutstanding)}
            description="Total unpaid amount"
            Icon={CircleDollarSign}
          />

        </div>
      ) : (
        <p className="text-destructive">Failed to load dashboard data.</p>
      )}

     {/* --- Charts Section --- */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Analytics
        </h2>
        {loading ? (
          <p className="text-muted-foreground">Loading charts...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
           {/* Monthly Revenue Chart */}
          <div className="rounded-lg border border-border bg-card p-4 h-[400px]"> {/* Added h-[400px] */}
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">
              Monthly Revenue
            </h3>
            <MonthlyRevenueChart data={revenueData} />
          </div>

          {/* Top Consumers Chart */}
          <div className="rounded-lg border border-border bg-card p-4 h-[400px]"> {/* Added h-[400px] */}
            <h3 className="text-lg font-semibold text-muted-foreground mb-4">
              Top 10 Consumers
            </h3>
            <TopConsumersChart data={consumerData} />
          </div>
          </div>
        )}
      </div>
    </div>
  );
}