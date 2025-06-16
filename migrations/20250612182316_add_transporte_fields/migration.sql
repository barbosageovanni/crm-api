-- AlterTable
ALTER TABLE "clientes" ALTER COLUMN "cnpjCpf" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "telefone" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "transportes" ADD COLUMN     "dataColeta" TIMESTAMP(3),
ADD COLUMN     "dataEntregaPrevista" TIMESTAMP(3),
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "placaVeiculo" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "valorFrete" DOUBLE PRECISION;
