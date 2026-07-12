-- Renames the Role enum values in place, preserving existing rows.
-- Must be run BEFORE `prisma db push` picks up the renamed enum in schema.prisma.
ALTER TYPE "Role" RENAME VALUE 'CLIENT' TO 'MANAGER';
ALTER TYPE "Role" RENAME VALUE 'PROVIDER' TO 'JOBBER';
