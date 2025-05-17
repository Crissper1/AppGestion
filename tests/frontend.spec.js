const { test, expect } = require('@playwright/test');

test('Work Management System Frontend Test', async ({ page }) => {
  console.log('Testing Dashboard page...');
  await page.goto('http://localhost:3000');
  
  // Wait for the dashboard to load
  await page.waitForSelector('.dashboard', { timeout: 10000 });
  
  // Test Dashboard stats
  const statsElements = await page.$$('.stat-value');
  for (const stat of statsElements) {
    const value = await stat.innerText();
    console.log(`Found stat value: ${value}`);
    expect(parseInt(value) >= 0 || value === '0').toBeTruthy();
  }
  
  // Test chart rendering
  const chartElements = await page.$$('.chart-card canvas');
  console.log(`Found ${chartElements.length} charts`);
  expect(chartElements.length).toBeGreaterThan(0);
  
  // Test recent work orders table
  const recentOrdersTable = await page.$('.recent-orders table');
  expect(recentOrdersTable).not.toBeNull();
  
  // Navigate to Clients section
  console.log('Testing Clients page...');
  await page.click('text=Clientes');
  await page.waitForSelector('.clients-grid', { timeout: 5000 });
  
  // Check for Constructora ABC client
  const clientText = await page.textContent('.clients-grid');
  console.log(`Found client text: ${clientText.substring(0, 100)}...`);
  expect(clientText).toContain('Constructora ABC');
  
  // Navigate to Work Orders section
  console.log('Testing Work Orders page...');
  await page.click('text=Órdenes de Trabajo');
  await page.waitForSelector('.work-orders-page', { timeout: 5000 });
  
  // Check for work orders
  const workOrdersText = await page.textContent('.orders-table');
  console.log(`Found work orders text: ${workOrdersText.substring(0, 100)}...`);
  expect(workOrdersText).toContain('Mantenimiento Eléctrico');
  expect(workOrdersText).toContain('Aire Acondicionado');
  
  // Navigate to Invoicing section
  console.log('Testing Invoicing page...');
  await page.click('text=Facturación');
  await page.waitForSelector('.invoices-page', { timeout: 5000 });
  
  // Check for invoice
  const invoicesText = await page.textContent('.invoices-table');
  console.log(`Found invoices text: ${invoicesText.substring(0, 100)}...`);
  expect(invoicesText).toContain('A-2025-00001');
  
  console.log('All tests passed successfully!');
});
