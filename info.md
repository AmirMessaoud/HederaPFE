# Guide d'utilisation de l'API NFT Info

Ce document explique comment tester les endpoints pour la gestion des informations NFT dans Postman.

## Configuration requise

- Assurez-vous que votre serveur Node.js est en cours d'exécution
- Base de données MongoDB connectée
- Postman (pour les tests d'API)

## Structure des données NFT

L'utilisateur peut définir des informations en sélectionnant d'abord une catégorie (`categoryType`) comme "Transportation", "Real Estate", ou "Certificat". Selon la catégorie sélectionnée, l'utilisateur choisit ensuite un type d'élément spécifique (`itemType`), et les champs de métadonnées requis dépendront de ce type d'élément.

> **NOUVELLE FONCTIONNALITÉ** : Lorsqu'un NFT est créé avec le contrôleur `createAndMintNFT`, le système génère automatiquement deux copies identiques du NFT - l'une est envoyée au compte de l'acheteur et l'autre au compte du vendeur. Cette approche garantit que les deux parties possèdent une preuve immuable de la transaction.

### Catégorie "Real Estate" (Immobilier)

Si `category = "Real Estate"` et `itemType = "House"` :

Les métadonnées NFT doivent inclure :

- `fullAddress` : Adresse complète
- `propertyType` : Type de propriété
- `surfaceArea` : Surface en mètres carrés (m²)
- `numberOfRooms` : Nombre de pièces
- `yearOfConstruction` : Année de construction
- `propertyCondition` : État de la propriété
- `purchasePrice` : Prix d'achat en TND

### Catégorie "Transportation" (Transport)

L'utilisateur sélectionne un `itemType` parmi :

- Car (Voiture)
- Motorcycle (Moto)
- Truck (Camion)
- Bicycle (Vélo)
- Scooter (Scooter)

En fonction du type sélectionné, les informations doivent inclure :

- `manufacturer` : Fabricant
- `model` : Modèle
- `type` : Type de véhicule
- `enginePower` : Puissance moteur
- `purchasePrice` : Prix d'achat en TND

### Catégorie "Certificat" (Nouveau)

Dans la catégorie "Certificat", les métadonnées doivent inclure :

- `UserAccountId` : ID du compte de l'utilisateur (destinataire du certificat)
- `InstitutionAccountId` : ID du compte de l'institution émettrice
- `studentName` : Nom de l'étudiant
- `certificateTitle` : Titre du certificat
- `institutionName` : Nom de l'institution
- `dateIssued` : Date d'émission du certificat
- `grade` : Note ou mention obtenue
- `speciality` : Spécialité concernant le certificat
- `duration` : Durée de la formation
- `issuerName` : Nom de l'émetteur du certificat

### Champs obligatoires pour les catégories Real Estate et Transportation

Pour les catégories "Real Estate" et "Transportation", les champs suivants sont toujours requis :

- `buyerAccountId` : ID du compte de l'acheteur
- `sellerAccountId` : ID du compte du vendeur

## Authentification

Toutes les routes sont protégées par une authentification. Vous devez inclure un token JWT valide dans l'en-tête de vos requêtes :

```
Authorization: Bearer <votre_token>
```

Pour obtenir un token, utilisez d'abord l'endpoint d'authentification.

## Endpoints disponibles

### API des certificats

#### 1. Sauvegarder les informations d'un certificat

**Endpoint :** `POST /api/certif/info`

**Corps de la requête :**

```json
{
  "UserAccountId": "0.0.1234567",
  "InstitutionAccountId": "0.0.7654321",
  "studentName": "John Doe",
  "certificateTitle": "Bachelor of Computer Science",
  "institutionName": "University of Technology",
  "dateIssued": "2023-05-15",
  "grade": "A",
  "speciality": "Artificial Intelligence",
  "duration": "4 years",
  "issuerName": "Prof. Jane Smith"
}
```

**Réponse en cas de succès :**

```json
{
  "success": true,
  "message": "Informations du certificat enregistrées avec succès",
  "data": {
    "_id": "60abcdef1234567890abcdef",
    "category": "Certificat",
    "UserAccountId": "0.0.1234567",
    "InstitutionAccountId": "0.0.7654321",
    "studentName": "John Doe",
    "certificateTitle": "Bachelor of Computer Science",
    "institutionName": "University of Technology",
    "dateIssued": "2023-05-15T00:00:00.000Z",
    "grade": "A",
    "speciality": "Artificial Intelligence",
    "duration": "4 years",
    "issuerName": "Prof. Jane Smith",
    "createdAt": "2025-05-06T12:34:56.789Z",
    "updatedAt": "2025-05-06T12:34:56.789Z",
    "__v": 0
  }
}
```

#### 2. Récupérer les informations d'un certificat spécifique

**Endpoint :** `GET /api/certif/info/:id`

Remplacez `:id` par l'identifiant MongoDB (\_id) du certificat.

**Exemple :** `GET /api/certif/info/60abcdef1234567890abcdef`

**Réponse en cas de succès :**

```json
{
  "success": true,
  "data": {
    "_id": "60abcdef1234567890abcdef",
    "category": "Certificat",
    "UserAccountId": "0.0.1234567",
    "InstitutionAccountId": "0.0.7654321",
    "studentName": "John Doe",
    "certificateTitle": "Bachelor of Computer Science",
    "institutionName": "University of Technology",
    "dateIssued": "2023-05-15T00:00:00.000Z",
    "grade": "A",
    "speciality": "Artificial Intelligence",
    "duration": "4 years",
    "issuerName": "Prof. Jane Smith",
    "createdAt": "2025-05-06T12:34:56.789Z",
    "updatedAt": "2025-05-06T12:34:56.789Z",
    "__v": 0
  }
}
```

#### 3. Récupérer tous les certificats

**Endpoint :** `GET /api/certif/info`

**Réponse en cas de succès :**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60abcdef1234567890abcdef",
      "category": "Certificat",
      "UserAccountId": "0.0.1234567",
      "InstitutionAccountId": "0.0.7654321",
      "studentName": "John Doe",
      "certificateTitle": "Bachelor of Computer Science",
      "institutionName": "University of Technology",
      "dateIssued": "2023-05-15T00:00:00.000Z",
      "grade": "A",
      "speciality": "Artificial Intelligence",
      "duration": "4 years",
      "issuerName": "Prof. Jane Smith",
      "createdAt": "2025-05-06T12:34:56.789Z",
      "updatedAt": "2025-05-06T12:34:56.789Z",
      "__v": 0
    },
    {
      "_id": "60abcdef1234567890abcdee",
      "category": "Certificat",
      "UserAccountId": "0.0.9876543",
      "InstitutionAccountId": "0.0.7654321",
      "studentName": "Jane Smith",
      "certificateTitle": "Master of AI",
      "institutionName": "AI Institute",
      "dateIssued": "2023-06-20T00:00:00.000Z",
      "grade": "B+",
      "speciality": "Machine Learning",
      "duration": "2 years",
      "issuerName": "Dr. Robert Johnson",
      "createdAt": "2025-05-06T12:30:56.789Z",
      "updatedAt": "2025-05-06T12:30:56.789Z",
      "__v": 0
    }
  ]
}
```

### API des certificats NFT

#### 1. Créer et Minter un certificat NFT

**Endpoint :** `POST /api/nft/certif/create`

Cet endpoint permet de créer un NFT de certificat sur Hedera et d'envoyer une copie à l'institution émettrice et une autre à l'étudiant/utilisateur qui reçoit le certificat.

**Corps de la requête :**

```json
{
  "metadata": {
    "UserAccountId": "0.0.1234567",
    "InstitutionAccountId": "0.0.7654321",
    "studentName": "John Doe",
    "certificateTitle": "Bachelor of Computer Science",
    "institutionName": "University of Technology",
    "dateIssued": "2023-05-15",
    "grade": "A",
    "speciality": "Artificial Intelligence",
    "duration": "4 years",
    "issuerName": "Prof. Jane Smith"
  }
}
```

**Réponse en cas de succès :**

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.9876543",
    "tokenId": "0.0.8765432",
    "institutionInfo": {
      "accountId": "0.0.7654321",
      "serialNumber": "1",
      "transferStatus": "SUCCESS"
    },
    "userInfo": {
      "accountId": "0.0.1234567",
      "serialNumber": "2",
      "transferStatus": "SUCCESS"
    },
    "category": "Certificat",
    "certificateTitle": "Bachelor of Computer Science",
    "studentName": "John Doe",
    "institutionName": "University of Technology",
    "dateIssued": "2023-05-15",
    "grade": "A",
    "speciality": "Artificial Intelligence",
    "duration": "4 years",
    "issuerName": "Prof. Jane Smith",
    "metadata": {
      "UserAccountId": "0.0.1234567",
      "InstitutionAccountId": "0.0.7654321",
      "studentName": "John Doe",
      "certificateTitle": "Bachelor of Computer Science",
      "institutionName": "University of Technology",
      "dateIssued": "2023-05-15",
      "grade": "A",
      "speciality": "Artificial Intelligence",
      "duration": "4 years",
      "issuerName": "Prof. Jane Smith"
    },
    "createdAt": "2025-05-06T12:34:56.789Z"
  }
}
```

