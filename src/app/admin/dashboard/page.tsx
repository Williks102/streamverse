
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BarChart3, ListOrdered, Users, Settings, Menu, Percent, Banknote } from "lucide-react";
import AdminEventManagement from "@/components/admin/AdminEventManagement";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminStats from "@/components/admin/AdminStats";
import { cn } from '@/lib/utils';
import AdminCommissionManagement from '@/components/admin/AdminCommissionManagement';
import AdminPayoutManagement from '@/components/admin/AdminPayoutManagement';

const tabs = [
    { value: "stats", label: "Statistiques", icon: BarChart3 },
    { value: "events", label: "Événements", icon: ListOrdered },
    { value: "users", label: "Utilisateurs", icon: Users },
    { value: "commissions", label: "Commissions", icon: Percent },
    { value: "payouts", label: "Paiements", icon: Banknote },
    { value: "settings", label: "Paramètres", icon: Settings },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("stats");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Tableau de Bord Admin</h1>
          </div>
          {/* Mobile: Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-3/4">
                <SheetTitle className="sr-only">Menu Admin</SheetTitle>
                <nav className="flex flex-col space-y-2 pt-6">
                  {tabs.map(tab => (
                    <SheetClose asChild key={tab.value}>
                       <Button
                        variant={activeTab === tab.value ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => setActiveTab(tab.value)}
                      >
                        <tab.icon className="mr-2 h-5 w-5" />
                        {tab.label}
                      </Button>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop: Tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <div className="mt-6">
            <TabsContent value="stats">
                <AdminStats />
            </TabsContent>
            
            <TabsContent value="events">
                <AdminEventManagement />
            </TabsContent>

            <TabsContent value="users">
                <AdminUserManagement />
            </TabsContent>

            <TabsContent value="commissions">
                <AdminCommissionManagement />
            </TabsContent>

             <TabsContent value="payouts">
                <AdminPayoutManagement />
            </TabsContent>

            <TabsContent value="settings">
                <AdminSettings />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
