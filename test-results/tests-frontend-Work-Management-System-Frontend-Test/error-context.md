# Test info

- Name: Work Management System Frontend Test
- Location: /app/tests/frontend.spec.js:3:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

╔════════════════════════════════════════════════════════════════════════════════════════════════╗
║ Looks like you launched a headed browser without having a XServer running.                     ║
║ Set either 'headless: true' or use 'xvfb-run <your-playwright-app>' before running Playwright. ║
║                                                                                                ║
║ <3 Playwright Team                                                                             ║
╚════════════════════════════════════════════════════════════════════════════════════════════════╝
Call log:
  - <launching> /root/.cache/ms-playwright/chromium-1169/chrome-linux/chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-snE21K --remote-debugging-pipe --no-startup-window
  - <launched> pid=3468
  - [pid=3468][err] [3468:3483:0517/180548.274125:ERROR:dbus/bus.cc:408] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
  - [pid=3468][err] [3468:3468:0517/180548.301132:ERROR:ui/ozone/platform/x11/ozone_platform_x11.cc:249] Missing X server or $DISPLAY
  - [pid=3468][err] [3468:3468:0517/180548.301164:ERROR:ui/aura/env.cc:257] The platform failed to initialize.  Exiting.

```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
>  3 | test('Work Management System Frontend Test', async ({ page }) => {
     | ^ Error: browserType.launch: Target page, context or browser has been closed
   4 |   console.log('Testing Dashboard page...');
   5 |   await page.goto('http://localhost:3000');
   6 |   
   7 |   // Wait for the dashboard to load
   8 |   await page.waitForSelector('.dashboard', { timeout: 10000 });
   9 |   
  10 |   // Test Dashboard stats
  11 |   const statsElements = await page.$$('.stat-value');
  12 |   for (const stat of statsElements) {
  13 |     const value = await stat.innerText();
  14 |     console.log(`Found stat value: ${value}`);
  15 |     expect(parseInt(value) >= 0 || value === '0').toBeTruthy();
  16 |   }
  17 |   
  18 |   // Test chart rendering
  19 |   const chartElements = await page.$$('.chart-card canvas');
  20 |   console.log(`Found ${chartElements.length} charts`);
  21 |   expect(chartElements.length).toBeGreaterThan(0);
  22 |   
  23 |   // Test recent work orders table
  24 |   const recentOrdersTable = await page.$('.recent-orders table');
  25 |   expect(recentOrdersTable).not.toBeNull();
  26 |   
  27 |   // Navigate to Clients section
  28 |   console.log('Testing Clients page...');
  29 |   await page.click('text=Clientes');
  30 |   await page.waitForSelector('.clients-grid', { timeout: 5000 });
  31 |   
  32 |   // Check for Constructora ABC client
  33 |   const clientText = await page.textContent('.clients-grid');
  34 |   console.log(`Found client text: ${clientText.substring(0, 100)}...`);
  35 |   expect(clientText).toContain('Constructora ABC');
  36 |   
  37 |   // Navigate to Work Orders section
  38 |   console.log('Testing Work Orders page...');
  39 |   await page.click('text=Órdenes de Trabajo');
  40 |   await page.waitForSelector('.work-orders-page', { timeout: 5000 });
  41 |   
  42 |   // Check for work orders
  43 |   const workOrdersText = await page.textContent('.orders-table');
  44 |   console.log(`Found work orders text: ${workOrdersText.substring(0, 100)}...`);
  45 |   expect(workOrdersText).toContain('Mantenimiento Eléctrico');
  46 |   expect(workOrdersText).toContain('Aire Acondicionado');
  47 |   
  48 |   // Navigate to Invoicing section
  49 |   console.log('Testing Invoicing page...');
  50 |   await page.click('text=Facturación');
  51 |   await page.waitForSelector('.invoices-page', { timeout: 5000 });
  52 |   
  53 |   // Check for invoice
  54 |   const invoicesText = await page.textContent('.invoices-table');
  55 |   console.log(`Found invoices text: ${invoicesText.substring(0, 100)}...`);
  56 |   expect(invoicesText).toContain('A-2025-00001');
  57 |   
  58 |   console.log('All tests passed successfully!');
  59 | });
  60 |
```