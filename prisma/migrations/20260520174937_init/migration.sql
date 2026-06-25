-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN', 'COMMERCIAL');


CREATE TYPE "VehicleStatus" AS ENUM ('A_VENDRE', 'EN_LOCATION', 'LES_DEUX', 'VENDU', 'LOUE');


CREATE TYPE "VehicleType" AS ENUM ('ACHAT', 'LOCATION', 'LES_DEUX');


CREATE TYPE "DossierType" AS ENUM ('ACHAT', 'LOCATION');


CREATE TYPE "DossierStatus" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'EN_REVISION', 'VALIDE', 'REFUSE', 'SIGNE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "monthly_price" DECIMAL(10,2),
    "status" "VehicleStatus" NOT NULL,
    "type" "VehicleType" NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "type" "DossierType" NOT NULL,
    "status" "DossierStatus" NOT NULL DEFAULT 'BROUILLON',
    "monthly_amount" DECIMAL(10,2),
    "duration_months" INTEGER,
    "admin_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "dossier_history" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "old_status" "DossierStatus" NOT NULL,
    "new_status" "DossierStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_history_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "users_email_key" ON "users"("email");


CREATE UNIQUE INDEX "documents_s3_key_key" ON "documents"("s3_key");


ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "documents" ADD CONSTRAINT "documents_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "dossier_history" ADD CONSTRAINT "dossier_history_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "dossier_history" ADD CONSTRAINT "dossier_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
