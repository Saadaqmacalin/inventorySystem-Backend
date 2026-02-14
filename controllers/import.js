import csv from 'csv-parser';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import Product from '../Models/products.js';
import Category from '../Models/category.js';
import Supplier from '../Models/suppliers.js';
import Sale from '../Models/sale.js';
import Order from '../Models/order.js';
import Customer from '../Models/customer.js';

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
    }

    console.log(`Starting Product import from: ${req.file.path}`);
    const data = await parseCSV(req.file.path);
    console.log(`Parsed ${data.length} rows from CSV`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const catName = row.categoryName?.trim();
        const supName = row.supplierName?.trim();

        // Look up or create category
        let category = null;
        if (catName) {
            category = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });
            if (!category) {
              category = await Category.create({ name: catName });
              console.log(`Created new category: ${catName}`);
            }
        }

        // Look up or create supplier
        let supplier = null;
        if (supName) {
            supplier = await Supplier.findOne({ companyName: { $regex: new RegExp(`^${supName}$`, 'i') } });
            if (!supplier) {
              supplier = await Supplier.create({ 
                companyName: supName,
                email: row.supplierEmail?.trim() || `${supName.toLowerCase().replace(/\s/g, '')}@example.com`,
                phone: row.supplierPhone?.trim() || 'N/A',
                category: [catName || 'General']
              });
              console.log(`Created new supplier: ${supName}`);
            }
        }

        const productData = {
          productName: row.productName?.trim(),
          sku: row.sku?.trim(),
          categoryId: category?._id,
          supplierId: supplier?._id,
          description: row.description?.trim(),
          price: parseFloat(row.price) || 0,
          costPrice: parseFloat(row.costPrice) || 0,
          quantity: parseInt(row.quantity) || 0,
          status: row.status?.toLowerCase().trim() || 'active'
        };

        if (productData.sku) {
           await Product.findOneAndUpdate({ sku: productData.sku }, productData, { upsert: true });
        } else {
           await Product.findOneAndUpdate({ productName: productData.productName }, productData, { upsert: true });
        }
        successCount++;
      } catch (err) {
        console.error('Row import error (Product):', err.message);
        errorCount++;
      }
    }

    console.log(`Product import finished. Success: ${successCount}, Failed: ${errorCount}`);
    fs.unlinkSync(req.file.path);
    res.status(StatusCodes.OK).json({ 
      message: 'Product import completed', 
      summary: { total: data.length, success: successCount, failed: errorCount } 
    });
  } catch (error) {
    console.error('Import process failed:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

const importSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
    }

    console.log(`Starting Sales import from: ${req.file.path}`);
    const data = await parseCSV(req.file.path);
    
    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const sku = row.sku?.trim();
        const productName = row.productName?.trim();
        const email = row.customerEmail?.toLowerCase().trim();

        const product = await Product.findOne({ 
          $or: [
              { sku: sku }, 
              { productName: { $regex: new RegExp(`^${productName}$`, 'i') } }
          ] 
        });

        let customer = null;
        if (email) {
            customer = await Customer.findOne({ email });
            if (!customer) {
                customer = await Customer.create({
                    name: row.customerName?.trim() || 'Walk-in Customer',
                    email: email,
                    password: 'defaultPassword123',
                    phone: row.customerPhone?.trim() || `+1${Math.floor(Math.random()*9000000000 + 1000000000)}`
                });
                console.log(`Created new customer: ${email}`);
            }
        }

        if (product && customer) {
            const qty = parseInt(row.quantity) || 0;
            const price = parseFloat(row.unitPrice) || product.price;
            
            await Sale.create({
                productId: product._id,
                customerId: customer._id,
                quantity: qty,
                unitPrice: price,
                totalAmount: parseFloat(row.totalAmount) || (qty * price),
                saleDate: row.saleDate ? new Date(row.saleDate) : new Date(),
                invoiceNo: row.invoiceNo?.trim() || `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                status: row.status?.trim() || 'Completed'
            });
            successCount++;
        } else {
            if (!product) console.warn(`Product not found for SKU/Name: ${sku || productName}`);
            if (!customer) console.warn(`Customer not found/created for email: ${email}`);
            errorCount++;
        }
      } catch (err) {
        console.error('Row import error (Sale):', err.message);
        errorCount++;
      }
    }

    console.log(`Sales import finished. Success: ${successCount}, Failed: ${errorCount}`);
    fs.unlinkSync(req.file.path);
    res.status(StatusCodes.OK).json({ 
      message: 'Sales import completed', 
      summary: { total: data.length, success: successCount, failed: errorCount } 
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

const importOrders = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
        }
    
        console.log(`Starting Orders import from: ${req.file.path}`);
        const data = await parseCSV(req.file.path);
        
        let successCount = 0;
        let errorCount = 0;
    
        for (const row of data) {
          try {
            const sku = row.sku?.trim();
            const productName = row.productName?.trim();
            const email = row.customerEmail?.toLowerCase().trim();

            const product = await Product.findOne({ 
              $or: [
                  { sku: sku }, 
                  { productName: { $regex: new RegExp(`^${productName}$`, 'i') } }
              ] 
            });
    
            let customer = null;
            if (email) {
                customer = await Customer.findOne({ email });
                if (!customer) {
                    customer = await Customer.create({
                        name: row.customerName?.trim() || 'Walk-in Customer',
                        email: email,
                        password: 'defaultPassword123',
                        phone: row.customerPhone?.trim() || `+1${Math.floor(Math.random()*9000000000 + 1000000000)}`
                    });
                    console.log(`Created new customer for order: ${email}`);
                }
            }
    
            if (product && customer) {
                const qty = parseInt(row.quantity) || 0;
                const price = parseFloat(row.unitPrice) || product.price;

                await Order.create({
                    orderNumber: row.orderNumber?.trim() || `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    customerId: customer._id,
                    items: [{
                        productId: product._id,
                        quantity: qty,
                        unitPrice: price,
                        totalPrice: parseFloat(row.totalAmount) || (qty * price)
                    }],
                    orderDate: row.orderDate ? new Date(row.orderDate) : new Date(),
                    expectedDeliveryDate: row.deliveryDate ? new Date(row.deliveryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    status: row.status?.trim() || 'Pending',
                    paymentMethod: row.paymentMethod?.trim() || 'Cash',
                    paymentStatus: row.paymentStatus?.trim() || 'Pending',
                    totalAmount: parseFloat(row.totalAmount) || (qty * price)
                });
                successCount++;
            } else {
                if (!product) console.warn(`Product not found for SKU/Name during order import: ${sku || productName}`);
                if (!customer) console.warn(`Customer not found/created for email: ${email}`);
                errorCount++;
            }
          } catch (err) {
            console.error('Row import error (Order):', err.message);
            errorCount++;
          }
        }
    
        console.log(`Orders import finished. Success: ${successCount}, Failed: ${errorCount}`);
        fs.unlinkSync(req.file.path);
        res.status(StatusCodes.OK).json({ 
          message: 'Orders import completed', 
          summary: { total: data.length, success: successCount, failed: errorCount } 
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

const seedData = async (req, res) => {
  const { type } = req.body;
  try {
    console.log(`Starting Synthetic Data Injection for: ${type || 'All'}...`);
    
    // Helper to get random item
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // 1. Ensure Categories & Suppliers exist (Pre-requisites)
    let categories = await Category.find();
    if (categories.length === 0) {
      categories = await Category.insertMany([
        { name: 'Electronics', description: 'Computing and gadgets' },
        { name: 'Office Supplies', description: 'Stationery and furniture' },
        { name: 'Peripherals', description: 'Keyboards, mice, monitors' }
      ]);
    }

    let suppliers = await Supplier.find();
    if (suppliers.length === 0) {
      suppliers = await Supplier.insertMany([
        { 
          companyName: 'TechCorp Solutions', email: 'sales@techcorp.com', phone: '+1234567890', 
          category: ['Electronics'], status: 'Active'
        },
        { 
          companyName: 'Global Office Pro', email: 'support@globaloffice.com', phone: '+0987654321', 
          category: ['Office Supplies'], status: 'Active'
        }
      ]);
    }

    let summary = {};

    // 2. Seed Products (Force seed if none exist and we need them for sales/orders)
    let allProducts = await Product.find();
    if (allProducts.length === 0 || (!type || type === 'products')) {
      const productNames = [
        'Quantum Laptop X1', 'Neural Keyboard GS', 'Infinity Display 32"', 
        'Logic Pro Mouse', 'HyperHub USB-C', 'EcoDesk Pro', 
        'Carbon Fiber Chair', 'Smart Stand L2', 'Pulse SSD 1TB', 'Vector GPU 8GB'
      ];
      
      const newProducts = [];
      // Only seed if they don't exist OR if specifically requested
      const shouldSeed = allProducts.length === 0 || type === 'products' || !type;
      
      if (shouldSeed) {
          for(let i=0; i<productNames.length; i++) {
            const sku = `SKU-AUTO-${1000 + i}-${Math.floor(Math.random()*1000)}`;
            newProducts.push({
                productName: productNames[i],
                sku: sku,
                categoryId: getRandom(categories)._id,
                supplierId: getRandom(suppliers)._id,
                description: `Auto-generated high-performance ${productNames[i]}.`,
                price: 50 + (i * 120),
                costPrice: 30 + (i * 80),
                quantity: 50 + (i * 10),
                status: 'active'
            });
          }
          await Product.insertMany(newProducts);
          summary.products = newProducts.length;
          allProducts = await Product.find();
      }
    }

    const productIds = allProducts.map(p => p._id);

    // 3. Ensure Customers exist
    let customers = await Customer.find();
    if (customers.length < 3) {
      customers = await Customer.insertMany([
        { name: 'Alice Neural', email: `alice.${Date.now()}@neural.io`, password: 'password123', phone: `+1${Date.now().toString().slice(-10)}` },
        { name: 'Bob Quantum', email: `bob.${Date.now()}@quantum.com`, password: 'password123', phone: `+2${Date.now().toString().slice(-10)}` }
      ]);
    }

    // 4. Seed Sales
    if (!type || type === 'sales') {
      const salesCount = 50;
      const salesToInsert = [];
      for (let i = 0; i < salesCount; i++) {
          const product = getRandom(allProducts);
          const customer = getRandom(customers);
          const qty = Math.floor(Math.random() * 5) + 1;
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 90));

          salesToInsert.push({
              productId: product._id,
              customerId: customer._id,
              quantity: qty,
              unitPrice: product.price,
              totalAmount: qty * product.price,
              saleDate: date,
              invoiceNo: `INV-AUTO-${Date.now()}-${i}`,
              status: 'Completed'
          });
      }
      await Sale.insertMany(salesToInsert);
      summary.sales = salesToInsert.length;
    }

    // 5. Seed Orders
    if (!type || type === 'orders') {
      const ordersToInsert = [];
      for (let i = 0; i < 50; i++) {
          const product = getRandom(allProducts);
          const customer = getRandom(customers);
          const qty = Math.floor(Math.random() * 3) + 1;
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30));

          ordersToInsert.push({
              orderNumber: `ORD-AUTO-${Date.now()}-${i}`,
              customerId: customer._id,
              items: [{
                  productId: product._id,
                  quantity: qty,
                  unitPrice: product.price,
                  totalPrice: qty * product.price
              }],
              orderDate: date,
              expectedDeliveryDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
              status: i % 3 === 0 ? 'Pending' : 'Delivered',
              paymentMethod: 'Cash',
              paymentStatus: i % 3 === 0 ? 'Pending' : 'Paid',
              totalAmount: qty * product.price
          });
      }
      await Order.insertMany(ordersToInsert);
      summary.orders = ordersToInsert.length;
    }

    res.status(StatusCodes.OK).json({ 
      message: `Automatic ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'System'} Injection Successful`,
      summary
    });

  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

export { importProducts, importSales, importOrders, seedData };
