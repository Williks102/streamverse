// src/app/admin/profile-settings/actions.ts - Actions pour la persistance du profil admin
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { z } from 'zod';

// Client Supabase server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  userId: z.string().min(1, "ID utilisateur requis."),
});

export type UpdateAdminProfileData = z.infer<typeof profileSchema>;

export async function updateAdminProfile(data: UpdateAdminProfileData) {
  try {
    // Validation des données
    const validatedData = profileSchema.parse(data);
    
    console.log('🔄 [ADMIN PROFILE] Mise à jour profil admin:', {
      userId: validatedData.userId,
      name: validatedData.name,
      email: validatedData.email
    });

    // 1. Mettre à jour le profil dans la table profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: validatedData.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.userId)
      .eq('role', 'admin'); // Sécurité : s'assurer que c'est bien un admin

    if (profileError) {
      console.error('❌ [ADMIN PROFILE] Erreur mise à jour profil:', profileError);
      throw new Error(`Erreur mise à jour profil: ${profileError.message}`);
    }

    // 2. Mettre à jour l'email dans l'authentification (si différent)
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(validatedData.userId);
      
      if (getUserError) {
        console.warn('⚠️ [ADMIN PROFILE] Impossible de récupérer l\'utilisateur auth:', getUserError);
      } else if (user && user.email !== validatedData.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          validatedData.userId,
          { email: validatedData.email }
        );

        if (emailError) {
          console.warn('⚠️ [ADMIN PROFILE] Erreur mise à jour email:', emailError);
          // On continue malgré l'erreur email
        } else {
          console.log('✅ [ADMIN PROFILE] Email mis à jour avec succès');
        }
      }
    } catch (emailError) {
      console.warn('⚠️ [ADMIN PROFILE] Erreur lors de la mise à jour de l\'email:', emailError);
      // On continue malgré l'erreur
    }

    // 3. Revalider les pages qui affichent les informations admin
    revalidatePath('/admin/profile-settings');
    revalidatePath('/admin/dashboard');

    console.log('✅ [ADMIN PROFILE] Profil admin mis à jour avec succès');
    
    return { 
      success: true, 
      message: 'Profil administrateur mis à jour avec succès.',
      data: {
        name: validatedData.name,
        email: validatedData.email,
        updated_at: new Date().toISOString(),
      }
    };

  } catch (error) {
    console.error('❌ [ADMIN PROFILE] Erreur mise à jour profil admin:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: 'Données invalides: ' + error.errors.map(e => e.message).join(', ')
      };
    }
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil.' 
    };
  }
}

// Action pour récupérer les données du profil admin
export async function getAdminProfile(userId: string) {
  try {
    console.log('📡 [ADMIN PROFILE] Récupération profil admin:', userId);

    // 1. Récupérer le profil depuis la table profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('role', 'admin')
      .single();

    if (profileError || !profile) {
      console.error('❌ [ADMIN PROFILE] Erreur récupération profil:', profileError);
      throw new Error('Profil administrateur introuvable');
    }

    // 2. Récupérer les données auth pour l'email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError) {
      console.warn('⚠️ [ADMIN PROFILE] Erreur récupération utilisateur auth:', userError);
    }

    const adminProfile = {
      id: profile.id,
      name: profile.name,
      email: user?.email || 'admin@streamverse.com',
      role: profile.role,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    console.log('✅ [ADMIN PROFILE] Profil admin récupéré:', adminProfile);
    
    return { 
      success: true, 
      data: adminProfile 
    };

  } catch (error) {
    console.error('❌ [ADMIN PROFILE] Erreur récupération profil admin:', error);
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération du profil.',
      data: null
    };
  }
}

// Action pour mettre à jour l'avatar admin
export async function updateAdminAvatar(userId: string, avatarUrl: string) {
  try {
    console.log('🖼️ [ADMIN AVATAR] Mise à jour avatar admin:', { userId, avatarUrl });

    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('role', 'admin');

    if (error) {
      throw new Error(`Erreur mise à jour avatar: ${error.message}`);
    }

    revalidatePath('/admin/profile-settings');
    revalidatePath('/admin/dashboard');

    console.log('✅ [ADMIN AVATAR] Avatar admin mis à jour avec succès');
    
    return { 
      success: true, 
      message: 'Avatar mis à jour avec succès.' 
    };

  } catch (error) {
    console.error('❌ [ADMIN AVATAR] Erreur mise à jour avatar admin:', error);
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'avatar.' 
    };
  }
}