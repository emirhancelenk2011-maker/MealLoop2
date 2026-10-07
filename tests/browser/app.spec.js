const {test,expect}=require('@playwright/test');
async function language(page,value) { await page.locator('.language-select select').selectOption(value); }
async function login(page,name) {
  await page.locator('.sidebar-action').filter({hasText:'Sign in'}).click();
  await page.getByRole('dialog').getByRole('button',{name:new RegExp(name)}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
test('three languages, theme persistence, routes and desktop sidebar',async ({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','uz');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Yaqiningizdagi yaxshi taomlar.');
  await language(page,'ru'); await expect(page.getByRole('heading',{level:1})).toHaveText('Хорошая еда по соседству.');
  await page.getByRole('button',{name:'Включить тёмную тему'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang','ru'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await language(page,'en');
  await page.getByRole('link',{name:'Food packages',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Food packages');
  await page.getByRole('button',{name:'Bakery',exact:true}).click(); await expect(page.locator('.package-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Collapse sidebar'}).click(); await expect(page.locator('.sidebar')).toHaveClass(/collapsed/);
  await page.reload(); await expect(page.locator('.sidebar')).toHaveClass(/collapsed/);
  await page.getByRole('button',{name:'Expand sidebar'}).click();
  await page.getByRole('link',{name:'Settings',exact:true}).click();
  await page.getByRole('button',{name:'Light',exact:true}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'O‘zbekcha',exact:true}).click(); await expect(page.getByRole('heading',{level:1})).toHaveText('Sozlamalar');
  await page.goBack(); await expect(page.getByRole('heading',{level:1})).toHaveText('Taom paketlari');
  expect(errors).toEqual([]);
});
test('reservation, translated statuses and cancellation via the real API',async ({page})=>{
  await page.goto('/'); await language(page,'en'); await login(page,'Jasur');
  await page.getByRole('link',{name:'Food packages',exact:true}).click();
  const card=page.locator('.package-card').filter({hasText:'Oven-baked bread'});
  await card.getByRole('button',{name:'View details'}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Reserve',exact:true}).click();
  await expect(page.locator('.reservation-card')).toHaveCount(1);
  await expect(page.locator('.status')).toHaveText('Reserved');
  await expect(page.locator('.reservation-info h2')).toHaveText('Oven-baked bread');
  await language(page,'ru'); await expect(page.locator('.status')).toHaveText('Забронировано');
  await expect(page.locator('.reservation-info h2')).toHaveText('Хлеб из печи');
  await language(page,'uz'); await expect(page.locator('.status')).toHaveText('Band qilingan');
  await expect(page.locator('.reservation-info h2')).toHaveText('Pechdan chiqqan nonlar');
  await language(page,'en'); await page.getByRole('button',{name:'Cancel reservation',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(page.locator('.status')).toHaveText('Cancelled');
});
test('business adds, edits and deletes a package with localized validation',async ({page})=>{
  await page.goto('/'); await language(page,'en'); await login(page,'Tashkent Bakery');
  await page.getByRole('link',{name:'Add package',exact:true}).click();
  await page.getByRole('button',{name:'Save',exact:true}).click(); await expect(page.locator('form [role=alert]')).toContainText('Enter a title');
  await language(page,'ru'); await expect(page.locator('form [role=alert]')).toContainText('Заполните название');
  await language(page,'en');
  await page.locator('[name=title]').fill('Browser test pastries');
  await page.getByRole('textbox',{name:'Description & contents'}).fill('Five pastries. Contains gluten.');
  await page.locator('[name=address]').fill('Sample street 12');
  await page.locator('[name=price]').fill('40'); await page.locator('[name=original_price]').fill('100'); await page.locator('[name=quantity]').fill('5');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('My packages');
  let card=page.locator('.package-card').filter({hasText:'Browser test pastries'}); await expect(card).toBeVisible();
  await card.getByRole('button',{name:'Edit',exact:true}).click();
  await page.locator('[name=price]').fill('45'); await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('My packages');
  await card.getByRole('button',{name:/Delete:/}).click(); await page.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(card).toHaveCount(0);
});
test('mobile sidebar opens, navigates, closes and fits viewport',async ({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/'); await language(page,'en');
  await expect(page.locator('.mobile-toggle')).toBeVisible();
  await page.getByRole('button',{name:'Menu',exact:true}).click(); await expect(page.locator('.sidebar')).toHaveClass(/mobile-open/);
  await page.getByRole('link',{name:'Food packages',exact:true}).click();
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/); await expect(page.getByRole('heading',{level:1})).toHaveText('Food packages');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Menu',exact:true}).click(); await page.keyboard.press('Escape'); await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/);
  await page.screenshot({path:'test-results/mobile-light.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to dark mode'}).click(); await page.screenshot({path:'test-results/mobile-dark.png',fullPage:true});
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.setViewportSize({width:1280,height:800});
  await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/);
  await expect(page.locator('.app-main')).not.toHaveAttribute('inert');
});
test('desktop visual check',async ({page})=>{
  await page.setViewportSize({width:1440,height:1000}); await page.goto('/');
  await expect(page.locator('.package-card').first()).toBeVisible();
  await page.screenshot({path:'test-results/desktop-light.png',fullPage:true});
  await page.getByRole('button',{name:'Qorong‘i mavzuga o‘tish'}).click();
  await page.screenshot({path:'test-results/desktop-dark.png',fullPage:true});
});

test('system theme, reduced motion, keyboard menu and smallest mobile viewport', async ({page}) => {
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.setViewportSize({width:320,height:700});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('.package-card').first()).toBeVisible();
  for (const locale of ['uz','ru','en']) {
    await language(page,locale);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await expect(page.locator('.hero')).toHaveCSS('opacity','1');
  await expect(page.locator('.hero')).toHaveCSS('transform','none');
  await expect(page.locator('.hero')).toHaveCSS('transition-duration','0s');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Menu',exact:true})).toBeFocused();
  await expect(page.locator('.sidebar')).toHaveCSS('visibility','hidden');
  await page.getByRole('button',{name:'Switch to light mode'}).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test('local photos crop consistently, translate alt text and never fill unrelated packages', async ({page}) => {
  await page.goto('/#/packages');
  const labels = {
    uz:['Pechdan chiqqan nonlar','Yangi sabzavotli salat','so‘m'],
    ru:['Хлеб из печи','Свежий овощной салат','UZS'],
    en:['Oven-baked bread','Fresh vegetable salad','UZS'],
  };
  const addedPhotos = [
    {file:'somsa-patir.jpg',uz:"Nonvoyxonadan syurpriz to'plam",ru:'Сюрприз-набор из пекарни',en:'Surprise Bakery Bundle'},
    {file:'salad-bowl.jpg',uz:'Kunning baraka kosasi',ru:'Чаша добра дня',en:'Daily Goodness Bowl'},
    {file:'sweets.jpg',uz:'Shirin yakun',ru:'Сладкое завершение',en:'Sweet Delight Set'},
    {file:'fruit-vegetables.jpg',uz:'Mavsumiy meva-sabzavot paketi',ru:'Сезонный продуктовый набор',en:'Seasonal Produce Pack'},
  ];
  for (const [locale,[bread,salad,currency]] of Object.entries(labels)) {
    await language(page,locale);
    for (const title of [bread,salad,...addedPhotos.map(photo => photo[locale])]) {
      const card = page.locator('.package-card').filter({has:page.getByRole('heading',{name:title,exact:true})});
      const photo = card.locator('img');
      await card.scrollIntoViewIfNeeded();
      await expect(photo).toBeVisible();
      await expect(photo).toHaveAttribute('alt',/.+/);
      const match = addedPhotos.find(item => item[locale] === title);
      if (match) await expect(photo).toHaveAttribute('src',`/images/${match.file}`);
      await expect.poll(() => photo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      await expect(card.locator('.price strong')).toContainText(currency);
      const size = await card.locator('.package-visual').boundingBox();
      expect(size.width / size.height).toBeCloseTo(1.6,1);
      await expect(photo).toHaveCSS('object-fit','cover');
    }
    expect(await page.locator('body').innerText()).not.toMatch(/Kadıköy|Caferağa|Mahalle Fırını|Yeşil Mutfak|TRY|RUB|USD|₺/);
  }
  await expect(page.locator('.package-card img')).toHaveCount(6);
  await expect(page.locator('.package-card .photo-placeholder')).toHaveCount(0);
  const bread = page.locator('.package-card').filter({hasText:'Oven-baked bread'});
  await bread.getByRole('button',{name:'View details'}).click();
  await expect(page.locator('dialog img')).toHaveAttribute('src','/images/bread.jpg');
  await expect(page.locator('.detail-total')).toContainText('35,000 UZS');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Bakery',exact:true}).click();
  await expect(page.locator('.package-card')).toHaveCount(2);
  await expect(page.locator('.package-card').first()).toHaveClass(/aos-init/);
  await expect(page.locator('.package-card').first()).toHaveClass(/aos-animate/);
});

test('failed image shows the translated empty state', async ({page}) => {
  await page.route('**/images/salad.jpg',route => route.abort());
  await page.goto('/#/packages'); await language(page,'en');
  const card = page.locator('.package-card').filter({hasText:'Fresh vegetable salad'});
  await expect(card.locator('.photo-placeholder')).toHaveText('No photo available');
  await expect(card.locator('img')).toHaveCount(0);
});

test('Tashkent form times, large UZS amounts and user content survive a different device zone', async ({browser,baseURL}) => {
  const context = await browser.newContext({baseURL,timezoneId:'America/Los_Angeles'});
  const page = await context.newPage();
  try {
    await page.goto('/'); await language(page,'en'); await login(page,'Tashkent Bakery');
    await page.getByRole('link',{name:'Add package',exact:true}).click();
    await page.locator('[name=title]').fill('Kullanıcının salatası');
    await page.locator('textarea[name=description]').fill('Kullanıcı tarafından girilen içerik korunur.');
    await page.locator('[name=address]').fill('Kullanıcının özel adresi 12');
    await page.locator('[name=price]').fill('125000.50');
    await page.locator('[name=original_price]').fill('240000');
    await page.locator('[name=image_key]').selectOption('salad');
    await page.locator('[name=pickup_start]').fill('2030-10-07T18:00');
    await page.locator('[name=pickup_end]').fill('2030-10-07T20:00');
    await language(page,'ru');
    await expect(page.locator('[name=title]')).toHaveValue('Kullanıcının salatası');
    await language(page,'en');
    const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/packages') && response.request().method() === 'POST');
    await page.getByRole('button',{name:'Save',exact:true}).click();
    const saved = await (await savedResponse).json();
    expect(saved.pickup_start).toBe('2030-10-07T13:00:00.000Z');
    expect(saved.price).toBe('125000.50');
    const card = page.locator('.package-card').filter({hasText:'Kullanıcının salatası'});
    await expect(card).toContainText('18:00');
    await expect(card).toContainText('125,000.5 UZS');
    await card.getByRole('button',{name:'Edit',exact:true}).click();
    await expect(page.locator('[name=pickup_start]')).toHaveValue('2030-10-07T18:00');
    await expect(page.locator('[name=image_key]')).toHaveValue('salad');
    await page.getByRole('link',{name:'My packages',exact:true}).click();
    await card.getByRole('button',{name:/Delete:/}).click();
    await page.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();
    await expect(card).toHaveCount(0);
  } finally { await context.close(); }
});

test('edit routes update for another package and do not overwrite demo source text', async ({page}) => {
  await page.goto('/'); await language(page,'en'); await login(page,'Tashkent Bakery');
  const packages = await (await page.request.get('/api/business/packages')).json();
  const bread = packages.find(item => item.seed_key === 'demo-bread');
  const dessert = packages.find(item => item.seed_key === 'demo-2');
  await page.goto(`/#/edit-package/${bread.id}`);
  await expect(page.locator('[name=title]')).toHaveValue('Oven-baked bread');
  await page.evaluate(id => { location.hash = `/edit-package/${id}`; }, dessert.id);
  await expect(page.locator('[name=title]')).toHaveValue('Sweet Delight Set');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('My packages');
  const updated = (await (await page.request.get('/api/business/packages')).json()).find(item => item.id === dessert.id);
  for (const field of ['title','description','address','price','original_price']) expect(updated[field]).toBe(dessert[field]);
});

test('network errors translate and retry reconnects to the API', async ({page}) => {
  await page.route('**/api/packages',route => route.abort());
  await page.goto('/');
  const alert = page.locator('main [role=alert]');
  await expect(alert).toContainText('Server bilan aloqa yo‘q');
  await language(page,'ru'); await expect(alert).toContainText('Нет связи с сервером');
  await language(page,'en'); await expect(alert).toContainText('Cannot reach the server');
  await page.unroute('**/api/packages');
  await alert.getByRole('button',{name:'Try again'}).click();
  await expect(page.locator('.package-card').first()).toBeVisible();
  await expect(alert).toHaveCount(0);
});

test('preferences still work when browser storage is unavailable', async ({page}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Unavailable','SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Unavailable','SecurityError'); };
  });
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','uz');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await language(page,'en');
  await page.getByRole('button',{name:'Switch to light mode'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Good food, close to home.');
});
