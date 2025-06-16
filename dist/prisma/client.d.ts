import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "info";
    } | {
        emit: "event";
        level: "warn";
    } | {
        emit: "event";
        level: "error";
    })[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
//# sourceMappingURL=client.d.ts.map