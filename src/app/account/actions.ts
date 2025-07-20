
'use server';

import { OrderService } from '@/services/orders';
import type { Order } from '@/types';
import { z } from 'zod';

// In a real app, this would come from the user's session
const MOCK_USER_ID = 'user-123';

export async function getUserOrders(): Promise<Order[]> {
  try {
    const orders = await OrderService.getOrdersByUserId(MOCK_USER_ID);
    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

// --- New Actions for Account Settings ---

const loginInfoSchema = z.object({
  email: z.string().email("L'adresse e-mail est invalide."),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères."),
});

export async function updateLoginInfo(values: z.infer<typeof loginInfoSchema>) {
  console.log("Updating login info for:", values.email);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // In a real app, you would update the user's email in your database.
  return { success: true, message: "Adresse e-mail mise à jour." };
}

export async function updateUserPassword(values: z.infer<typeof passwordSchema>) {
  console.log("Updating password...");
  // Simulate API call & password check
  await new Promise(resolve => setTimeout(resolve, 1000));
   if (values.currentPassword === "password123") { // Mock password check
    return { success: true, message: "Mot de passe mis à jour avec succès." };
  } else {
    return { success: false, message: "Le mot de passe actuel est incorrect." };
  }
}

export async function getPaymentMethods() {
    // Simulate fetching saved payment methods
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { id: 'pm_1', type: 'Visa', last4: '4242', isDefault: true },
        { id: 'pm_2', type: 'Mastercard', last4: '5555', isDefault: false },
    ]
}

export async function removePaymentMethod(id: string) {
    console.log("Removing payment method:", id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: "Moyen de paiement supprimé." };
}
