const db = require('../database/db');

const getRestaurantName = () =>
  db.prepare("SELECT value FROM settings WHERE key = 'restaurant_name'").get()?.value || 'TableServe Bistro';

const normalizeItems = (items = []) =>
  items
    .filter((item) => item.productId && Number(item.qty) > 0)
    .map((item) => ({
      productId: Number(item.productId),
      qty: Number(item.qty),
      note: (item.note || '').trim(),
    }));

const computeOrderTotals = (items = [], tax = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total = subtotal + Number(tax || 0) - Number(discount || 0);
  return { subtotal, tax: Number(tax || 0), discount: Number(discount || 0), total };
};

const getOrderDetails = (orderId) => {
  const order = db
    .prepare(
      `SELECT o.*, t.name AS table_name, t.id AS table_id, f.name AS floor_name
       FROM orders o
       JOIN "tables" t ON t.id = o.table_id
       JOIN floors f ON f.id = t.floor_id
       WHERE o.id = ?`,
    )
    .get(orderId);

  if (!order) return null;

  const items = db
    .prepare(
      `SELECT oi.id, oi.product_id AS productId, oi.qty, oi.note, oi.price, p.name AS productName
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
    )
    .all(orderId);

  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(orderId);
  const totals = computeOrderTotals(items, order.tax, order.discount);

  return {
    ...order,
    items,
    payment,
    totals,
    restaurantName: getRestaurantName(),
  };
};

const getBootstrapData = (_req, res) => {
  const floors = db.prepare('SELECT * FROM floors ORDER BY id ASC').all();
  const tables = db
    .prepare(
      `SELECT t.*, f.name AS floor_name
       FROM "tables" t
       JOIN floors f ON f.id = t.floor_id
       ORDER BY t.floor_id ASC, t.id ASC`,
    )
    .all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  const products = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1
       ORDER BY c.name ASC, p.name ASC`,
    )
    .all();
  const activeOrders = db
    .prepare(
      `SELECT o.id, o.table_id, o.status, o.updated_at,
              COUNT(oi.id) AS item_count,
              COALESCE(SUM(oi.qty * oi.price), 0) AS subtotal
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.status IN ('Open', 'Printed')
       GROUP BY o.id
       ORDER BY o.updated_at DESC`,
    )
    .all();

  res.json({
    restaurantName: getRestaurantName(),
    floors,
    tables,
    categories,
    products,
    activeOrders,
  });
};

const getTableOrder = (req, res) => {
  const tableId = Number(req.params.tableId);
  const order = db
    .prepare(`SELECT id FROM orders WHERE table_id = ? AND status IN ('Open', 'Printed') ORDER BY id DESC LIMIT 1`)
    .get(tableId);

  res.json({
    order: order ? getOrderDetails(order.id) : null,
  });
};

const saveOrder = (req, res) => {
  const tableId = Number(req.body.tableId);
  const orderId = req.body.orderId ? Number(req.body.orderId) : null;
  const tax = Number(req.body.tax || 0);
  const discount = Number(req.body.discount || 0);
  const kitchenNote = (req.body.kitchenNote || '').trim();
  const items = normalizeItems(req.body.items);

  if (!tableId) {
    return res.status(400).json({ message: 'Table is required.' });
  }

  const upsertOrder = db.transaction(() => {
    let currentOrderId = orderId;

    if (!currentOrderId) {
      const existing = db
        .prepare(`SELECT id FROM orders WHERE table_id = ? AND status IN ('Open', 'Printed') ORDER BY id DESC LIMIT 1`)
        .get(tableId);
      currentOrderId = existing?.id || null;
    }

    if (!currentOrderId) {
      currentOrderId = db
        .prepare(
          "INSERT INTO orders (table_id, status, created_at, updated_at, kitchen_note, tax, discount) VALUES (?, ?, datetime('now'), datetime('now'), ?, ?, ?)",
        )
        .run(tableId, 'Open', kitchenNote, tax, discount).lastInsertRowid;
    } else {
      db.prepare("UPDATE orders SET updated_at = datetime('now'), kitchen_note = ?, tax = ?, discount = ? WHERE id = ?").run(
        kitchenNote,
        tax,
        discount,
        currentOrderId,
      );
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(currentOrderId);
    }

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, qty, note, price) VALUES (?, ?, ?, ?, ?)',
    );
    const getProduct = db.prepare('SELECT price FROM products WHERE id = ?');

    items.forEach((item) => {
      const product = getProduct.get(item.productId);
      if (product) {
        insertItem.run(currentOrderId, item.productId, item.qty, item.note, product.price);
      }
    });

    const tableStatus = items.length ? 'Occupied' : 'Available';
    const orderStatus = items.length ? 'Open' : 'Cancelled';

    db.prepare('UPDATE "tables" SET status = ?, merged_into_table_id = NULL WHERE id = ?').run(tableStatus, tableId);
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(orderStatus, currentOrderId);

    return currentOrderId;
  });

  const savedOrderId = upsertOrder();
  res.json({ order: getOrderDetails(savedOrderId) });
};

