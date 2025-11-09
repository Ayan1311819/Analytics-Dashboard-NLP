import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Load and parse JSON
  const raw = fs.readFileSync("C:/Users/Hp/OneDrive/Desktop/assign/root/data/Analytics_Test_Data.json", "utf-8");
  const records = JSON.parse(raw);

  console.log(`📄 Found ${records.length} records`);

  // 2. Loop through each record
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    console.log(`\n⚡ Processing record ${i + 1}/${records.length}...`);

    // Check if extractedData exists
    if (!record.extractedData?.llmData) {
      console.log(`⚠️  Skipping record ${i + 1} - no extractedData`);
      continue;
    }

    const data = record.extractedData.llmData;
    
    // Use the unique record._id or metadata.docId as the base identifier
    const uniqueRecordId = record._id || record.metadata?.docId;
    
    if (!uniqueRecordId) {
      console.log(`⚠️  Skipping record ${i + 1} - no unique ID found`);
      continue;
    }

    // --- Extract Vendor Data ---
    const vendorObj = data.vendor;
    if (!vendorObj) {
      console.log(`⚠️  Skipping record ${i + 1} - no vendor data`);
      continue;
    }

    const vendorData = vendorObj.value;
    // Make vendor unique by combining vendor.id with record._id
    // This ensures each invoice creates its own vendor record even if vendor.id is duplicate
    const vendorExternalId = `vendor-${uniqueRecordId}`;
    const vendorName = vendorData?.vendorName?.value || "Unknown Vendor";
    const vendorTaxId = vendorData?.vendorTaxId?.value || null;
    const vendorAddress = vendorData?.vendorAddress?.value || null;

    const vendor = await prisma.vendor.upsert({
      where: { externalId: vendorExternalId },
      update: {
        name: vendorName,
        taxId: vendorTaxId,
        address: vendorAddress,
      },
      create: {
        externalId: vendorExternalId,
        name: vendorName,
        taxId: vendorTaxId,
        address: vendorAddress,
      },
    });
    console.log(`✅ Vendor: ${vendor.name} (External ID: ${vendorExternalId.substring(0, 20)}...)`);

    // --- Extract Customer Data ---
    const customerObj = data.customer;
    const customerData = customerObj?.value;
    // Make customer unique per invoice record
    const customerExternalId = `customer-${uniqueRecordId}`;
    const customerName = customerData?.customerName?.value || "Unknown Customer";
    const customerAddress = customerData?.customerAddress?.value || null;

    const customer = await prisma.customer.upsert({
      where: { externalId: customerExternalId },
      update: {
        name: customerName,
        address: customerAddress,
      },
      create: {
        externalId: customerExternalId,
        name: customerName,
        address: customerAddress,
      },
    });
    console.log(`✅ Customer: ${customer.name} (External ID: ${customerExternalId.substring(0, 20)}...)`);

    // --- Extract Invoice Data ---
    const invoiceObj = data.invoice;
    const invoiceData = invoiceObj?.value;
    const summaryData = data.summary?.value;

    const invoiceCode = invoiceData?.invoiceId?.value || null;
    const invoiceDate = invoiceData?.invoiceDate?.value || null;
    const deliveryDate = invoiceData?.deliveryDate?.value || null;
    const documentType = summaryData?.documentType?.value || "invoice";
    const subTotal = summaryData?.subTotal?.value || 0;
    const totalTax = summaryData?.totalTax?.value || 0;
    const invoiceTotal = summaryData?.invoiceTotal?.value || 0;
    const currency = summaryData?.currencySymbol?.value || "EUR";

    const invoice = await prisma.invoice.create({
      data: {
        vendorId: vendor.id,
        customerId: customer.id,
        invoiceCode: invoiceCode?.toString() || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        documentType: documentType,
        totalAmount: parseFloat(invoiceTotal),
        subTotal: parseFloat(subTotal),
        totalTax: parseFloat(totalTax),
        currency: currency,
      },
    });
    console.log(`✅ Invoice: ${invoice.invoiceCode || 'N/A'} | Total: ${invoice.totalAmount} | Record: ${uniqueRecordId.substring(0, 8)}...`);

    // --- Extract Line Items ---
    const lineItemsData = data.lineItems?.value?.items?.value;
    if (Array.isArray(lineItemsData)) {
      for (const item of lineItemsData) {
        const description = item.description?.value || null;
        const quantity = item.quantity?.value || 0;
        const unitPrice = item.unitPrice?.value || 0;
        const totalPrice = item.totalPrice?.value || 0;
        const sachkonto = item.Sachkonto?.value || null;
        const buschluessel = item.BUSchluessel?.value || null;

        await prisma.lineItem.create({
          data: {
            invoiceId: invoice.id,
            description: description,
            quantity: parseFloat(quantity),
            unitPrice: parseFloat(unitPrice),
            totalPrice: parseFloat(totalPrice),
            sachkonto: sachkonto?.toString() || null,
            buschluessel: buschluessel?.toString() || null,
            vatRate: null,
            vatAmount: null,
          },
        });
      }
      console.log(`✅ Created ${lineItemsData.length} line items`);
    }

    // --- Extract Payment Data ---
    const paymentData = data.payment?.value;
    if (paymentData) {
      const dueDate = paymentData.dueDate?.value || null;
      const bankAccountNumber = paymentData.bankAccountNumber?.value || null;
      const discountedTotal = paymentData.discountedTotal?.value || null;
      const paymentTerms = paymentData.paymentTerms?.value || null;
      const netDays = paymentData.netDays?.value || null;
      const discountPercentage = paymentData.discountPercentage?.value || null;

      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          dueDate: dueDate && dueDate !== "" ? new Date(dueDate) : null,
          bankAccountNumber: bankAccountNumber || null,
          discountedTotal: discountedTotal ? parseFloat(discountedTotal) : null,
          paymentTerms: paymentTerms || null,
          netDays: netDays ? parseInt(netDays) : null,
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        },
      });
      console.log(`✅ Created payment record`);
    }
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  
  const vendorCount = await prisma.vendor.count();
  const customerCount = await prisma.customer.count();
  const invoiceCount = await prisma.invoice.count();
  const lineItemCount = await prisma.lineItem.count();
  const paymentCount = await prisma.payment.count();
  
  console.log(`   Vendors: ${vendorCount}`);
  console.log(`   Customers: ${customerCount}`);
  console.log(`   Invoices: ${invoiceCount}`);
  console.log(`   Line Items: ${lineItemCount}`);
  console.log(`   Payments: ${paymentCount}`);
}

// --- Run and handle errors ---
main()
  .catch((err) => {
    console.error("❌ Error while seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });