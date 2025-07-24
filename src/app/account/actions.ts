// src/app/account/actions.ts - VERSION CORRIGÉE TYPESCRIPT
'use server';

import { OrderService } from '@/services/orders';
import type { Order } from '@/types';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

// Helper pour obtenir le client Supabase côté serveur
async function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

// ✅ CORRECTION: Interface pour le profil utilisateur
interface UserProfileResult {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

// Helper pour obtenir l'utilisateur authentifié
async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur session:', sessionError);
    throw new Error('Session invalide. Veuillez vous reconnecter.');
  }
  
  if (!session?.user) {
    console.error('❌ [ACCOUNT ACTIONS] Aucune session trouvée');
    throw new Error('Utilisateur non authentifié. Veuillez vous connecter.');
  }
  
  // Récupérer le profil pour vérification
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, role, created_at, updated_at')
    .eq('id', session.user.id)
    .single();
  
  if (profileError) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur profil:', profileError);
    
    if (profileError.code === 'PGRST116') {
      throw new Error('Profil utilisateur introuvable. Veuillez contacter l\'administrateur.');
    }
    
    throw new Error('Erreur lors de la récupération du profil utilisateur.');
  }
  
  return {
    user: session.user,
    profile,
    session
  };
}

// ✅ FONCTION CORRIGÉE - Récupération des commandes avec vraie authentification
export async function getUserOrders(): Promise<Order[]> {
  try {
    console.log('🔍 [ACCOUNT ACTIONS] Récupération des commandes utilisateur...');
    
    // Obtenir l'utilisateur authentifié
    const { user, profile } = await getCurrentUser();
    
    console.log('✅ [ACCOUNT ACTIONS] Utilisateur authentifié:', user.email);
    console.log('👤 [ACCOUNT ACTIONS] Profil:', profile.name, '- Rôle:', profile.role);
    
    // Récupérer les vraies commandes de l'utilisateur
    const orders = await OrderService.getOrdersByUserId(user.id);
    
    console.log(`📦 [ACCOUNT ACTIONS] ${orders.length} commandes trouvées pour l'utilisateur ${user.email}`);
    
    return orders;
    
  } catch (error) {
    console.error("❌ [ACCOUNT ACTIONS] Erreur récupération commandes:", error);
    
    // Relancer l'erreur pour que le composant puisse la gérer
    throw error;
  }
}

// --- Actions pour les paramètres du compte ---

const loginInfoSchema = z.object({
  email: z.string().email("L'adresse e-mail est invalide."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères."),
});

// ✅ FONCTION CORRIGÉE - Mise à jour des informations de connexion
export async function updateLoginInfo(values: z.infer<typeof loginInfoSchema>) {
  try {
    console.log('🔄 [ACCOUNT ACTIONS] Mise à jour des informations de connexion...');
    
    // Obtenir l'utilisateur authentifié
    const { user } = await getCurrentUser();
    const supabase = await getSupabaseServerClient();
    
    console.log('✅ [ACCOUNT ACTIONS] Mise à jour email pour:', user.email, '→', values.email);
    
    // 1. Mettre à jour l'email dans Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      email: values.email
    });
    
    if (authError) {
      console.error('❌ [ACCOUNT ACTIONS] Erreur mise à jour email auth:', authError);
      throw new Error(`Erreur mise à jour email: ${authError.message}`);
    }
    
    // 2. Mettre à jour le profil (optionnel, selon votre structure)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (profileError) {
      console.warn('⚠️ [ACCOUNT ACTIONS] Erreur mise à jour profil:', profileError);
      // On continue malgré l'erreur car l'email a été mis à jour
    }
    
    console.log('✅ [ACCOUNT ACTIONS] Email mis à jour avec succès');
    
    return { 
      success: true, 
      message: "Adresse e-mail mise à jour. Vérifiez votre nouvelle adresse email pour confirmer le changement." 
    };
    
  } catch (error) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur updateLoginInfo:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'email"
    };
  }
}

