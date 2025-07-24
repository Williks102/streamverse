// src/components/AuthDiagnostic.tsx - VERSION CORRIGÉE IMPORTS
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield
} from 'lucide-react';
// ✅ CORRECTION : Import de type unique pour éviter les doublons
import type { Database as SupabaseDatabase } from '@/types/database';

// ✅ CORRECTION : Éviter les conflits avec le nom Database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<SupabaseDatabase>(supabaseUrl, supabaseKey);

interface DiagnosticResult {
  title: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export default function AuthDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // 1. Test de connexion Supabase
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
          diagnosticResults.push({
            title: '🔌 Connexion Supabase',
            status: 'error',
            message: 'Impossible de se connecter à Supabase',
            details: [error.message, `Code: ${error.code}`]
          });
        } else {
          diagnosticResults.push({
            title: '🔌 Connexion Supabase',
            status: 'success',
            message: 'Connexion à la base de données réussie'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          title: '🔌 Connexion Supabase',
          status: 'error',
          message: 'Erreur de connexion Supabase',
          details: [String(error)]
        });
      }

      // 2. Test de session actuelle
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          diagnosticResults.push({
            title: '🔐 Session utilisateur',
            status: 'error',
            message: 'Erreur de récupération de session',
            details: [sessionError.message]
          });
        } else if (session?.user) {
          diagnosticResults.push({
            title: '🔐 Session utilisateur',
            status: 'success',
            message: `Session active pour ${session.user.email}`,
            details: [
              `User ID: ${session.user.id}`,
              `Dernière connexion: ${new Date(session.user.last_sign_in_at || '').toLocaleString()}`,
              `Email vérifié: ${session.user.email_confirmed_at ? 'Oui' : 'Non'}`
            ]
          });
          
          // 3. Test du profil utilisateur
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              if (profileError.code === 'PGRST116') {
                diagnosticResults.push({
                  title: '👤 Profil utilisateur',
                  status: 'warning',
                  message: 'Profil utilisateur manquant',
                  details: [
                    'Le profil n\'existe pas dans la table profiles',
                    'Cela peut causer des problèmes de redirection',
                    'Solution: Créer automatiquement le profil'
                  ]
                });
              } else {
                diagnosticResults.push({
                  title: '👤 Profil utilisateur',
                  status: 'error',
                  message: 'Erreur de récupération du profil',
                  details: [profileError.message, `Code: ${profileError.code}`]
                });
              }
            } else {
              diagnosticResults.push({
                title: '👤 Profil utilisateur',
                status: 'success',
                message: `Profil trouvé: ${profile.name}`,
                details: [
                  `Nom: ${profile.name}`,
                  `Rôle: ${profile.role}`,
                  `Créé le: ${new Date(profile.created_at).toLocaleString()}`,
                  `Modifié le: ${new Date(profile.updated_at || profile.created_at).toLocaleString()}`
                ]
              });
            }
          } catch (profileException) {
            diagnosticResults.push({
              title: '👤 Profil utilisateur',
              status: 'error',
              message: 'Exception lors de la récupération du profil',
              details: [String(profileException)]
            });
          }

          // 4. Test des permissions RLS
          try {
            const { data: testQuery, error: rlsError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id);

            if (rlsError) {
              diagnosticResults.push({
                title: '🛡️ Permissions RLS',
                status: 'error',
                message: 'Erreur de permissions RLS',
                details: [
                  rlsError.message,
                  'Vérifiez les politiques RLS dans Supabase',
                  'L\'utilisateur peut ne pas avoir accès à ses propres données'
                ]
              });
            } else {
              diagnosticResults.push({
                title: '🛡️ Permissions RLS',
                status: 'success',
                message: 'Permissions RLS correctes'
              });
            }
          } catch (rlsException) {
            diagnosticResults.push({
              title: '🛡️ Permissions RLS',
              status: 'warning',
              message: 'Impossible de tester les permissions RLS',
              details: [String(rlsException)]
            });
          }

        } else {
          diagnosticResults.push({
            title: '🔐 Session utilisateur',
            status: 'warning',
            message: 'Aucune session active',
            details: ['L\'utilisateur n\'est pas connecté']
          });
        }
      } catch (sessionException) {
        diagnosticResults.push({
          title: '🔐 Session utilisateur',
          status: 'error',
          message: 'Exception lors du test de session',
          details: [String(sessionException)]
        });
      }

      // 5. Test des variables d'environnement
      const envTests = [
        { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
      ];

      const missingEnv = envTests.filter(env => !env.value);
      if (missingEnv.length > 0) {
        diagnosticResults.push({
          title: '⚙️ Variables d\'environnement',
          status: 'error',
          message: 'Variables d\'environnement manquantes',
          details: missingEnv.map(env => `${env.name} non définie`)
        });
      } else {
        diagnosticResults.push({
          title: '⚙️ Variables d\'environnement',
          status: 'success',
          message: 'Variables d\'environnement correctes',
          details: [
            `URL Supabase: ${supabaseUrl.substring(0, 30)}...`,
            `Clé publique: ${supabaseKey.substring(0, 20)}...`
          ]
        });
      }

      // 6. Test de connectivité réseau
      try {
        const networkTest = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (networkTest.ok) {
          diagnosticResults.push({
            title: '🌐 Connectivité réseau',
            status: 'success',
            message: 'Connexion réseau à Supabase réussie'
          });
        } else {
          diagnosticResults.push({
            title: '🌐 Connectivité réseau',
            status: 'warning',
            message: `Réponse réseau inhabituelle: ${networkTest.status}`,
            details: [`Status: ${networkTest.status} ${networkTest.statusText}`]
          });
        }
      } catch (networkError) {
        diagnosticResults.push({
          title: '🌐 Connectivité réseau',
          status: 'error',
          message: 'Erreur de connectivité réseau',
          details: [String(networkError)]
        });
      }

    } catch (globalError) {
      diagnosticResults.push({
        title: '❌ Erreur générale',
        status: 'error',
        message: 'Erreur lors du diagnostic',
        details: [String(globalError)]
      });
    }

    setResults(diagnosticResults);
    setLastRun(new Date());
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    const variants = {
      success: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    const labels = {
      success: 'OK',
      warning: 'Attention',
      error: 'Erreur'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Diagnostic d'Authentification
          </CardTitle>
          <CardDescription>
            Vérification des composants d'authentification et de redirection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              variant="outline"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Diagnostic en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Relancer le diagnostic
                </>
              )}
            </Button>
            
            {lastRun && (
              <span className="text-sm text-muted-foreground">
                Dernière exécution: {lastRun.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-700">Succès</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-yellow-700">Avertissements</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-700">Erreurs</div>
            </div>
          </div>

          {/* Recommandations prioritaires */}
          {errorCount > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Action requise:</strong> {errorCount} erreur(s) critique(s) détectée(s). 
                Corrigez ces problèmes pour résoudre les issues de redirection.
              </AlertDescription>
            </Alert>
          )}

          {/* Résultats détaillés */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className="border-l-4" 
                style={{
                  borderLeftColor: 
                    result.status === 'success' ? '#22c55e' :
                    result.status === 'warning' ? '#eab308' :
                    '#ef4444'
                }}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  {result.details && result.details.length > 0 && (
                    <div className="mt-3 ml-8">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                          Voir les détails ({result.details.length})
                        </summary>
                        <div className="mt-2 space-y-1">
                          {result.details.map((detail, detailIndex) => (
                            <div key={detailIndex} className="text-xs font-mono bg-muted p-2 rounded">
                              {detail}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Guide de dépannage */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">🔧 Guide de dépannage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Erreurs 403 (Forbidden)</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Vérifiez les politiques RLS dans Supabase</li>
                  <li>• Assurez-vous que l'utilisateur a les bonnes permissions</li>
                  <li>• Vérifiez que le profil utilisateur existe dans la table profiles</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-yellow-600 mb-2">Profil manquant</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Le profil doit être créé automatiquement lors de l'inscription</li>
                  <li>• Vérifiez les triggers de base de données</li>
                  <li>• Implémentez une création de profil de fallback</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Problèmes de redirection</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Utilisez router.replace() au lieu de router.push()</li>
                  <li>• Ajoutez des délais pour la synchronisation de l'état</li>
                  <li>• Implémentez des redirections de fallback</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-600 mb-2">Erreurs TypeScript</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Évitez les imports dupliqués de type Database</li>
                  <li>• Utilisez des alias pour les types conflictuels</li>
                  <li>• Implémentez des type guards pour les comparaisons</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}