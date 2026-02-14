import Sales from '../Models/sale.js';
import Products from '../Models/products.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const exportData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        const outDir = path.resolve('..', 'ml', 'data');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        // 1. Export Sales & Order Trends
        const sales = await Sales.find().populate('productId', 'productName');
        const salesCsvHeader = 'date,productId,productName,quantity,unitPrice,totalAmount,invoiceNo\n';
        const salesCsvRows = sales.map(s => {
            const date = s.saleDate.toISOString().split('T')[0];
            return `${date},${s.productId?._id || 'N/A'},${s.productId?.productName || 'N/A'},${s.quantity},${s.unitPrice},${s.totalAmount},${s.invoiceNo}`;
        }).join('\n');

        fs.writeFileSync(path.join(outDir, 'sales_history.csv'), salesCsvHeader + salesCsvRows);
        console.log('Exported sales_history.csv');

        // 2. Export Product Catalog
        const products = await Products.find();
        const productCsvHeader = 'id,productName,sku,category,price,quantity\n';
        const productCsvRows = products.map(p => {
            return `${p._id},${p.productName},${p.sku},${p.category},${p.price},${p.quantity}`;
        }).join('\n');

        fs.writeFileSync(path.join(outDir, 'products.csv'), productCsvHeader + productCsvRows);
        console.log('Exported products.csv');

        console.log('Export complete. Data is ready in /ml/data');
        process.exit(0);
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
};

exportData();
