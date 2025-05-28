-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transporte" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "numeroCteOc" TEXT NOT NULL,
    "dataOperacao" TIMESTAMP(3) NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "dataEnvioFaturamento" TIMESTAMP(3),
    "dataVencimento" TIMESTAMP(3),
    "dataAtesto" TIMESTAMP(3),
    "dataNotaFiscal" TIMESTAMP(3),
    "descricaoNotaFiscal" TEXT,

    CONSTRAINT "Transporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atesto" (
    "id" SERIAL NOT NULL,
    "transporteId" INTEGER NOT NULL,
    "dataAtesto" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "usuarioId" INTEGER,

    CONSTRAINT "Atesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" SERIAL NOT NULL,
    "transporteId" INTEGER NOT NULL,
    "numeroFatura" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" SERIAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "centroCustoId" INTEGER,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Transporte" ADD CONSTRAINT "Transporte_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atesto" ADD CONSTRAINT "Atesto_transporteId_fkey" FOREIGN KEY ("transporteId") REFERENCES "Transporte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atesto" ADD CONSTRAINT "Atesto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_transporteId_fkey" FOREIGN KEY ("transporteId") REFERENCES "Transporte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
