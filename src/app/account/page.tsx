
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, UserCircle, Settings } from "lucide-react";
import { getUserOrders } from './actions';
import TicketCard from "@/components/TicketCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AccountSettings from "@/components/AccountSettings";

export default async function AccountPage() {
  const orders = await getUserOrders();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <UserCircle className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Mon Compte</h1>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">
            <Ticket className="mr-2 h-4 w-4" />
            Mes Billets
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mon Historique d'Achats</CardTitle>
              <CardDescription>Retrouvez ici tous les billets que vous avez achetés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orders.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {orders.map(order => (
                        <TicketCard key={order.id} order={order} />
                    ))}
                </div>
              ) : (
                <Alert>
                  <Ticket className="h-4 w-4" />
                  <AlertTitle>Aucun billet trouvé</AlertTitle>
                  <AlertDescription>
                    Vous n'avez pas encore acheté de billet. Explorez nos événements pour trouver votre prochaine expérience !
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
