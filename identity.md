# Guide de test des APIs d'identité avec Postman

Ce document décrit comment tester les différentes routes d'API du contrôleur d'identité (`identityController.js`) en utilisant Postman.

## Prérequis

- [Postman](https://www.postman.com/downloads/) installé sur votre machine
- Le serveur backend en cours d'exécution (généralement sur `http://localhost:3000` ou autre port configuré)
- Un compte utilisateur valide pour authentification (pour les endpoints nécessitant une authentification)

## Configuration de l'environnement Postman

1. Créez un nouvel environnement dans Postman
2. Ajoutez les variables suivantes:
   - `baseUrl`: URL de base de votre API (ex: `http://localhost:3000/api/identity`)
   - `authToken`: Jeton d'authentification JWT (à remplir après connexion)

## Endpoints d'identité (MongoDB)

### 1. Récupérer toutes les identités

**Requête**:

- Méthode: `GET`
- URL: `{{baseUrl}}/`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

**Réponse attendue**:

- Code: 200 OK
- Body: Tableau d'objets identité

### 2. Récupérer une identité spécifique

**Requête**:

- Méthode: `GET`
- URL: `{{baseUrl}}/:id`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

**Réponse attendue**:

- Code: 200 OK
- Body: Objet identité

### 3. Créer une nouvelle identité et minter un NFT

**Requête**:

- Méthode: `POST`
- URL: `{{baseUrl}}/`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (obligatoire)
- Body:

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "dateOfBirth": "1990-01-01",
  "gender": "Homme",
  "phoneNumber": "+33612345678",
  "idNumber": "123AB456789",
  "idIssueDate": "2020-01-01",
  "idExpiryDate": "2030-01-01",
  "nationality": "Française",
  "address": {
    "street": "1 rue de la Paix",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  }
}
```

**Réponse attendue**:

- Code: 201 Created
- Body: Objet identité créé avec informations du NFT

### 4. Mettre à jour une identité

**Requête**:

- Méthode: `PATCH` (et non PUT)
- URL: `{{baseUrl}}/:id`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)
- Body (champs à mettre à jour):

```json
{
  "firstName": "Nouveau Prénom",
  "lastName": "Nouveau Nom"
}
```

**Réponse attendue**:

- Code: 200 OK
- Body: Objet identité mis à jour

### 5. Supprimer une identité

**Requête**:

- Méthode: `DELETE`
- URL: `{{baseUrl}}/:id`
- Headers:
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

**Réponse attendue**:

- Code: 200 OK
- Body:

```json
{
  "message": "Identity deleted successfully"
}
```

## Endpoints NFT et compte Hedera

### 1. Créer un compte Hedera

**Requête**:

- Méthode: `POST`
- URL: `{{baseUrl}}/account`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

### 2. Obtenir le solde d'un compte (détaillé)

**Requête**:

- Méthode: `GET`
- URL: `{{baseUrl}}/balance`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

### 3. Obtenir les informations d'un compte

**Requête**:

- Méthode: `GET`
- URL: `{{baseUrl}}/account-info`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

### 4. Obtenir le solde d'un compte (simplifié)

**Requête**:

- Méthode: `GET`
- URL: `{{baseUrl}}/account-balance`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

### 5. Transférer des HBAR entre comptes

**Requête**:

- Méthode: `POST`
- URL: `{{baseUrl}}/transfer`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)
- Body:

```json
{
  "receiverAccountId": "0.0.12345",
  "amount": 10
}
```

### 6. Créer une ID avec NFT

**Requête**:

- Méthode: `POST`
- URL: `{{baseUrl}}/id-nft`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

### 7. Minter un NFT sur un compte existant

**Requête**:

- Méthode: `POST`
- URL: `{{baseUrl}}/mint`
- Headers:
  - Content-Type: `application/json`
  - Authorization: `Bearer {{authToken}}` (si authentification requise)

## Gestion des erreurs

Les réponses d'erreur suivent généralement ce format:

```json
{
  "error": "Description de l'erreur"
}
```

Codes d'erreur courants:

- 400: Requête invalide
- 401: Non authentifié
- 404: Ressource non trouvée
- 500: Erreur serveur

## Notes importantes

1. L'endpoint `createIdentityAndMintNFT` nécessite une authentification valide car il utilise les informations de l'utilisateur connecté.
2. Les opérations de mint NFT peuvent prendre un certain temps à s'exécuter en raison des interactions avec la blockchain Hedera.
3. Lorsqu'un NFT est minté avec succès, le tokenId et l'accountId retournés sont des identifiants sur la blockchain Hedera au format `0.0.xxxxx`.
4. En cas d'erreur de transaction sur la blockchain, consultez les logs du serveur pour des informations de débogage détaillées.

## Exemple de flux de test complet

1. Connectez-vous pour obtenir un token JWT
2. Créez une identité avec NFT via l'endpoint `POST /`
3. Récupérez toutes les identités avec `GET /`
4. Récupérez l'identité spécifique créée avec `GET /:id`
5. Mettez à jour l'identité avec `PATCH /:id`
6. Supprimez l'identité avec `DELETE /:id`

## Notes importantes pour les tests

1. L'URL de base est probablement `http://localhost:3000/api/identity` (à vérifier selon votre configuration de serveur)
2. Toutes les routes d'identité sont relatives à cette URL de base
3. Les endpoints NFT et compte Hedera sont également accessibles via le même routeur
4. L'authentification est généralement requise pour la plupart des opérations
5. Les opérations blockchain peuvent prendre un certain temps à être confirmées