const printKitchenReceipt = (req, res) => {
  const orderId = Number(req.params.id);
  db.prepare("UPDATE orders SET status = ?, printed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(
    'Printed',
    orderId,
  );
  const order = getOrderDetails(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  db.prepare('UPDATE "tables" SET status = ? WHERE id = ?').run('Printed', order.table_id);
  res.json({ order: getOrderDetails(orderId) });
};

const clearTable = (req, res) => {
  const orderId = Number(req.params.id);
  const order = getOrderDetails(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  db.transaction(() => {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run('Cancelled', orderId);
    db.prepare('UPDATE "tables" SET status = ?, merged_into_table_id = NULL WHERE id = ?').run('Available', order.table_id);
  })();

  res.json({ success: true });
};

const moveTable = (req, res) => {
  const orderId = Number(req.params.id);
  const targetTableId = Number(req.body.targetTableId);
  const order = getOrderDetails(orderId);

  if (!order || !targetTableId) {
    return res.status(400).json({ message: 'Order and target table are required.' });
  }

  const existingTargetOrder = db
    .prepare(`SELECT id FROM orders WHERE table_id = ? AND status IN ('Open', 'Printed')`)
    .get(targetTableId);

  if (existingTargetOrder) {
    return res.status(409).json({ message: 'Target table already has an active order. Use merge instead.' });
  }

  db.transaction(() => {
    db.prepare("UPDATE orders SET table_id = ?, updated_at = datetime('now') WHERE id = ?").run(targetTableId, orderId);
    db.prepare('UPDATE "tables" SET status = ?, merged_into_table_id = NULL WHERE id = ?').run('Available', order.table_id);
    db.prepare('UPDATE "tables" SET status = ? WHERE id = ?').run(order.status === 'Printed' ? 'Printed' : 'Occupied', targetTableId);
  })();

  res.json({ order: getOrderDetails(orderId) });
};

const mergeTables = (req, res) => {
  const sourceOrderId = Number(req.params.id);
  const targetTableId = Number(req.body.targetTableId);
  const sourceOrder = getOrderDetails(sourceOrderId);

  if (!sourceOrder || !targetTableId) {
    return res.status(400).json({ message: 'Source order and target table are required.' });
  }

  const targetOrderRef = db
    .prepare(`SELECT id FROM orders WHERE table_id = ? AND status IN ('Open', 'Printed') ORDER BY id DESC LIMIT 1`)
    .get(targetTableId);

  if (!targetOrderRef) {
    return res.status(404).json({ message: 'Target table has no active order to merge with.' });
  }

  db.transaction(() => {
    const sourceItems = db.prepare('SELECT product_id, qty, note, price FROM order_items WHERE order_id = ?').all(sourceOrderId);
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, qty, note, price) VALUES (?, ?, ?, ?, ?)',
    );

    sourceItems.forEach((item) => {
      insertItem.run(targetOrderRef.id, item.product_id, item.qty, item.note, item.price);
    });

    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(sourceOrderId);
    db.prepare("UPDATE orders SET status = ?, closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(
      'Merged',
      sourceOrderId,
    );
    db.prepare('UPDATE "tables" SET status = ?, merged_into_table_id = ? WHERE id = ?').run(
      'Available',
      targetTableId,
      sourceOrder.table_id,
    );
  })();

  res.json({ order: getOrderDetails(targetOrderRef.id) });
};

const settlePayment = (req, res) => {
  const orderId = Number(req.params.id);
  const paymentMethod = req.body.paymentMethod || 'Cash';
  const details = req.body.details ? JSON.stringify(req.body.details) : '';
  const order = getOrderDetails(orderId);

  if (!order) return res.status(404).json({ message: 'Order not found.' });

  db.transaction(() => {
    db.prepare("INSERT INTO payments (order_id, payment_method, total, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))").run(
      orderId,
      paymentMethod,
      order.totals.total,
      details,
    );
    db.prepare("UPDATE orders SET status = ?, closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(
      'Paid',
      orderId,
    );
    db.prepare('UPDATE "tables" SET status = ?, merged_into_table_id = NULL WHERE id = ?').run('Available', order.table_id);
  })();

  res.json({ order: getOrderDetails(orderId) });
};

