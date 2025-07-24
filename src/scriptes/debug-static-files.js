// scripts/debug-static-files.js - SCRIPT DE DÉBOGAGE POUR LES ERREURS 403
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic des fichiers statiques Next.js\n');

// Vérifier la structure des dossiers
const checkDirectory = (dirPath, description) => {
  try {
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      console.log(`✅ ${description}: ${dirPath} (Permissions: ${stats.mode.toString(8)})`);
      
      // Lister les fichiers dans le dossier
      const files = fs.readdirSync(dirPath);
      console.log(`   📁 Contient ${files.length} fichiers/dossiers`);
      
      // Afficher les premiers fichiers
      files.slice(0, 5).forEach(file => {
        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);
        console.log(`   📄 ${file} (${fileStats.isDirectory() ? 'dossier' : 'fichier'})`);
      });
      
      if (files.length > 5) {
        console.log(`   ... et ${files.length - 5} autres`);
      }
    } else {
      console.log(`❌ ${description}: ${dirPath} (N'existe pas)`);
    }
  } catch (error) {
    console.log(`❌ ${description}: ${dirPath} (Erreur: ${error.message})`);
  }
  console.log('');
};

// Vérifier les dossiers Next.js
console.log('📂 Vérification des dossiers Next.js:');
checkDirectory('.next', 'Dossier de build Next.js');
checkDirectory('.next/static', 'Fichiers statiques générés');
checkDirectory('.next/static/media', 'Fichiers media');
checkDirectory('public', 'Dossier public');

// Vérifier les fichiers de configuration
console.log('⚙️ Vérification des fichiers de configuration:');
const configFiles = [
  'next.config.js',
  'next.config.mjs', 
  'middleware.ts',
  'middleware.js',
  'package.json'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} (Permissions: ${stats.mode.toString(8)})`);
  } else {
    console.log(`❌ ${file} (N'existe pas)`);
  }
});

// Vérifier les variables d'environnement
console.log('\n🌍 Variables d\'environnement:');
const envVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PORT'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Masquer les clés sensibles
    const displayValue = varName.includes('KEY') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: Non définie`);
  }
});

// Vérifier les permissions du projet
console.log('\n🔐 Permissions du projet:');
try {
  const projectStats = fs.statSync('.');
  console.log(`📁 Dossier racine: ${projectStats.mode.toString(8)}`);
  
  // Vérifier si on peut écrire dans le dossier
  fs.accessSync('.', fs.constants.R_OK | fs.constants.W_OK);
  console.log('✅ Lecture/écriture autorisée dans le dossier du projet');
} catch (error) {
  console.log(`❌ Problème de permissions: ${error.message}`);
}

// Recommandations
console.log('\n💡 Recommandations pour corriger les erreurs 403:');
console.log('1. Vérifiez que le build Next.js s\'est bien déroulé: npm run build');
console.log('2. Redémarrez le serveur de développement: npm run dev');
console.log('3. Vérifiez que le middleware n\'interfère pas avec les fichiers statiques');
console.log('4. Vérifiez les permissions des dossiers .next et public');
console.log('5. Supprimez .next et node_modules puis réinstallez:');
console.log('   rm -rf .next node_modules && npm install && npm run dev');

// Solution rapide
console.log('\n🚀 Solution rapide:');
console.log('Exécutez ces commandes pour corriger les problèmes courants:');
console.log('');
console.log('# Nettoyer et reconstruire');
console.log('rm -rf .next');
console.log('npm run build');
console.log('npm run dev');
console.log('');
console.log('# Ou pour un reset complet');
console.log('rm -rf .next node_modules package-lock.json');
console.log('npm install');
console.log('npm run dev');

console.log('\n🏁 Diagnostic terminé.');
console.log('Si les erreurs 403 persistent, vérifiez votre configuration de serveur et les politiques CORS.');

// Export pour utilisation en module
module.exports = {
  checkDirectory,
  checkPermissions: () => {
    console.log('Vérification des permissions...');
    // Logique de vérification des permissions
  }
};