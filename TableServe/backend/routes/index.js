const express = require('express');
const controller = require('../controllers/posController');

const router = express.Router();

router.get('/bootstrap', controller.getBootstrapData);
router.get('/orders/table/:tableId', controller.getTableOrder);
router.post('/orders/save', controller.saveOrder);
router.post('/orders/:id/print', controller.printKitchenReceipt);
router.post('/orders/:id/clear', controller.clearTable);
router.post('/orders/:id/move', controller.moveTable);
router.post('/orders/:id/merge', controller.mergeTables);
router.post('/orders/:id/pay', controller.settlePayment);
router.get('/reports/daily', controller.getDailyReport);
router.get('/reports/daily/export', controller.exportDailyCsv);
router.post('/floors', controller.addFloor);
router.post('/tables', controller.addTable);
router.post('/categories', controller.addCategory);
router.post('/products', controller.addProduct);
router.put('/settings', controller.updateSettings);

module.exports = router;