### API des NFTs pour les autres catégories

#### 1. Créer et Minter un NFT

**Endpoint :** `POST /api/nft/create`

Cet endpoint permet de créer un NFT sur Hedera et d'envoyer des copies identiques à la fois à l'acheteur et au vendeur.

**Corps de la requête :**

```json
{
  "categoryType": "Real Estate",
  "itemType": "House",
  "metadata": {
    "buyerAccountId": "0.0.1234567",
    "sellerAccountId": "0.0.7654321",
    "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
    "propertyType": "Apartment",
    "surfaceArea": 120,
    "numberOfRooms": 3,
    "yearOfConstruction": 2020,
    "propertyCondition": "Excellent",
    "purchasePrice": 250000
  }
}
```

**Réponse en cas de succès :**

```json
{
  "success": true,
  "data": {
    "contractId": "0.0.1234567",
    "tokenId": "0.0.8765432",
    "buyerInfo": {
      "accountId": "0.0.1234567",
      "serialNumber": "1",
      "transferStatus": "SUCCESS"
    },
    "sellerInfo": {
      "accountId": "0.0.7654321",
      "serialNumber": "2",
      "transferStatus": "SUCCESS"
    },
    "category": "Real Estate",
    "itemType": "House",
    "metadata": {
      "buyerAccountId": "0.0.1234567",
      "sellerAccountId": "0.0.7654321",
      "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
      "propertyType": "Apartment",
      "surfaceArea": 120,
      "numberOfRooms": 3,
      "yearOfConstruction": 2020,
      "propertyCondition": "Excellent",
      "purchasePrice": 250000
    },
    "simplifiedMetadata": "{ ... }",
    "createdAt": "2025-05-06T12:34:56.789Z"
  }
}
```

