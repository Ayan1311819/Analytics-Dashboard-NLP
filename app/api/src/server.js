import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

function normalizeBigInts(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}

app.get("/", (req, res) => res.send("Flowbit API running 🚀"));

app.get("/stats", async (req, res) => {
  try {
    const totalInvoices = await prisma.invoice.count();

    const totals = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
        subTotal: true,
        totalTax: true,
      },
      _avg: {
        totalAmount: true,
      },
    });

    const lineItemCount = await prisma.lineItem.count();

    const totalSpend = totals._sum.totalAmount || 0;
    const totalSubTotal = totals._sum.subTotal || 0;
    const totalTax = totals._sum.totalTax || 0;
    const avgInvoiceValue = totals._avg.totalAmount || 0;
    const avgTaxRate =
      totalSubTotal > 0 ? ((totalTax / totalSubTotal) * 100).toFixed(2) : 0;

    res.json({
      total_invoices: totalInvoices,
      documents_uploaded: totalInvoices,
      total_spend: totalSpend,
      total_subtotal: totalSubTotal,
      total_tax: totalTax,
      avg_invoice_value: avgInvoiceValue,
      avg_tax_rate: avgTaxRate,
      total_line_items: lineItemCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/invoice-trends", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "invoiceDate") AS month,
        COUNT(*) AS count,
        SUM("subTotal") AS subtotal_sum,
        SUM("totalTax") AS tax_sum,
        SUM("totalAmount") AS total_sum
      FROM "Invoice"
      WHERE "invoiceDate" IS NOT NULL
      GROUP BY month
      ORDER BY month;
    `;
    const sresult = normalizeBigInts(result);
    res.json(sresult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/vendors/top10", async (req, res) => {
  try {
    const vendors = await prisma.invoice.groupBy({
      by: ["vendorId"],
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 10,
    });

    const enriched = await Promise.all(
      vendors.map(async (v) => {
        const vendor = await prisma.vendor.findUnique({ where: { id: v.vendorId } });
        return {
          vendor_name: vendor?.name || "Unknown",
          vendor_address: vendor?.address || "Unknown",
          total_spend: v._sum.totalAmount || 0,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/category-spend", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        "sachkonto" AS category,
        SUM("totalPrice") AS total_spend
      FROM "LineItem"
      WHERE "sachkonto" IS NOT NULL
      GROUP BY "sachkonto"
      ORDER BY total_spend DESC;
    `;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/cash-outflow", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
  SELECT
    DATE_TRUNC('month', "i"."invoiceDate") AS month,
    "v"."name" AS vendor_name,
    SUM("i"."totalAmount") AS total_outflow
  FROM "Invoice" AS "i"
  JOIN "Vendor" AS "v" ON "i"."vendorId" = "v"."id"
  JOIN "Payment" AS "p" ON "p"."invoiceId" = "i"."id"
  WHERE "i"."vendorId" IS NOT NULL
    AND "i"."totalAmount" IS NOT NULL
    AND "p"."dueDate" IS NOT NULL
  GROUP BY DATE_TRUNC('month', "i"."invoiceDate"), "v"."name"
  ORDER BY month, total_outflow DESC;
`;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/invoices", async (req, res) => {
  const { search = "", page = 1, pageSize = 49 } = req.query;
  const skip = (page - 1) * pageSize;

  try {
    const where = search
      ? {
          OR: [
        { invoiceCode: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        (() => {
          const num = parseFloat(search.replace(/[€,]/g, "").trim());
          return !isNaN(num)
            ? { totalAmount: { gte: num * 0.95, lte: num * 1.05 } }
            : undefined;
        })(),
        (() => {
          const d = new Date(search);
          if (isNaN(d.getTime())) return undefined;
          const start = new Date(d);
          start.setUTCHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 1);
          return { invoiceDate: { gte: start, lt: end } };
        })(),
      ].filter(Boolean),
    }
      : {};

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { vendor: true, customer: true },
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { invoiceDate: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      total: totalCount,
      page: Number(page),
      pageSize: Number(pageSize),
      data: invoices,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/chat-with-data", async (req, res) => {
  try {
    const resp = await fetch("http://127.0.0.1:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: req.body.query })
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));