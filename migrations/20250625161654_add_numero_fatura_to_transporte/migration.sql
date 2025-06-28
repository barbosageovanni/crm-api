/*
  Warnings:

  - You are about to drop the column `dataEntregaPrevista` on the `transportes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transportes" DROP COLUMN "dataEntregaPrevista",
ADD COLUMN     "numeroFatura" TEXT;
