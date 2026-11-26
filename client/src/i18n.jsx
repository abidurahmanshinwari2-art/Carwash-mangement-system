import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LANG_KEY = 'zamzam.lang';

const dict = {
  en: {
    brand: { name: 'ZAMZAM', sub: 'Carwash', full: 'ZAMZAM Carwash' },
    language: 'Language',
    computer: { this: 'this computer' },
    nav: {
      dashboard: 'Dashboard', wash: 'Wash Now', expenses: 'Expenses', distribution: 'Distribution',
      reports: 'Reports', rent: 'Room rent', settings: 'Settings', signedIn: 'Signed in as', signOut: 'Sign out',
      offline: 'Offline · records stay on {computer}',
    },
    splash: 'Opening ZAMZAM…',
    login: {
      username: 'Username', password: 'Password', show: 'Show', hide: 'Hide',
      submit: 'Sign in', busy: 'Signing in…',
    },
    period: { today: 'Today', week: 'This week', month: 'This month', all: 'All time', from: 'From', to: 'To' },
    cal: { meladi: 'Meladi', shamsi: 'Shamsi', hijri: 'Hijri', time: 'Time' },
    time: { am: 'AM', pm: 'PM', minute: 'Minute', period: 'AM / PM' },
    common: {
      save: 'Save', saving: 'Saving…', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', remove: 'Remove',
      print: 'Print', download: 'Download CSV', total: 'Total', name: 'Name', note: 'Note', loading: 'Loading…',
    },
    dashboard: {
      eyebrow: 'Desk', title: 'Dashboard',
      lede: 'How many of each wash were done, and how the net profit is shared.',
      washes: 'Washes', tickets: 'sale tickets', income: 'Total income', fromWashes: 'From washes',
      expenses: 'Expenses', allCosts: 'All costs in this period', net: 'Net profit', netHint: 'Income minus expenses',
      byType: 'Washes by type', record: 'Record a wash', washed: 'washed', empty: 'Add wash items in Settings, then record them in Wash Now.',
      splitTitle: 'Profit distribution', fullSplit: 'Full split',
      formula: 'Each share is net profit × that partner’s investment percentage.',
      invested: '{value} invested',
      percentWarn: 'Partner percentages add up to {value}. Set them to 100 in Settings.',
    },
    wash: {
      eyebrow: 'Counter', title: 'Wash Now',
      lede: 'Tap a saved wash to record it at the stored price. A new item is written into the records as soon as you add it.',
      note: 'Note for the next wash', notePlaceholder: 'Plate number or customer, optional',
      washedToday: 'Washed today', record: 'Record wash', saving: 'Saving…',
      saved: '{name} saved.', itemSaved: 'Wash item saved on {computer}.',
      empty: 'No wash items yet. Add one on the right, or turn items back on in Settings.',
      todayTitle: 'Today’s washes', none: 'No washes recorded today.',
      removeAsk: 'Remove this {name} sale?',
      newTitle: 'New wash item', newHint: 'Name and cost are saved immediately and show up on this counter.',
      washName: 'Wash name', cost: 'Washing cost', saveItem: 'Save item', editLink: 'Edit prices and turn items off',
    },
    expenses: {
      eyebrow: 'Costs', title: 'Expenses',
      lede: 'Every cost is stored with its date and time, and it is taken out before profit is shared.',
      add: 'Add expense', update: 'Update expense', namePlaceholder: 'Car shampoo', amount: 'Amount',
      category: 'Category', when: 'Date and time', notePlaceholder: 'Optional',
      save: 'Save expense', updateBtn: 'Update expense', saved: 'Expense saved with its date and time.',
      updated: 'Expense updated.', list: 'Expense list', none: 'No expenses in this period.',
      deleteAsk: 'Delete “{name}”?',
    },
    categories: {
      soap: 'Soap & chemicals', water: 'Water', electricity: 'Electricity', salary: 'Salary',
      rent: 'Rent', equipment: 'Equipment', maintenance: 'Maintenance', other: 'Other',
    },
    dist: {
      eyebrow: 'Partners', title: 'Profit distribution',
      lede: 'Net profit is total income minus all expenses. That amount is shared by the three partners using the percentages saved in Settings.',
      income: 'Total income', expenses: 'All expenses', net: 'Net profit',
      settings: 'names and percentages are set in Settings',
      percentOf: '{value} of the investment', shareHint: 'Net profit × {value}',
      percentWarn: 'These percentages add up to {value}. They need to equal 100 before the split is exact.',
    },
    reports: {
      eyebrow: 'Books', title: 'Reports',
      lede: 'Expense, income, net profit, and the partner split for the dates you choose.',
      expenses: 'Expense report', income: 'Total income report', profit: 'Net profit report',
      distribution: 'Profits distribution report', rent: 'Rented rooms report', preparing: 'Preparing the report…',
      noRent: 'No rented rooms in this period.',
      rentNote: 'This rent list stays separate from wash income and partner profit.',
      totalExpenses: 'Total expenses', noExpenses: 'No expenses in this period.',
      noIncome: 'No income in this period.', washesCount: '{count} washes',
      noActivity: 'No activity in this period.',
      formula: 'Net profit {amount} is split by each partner’s investment percentage.',
      partner: 'Partner', investment: 'Investment', share: 'Share of net profit',
      colWhen: 'Date and time', colName: 'Name', colCategory: 'Category', colNote: 'Note', colAmount: 'Amount',
      colItem: 'Item', colQty: 'Qty', colUnit: 'Unit cost', colTotal: 'Total',
      colDate: 'Date', colIncome: 'Income', colExpenses: 'Expenses', colNet: 'Net profit',
    },
    rent: {
      eyebrow: 'Rooms', title: 'Room rent',
      lede: 'Give a saved room to a person, take the fee, and print a receipt.',
      isolated: 'This rent money stays on this screen. It is not added to wash income, expenses, or partner profit.',
      rented: 'Rented rooms', monthIncome: 'Rent income this month',
      collected: 'Fees collected this month', partial: 'Partly paid people',
      assign: 'Give a room', person: 'Person', phone: 'Phone', room: 'Room',
      fee: 'Monthly fee', note: 'About this person', movedIn: 'Move-in date',
      savePerson: 'Save person', noRooms: 'Save rooms in Settings first, then give them here.',
      noFree: 'Every saved room is already given.', given: 'Already given', noPeople: 'No one is in a room yet.',
      search: 'Search by name or room', noMatch: 'No person matches that search.',
      pay: 'Pay', leave: 'Leave room', paidMonth: 'Paid this month', remaining: 'Remaining',
      status: 'Status', unpaid: 'Not paid', partialStatus: 'Partially paid', paid: 'Paid',
      amount: 'Amount now', payNow: 'Take payment', cancel: 'Cancel',
      receipt: 'Rent receipt', receiptNo: 'Receipt', print: 'Print receipt', close: 'Close',
      confirmLeave: 'Mark this person as having left the room?',
      monthOf: 'This month',
    },
    settings: {
      eyebrow: 'Setup', title: 'Settings',
      lede: 'Wash types, the three partners, and their investment percentages live here. The desk uses them everywhere else.',
      business: 'Business', reportName: 'Name on reports', currency: 'Currency symbol',
      calendar: 'Date type', calendarHint: 'Every date uses the type you choose here, and the time follows the 12-hour clock on {computer}.',
      saveBusiness: 'Save business',
      businessSaved: 'Business details saved.', partners: 'Three partners', splitEqual: 'Split equally',
      partnerHint: 'Net profit, after every expense, is multiplied by each percentage.',
      partner: 'Partner {n}', percent: 'Investment %', invested: 'Investment amount', totalMust: 'Total {value} · must equal 100%',
      savePartners: 'Save partners', partnersSaved: 'Partner names and percentages saved. Profit splits use them automatically.',
      rooms: 'Rooms for rent', roomsHint: 'Save the rooms here. They are used only on the Room rent screen, and their money is not wash income.',
      addRoom: 'Add room', roomPlaceholder: 'Room name', rentPlaceholder: 'Monthly rent', roomFee: 'Monthly rent',
      items: 'Wash items', itemsHint: 'These names and costs appear on Wash Now. A price change does not rewrite washes already recorded.',
      newPlaceholder: 'New wash name', costPlaceholder: 'Cost', addItem: 'Add item', itemSaved: 'Wash item saved.',
      onCounter: 'On counter', showing: 'Showing', hidden: 'Hidden', itemUpdated: 'Wash item updated.',
      deleteAsk: 'Delete {name}?', symbolNote: 'Current symbol on screen: {value}',
      password: 'Password', current: 'Current password', next: 'New password', change: 'Change password',
      passwordSaved: 'Password changed on {computer}.',
      storageTitle: 'Where the records live',
      storage: 'Washes, expenses, partners, and reports are stored in a database file on {computer}, in the data folder next to the app. Copy that folder if you want a backup. The desk does not use the internet while you work.',
    },
    errors: {
      generic: 'Something went wrong',
      offline: 'Cannot reach ZAMZAM on {computer}. Leave the app window open and try again.',
      notFound: 'Not found',
      auth: {
        bad: 'Username or password is incorrect',
        short: 'New password must be at least 6 characters',
        current: 'Current password is incorrect',
        again: 'Please sign in again',
      },
      required: {
        washName: 'Wash name is required', expenseName: 'Expense name is required', category: 'Category is required',
        partnerName: 'Partner name is required', businessName: 'Business name is required', currency: 'Currency is required',
        roomName: 'Room name is required', personName: 'Person name is required',
      },
      tooLong: {
        washName: 'Wash name is too long', expenseName: 'Expense name is too long', category: 'Category is too long',
        partnerName: 'Partner name is too long', businessName: 'Business name is too long', currency: 'Currency is too long',
        roomName: 'Room name is too long', personName: 'Person name is too long', phone: 'Phone is too long',
      },
      amount: { washingCost: 'Washing cost must be a valid amount', amount: 'Amount must be a valid amount', roomRent: 'Monthly rent must be a valid amount', rentPay: 'Payment must be a valid amount', investment: 'Investment amount must be a valid amount' },
      note: { max: 'Note must be 300 characters or less' },
      datetime: { invalid: 'Enter a valid date and time' },
      date: { invalid: 'Enter a valid date' },
      item: { duplicate: 'That wash item already exists', missing: 'Wash item not found', inUse: 'This item has washes, so it stays in history. Turn it off instead.' },
      wash: { item: 'Choose a wash item that is turned on', quantity: 'Quantity must be a whole number from 1 to 100', missing: 'Wash not found' },
      expense: { missing: 'Expense not found' },
      partners: {
        count: 'Enter exactly three investment partners', invalid: 'Partner record is invalid',
        range: 'Each percentage must be between 0 and 100', total: 'Investment percentages must add up to 100',
        missing: 'Partner records are missing',
      },
      room: { duplicate: 'That room already exists', missing: 'Choose a room saved in Settings', inUse: 'This room is on the rent screen, so it stays.' },
      tenant: { occupied: 'This room is already given to someone', missing: 'Person not found', left: 'This person already left the room' },
    },
  },
  fa: {
    brand: { name: 'زمزم', sub: 'کارواش', full: 'زمزم کارواش' },
    language: 'زبان',
    computer: { this: 'همین کامپیوتر' },
    nav: {
      dashboard: 'داشبورد', wash: 'شستشوی اکنون', expenses: 'مصارف', distribution: 'تقسیم مفاد',
      reports: 'گزارش‌ها', rent: 'کرایه اطاق', settings: 'تنظیمات', signedIn: 'وارد شده به نام', signOut: 'خروج',
      offline: 'آفلاین · معلومات در {computer} می‌ماند',
    },
    splash: 'زمزم باز می‌شود…',
    login: {
      username: 'نام کاربری', password: 'رمز عبور', show: 'نمایش', hide: 'پنهان',
      submit: 'ورود', busy: 'در حال ورود…',
    },
    period: { today: 'امروز', week: 'این هفته', month: 'این ماه', all: 'همه وقت', from: 'از', to: 'تا' },
    cal: { meladi: 'میلادی', shamsi: 'شمسی', hijri: 'هجری', time: 'ساعت' },
    time: { am: 'ق.ظ', pm: 'ب.ظ', minute: 'دقیقه', period: 'ق.ظ / ب.ظ' },
    common: {
      save: 'ذخیره', saving: 'در حال ذخیره…', cancel: 'لغو', delete: 'حذف', edit: 'ویرایش', remove: 'برداشتن',
      print: 'چاپ', download: 'دانلود CSV', total: 'مجموع', name: 'نام', note: 'یادداشت', loading: 'در حال بارگیری…',
    },
    dashboard: {
      eyebrow: 'میز', title: 'داشبورد',
      lede: 'تعداد هر نوع شستشو و تقسیم مفاد خالص.',
      washes: 'شستشوها', tickets: 'بل فروش', income: 'مجموع عاید', fromWashes: 'از شستشوها',
      expenses: 'مصارف', allCosts: 'همه مصارف این دوره', net: 'مفاد خالص', netHint: 'عاید منهای مصارف',
      byType: 'شستشو به تفکیک نوع', record: 'ثبت شستشو', washed: 'شستشو شد', empty: 'در تنظیمات نوع شستشو اضافه کنید، سپس در شستشوی اکنون ثبت کنید.',
      splitTitle: 'تقسیم مفاد', fullSplit: 'تقسیم کامل',
      formula: 'سهم هر شریک = مفاد خالص × فیصد سرمایه‌گذاری او.',
      invested: '{value} سرمایه‌گذاری',
      percentWarn: 'فیصد شرکا {value} است. در تنظیمات آن را ۱۰۰ کنید.',
    },
    wash: {
      eyebrow: 'پیشخوان', title: 'شستشوی اکنون',
      lede: 'روی شستشوی ذخیره شده بزنید تا به قیمت ثبت شده حساب شود. نام و قیمت نوع جدید همان لحظه ذخیره می‌شود.',
      note: 'یادداشت شستشوی بعدی', notePlaceholder: 'نمبر پلیت یا مشتری، اختیاری',
      washedToday: 'شستشوی امروز', record: 'ثبت شستشو', saving: 'در حال ذخیره…',
      saved: '{name} ذخیره شد.', itemSaved: 'نوع شستشو در {computer} ذخیره شد.',
      empty: 'هنوز نوع شستشو نیست. از سمت راست اضافه کنید یا در تنظیمات دوباره روشن کنید.',
      todayTitle: 'شستشوهای امروز', none: 'امروز شستشویی ثبت نشده.',
      removeAsk: 'این فروش {name} برداشته شود؟',
      newTitle: 'نوع جدید شستشو', newHint: 'نام و قیمت فوراً ذخیره می‌شود و در همین پیشخوان دیده می‌شود.',
      washName: 'نام شستشو', cost: 'قیمت شستشو', saveItem: 'ذخیره نوع', editLink: 'ویرایش قیمت و خاموش کردن نوع‌ها',
    },
    expenses: {
      eyebrow: 'هزینه‌ها', title: 'مصارف',
      lede: 'هر مصرف با تاریخ و ساعت ذخیره می‌شود و پیش از تقسیم مفاد کم می‌گردد.',
      add: 'افزودن مصرف', update: 'ویرایش مصرف', namePlaceholder: 'شامپو موتر', amount: 'مبلغ',
      category: 'دسته', when: 'تاریخ و ساعت', notePlaceholder: 'اختیاری',
      save: 'ذخیره مصرف', updateBtn: 'تازه‌سازی مصرف', saved: 'مصرف با تاریخ و ساعت ذخیره شد.',
      updated: 'مصرف تازه‌سازی شد.', list: 'فهرست مصارف', none: 'در این دوره مصرفی نیست.',
      deleteAsk: '«{name}» حذف شود؟',
    },
    categories: {
      soap: 'صابون و مواد', water: 'آب', electricity: 'برق', salary: 'معاش',
      rent: 'کرایه', equipment: 'وسایل', maintenance: 'ترمیم', other: 'دیگر',
    },
    dist: {
      eyebrow: 'شرکا', title: 'تقسیم مفاد',
      lede: 'مفاد خالص عاید مجموعی منهای همه مصارف است. این مبلغ به فیصد سرمایه‌گذاری سه شریک، که در تنظیمات ذخیره است، تقسیم می‌شود.',
      income: 'مجموع عاید', expenses: 'همه مصارف', net: 'مفاد خالص',
      settings: 'نام‌ها و فیصدها در تنظیمات تعیین می‌شوند',
      percentOf: '{value} از سرمایه‌گذاری', shareHint: 'مفاد خالص × {value}',
      percentWarn: 'این فیصدها {value} می‌شوند. برای تقسیم دقیق باید ۱۰۰ باشند.',
    },
    reports: {
      eyebrow: 'دفتر', title: 'گزارش‌ها',
      lede: 'گزارش مصارف، عاید، مفاد خالص و تقسیم مفاد برای تاریخ انتخاب‌شده.',
      expenses: 'گزارش مصارف', income: 'گزارش مجموع عاید', profit: 'گزارش مفاد خالص',
      distribution: 'گزارش تقسیم مفاد', rent: 'گزارش اطاق‌های کرایه', preparing: 'گزارش آماده می‌شود…',
      noRent: 'در این دوره اطاق کرایه‌ای نیست.',
      rentNote: 'این فهرست کرایه از عاید شستشو و مفاد شرکا جدا است.',
      totalExpenses: 'مجموع مصارف', noExpenses: 'در این دوره مصرفی نیست.',
      noIncome: 'در این دوره عایدی نیست.', washesCount: '{count} شستشو',
      noActivity: 'در این دوره فعالیتی نیست.',
      formula: 'مفاد خالص {amount} به فیصد سرمایه‌گذاری هر شریک تقسیم می‌شود.',
      partner: 'شریک', investment: 'سرمایه‌گذاری', share: 'سهم از مفاد خالص',
      colWhen: 'تاریخ و ساعت', colName: 'نام', colCategory: 'دسته', colNote: 'یادداشت', colAmount: 'مبلغ',
      colItem: 'نوع', colQty: 'تعداد', colUnit: 'قیمت واحد', colTotal: 'مجموع',
      colDate: 'تاریخ', colIncome: 'عاید', colExpenses: 'مصارف', colNet: 'مفاد خالص',
    },
    rent: {
      eyebrow: 'اطاق‌ها', title: 'کرایه اطاق',
      lede: 'اطاق ذخیره‌شده را به یک شخص بدهید، فیس را بگیرید و رسید چاپ کنید.',
      isolated: 'پول کرایه فقط در همین صفحه می‌ماند و به عاید شستشو، مصارف یا مفاد شرکا اضافه نمی‌شود.',
      rented: 'اطاق‌های کرایه داده شده', monthIncome: 'عاید کرایه در این ماه',
      collected: 'فیس‌های گرفته شده در این ماه', partial: 'کسانی که بخشی پرداخته‌اند',
      assign: 'دادن اطاق', person: 'شخص', phone: 'تلفن', room: 'اطاق',
      fee: 'فیس ماهانه', note: 'معلومات شخص', movedIn: 'تاریخ آمدن',
      savePerson: 'ثبت شخص', noRooms: 'اول اطاق‌ها را در تنظیمات ذخیره کنید، بعد اینجا بدهید.',
      noFree: 'همه اطاق‌های ذخیره شده داده شده‌اند.', given: 'قبلاً داده شده', noPeople: 'هنوز کسی در اطاق نیست.',
      search: 'جستجو با نام یا شماره اطاق', noMatch: 'کسی با این جستجو پیدا نشد.',
      pay: 'پرداخت', leave: 'ترک اطاق', paidMonth: 'پرداخت این ماه', remaining: 'باقی',
      status: 'حالت', unpaid: 'پرداخت نشده', partialStatus: 'بخشی پرداخت شده', paid: 'پرداخت شده',
      amount: 'مبلغ اکنون', payNow: 'گرفتن پرداخت', cancel: 'لغو',
      receipt: 'رسید کرایه', receiptNo: 'رسید', print: 'چاپ رسید', close: 'بستن',
      confirmLeave: 'این شخص اطاق را ترک کرده است؟',
      monthOf: 'این ماه',
    },
    settings: {
      eyebrow: 'آماده‌سازی', title: 'تنظیمات',
      lede: 'نوع‌های شستشو، نام سه شریک و فیصد سرمایه‌گذاری اینجا تعیین می‌شود و در سراسر سیستم به کار می‌رود.',
      business: 'تجارت', reportName: 'نام روی گزارش‌ها', currency: 'نشانه پول',
      calendar: 'نوع تاریخ', calendarHint: 'همه تاریخ‌ها به نوعی که اینجا انتخاب کنید نشان داده می‌شوند و ساعت، ساعت ۱۲ ساعته {computer} است.',
      saveBusiness: 'ذخیره تجارت',
      businessSaved: 'مشخصات تجارت ذخیره شد.', partners: 'سه شریک', splitEqual: 'تقسیم مساوی',
      partnerHint: 'مفاد خالص، پس از همه مصارف، در فیصد هر شریک ضرب می‌شود.',
      partner: 'شریک {n}', percent: 'فیصد سرمایه‌گذاری', invested: 'مبلغ سرمایه‌گذاری', totalMust: 'مجموع {value} · باید ۱۰۰٪ باشد',
      savePartners: 'ذخیره شرکا', partnersSaved: 'نام و فیصد شرکا ذخیره شد. تقسیم مفاد خودکار از همین‌ها حساب می‌شود.',
      rooms: 'اطاق‌های کرایه', roomsHint: 'اطاق‌ها را اینجا ذخیره کنید. فقط در صفحه کرایه اطاق به کار می‌روند و پول‌شان عاید شستشو نیست.',
      addRoom: 'افزودن اطاق', roomPlaceholder: 'نام اطاق', rentPlaceholder: 'کرایه ماهانه', roomFee: 'کرایه ماهانه',
      items: 'نوع‌های شستشو', itemsHint: 'این نام‌ها و قیمت‌ها در شستشوی اکنون دیده می‌شوند. تغییر قیمت، شستشوهای قبلی را عوض نمی‌کند.',
      newPlaceholder: 'نام شستشوی جدید', costPlaceholder: 'قیمت', addItem: 'افزودن نوع', itemSaved: 'نوع شستشو ذخیره شد.',
      onCounter: 'در پیشخوان', showing: 'نمایان', hidden: 'پنهان', itemUpdated: 'نوع شستشو تازه‌سازی شد.',
      deleteAsk: '{name} حذف شود؟', symbolNote: 'نشانه فعلی روی صفحه: {value}',
      password: 'رمز عبور', current: 'رمز فعلی', next: 'رمز جدید', change: 'تغییر رمز',
      passwordSaved: 'رمز در {computer} تغییر کرد.',
      storageTitle: 'جای نگهداری معلومات',
      storage: 'شستشوها، مصارف، شرکا و گزارش‌ها در یک فایل پایگاه داده روی {computer}، در پوشه data کنار برنامه، ذخیره می‌شوند. برای پشتیبان آن پوشه را کاپی کنید. هنگام کار انترنت لازم نیست.',
    },
    errors: {
      generic: 'مشکلی پیش آمد',
      offline: 'زمزم در {computer} در دسترس نیست. پنجره برنامه را باز بگذارید و دوباره کوشش کنید.',
      notFound: 'یافت نشد',
      auth: {
        bad: 'نام کاربری یا رمز عبور نادرست است',
        short: 'رمز جدید باید حداقل ۶ حرف باشد',
        current: 'رمز فعلی نادرست است',
        again: 'لطفاً دوباره وارد شوید',
      },
      required: {
        washName: 'نام شستشو ضروری است', expenseName: 'نام مصرف ضروری است', category: 'دسته ضروری است',
        partnerName: 'نام شریک ضروری است', businessName: 'نام تجارت ضروری است', currency: 'نشانه پول ضروری است',
        roomName: 'نام اطاق ضروری است', personName: 'نام شخص ضروری است',
      },
      tooLong: {
        washName: 'نام شستشو بسیار طولانی است', expenseName: 'نام مصرف بسیار طولانی است', category: 'دسته بسیار طولانی است',
        partnerName: 'نام شریک بسیار طولانی است', businessName: 'نام تجارت بسیار طولانی است', currency: 'نشانه پول بسیار طولانی است',
        roomName: 'نام اطاق بسیار طولانی است', personName: 'نام شخص بسیار طولانی است', phone: 'شماره تلفن بسیار طولانی است',
      },
      amount: { washingCost: 'قیمت شستشو باید مبلغ درست باشد', amount: 'مبلغ باید درست باشد', roomRent: 'کرایه ماهانه باید مبلغ درست باشد', rentPay: 'پرداخت باید مبلغ درست باشد', investment: 'مبلغ سرمایه‌گذاری باید درست باشد' },
      note: { max: 'یادداشت باید ۳۰۰ حرف یا کمتر باشد' },
      datetime: { invalid: 'تاریخ و ساعت درست را بنویسید' },
      date: { invalid: 'تاریخ درست را بنویسید' },
      item: { duplicate: 'این نوع شستشو از قبل وجود دارد', missing: 'نوع شستشو یافت نشد', inUse: 'این نوع شستشو در تاریخچه است. آن را خاموش کنید، حذف نه.' },
      wash: { item: 'یک نوع شستشوی روشن را انتخاب کنید', quantity: 'تعداد باید عدد کامل از ۱ تا ۱۰۰ باشد', missing: 'شستشو یافت نشد' },
      expense: { missing: 'مصرف یافت نشد' },
      partners: {
        count: 'دقیقاً سه شریک سرمایه‌گذاری را بنویسید', invalid: 'معلومات شریک نادرست است',
        range: 'هر فیصد باید بین ۰ و ۱۰۰ باشد', total: 'فیصد سرمایه‌گذاری باید ۱۰۰ شود',
        missing: 'معلومات شرکا موجود نیست',
      },
      room: { duplicate: 'این اطاق از قبل وجود دارد', missing: 'اطاقی را انتخاب کنید که در تنظیمات ذخیره شده', inUse: 'این اطاق در صفحه کرایه است و می‌ماند.' },
      tenant: { occupied: 'این اطاق قبلاً به کسی داده شده', missing: 'شخص یافت نشد', left: 'این شخص اطاق را ترک کرده است' },
    },
  },
  ps: {
    brand: { name: 'زمزم', sub: 'کارواش', full: 'زمزم کارواش' },
    language: 'ژبه',
    computer: { this: 'همدې کمپیوټر' },
    nav: {
      dashboard: 'ډشبورډ', wash: 'اوس وینځل', expenses: 'لګښتونه', distribution: 'د ګټې ویش',
      reports: 'راپورونه', rent: 'د اطاق کرایه', settings: 'تنظیمات', signedIn: 'ننوتی یاست په نوم', signOut: 'وتل',
      offline: 'آفلاین · معلومات په {computer} پاتې کېږي',
    },
    splash: 'زمزم پرانیستل کېږي…',
    login: {
      username: 'کارن نوم', password: 'پټنوم', show: 'ښودل', hide: 'پټول',
      submit: 'ننوتل', busy: 'ننوتل کېږي…',
    },
    period: { today: 'نن', week: 'دا اونۍ', month: 'دا میاشت', all: 'ټول وخت', from: 'له', to: 'تر' },
    cal: { meladi: 'میلادي', shamsi: 'شمسي', hijri: 'هجري', time: 'وخت' },
    time: { am: 'غ.م', pm: 'غ.و', minute: 'دقیقه', period: 'غ.م / غ.و' },
    common: {
      save: 'خوندي کول', saving: 'خوندي کېږي…', cancel: 'لغوه', delete: 'ړنګول', edit: 'سمول', remove: 'لرې کول',
      print: 'چاپ', download: 'CSV ښکته کول', total: 'ټول', name: 'نوم', note: 'یادښت', loading: 'چمتو کېږي…',
    },
    dashboard: {
      eyebrow: 'میز', title: 'ډشبورډ',
      lede: 'د هر ډول وینځلو شمېر او د خالصې ګټې ویش.',
      washes: 'وینځنې', tickets: 'د پلور پاڼې', income: 'ټول عاید', fromWashes: 'له وینځنو',
      expenses: 'لګښتونه', allCosts: 'د دې مودې ټول لګښتونه', net: 'خالصه ګټه', netHint: 'عاید منفي لګښتونه',
      byType: 'وینځنې د ډول له مخې', record: 'وینځنه ثبت کړئ', washed: 'وینځل شوي', empty: 'په تنظیماتو کې د وینځلو ډولونه زیات کړئ، بیا یې په اوس وینځل کې ثبت کړئ.',
      splitTitle: 'د ګټې ویش', fullSplit: 'بشپړ ویش',
      formula: 'د هر شریک برخه = خالصه ګټه × د هغه د پانګونې سلنه.',
      invested: '{value} پانګونه',
      percentWarn: 'د شریکانو سلنې {value} دي. په تنظیماتو کې یې ۱۰۰ کړئ.',
    },
    wash: {
      eyebrow: 'کاؤنټر', title: 'اوس وینځل',
      lede: 'خوندي شوې وینځنه وټاکئ تر څو په ثبت شوې بیه حساب شي. د نوي ډول نوم او بیه سمدلاسه خوندي کېږي.',
      note: 'د راتلونکې وینځنې یادښت', notePlaceholder: 'د پلېټ نمبر یا پېرودونکی، اختیاري',
      washedToday: 'نن وینځل شوي', record: 'وینځنه ثبت کړئ', saving: 'خوندي کېږي…',
      saved: '{name} خوندي شو.', itemSaved: 'د وینځلو ډول په {computer} خوندي شو.',
      empty: 'تر اوسه د وینځلو ډول نشته. ښي خوا ته یې زیات کړئ یا په تنظیماتو کې بیا فعال کړئ.',
      todayTitle: 'د نن ورځې وینځنې', none: 'نن هېڅ وینځنه نه ده ثبت شوې.',
      removeAsk: 'دا د {name} پلور لرې شي؟',
      newTitle: 'نوی د وینځلو ډول', newHint: 'نوم او بیه سمدلاسه خوندي کېږي او په همدې کاؤنټر ښکاري.',
      washName: 'د وینځلو نوم', cost: 'د وینځلو بیه', saveItem: 'ډول خوندي کړئ', editLink: 'بیې سمې کړئ او ډولونه پټ کړئ',
    },
    expenses: {
      eyebrow: 'لګښتونه', title: 'لګښتونه',
      lede: 'هر لګښت د نېټې او وخت سره خوندي کېږي او له ګټې ویش مخکې منفي کېږي.',
      add: 'لګښت زیاتول', update: 'لګښت سمول', namePlaceholder: 'د موټر شامپو', amount: 'اندازه',
      category: 'ډله', when: 'نېټه او وخت', notePlaceholder: 'اختیاري',
      save: 'لګښت خوندي کړئ', updateBtn: 'لګښت تازه کړئ', saved: 'لګښت د نېټې او وخت سره خوندي شو.',
      updated: 'لګښت تازه شو.', list: 'د لګښتونو لړ', none: 'په دې موده کې لګښت نشته.',
      deleteAsk: '«{name}» ړنګ شي؟',
    },
    categories: {
      soap: 'صابون او مواد', water: 'اوبه', electricity: 'برېښنا', salary: 'معاش',
      rent: 'کرایه', equipment: 'وسایل', maintenance: 'ترمیم', other: 'نور',
    },
    dist: {
      eyebrow: 'شریکان', title: 'د ګټې ویش',
      lede: 'خالصه ګټه ټول عاید منفي ټول لګښتونه دي. دا پیسې د دریو شریکانو د پانګونې په سلنه ویشل کېږي چې په تنظیماتو کې خوندي دي.',
      income: 'ټول عاید', expenses: 'ټول لګښتونه', net: 'خالصه ګټه',
      settings: 'نومونه او سلنې په تنظیماتو کې ټاکل کېږي',
      percentOf: 'د پانګونې {value}', shareHint: 'خالصه ګټه × {value}',
      percentWarn: 'دا سلنې {value} کېږي. د دقیق ویش لپاره باید ۱۰۰ وي.',
    },
    reports: {
      eyebrow: 'کتاب', title: 'راپورونه',
      lede: 'د لګښت، عاید، خالصې ګټې او د ګټې ویش راپور د ټاکل شوې نېټې لپاره.',
      expenses: 'د لګښت راپور', income: 'د ټول عاید راپور', profit: 'د خالصې ګټې راپور',
      distribution: 'د ګټې د ویش راپور', rent: 'د کرایه شویو اطاقونو راپور', preparing: 'راپور چمتو کېږي…',
      noRent: 'په دې موده کې کرایه شوی اطاق نشته.',
      rentNote: 'دا د کرایې لړلیک د وینځلو عاید او د شریکانو ګټې څخه بېل دی.',
      totalExpenses: 'ټول لګښتونه', noExpenses: 'په دې موده کې لګښت نشته.',
      noIncome: 'په دې موده کې عاید نشته.', washesCount: '{count} وینځنې',
      noActivity: 'په دې موده کې فعالیت نشته.',
      formula: 'خالصه ګټه {amount} د هر شریک د پانګونې په سلنه ویشل کېږي.',
      partner: 'شریک', investment: 'پانګونه', share: 'د خالصې ګټې برخه',
      colWhen: 'نېټه او وخت', colName: 'نوم', colCategory: 'ډله', colNote: 'یادښت', colAmount: 'اندازه',
      colItem: 'ډول', colQty: 'شمېر', colUnit: 'د واحد بیه', colTotal: 'ټول',
      colDate: 'نېټه', colIncome: 'عاید', colExpenses: 'لګښتونه', colNet: 'خالصه ګټه',
    },
    rent: {
      eyebrow: 'اطاقونه', title: 'د اطاق کرایه',
      lede: 'خوندي شوی اطاق یو کس ته ورکړئ، فیس واخلئ او رسید چاپ کړئ.',
      isolated: 'د کرایې پیسې یوازې په همدې پاڼه پاتې کېږي او د وینځلو عاید، لګښت یا د شریکانو ګټې کې نه ورزیاتېږي.',
      rented: 'په کرایه ورکړل شوي اطاقونه', monthIncome: 'د دې میاشتې د کرایې عاید',
      collected: 'پدې میاشت کې اخیستل شوي فیسونه', partial: 'هغه کسان چې نیمګړې پیسې یې ورکړې',
      assign: 'اطاق ورکول', person: 'شخص', phone: 'ټیلیفون', room: 'اطاق',
      fee: 'میاشتنی فیس', note: 'د شخص معلومات', movedIn: 'د راتلو نېټه',
      savePerson: 'شخص خوندي کړئ', noRooms: 'لومړی اطاقونه په تنظیماتو کې خوندي کړئ، بیا یې دلته ورکړئ.',
      noFree: 'ټول خوندي اطاقونه ورکړل شوي دي.', given: 'له مخکې ورکړل شوی', noPeople: 'تر اوسه څوک په اطاق کې نشته.',
      search: 'د نوم یا د اطاق نمبر لټون', noMatch: 'هیڅ کس په دې لټون کې و نه موندل شو.',
      pay: 'ورکول', leave: 'اطاق پرېښودل', paidMonth: 'د دې میاشتې ورکړه', remaining: 'پاتې',
      status: 'حالت', unpaid: 'نه دي ورکړل شوي', partialStatus: 'نیمګړې ورکړل شوې', paid: 'ورکړل شوې',
      amount: 'اوسنۍ اندازه', payNow: 'پیسې واخلئ', cancel: 'پرېښودل',
      receipt: 'د کرایې رسید', receiptNo: 'رسید', print: 'رسید چاپ کړئ', close: 'تړل',
      confirmLeave: 'دا کس اطاق پرېښی دی؟',
      monthOf: 'دا میاشت',
    },
    settings: {
      eyebrow: 'چمتووالی', title: 'تنظیمات',
      lede: 'د وینځلو ډولونه، د دریو شریکانو نومونه او د پانګونې سلنې دلته ټاکل کېږي او په ټول سیستم کارول کېږي.',
      business: 'سوداګري', reportName: 'نوم په راپورونو', currency: 'د پیسو نښه',
      calendar: 'د نېټې ډول', calendarHint: 'ټولې نېټې په هغه ډول ښودل کېږي چې دلته یې وټاکئ، او وخت د {computer} ۱۲ ساعتی وخت دی.',
      saveBusiness: 'سوداګري خوندي کړئ',
      businessSaved: 'د سوداګرۍ معلومات خوندي شول.', partners: 'درې شریکان', splitEqual: 'مساوي ویش',
      partnerHint: 'خالصه ګټه، له ټولو لګښتونو وروسته، د هرې سلنې سره ضربېږي.',
      partner: 'شریک {n}', percent: 'د پانګونې سلنه', invested: 'د پانګونې اندازه', totalMust: 'ټول {value} · باید ۱۰۰٪ وي',
      savePartners: 'شریکان خوندي کړئ', partnersSaved: 'د شریکانو نومونه او سلنې خوندي شوې. د ګټې ویش له همدې حسابېږي.',
      rooms: 'د کرایې اطاقونه', roomsHint: 'اطاقونه دلته خوندي کړئ. یوازې د اطاق کرایې په پاڼه کارېږي او پیسې یې د وینځلو عاید نه دی.',
      addRoom: 'اطاق زیات کړئ', roomPlaceholder: 'د اطاق نوم', rentPlaceholder: 'میاشتنۍ کرایه', roomFee: 'میاشتنۍ کرایه',
      items: 'د وینځلو ډولونه', itemsHint: 'دا نومونه او بیې په اوس وینځل کې ښکاري. د بیې بدلون پخوانۍ وینځنې نه بدلوي.',
      newPlaceholder: 'د نوي وینځلو نوم', costPlaceholder: 'بیه', addItem: 'ډول زیات کړئ', itemSaved: 'د وینځلو ډول خوندي شو.',
      onCounter: 'په کاؤنټر', showing: 'ښکاري', hidden: 'پټ', itemUpdated: 'د وینځلو ډول تازه شو.',
      deleteAsk: '{name} ړنګ شي؟', symbolNote: 'اوسنۍ نښه په پرده: {value}',
      password: 'پټنوم', current: 'اوسنی پټنوم', next: 'نوی پټنوم', change: 'پټنوم بدل کړئ',
      passwordSaved: 'پټنوم په {computer} بدل شو.',
      storageTitle: 'معلومات چېرته دي',
      storage: 'وینځنې، لګښتونه، شریکان او راپورونه د {computer} په ډیټابیس فایل کې، د پروګرام تر څنګ په data پوښۍ کې، خوندي دي. د بیکاپ لپاره هغه پوښۍ کاپي کړئ. د کار پر مهال انټرنېټ ته اړتیا نشته.',
    },
    errors: {
      generic: 'یوه ستونزه رامنځته شوه',
      offline: 'زمزم په {computer} نه رسي. د پروګرام کړکۍ پرانیستې پرېږدئ او بیا هڅه وکړئ.',
      notFound: 'و نه موندل شو',
      auth: {
        bad: 'کارن نوم یا پټنوم ناسم دی',
        short: 'نوی پټنوم باید لږ تر لږه ۶ توري وي',
        current: 'اوسنی پټنوم ناسم دی',
        again: 'مهرباني وکړئ بیا ننوځئ',
      },
      required: {
        washName: 'د وینځلو نوم اړین دی', expenseName: 'د لګښت نوم اړین دی', category: 'ډله اړینه ده',
        partnerName: 'د شریک نوم اړین دی', businessName: 'د سوداګرۍ نوم اړین دی', currency: 'د پیسو نښه اړینه ده',
        roomName: 'د اطاق نوم اړین دی', personName: 'د شخص نوم اړین دی',
      },
      tooLong: {
        washName: 'د وینځلو نوم ډېر اوږد دی', expenseName: 'د لګښت نوم ډېر اوږد دی', category: 'ډله ډېره اوږده ده',
        partnerName: 'د شریک نوم ډېر اوږد دی', businessName: 'د سوداګرۍ نوم ډېر اوږد دی', currency: 'د پیسو نښه ډېره اوږده ده',
        roomName: 'د اطاق نوم ډېر اوږد دی', personName: 'د شخص نوم ډېر اوږد دی', phone: 'ټیلیفون ډېر اوږد دی',
      },
      amount: { washingCost: 'د وینځلو بیه باید سمه اندازه وي', amount: 'اندازه باید سمه وي', roomRent: 'میاشتنۍ کرایه باید سمه اندازه وي', rentPay: 'ورکړه باید سمه اندازه وي', investment: 'د پانګونې اندازه باید سمه وي' },
      note: { max: 'یادښت باید ۳۰۰ توري یا لږ وي' },
      datetime: { invalid: 'سمه نېټه او وخت ولیکئ' },
      date: { invalid: 'سمه نېټه ولیکئ' },
      item: { duplicate: 'دا د وینځلو ډول له مخکې شته', missing: 'د وینځلو ډول و نه موندل شو', inUse: 'دا ډول په تاریخچه کې وینځنې لري. ړنګ یې نه کړئ، پټ یې کړئ.' },
      wash: { item: 'یو فعال د وینځلو ډول وټاکئ', quantity: 'شمېر باید له ۱ تر ۱۰۰ پوره عدد وي', missing: 'وینځنه و نه موندل شوه' },
      expense: { missing: 'لګښت و نه موندل شو' },
      partners: {
        count: 'د پانګونې درې شریکان ولیکئ', invalid: 'د شریک معلومات ناسم دي',
        range: 'هره سلنه باید د ۰ او ۱۰۰ تر منځ وي', total: 'د پانګونې سلنې باید ۱۰۰ شي',
        missing: 'د شریکانو معلومات نشته',
      },
      room: { duplicate: 'دا اطاق له مخکې شته', missing: 'هغه اطاق وټاکئ چې په تنظیماتو کې خوندي دی', inUse: 'دا اطاق د کرایې په پاڼه دی او پاتې کېږي.' },
      tenant: { occupied: 'دا اطاق له مخکې چا ته ورکړل شوی', missing: 'شخص و نه موندل شو', left: 'دا کس اطاق پرېښی دی' },
    },
  },
};

