/*
  Warnings:

  - You are about to drop the column `senhahash` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "senhahash",
ADD COLUMN     "senhaHash" VARCHAR(255) NOT NULL DEFAULT '';
