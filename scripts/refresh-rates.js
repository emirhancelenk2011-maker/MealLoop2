const { createRateService } = require('../src/exchange-rates');
createRateService()().then(rates => console.log(JSON.stringify(rates,null,2))).catch(error => { console.error(error.message); process.exitCode=1; });
