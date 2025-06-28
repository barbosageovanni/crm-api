/*
  Warnings:

  - You are about to drop the column `senhaHash` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "senhaHash",
ADD COLUMN     "senhahash" VARCHAR(255) NOT NULL DEFAULT '';