### 2. Sauvegarder les informations d'un NFT

**Endpoint :** `POST /api/nft/info`

**Corps de la requête (pour une propriété immobilière) :**

```json
{
  "category": "Real Estate",
  "itemType": "House",
  "buyerAccountId": "0.0.1234567",
  "sellerAccountId": "0.0.7654321",
  "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
  "propertyType": "Apartment",
  "surfaceArea": 120,
  "numberOfRooms": 3,
  "yearOfConstruction": 2020,
  "propertyCondition": "Excellent",
  "purchasePrice": 250000
}
```

**Corps de la requête (pour un véhicule - Catégorie Transport) :**

```json
{
  "category": "Transportation",
  "itemType": "Car",
  "buyerAccountId": "0.0.1234567",
  "sellerAccountId": "0.0.7654321",
  "manufacturer": "Toyota",
  "model": "Corolla",
  "type": "Car",
  "enginePower": 120,
  "purchasePrice": 35000
}
```

**Corps de la requête (pour une moto - Catégorie Transport) :**

```json
{
  "category": "Transportation",
  "itemType": "Motorcycle",
  "buyerAccountId": "0.0.1234567",
  "sellerAccountId": "0.0.7654321",
  "manufacturer": "Honda",
  "model": "CBR500R",
  "type": "Motorcycle",
  "enginePower": 47,
  "purchasePrice": 18000
}
```

**Réponse en cas de succès :**

```json
{
  "success": true,
  "message": "Informations NFT enregistrées avec succès",
  "data": {
    "_id": "60abcdef1234567890abcdef",
    "category": "Real Estate",
    "itemType": "House",
    "buyerAccountId": "0.0.1234567",
    "sellerAccountId": "0.0.7654321",
    "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
    "propertyType": "Apartment",
    "surfaceArea": 120,
    "numberOfRooms": 3,
    "yearOfConstruction": 2020,
    "propertyCondition": "Excellent",
    "purchasePrice": 250000,
    "tokenId": "0.0.8765432",
    "serialNumber": "1",
    "contractId": "0.0.9876543",
    "createdAt": "2025-05-06T12:34:56.789Z",
    "updatedAt": "2025-05-06T12:34:56.789Z",
    "__v": 0
  }
}
```

