"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Cog,
  UserCircle, // <-- 1. Import UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Sidebar() {
  const { role, userId } = useAuth(); // <-- 2. Get userId
  const pathname = usePathname();

  // Role-based visibility
  // (Note: 'Customer' is NOT in any of these lists, so they naturally return false)
  const canSeeDashboard = role === 'Admin' || role === 'Manager';
  const canSeeCustomers = role === 'Admin' || role === 'Manager';
  const canSeeMeters = role === 'Admin' || role === 'FieldOfficer' || role === 'Manager';
  const canSeeBills = role === 'Admin' || role === 'BillingClerk' || role === 'Manager';
  const canSeePayments = role === 'Admin' || role === 'BillingClerk' || role === 'Manager';
  const canSeeReports = role === 'Admin';
  const canSeeTariffs = role === 'Admin';
  
  // Check if user is a customer
  const isCustomer = role === 'Customer';

  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Database className="h-6 w-6 text-primary" />
            <span className="">UMS ({role})</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            
            {/* --- 1. CUSTOMER PORTAL LINK (Only for Customers) --- */}
            {isCustomer && userId && (
              <Link
                href={`/dashboard/customers/${userId}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.includes(`/dashboard/customers/${userId}`)
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <UserCircle className="h-4 w-4" />
                My Portal
              </Link>
            )}

            {/* --- 2. STAFF LINKS (Hidden from Customers automatically via 'canSeeX' logic) --- */}

            {canSeeDashboard && (
              <Link
                href="/dashboard"
                className={cn( 
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname === "/dashboard" 
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}

            {canSeeCustomers && (
              <Link
                href="/dashboard/customers"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.startsWith("/dashboard/customers") 
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <Users className="h-4 w-4" />
                Customers
              </Link>
            )}

            {canSeeMeters && (
              <Link
                href="/dashboard/meters"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.startsWith("/dashboard/meters")
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <Settings className="h-4 w-4" />
                Meters
              </Link>
            )}

            {canSeeBills && (
              <Link
                href="/dashboard/bills"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.startsWith("/dashboard/bills")
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <FileText className="h-4 w-4" />
                Bills
              </Link>
            )}

            {canSeePayments && (
              <Link
                href="/dashboard/payments"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.startsWith("/dashboard/payments")
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <CreditCard className="h-4 w-4" />
                Payments
              </Link>
            )}

            {canSeeReports && (
              <Link
                href="/dashboard/reports"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.startsWith("/dashboard/reports")
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
            )}

            {canSeeTariffs && (
              <Link
                href="/dashboard/tariffs"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname.startsWith("/dashboard/tariffs")
                    ? "bg-muted text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                <Cog className="h-4 w-4" />
                Tariffs
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}