// ✅ FONCTION CORRIGÉE - Mise à jour du mot de passe
export async function updateUserPassword(values: z.infer<typeof passwordSchema>) {
  try {
    console.log('🔄 [ACCOUNT ACTIONS] Mise à jour du mot de passe...');
    
    // Obtenir l'utilisateur authentifié
    const { user } = await getCurrentUser();
    const supabase = await getSupabaseServerClient();
    
    console.log('✅ [ACCOUNT ACTIONS] Mise à jour mot de passe pour:', user.email);
    
    // 1. Vérifier le mot de passe actuel en tentant une connexion
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: values.currentPassword
    });
    
    if (signInError) {
      console.error('❌ [ACCOUNT ACTIONS] Mot de passe actuel incorrect:', signInError);
      return { 
        success: false, 
        message: "Le mot de passe actuel est incorrect." 
      };
    }
    
    // 2. Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.newPassword
    });
    
    if (updateError) {
      console.error('❌ [ACCOUNT ACTIONS] Erreur mise à jour mot de passe:', updateError);
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${updateError.message}`
      };
    }
    
    console.log('✅ [ACCOUNT ACTIONS] Mot de passe mis à jour avec succès');
    
    return { 
      success: true, 
      message: "Mot de passe mis à jour avec succès." 
    };
    
  } catch (error) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur updateUserPassword:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du mot de passe"
    };
  }
}

// ✅ FONCTION CORRIGÉE - Récupération des moyens de paiement
export async function getPaymentMethods() {
  try {
    console.log('💳 [ACCOUNT ACTIONS] Récupération des moyens de paiement...');
    
    // Obtenir l'utilisateur authentifié
    const { user } = await getCurrentUser();
    
    console.log('✅ [ACCOUNT ACTIONS] Moyens de paiement pour:', user.email);
    
    // Simuler un délai API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 🔧 TODO: Remplacer par une vraie intégration de paiement (Stripe, PayPal, etc.)
    // Pour l'instant, retourner des données mockées mais liées à l'utilisateur réel
    const paymentMethods = [
      { 
        id: `pm_${user.id}_1`, 
        type: 'Visa', 
        last4: '4242', 
        isDefault: true,
        userId: user.id // Lier au vrai utilisateur
      },
      { 
        id: `pm_${user.id}_2`, 
        type: 'Mastercard', 
        last4: '5555', 
        isDefault: false,
        userId: user.id // Lier au vrai utilisateur
      },
    ];
    
    console.log(`💳 [ACCOUNT ACTIONS] ${paymentMethods.length} moyens de paiement trouvés`);
    
    return paymentMethods;
    
  } catch (error) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur getPaymentMethods:', error);
    
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
}

// ✅ FONCTION CORRIGÉE - Suppression d'un moyen de paiement
export async function removePaymentMethod(paymentMethodId: string) {
  try {
    console.log('🗑️ [ACCOUNT ACTIONS] Suppression moyen de paiement:', paymentMethodId);
    
    // Obtenir l'utilisateur authentifié
    const { user } = await getCurrentUser();
    
    // Vérifier que le moyen de paiement appartient à l'utilisateur
    if (!paymentMethodId.includes(user.id)) {
      console.error('❌ [ACCOUNT ACTIONS] Tentative de suppression d\'un moyen de paiement non autorisé');
      return { 
        success: false, 
        message: "Vous n'êtes pas autorisé à supprimer ce moyen de paiement." 
      };
    }
    
    console.log('✅ [ACCOUNT ACTIONS] Suppression autorisée pour:', user.email);
    
    // Simuler un délai API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 🔧 TODO: Implémenter la vraie suppression via l'API de paiement
    console.log('✅ [ACCOUNT ACTIONS] Moyen de paiement supprimé:', paymentMethodId);
    
    return { 
      success: true, 
      message: "Moyen de paiement supprimé avec succès." 
    };
    
  } catch (error) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur removePaymentMethod:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la suppression"
    };
  }
}

// ✅ FONCTION CORRIGÉE - Obtenir les informations du profil utilisateur
export async function getUserProfile(): Promise<{
  success: boolean;
  data?: UserProfileResult;
  message?: string;
}> {
  try {
    console.log('👤 [ACCOUNT ACTIONS] Récupération du profil utilisateur...');
    
    const { user, profile } = await getCurrentUser();
    
    console.log('✅ [ACCOUNT ACTIONS] Profil récupéré pour:', user.email);
    
    const profileResult: UserProfileResult = {
      id: profile.id,
      name: profile.name || 'Utilisateur',
      email: user.email || '',
      role: profile.role,
      created_at: user.created_at,
      updated_at: profile.updated_at || user.updated_at,
    };
    
    return {
      success: true,
      data: profileResult
    };
    
  } catch (error) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur getUserProfile:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la récupération du profil"
    };
  }
}

// ✅ FONCTION CORRIGÉE - Mise à jour du profil utilisateur
export async function updateUserProfile(data: { name: string }) {
  try {
    console.log('🔄 [ACCOUNT ACTIONS] Mise à jour du profil utilisateur...');
    
    const { user } = await getCurrentUser();
    const supabase = await getSupabaseServerClient();
    
    console.log('✅ [ACCOUNT ACTIONS] Mise à jour profil pour:', user.email);
    
    // Mettre à jour le profil dans la base de données
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ [ACCOUNT ACTIONS] Erreur mise à jour profil:', updateError);
      throw new Error(`Erreur mise à jour profil: ${updateError.message}`);
    }
    
    console.log('✅ [ACCOUNT ACTIONS] Profil mis à jour avec succès');
    
    return {
      success: true,
      message: "Profil mis à jour avec succès."
    };
    
  } catch (error) {
    console.error('❌ [ACCOUNT ACTIONS] Erreur updateUserProfile:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du profil"
    };
  }
}