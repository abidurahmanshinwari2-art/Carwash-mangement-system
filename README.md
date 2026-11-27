# ZAMZAM Carwash

Offline car-wash desk for one computer. The screen is React. The records are kept by Node.js in a SQLite file in the `data` folder next to the app. Nothing is sent to the internet while the desk is in use.

The desk shows the name of the computer it is running on. Copy the folder to another PC and it uses that PC’s name and its own `data` folder.

## Open it on a customer PC

1. Install the LTS version of [Node.js](https://nodejs.org) once.
2. Download this project from GitHub and unzip it.
3. Open the folder that contains **Run.bat**. If you see two folders with the same name, open the inner one.
4. Double-click **Run.bat**.

The screen is already prepared, so the customer PC does not build it. The first open installs the desk and needs the internet once. It also puts a **ZAMZAM Carwash** icon on the desktop. After that, open the desk from the icon. Leave the ZAMZAM window open while you work. Closing that window stops the desk.

## Sign in

The first sign-in is:

- Username: `admin`
- Password: `admin123`

Change the password in **Settings** after you enter.

## Screens

| Screen | What it is for |
|---|---|
| Dashboard | Washes by type, income, expenses, net profit, and each partner’s share |
| Wash Now | Record a wash at the saved price. A new wash name and cost are stored as soon as you add them |
| Expenses | Costs with the computer’s date and a 12-hour time |
| Distribution | Net profit (income minus every expense) split by the three partners’ investment percentages |
| Reports | Expense, total income, net profit, and profit-distribution reports. Print or download CSV |
| Settings | Business name, currency, date type, wash items, the three partners, and the password |

## Language and dates

The language switch is on the sign-in screen and in the side menu:

- English
- پښتو
- دری

Pashto and Dari run right to left.

In **Settings**, choose one date type. Every date on the desk then uses only that calendar, with its month names:

- Meladi
- Shamsi
- Hijri

Times follow the computer clock in 12-hour form.

## Partners

Settings holds exactly three partner names. Their investment percentages must add up to 100. Net profit is multiplied by each percentage.

## Where the records are

Washes, expenses, partners, and the sign-in secret stay in the `data` folder on that computer. Copy that folder when you want a backup. Those files are not part of this Git repository.

## Develop on this computer

```bash
npm install
npm run dev
```

Then open http://127.0.0.1:5173 and leave that window open.