### 2. Récupérer les informations d'un NFT spécifique

**Endpoint :** `GET /api/nft/info/:id`

Remplacez `:id` par l'identifiant MongoDB (\_id) du NFT.

**Exemple :** `GET /api/nft/info/60abcdef1234567890abcdef`

**Réponse en cas de succès :**

```json
{
  "success": true,
  "data": {
    "_id": "60abcdef1234567890abcdef",
    "category": "Real Estate",
    "itemType": "House",
    "buyerAccountId": "0.0.1234567",
    "sellerAccountId": "0.0.7654321",
    "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
    "propertyType": "Apartment",
    "surfaceArea": 120,
    "numberOfRooms": 3,
    "yearOfConstruction": 2020,
    "propertyCondition": "Excellent",
    "purchasePrice": 250000,
    "tokenId": "0.0.8765432",
    "serialNumber": "1",
    "contractId": "0.0.9876543",
    "createdAt": "2025-05-06T12:34:56.789Z",
    "updatedAt": "2025-05-06T12:34:56.789Z",
    "__v": 0
  }
}
```

### 3. Récupérer tous les NFTs

**Endpoint :** `GET /api/nft/info`

**Réponse en cas de succès :**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60abcdef1234567890abcdef",
      "category": "Real Estate",
      "itemType": "House",
      "buyerAccountId": "0.0.1234567",
      "sellerAccountId": "0.0.7654321",
      "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
      "propertyType": "Apartment",
      "surfaceArea": 120,
      "numberOfRooms": 3,
      "yearOfConstruction": 2020,
      "propertyCondition": "Excellent",
      "purchasePrice": 250000,
      "tokenId": "0.0.8765432",
      "serialNumber": "1",
      "contractId": "0.0.9876543",
      "createdAt": "2025-05-06T12:34:56.789Z",
      "updatedAt": "2025-05-06T12:34:56.789Z",
      "__v": 0
    },
    {
      "_id": "60abcdef1234567890abcdee",
      "category": "Transportation",
      "itemType": "Car",
      "buyerAccountId": "0.0.1234567",
      "sellerAccountId": "0.0.7654321",
      "purchasePrice": 35000,
      "tokenId": "0.0.8765432",
      "serialNumber": "1",
      "contractId": "0.0.9876543",
      "createdAt": "2025-05-06T12:30:56.789Z",
      "updatedAt": "2025-05-06T12:30:56.789Z",
      "__v": 0
    }
  ]
}
```

## Exemples de configuration dans Postman

### Sauvegarder un NFT immobilier

1. Créez une nouvelle requête de type `POST`
2. Entrez l'URL : `http://localhost:5000/api/nft/info`
3. Onglet Headers:
   - Key: `Content-Type`, Value: `application/json`
   - Key: `Authorization`, Value: `Bearer votre_token_jwt`
4. Onglet Body:
   - Sélectionnez `raw` et `JSON`
   - Entrez le JSON suivant:

```json
{
  "category": "Real Estate",
  "itemType": "House",
  "buyerAccountId": "0.0.1234567",
  "sellerAccountId": "0.0.7654321",
  "fullAddress": "123 Blockchain Avenue, Crypto City, 75000",
  "propertyType": "Apartment",
  "surfaceArea": 120,
  "numberOfRooms": 3,
  "yearOfConstruction": 2020,
  "propertyCondition": "Excellent",
  "purchasePrice": 250000,
  "tokenId": "0.0.8765432",
  "serialNumber": "1",
  "contractId": "0.0.9876543"
}
```

5. Cliquez sur "Send" pour envoyer la requête

## Codes d'erreur

- **400** : Requête incorrecte (champs manquants ou invalides)
- **404** : NFT non trouvé
- **500** : Erreur serveur interne

## Conseils de débogage

- Vérifiez que votre serveur et MongoDB sont en cours d'exécution
- Assurez-vous que le token JWT est valide
- Consultez les logs du serveur pour plus d'informations sur les erreurs
