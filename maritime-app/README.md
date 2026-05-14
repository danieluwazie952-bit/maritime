# Department of Maritime Transport and Logistics

Full-stack web application for student registration, payments, and document management.

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express + MongoDB
- **Payments:** Flutterwave API
- **Auth:** JWT + bcrypt
- **Email:** Nodemailer (Gmail SMTP)
- **PDF:** pdf-lib (generate) + pdf-parse (extract)

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MongoDB URI, Flutterwave keys, Gmail App Password
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Access
| Role | Route | Credentials |
|------|-------|-------------|
| Student | `/login` | Register then verify email |
| Admin | `/admin` | Email + Password + Key: `maritime@trans&logis12y37` |
| Super Admin | `/super-dev-access` | Password: `Daniel@111` |

## Auto Push to GitHub
1. Create a repo on [github.com](https://github.com)
2. Go to **Settings → Secrets → Actions → New secret**. Name it `GH_TOKEN`. Paste your GitHub Personal Access Token.
3. Run:
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```
After this, every push auto-syncs to GitHub via the Actions workflow.

## Environment Variables
See `.env.example` for all required variables. Never commit `.env` to git.

## Creating an Admin Account
Use MongoDB Compass or a seed script to insert a user with `role: "admin"` and a bcrypt-hashed password.
