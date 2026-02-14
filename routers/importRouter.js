import express from 'express';
import multer from 'multer';
import os from 'os';
import { importProducts, importSales, importOrders, seedData } from '../controllers/import.js';

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

router.post('/products', upload.single('file'), importProducts);
router.post('/sales', upload.single('file'), importSales);
router.post('/orders', upload.single('file'), importOrders);
router.post('/seed', seedData);

export default router;
