# Anansi

Application Next.js 14 pour écouter des livres audio en streaming. Les métadonnées sont stockées dans PostgreSQL via Prisma, tandis que les couvertures et pistes audio sont servies depuis un bucket compatible S3/R2.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS avec `next-themes`
- Prisma ORM + PostgreSQL
- NextAuth credentials + PrismaAdapter
- Stockage S3/R2 pour les médias

## Variables d'environnement
Copiez `.env.local.example`, puis renseignez :

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/db?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="remplacer"
N8N_ASSISTANT_WEBHOOK_URL="https://ton-n8n.example/webhook/assistant"
S3_BUCKET="osmos-files"
S3_REGION="auto"
S3_ACCESS_KEY_ID="access-key"
S3_SECRET_ACCESS_KEY="secret-key"
S3_ENDPOINT="https://account-id.r2.cloudflarestorage.com"
S3_LIBRARY_PREFIX="Anansi"
R2_PUBLIC_BASE_URL="https://media.example.com"
NEXT_PUBLIC_R2_PUBLIC_BASE_URL="https://media.example.com"
```

Les clés et URLs publiques de médias sont stockées en base (`coverKey`, `coverUrl`, `audioKey`, `audioUrl`). La clé reste la référence durable; l’URL permet une lecture directe depuis le site. Les uploads admin sont envoyés dans `S3_BUCKET/S3_LIBRARY_PREFIX/<dossier-livre>/`.

## Démarrage
```bash
npm install
npx prisma db push
npm run dev
```

## Fonctionnement
- Le site public expose uniquement un catalogue et un lecteur streaming.
- Il n’y a plus de compte client, panier, paiement, favori ou historique de lecture.
- L’accès `/admin` reste protégé par un compte administrateur.
- Chaque livre peut avoir son dossier S3, sa couverture, ses métadonnées et plusieurs chapitres avec audio et couverture optionnelle.

## Vérifications
```bash
npm run lint
npm run build
```