const getDailyReport = (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const totals = db
    .prepare(
      `SELECT
         COUNT(DISTINCT o.id) AS totalOrders,
         COALESCE(SUM(p.total), 0) AS totalSales
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE date(COALESCE(p.created_at, o.created_at)) = ? AND o.status IN ('Paid', 'Printed', 'Open')`,
    )
    .get(date);

  const mostSoldItem = db
    .prepare(
      `SELECT p.name, COALESCE(SUM(oi.qty), 0) AS quantity
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE date(o.created_at) = ?
       GROUP BY p.id, p.name
       ORDER BY quantity DESC, p.name ASC
       LIMIT 1`,
    )
    .get(date);

  const paymentSummary = db
    .prepare(
      `SELECT payment_method AS method, COUNT(*) AS count, SUM(total) AS total
       FROM payments
       WHERE date(created_at) = ?
       GROUP BY payment_method
       ORDER BY total DESC`,
    )
    .all(date);

  const lineItems = db
    .prepare(
      `SELECT o.id AS orderId, t.name AS tableName, o.status, COALESCE(p.payment_method, '-') AS paymentMethod,
              COALESCE(p.total, 0) AS total, o.created_at
       FROM orders o
       JOIN "tables" t ON t.id = o.table_id
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE date(COALESCE(p.created_at, o.created_at)) = ?
       ORDER BY o.created_at DESC`,
    )
    .all(date);

  res.json({
    date,
    totalOrders: totals.totalOrders || 0,
    totalSales: totals.totalSales || 0,
    mostSoldItem: mostSoldItem || null,
    paymentSummary,
    lineItems,
  });
};

const exportDailyCsv = (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const report = db
    .prepare(
      `SELECT o.id AS order_id, t.name AS table_name, o.status, COALESCE(p.payment_method, '-') AS payment_method,
              COALESCE(p.total, 0) AS total, o.created_at
       FROM orders o
       JOIN "tables" t ON t.id = o.table_id
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE date(COALESCE(p.created_at, o.created_at)) = ?
       ORDER BY o.created_at DESC`,
    )
    .all(date);

  const rows = ['Order ID,Table,Status,Payment Method,Total,Created At'];
  report.forEach((row) => {
    rows.push([row.order_id, row.table_name, row.status, row.payment_method, row.total, row.created_at].join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="daily-report-${date}.csv"`);
  res.send(rows.join('\n'));
};

const addFloor = (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Floor name is required.' });
  const result = db.prepare('INSERT INTO floors (name) VALUES (?)').run(name);
  res.status(201).json({ floor: db.prepare('SELECT * FROM floors WHERE id = ?').get(result.lastInsertRowid) });
};

const addTable = (req, res) => {
  const name = (req.body.name || '').trim();
  const floorId = Number(req.body.floorId);
  if (!name || !floorId) return res.status(400).json({ message: 'Table name and floor are required.' });
  const result = db.prepare('INSERT INTO "tables" (name, floor_id, status) VALUES (?, ?, ?)').run(name, floorId, 'Available');
  res.status(201).json({ table: db.prepare('SELECT * FROM "tables" WHERE id = ?').get(result.lastInsertRowid) });
};

const addCategory = (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Category name is required.' });
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  res.status(201).json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) });
};

const addProduct = (req, res) => {
  const name = (req.body.name || '').trim();
  const categoryId = Number(req.body.categoryId);
  const price = Number(req.body.price);
  const description = (req.body.description || '').trim();

  if (!name || !categoryId || Number.isNaN(price)) {
    return res.status(400).json({ message: 'Product name, price, and category are required.' });
  }

  const result = db
    .prepare('INSERT INTO products (name, price, category_id, description) VALUES (?, ?, ?, ?)')
    .run(name, price, categoryId, description);
  res.status(201).json({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid) });
};

const updateSettings = (req, res) => {
  const restaurantName = (req.body.restaurantName || '').trim();
  if (!restaurantName) return res.status(400).json({ message: 'Restaurant name is required.' });
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('restaurant_name', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(restaurantName);
  res.json({ restaurantName });
};

module.exports = {
  addCategory,
  addFloor,
  addProduct,
  addTable,
  clearTable,
  exportDailyCsv,
  getBootstrapData,
  getDailyReport,
  getTableOrder,
  mergeTables,
  moveTable,
  printKitchenReceipt,
  saveOrder,
  settlePayment,
  updateSettings,
};
