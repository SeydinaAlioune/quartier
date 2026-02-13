TITRE DU PROJET : QUARTIERCONNECT — PLATEFORME WEB COMMUNAUTAIRE DE GESTION D’UN QUARTIER
 
 Dans le cadre de la digitalisation et de la centralisation des échanges au niveau d’un quartier, il est proposé de mettre en place une plateforme web communautaire permettant d’informer, d’échanger, de publier des contenus, de signaler des incidents et de gérer des médias.
 
 L’application devra couvrir les phases (fonctionnalités) suivantes :
 
 1- Authentification et gestion du profil
 2- Publication et gestion des actualités
 3- Forum (catégories, sujets, réponses) et signalements
 4- Petites annonces (publication, modération, gestion « mes annonces »)
 5- Boîte à idées (proposition et vote)
 6- Sécurité (alertes/incidents, pièces jointes et mises à jour)
 7- Galerie média (photos/vidéos) avec modération
 8- Dons (campagnes, soumission de preuve manuelle, validation)
 9- Administration et modération (contenus, utilisateurs, validations)
 10- Notifications d’administration

 ## 1) Périmètre
 
 Le périmètre couvre :
 
 - les fonctionnalités communautaires (actualités, forum, annonces, idées)
 - les fonctionnalités sensibles (sécurité, signalements, modération)
 - la gestion des médias (photos/vidéos) avec validation
 - la gestion des dons (processus manuel avec preuve, puis validation par un administrateur)
 
 Hors périmètre (non garanti) :
 
 - paiement automatique entièrement intégré avec opérateurs (selon contrats et disponibilités)
 - migration des anciens médias déjà stockés localement vers un stockage externe
 - application mobile native (la version web doit rester mobile-friendly)

 ## 2) Parties prenantes & rôles
 
 - **Visiteur (non connecté)**
   - consulte les contenus publics validés
   - peut s’inscrire et se connecter
 
 - **Utilisateur authentifié**
   - publie des sujets/réponses, annonces, idées
   - peut proposer des médias
   - peut soumettre une preuve de don et consulter son historique
 
 - **Modérateur / Administrateur**
   - modère et valide/rejette les contenus (forum, annonces, médias, sécurité)
   - administre les actualités et les paramètres fonctionnels nécessaires
   - traite les preuves de dons
   - consulte et gère les notifications d’administration

 ## 3) Parcours clés (scénarios)
 
 1- **Authentification**
    - inscription puis connexion
    - récupération de compte (mot de passe oublié puis réinitialisation)
 
 2- **Forum**
    - création d’un sujet et publication de réponses
    - modération (masquage/suppression) par un administrateur
 
 3- **Petites annonces**
    - publication d’une annonce par un utilisateur authentifié
    - validation avant publication publique
    - gestion de ses annonces (modifier/supprimer)
 
 4- **Galerie média**
    - proposition d’un média (photo/vidéo)
    - validation avant visibilité publique
 
 5- **Sécurité**
    - consultation des alertes/incidents
    - signalement d’un incident (pièces jointes optionnelles)
    - création/gestion d’alertes par l’administration
 
 6- **Dons**
    - consultation des campagnes
    - soumission d’un don avec preuve
    - validation/rejet par l’administration et suivi par l’utilisateur

 ## 4) Exigences fonctionnelles (détaillées)
 
 1- Authentification et gestion du profil
    a. Une interface permet l’inscription et la connexion des utilisateurs.
    b. Un mécanisme de récupération de compte (mot de passe oublié puis réinitialisation) est disponible.
    c. Un utilisateur authentifié accède à son profil et à ses informations personnelles.
 
 2- Publication et gestion des actualités
    a. Les actualités sont consultables publiquement (liste et détail).
    b. Une interface d’administration permet de créer, modifier et gérer les actualités.
 
 3- Forum et signalements
    a. Le forum est organisé en catégories, sujets et réponses.
    b. La lecture est publique pour les contenus validés.
    c. La publication est réservée aux utilisateurs authentifiés.
    d. Les utilisateurs peuvent signaler un contenu jugé inapproprié.
    e. L’administration peut modérer (masquer/supprimer, fermer ou mettre en avant des contenus selon droits).
 
 4- Petites annonces
    a. Un utilisateur authentifié peut publier une annonce.
    b. La publication publique est soumise à validation/modération.
    c. Chaque utilisateur peut gérer ses annonces (mise à jour et suppression).
 
 5- Boîte à idées
    a. Un utilisateur authentifié peut proposer une idée.
    b. Les utilisateurs peuvent voter afin de faire ressortir les idées prioritaires.
 
 6- Sécurité (alertes et incidents)
    a. Les alertes et incidents sont consultables publiquement.
    b. Un utilisateur authentifié peut signaler un incident.
    c. L’administration peut créer, modifier, supprimer et modérer les éléments de sécurité.
    d. Le système peut afficher des mises à jour en temps réel pour améliorer la réactivité.
 
 7- Galerie média (photos/vidéos)
    a. Un utilisateur authentifié peut proposer un média (photo/vidéo).
    b. Un statut de validation est appliqué avant publication.
    c. Les médias validés sont consultables publiquement.
    d. L’administration peut approuver/rejeter/supprimer les médias.
 
 8- Dons (processus manuel)
    a. Les campagnes de dons sont consultables publiquement.
    b. Un utilisateur peut soumettre un don et joindre une preuve.
    c. L’administration valide ou rejette la preuve.
    d. L’utilisateur consulte l’historique de ses dons.
 
 9- Administration et modération
    a. Des interfaces dédiées permettent de gérer les contenus et les validations.
    b. Les actions sensibles sont restreintes aux rôles habilités.
 
 10- Notifications d’administration
    a. L’administration dispose d’un centre de notifications pour suivre les actions à traiter.
    b. Chaque notification peut être marquée comme lue (unitairement ou en lot).

 ## 5) Exigences non-fonctionnelles
 
 1- Sécurité
    - contrôle d’accès par rôles (utilisateur, modérateur, administrateur)
    - limitation des abus (protection contre les tentatives répétées sur les actions sensibles)
    - validation des données saisies et protection des opérations critiques
 
 2- Performance et ergonomie
    - interface responsive (adaptée mobile)
    - chargement progressif des listes et des médias
    - expérience fluide sur les fonctionnalités principales
 
 3- Exploitation
    - journalisation des événements principaux
    - surveillance de disponibilité de l’application en production

 ## 6) Contraintes techniques (haut niveau)
 
 - L’application est une solution web (front + back) avec une base de données.
 - Le stockage des médias doit être durable en production (afin d’éviter la disparition des fichiers après un délai).
 - Le déploiement doit permettre :
   - une interface publique
   - une interface d’administration
   - une persistance des données et des médias

 ## 7) Recette (critères d’acceptation)

- Auth : register/login/forgot/reset OK.
- Forum : création sujet + réponse OK ; modération admin OK.
- Annonces : création + upload image OK ; listing public OK.
- Sécurité : création incident + consultation + SSE OK.
- Galerie : upload image+vidéo OK ; modération admin OK.
- Dons : preuve manuelle + validation admin + historique OK.
- Médias en production : URL Cloudinary persistante + suppression libère l’espace.

 ## 8) Annexes
