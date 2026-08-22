# BillingPro - Complete Billing & Invoice Management System

BillingPro is a modern, responsive, and production-ready web application built for small-to-medium trading businesses. It allows you to efficiently manage customers, track products, create customized bills, and monitor your sales turnover—all from a sleek, intuitive dashboard.

## 🚀 Features

- **Authentication & Security**: Secure login and registration powered by Firebase Authentication.
- **Dashboard Analytics**: Real-time tracking of Today's Sales, This Month's Sales, Total Turnover, and Total Bills.
- **Create & Print Invoices**: Generate professional invoices with automatic tax, discount, and grand total calculations. 
- **Print & PDF Support**: Print bills directly or download them as perfectly formatted A4 PDFs. Number-to-Words conversion is built right into the invoice.
- **Customer Management**: Save regular customers (Shop Name, Address, Phone) to auto-fill details during billing, speeding up the checkout process.
- **Product Management**: Maintain a catalog of products to easily fetch prices and details.
- **Company Settings**: Customize your invoice headers, shop name, address, and terms & conditions.
- **Progressive Web App (PWA)**: Installable on Desktop, Android, and iOS devices for a native app experience. Works perfectly across all screen sizes.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), TypeScript
- **Styling**: Vanilla CSS Modules (Modern, responsive, print-optimized)
- **Backend/Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **PDF Generation**: html2canvas & jsPDF
- **Icons**: Lucide React

## 📦 Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MalajiGopiChand/BillingSoftware.git
   cd BillingSoftware
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Firebase Setup:**
   Ensure you have your Firebase project configured. The `src/firebase.ts` file must contain your Firebase config. Firestore requires the following collections:
   - `users`
   - `invoices`
   - `products`
   - `customers`
   - `company_settings`

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view it in the browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

## 📱 PWA / Mobile Installation

To install this application on your mobile device or desktop as a native app:
1. Deploy the `dist/` folder to an HTTPS server (like Firebase Hosting, Vercel, or Netlify).
2. Visit the live URL on your device.
3. Click "Install App" in your Chrome address bar (Desktop) or select "Add to Home Screen" on your mobile browser (Android/iOS).

## 🔒 Firebase Security Rules

To secure your Firestore database, ensure your rules allow only authenticated users to read and write. A `firestore.rules` file is included in this repository. Deploy it using:
```bash
firebase deploy --only firestore:rules
```

---
*Designed for fast, secure, and professional trading business management.*
