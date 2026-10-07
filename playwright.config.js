const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser', fullyParallel:false, workers:1,
  use:{ baseURL:'http://127.0.0.1:3101', channel:'chrome', headless:true, screenshot:'only-on-failure', trace:'retain-on-failure' },
  globalSetup:require.resolve('./tests/browser-setup'),
});
