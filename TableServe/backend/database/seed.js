const defaultRestaurantName = 'TableServe Bistro';

function seedDatabase(db) {
  const counts = {
    floors: db.prepare('SELECT COUNT(*) AS count FROM floors').get().count,
    categories: db.prepare('SELECT COUNT(*) AS count FROM categories').get().count,
    settings: db.prepare('SELECT COUNT(*) AS count FROM settings').get().count,
  };

  if (!counts.settings) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('restaurant_name', defaultRestaurantName);
  }

  if (!counts.floors) {
    const insertFloor = db.prepare('INSERT INTO floors (name) VALUES (?)');
    const insertTable = db.prepare('INSERT INTO "tables" (floor_id, name, status) VALUES (?, ?, ?)');

    const floorIds = [
      insertFloor.run('Ground Floor').lastInsertRowid,
      insertFloor.run('First Floor').lastInsertRowid,
      insertFloor.run('Outdoor').lastInsertRowid,
    ];

    const tableSeeds = [
      ['Table 1', 'Available'],
      ['Table 2', 'Occupied'],
      ['Table 3', 'Printed'],
      ['Table 4', 'Available'],
      ['Table 5', 'Occupied'],
      ['Table 6', 'Available'],
    ];

    floorIds.forEach((floorId, floorIndex) => {
      tableSeeds.forEach(([name, status], tableIndex) => {
        const tableName = floorIndex === 0 ? name : `${name} ${floorIndex + 1}`;
        const seededStatus = tableIndex % 2 === 0 ? status : 'Available';
        insertTable.run(floorId, tableName, seededStatus);
      });
    });
  }

  if (!counts.categories) {
    const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const insertProduct = db.prepare(
      'INSERT INTO products (name, price, category_id, description) VALUES (?, ?, ?, ?)',
    );

    const categories = {
      Drinks: insertCategory.run('Drinks').lastInsertRowid,
      'Fast Food': insertCategory.run('Fast Food').lastInsertRowid,
      BBQ: insertCategory.run('BBQ').lastInsertRowid,
      Deals: insertCategory.run('Deals').lastInsertRowid,
    };

    const products = [
      ['Pepsi', 180, categories.Drinks, 'Chilled soft drink'],
      ['Mint Margarita', 240, categories.Drinks, 'Fresh blended mint drink'],
      ['Zinger Burger', 620, categories['Fast Food'], 'Crispy chicken burger'],
      ['Fries', 280, categories['Fast Food'], 'Classic salted fries'],
      ['Chicken Tikka', 540, categories.BBQ, 'Smoky grilled tikka'],
      ['Malai Boti', 740, categories.BBQ, 'Creamy charcoal grilled bites'],
      ['Family Deal', 2450, categories.Deals, '4 burgers, fries, and drinks'],
      ['Lunch Box', 890, categories.Deals, 'Burger, fries, and drink combo'],
    ];

    products.forEach((product) => insertProduct.run(...product));
  }

  const existingOpenOrders = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status != 'Paid'").get().count;

  if (!existingOpenOrders) {
    const occupiedTables = db
      .prepare('SELECT id, status FROM "tables" WHERE name IN (?, ?, ?)')
      .all('Table 2', 'Table 3', 'Table 5');

    const insertOrder = db.prepare(
      "INSERT INTO orders (table_id, status, created_at, updated_at, printed_at) VALUES (?, ?, datetime('now'), datetime('now'), ?)",
    );
    const insertOrderItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, qty, note, price) VALUES (?, ?, ?, ?, ?)',
    );

    const productMap = Object.fromEntries(
      db.prepare('SELECT id, name, price FROM products').all().map((row) => [row.name, row]),
    );

    occupiedTables.forEach((table) => {
      const status = table.status === 'Printed' ? 'Printed' : 'Open';
      const printedAt = status === 'Printed' ? new Date().toISOString() : null;
      const orderId = insertOrder.run(table.id, status, printedAt).lastInsertRowid;

      if (table.status === 'Occupied') {
        insertOrderItem.run(orderId, productMap['Zinger Burger'].id, 2, 'No spice', productMap['Zinger Burger'].price);
        insertOrderItem.run(orderId, productMap['Fries'].id, 1, '', productMap.Fries.price);
        insertOrderItem.run(orderId, productMap.Pepsi.id, 3, '', productMap.Pepsi.price);
      } else {
        insertOrderItem.run(orderId, productMap['Chicken Tikka'].id, 2, 'Extra chutney', productMap['Chicken Tikka'].price);
        insertOrderItem.run(orderId, productMap['Mint Margarita'].id, 2, '', productMap['Mint Margarita'].price);
      }
    });
  }
}

module.exports = { seedDatabase, defaultRestaurantName };
