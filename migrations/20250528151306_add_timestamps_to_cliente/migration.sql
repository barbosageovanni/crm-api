/*
  Warnings:

  - You are about to drop the `Atesto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Despesa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Fatura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transporte` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "StatusFatura" AS ENUM ('PENDENTE', 'PAGA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'USUARIO', 'GERENTE');

-- CreateEnum
CREATE TYPE "TipoAtesto" AS ENUM ('ENTREGA_OK', 'AVARIA', 'DEVOLUCAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('TRANSPORTE', 'ALIMENTACAO', 'MATERIAL_ESCRITORIO', 'MANUTENCAO', 'OUTRA');

-- DropForeignKey
ALTER TABLE "Atesto" DROP CONSTRAINT "Atesto_transporteId_fkey";

-- DropForeignKey
ALTER TABLE "Atesto" DROP CONSTRAINT "Atesto_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Fatura" DROP CONSTRAINT "Fatura_transporteId_fkey";

-- DropForeignKey
ALTER TABLE "Transporte" DROP CONSTRAINT "Transporte_clienteId_fkey";

-- DropTable
DROP TABLE "Atesto";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "Despesa";

-- DropTable
DROP TABLE "Fatura";

-- DropTable
DROP TABLE "Transporte";

-- DropTable
DROP TABLE "Usuario";

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cnpjCpf" VARCHAR(14),
    "tipo" "TipoCliente" NOT NULL,
    "email" VARCHAR(255),
    "telefone" VARCHAR(20),
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportes" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "numeroCteOc" VARCHAR(100) NOT NULL,
    "dataOperacao" TIMESTAMP(3) NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "dataEnvioFaturamento" TIMESTAMP(3),
    "dataVencimento" TIMESTAMP(3),
    "dataAtesto" TIMESTAMP(3),
    "dataNotaFiscal" TIMESTAMP(3),
    "descricaoNotaFiscal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atestos" (
    "id" SERIAL NOT NULL,
    "transporteId" INTEGER NOT NULL,
    "dataAtesto" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoAtesto" NOT NULL,
    "observacao" TEXT,
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" SERIAL NOT NULL,
    "transporteId" INTEGER NOT NULL,
    "numeroFatura" VARCHAR(50) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusFatura" NOT NULL,
    "linkBoleto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senhaHash" VARCHAR(255) NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" SERIAL NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "centroCustoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_custo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpjCpf_key" ON "clientes"("cnpjCpf");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");

-- CreateIndex
CREATE INDEX "clientes_cnpjCpf_idx" ON "clientes"("cnpjCpf");

-- CreateIndex
CREATE INDEX "clientes_tipo_idx" ON "clientes"("tipo");

-- CreateIndex
CREATE INDEX "transportes_clienteId_idx" ON "transportes"("clienteId");

-- CreateIndex
CREATE INDEX "transportes_dataOperacao_idx" ON "transportes"("dataOperacao");

-- CreateIndex
CREATE INDEX "atestos_transporteId_idx" ON "atestos"("transporteId");

-- CreateIndex
CREATE INDEX "atestos_usuarioId_idx" ON "atestos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_numeroFatura_key" ON "faturas"("numeroFatura");

-- CreateIndex
CREATE INDEX "faturas_transporteId_idx" ON "faturas"("transporteId");

-- CreateIndex
CREATE INDEX "faturas_status_idx" ON "faturas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "despesas_data_idx" ON "despesas"("data");

-- CreateIndex
CREATE INDEX "despesas_categoria_idx" ON "despesas"("categoria");

-- CreateIndex
CREATE INDEX "despesas_centroCustoId_idx" ON "despesas"("centroCustoId");

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_nome_key" ON "centros_custo"("nome");

-- AddForeignKey
ALTER TABLE "transportes" ADD CONSTRAINT "transportes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atestos" ADD CONSTRAINT "atestos_transporteId_fkey" FOREIGN KEY ("transporteId") REFERENCES "transportes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atestos" ADD CONSTRAINT "atestos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_transporteId_fkey" FOREIGN KEY ("transporteId") REFERENCES "transportes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
