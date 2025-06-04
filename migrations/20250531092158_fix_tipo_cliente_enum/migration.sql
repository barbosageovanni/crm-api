/*
  Warnings:

  - The values [TipoCliente] on the enum `TipoCliente` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoCliente_new" AS ENUM ('PF', 'PJ');
ALTER TABLE "clientes" ALTER COLUMN "tipo" TYPE "TipoCliente_new" USING ("tipo"::text::"TipoCliente_new");
ALTER TYPE "TipoCliente" RENAME TO "TipoCliente_old";
ALTER TYPE "TipoCliente_new" RENAME TO "TipoCliente";
DROP TYPE "TipoCliente_old";
COMMIT;