export const categoryKeys = ['soap', 'water', 'electricity', 'salary', 'rent', 'equipment', 'maintenance', 'other'];

const legacyCategories = {
  'Soap & chemicals': 'soap',
  Water: 'water',
  Electricity: 'electricity',
  Salary: 'salary',
  Rent: 'rent',
  Equipment: 'equipment',
  Maintenance: 'maintenance',
  Other: 'other',
};

export function categoryKey(value) {
  if (categoryKeys.includes(value)) return value;
  return legacyCategories[value] || 'other';
}

export function categoryLabel(value, t) {
  const key = categoryKeys.includes(value) ? value : legacyCategories[value];
  return key ? t(`categories.${key}`) : value;
}

export function getLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ps' || saved === 'fa' || saved === 'en') return saved;
  } catch {
    /* storage can be blocked; English remains the fallback */
  }
  return 'en';
}

function lookup(lang, key) {
  let node = dict[lang];
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(key, vars = {}, lang = getLang()) {
  const text = lookup(lang, key) ?? lookup('en', key) ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] == null ? '' : String(vars[name])));
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLang);
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.lang = lang === 'fa' ? 'fa-AF' : lang === 'ps' ? 'ps-AF' : 'en';
    document.documentElement.dir = dir;
    document.title = translate('brand.full', {}, lang);
  }, [lang, dir]);

  const value = useMemo(() => ({
    lang,
    dir,
    setLang(next) {
      localStorage.setItem(LANG_KEY, next);
      setLangState(next);
    },
    t: (key, vars) => translate(key, vars, lang),
  }), [lang, dir]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('Language is not ready');
  return value;
}
