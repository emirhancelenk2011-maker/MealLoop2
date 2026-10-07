import catalog from '../shared/demo-offers.json';
// Translate only known, unchanged demo copy. Edited listings keep their own content.
const businesses = {
  'Mahalle Fırını': { uz:'Mahalla nonvoyxonasi', ru:'Пекарня у дома', en:'Neighbourhood Bakery' },
  'Yeşil Mutfak': { uz:'Yashil oshxona', ru:'Зелёная кухня', en:'Green Kitchen' },
  'Toshkent Nonvoyxonasi': { uz:'Toshkent Nonvoyxonasi', ru:'Ташкентская пекарня', en:'Tashkent Bakery' },
  'Yashil Oshxona': { uz:'Yashil Oshxona', ru:'Зелёная кухня', en:'Green Kitchen' },
};
const addresses = {
  'Caferağa Mah. Moda Cad. No: 24, Kadıköy': catalog[0].address,
  'Osmanağa Mah. Bahariye Cad. No: 18, Kadıköy': catalog[1].address,
};
const offers = {
  'demo-0': {
    title:{ source:'Fırından sürpriz lezzetler', uz:'Nonvoyxonadan mazali to‘plam', ru:'Набор выпечки из пекарни', en:'Bakery surprise bag' },
    description:{ source:'Günün taze kalanlarından 5 poğaça. İçerik değişebilir; alerjen bilgisi için işletmeye danışın.', uz:'Bugun pishirilgan 5 ta yumshoq bulochka. Tarkibi o‘zgarishi mumkin; allergenlar haqida nonvoyxonadan so‘rang.', ru:'5 свежих булочек из сегодняшней выпечки. Состав может меняться; информацию об аллергенах уточняйте в пекарне.', en:'5 freshly baked savoury buns from today’s batch. Contents may vary; ask the bakery about allergens.' },
  },
  'demo-1': {
    title:{ source:'Günün iyilik kasesi', uz:'Sabzavotli to‘yimli kosa', ru:'Боул дня', en:'Bowl of the day' },
    description:{ source:'Mevsim sebzeleri, tahıl ve ev yapımı sosla hazırlanan doyurucu bir kase.', uz:'Mavsumiy sabzavotlar, don mahsulotlari va uy usulidagi sousdan tayyorlangan to‘yimli taom.', ru:'Сытный боул с сезонными овощами, крупой и домашним соусом.', en:'A filling bowl of seasonal vegetables, grains and house-made dressing.' },
  },
  'demo-2': {
    title:{ source:'Tatlı bir kapanış', uz:'Shirinliklar to‘plami', ru:'Сладкий набор', en:'Sweet treat selection' },
    description:{ source:'Günlük üretimden kalan iki kişilik tatlı ve kurabiye seçkisi.', uz:'Bugun tayyorlangan shirinlik va pechenyelardan ikki kishilik to‘plam.', ru:'Набор десертов и печенья на двоих из сегодняшней выпечки.', en:'A selection of today’s desserts and cookies for two.' },
  },
  'demo-3': {
    title:{ source:'Mevsimden bir paket', uz:'Mavsumiy meva-sabzavotlar', ru:'Сезонные фрукты и овощи', en:'Seasonal fruit & veg' },
    description:{ source:'Görünüşü kusurlu, tadı yerinde mevsim meyve ve sebzeleri. Yaklaşık 2 kg.', uz:'Ko‘rinishi biroz notekis, ta’mi esa ajoyib mavsumiy meva-sabzavotlar. Taxminan 2 kg.', ru:'Сезонные фрукты и овощи: неидеальные снаружи, вкусные внутри. Примерно 2 кг.', en:'Seasonal fruit and vegetables with a few cosmetic imperfections and plenty of flavour. About 2 kg.' },
  },
};
export function localizeOffer(item, language) {
  const key = item.seed_key || item.package_seed_key;
  const copy = offers[key];
  const sample = catalog.find(entry => entry.key === key);
  if (!copy && !sample) return item;
  const result = { ...item };
  for (const field of ['title','description','address']) {
    if (sample && item[field] === sample[field].uz) result[field] = sample[field][language];
    else if (copy?.[field] && item[field] === copy[field].source) result[field] = copy[field][language];
  }
  result.business_name = businesses[item.business_name]?.[language] || item.business_name;
  result.address = addresses[item.address]?.[language] || result.address;
  return result;
}
export function localizeAccount(account, language) {
  if (account?.role === 'customer') {
    if (account.id === 1 && account.name === 'Deniz Yılmaz') return 'Jasur Rahimov';
    if (account.id === 2 && account.name === 'Ece Kaya') return 'Dilnoza Umarova';
  }
  return account?.role === 'business' && [3,4].includes(account.id)
    ? businesses[account.name]?.[language] || account.name : account?.name;
}
