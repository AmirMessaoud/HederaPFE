# Guide de test des endpoints Identity & NFT (Hedera)

Ce guide explique comment tester tous les endpoints exposés par le contrôleur `identityController.js` via Postman ou un outil similaire.

## Prérequis

- Serveur backend en cours d'exécution (ex: `http://localhost:3000`)
- Un compte utilisateur pour obtenir un JWT (`authToken`)
- Postman ou équivalent

---

## Configuration Postman

- Créez un environnement Postman avec :
  - `baseUrl` = `http://localhost:3000/api/identity`
  - `authToken` = votre JWT

---

## Endpoints principaux

### 1. Récupérer toutes les identités

- **Méthode**: GET
- **URL**: `{{baseUrl}}/`
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {{authToken}}

### 2. Récupérer une identité par ID

- **Méthode**: GET
- **URL**: `{{baseUrl}}/:id`
- **Headers**: identiques

### 3. Créer une nouvelle identité et minter un NFT

- **Méthode**: POST
- **URL**: `{{baseUrl}}/`
- **Headers**: identiques
- **Body (JSON)** :

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "dateOfBirth": "1990-01-01",
  "gender": "Homme",
  "phoneNumber": "+33612345678",
  "idNumber": "123AB456789",
  "idIssueDate": "2020-01-01",
  "fingerprintNumber": "FP123456",
  "homeAddress": "1 rue de la Paix",
  "workAddress": "5 avenue des Champs-Élysées",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France"
}
```

### 4. Mettre à jour une identité

- **Méthode**: PATCH
- **URL**: `{{baseUrl}}/:id`
- **Headers**: identiques
- **Body (JSON)** :

```json
{
  "firstName": "Nouveau Prénom",
  "lastName": "Nouveau Nom"
}
```

### 5. Supprimer une identité

- **Méthode**: DELETE
- **URL**: `{{baseUrl}}/:id`
- **Headers**: identiques

---

## Endpoints Hedera/NFT supplémentaires

### 6. Créer un compte Hedera

- **Méthode**: POST
- **URL**: `{{baseUrl}}/account`
- **Headers**: identiques

### 7. Obtenir le solde d’un compte

- **Méthode**: GET
- **URL**: `{{baseUrl}}/balance`
- **Headers**: identiques

### 8. Obtenir les infos d’un compte

- **Méthode**: GET
- **URL**: `{{baseUrl}}/account-info`
- **Headers**: identiques

### 9. Obtenir un solde simplifié

- **Méthode**: GET
- **URL**: `{{baseUrl}}/account-balance`
- **Headers**: identiques

### 10. Transférer des HBAR

- **Méthode**: POST
- **URL**: `{{baseUrl}}/transfer`
- **Headers**: identiques
- **Body (JSON)** :

```json
{
  "receiverAccountId": "0.0.12345",
  "amount": 10
}
```

### 11. Créer une ID avec NFT (autre méthode)

- **Méthode**: POST
- **URL**: `{{baseUrl}}/id-nft`
- **Headers**: identiques

### 12. Minter un NFT sur un compte existant

- **Méthode**: POST
- **URL**: `{{baseUrl}}/mint`
- **Headers**: identiques

---

## Gestion des erreurs

- Les erreurs sont retournées au format JSON avec un champ `error`.
- Ex :

```json
{
  "error": "All identity fields are required"
}
```

---

## Conseils

- Toujours fournir un JWT valide dans le header `Authorization`.
- Respectez la structure des bodies JSON indiquée (voir la section création d'identité).
- Pour vérifier l’enregistrement dans MongoDB, utilisez l’endpoint GET `/` ou MongoDB Compass/shell.

---

## Flux de test conseillé

1. Créez une identité (`POST /`)
2. Vérifiez la présence dans la base (`GET /`)
3. Testez la mise à jour (`PATCH /:id`)
4. Testez la suppression (`DELETE /:id`)
5. Testez les endpoints Hedera si besoin

---

**Contact : Pour toute question ou problème, vérifiez les logs serveur ou contactez l’équipe technique.**
