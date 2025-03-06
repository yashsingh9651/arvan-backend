-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_category_id_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "productCount" INTEGER NOT NULL DEFAULT 0;
