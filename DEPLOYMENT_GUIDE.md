# AgriNova AI — Cloud Deployment Guide

This guide details how to deploy **AgriNova AI**:
- **Frontend** on **Vercel**
- **Database & Media Storage** on **Supabase**
- **FastAPI AI Backend** on **Render** (or **Railway**)

---

## 1. Database & Media Storage Setup on Supabase

> **Note:** Supabase is a managed PostgreSQL database and cloud storage provider. Your FastAPI Python backend will connect to Supabase for all persistent records and leaf photos.

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and log in.
   - Click **New Project** and name it `agrinova-ai`.
   - Save your database password securely.

2. **Run Database Migrations**:
   - In your Supabase project dashboard, open the **SQL Editor** tab on the left menu.
   - Open [`supabase/migration.sql`](./supabase/migration.sql) from this repository.
   - Copy its entire contents, paste into the Supabase SQL Editor, and click **Run**.
   - This creates all required tables (`farms`, `reports`, `analysis_results`, `officer_tickets`, `outbreaks`, `notifications`, `field_visits`, `lab_requests`, `ai_feedback`).

3. **Verify Storage Bucket**:
   - Go to **Storage** in the Supabase dashboard.
   - Verify that the `crop-images` bucket exists and is set to **Public** (so uploaded leaf images can be viewed in reports).

4. **Collect Supabase Credentials**:
   - Go to **Project Settings** -> **API**:
     - **Project URL** (`https://<project-ref>.supabase.co`)
     - **Project API Keys** -> `anon` public key (or `service_role` key)
   - Go to **Project Settings** -> **Database** -> **Connection string** (URI format):
     - `postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres`

---

## 2. Backend Deployment on Render (Free & Fast)

> Because the backend runs Python 3.11 with PyTorch, OpenCV, and FastAPI, it requires a Python/Docker container runtime. Render provides a free cloud container service that connects directly to your GitHub repo.

1. **Sign Up / Log in to Render**:
   - Go to [render.com](https://render.com).

2. **Deploy via GitHub**:
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository (`IT24101739/AgriNova_AI`).
   - Configure the following settings:
     - **Name**: `agrinova-ai-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Docker` (or `Python 3`)
     - **Build Command**: `pip install -r requirements.txt` (if using Python environment)
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Or simply choose **Docker** to use the provided [`backend/Dockerfile`](./backend/Dockerfile).

3. **Add Environment Variables in Render**:
   In the **Environment** section of your Render Web Service, add:
   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | `https://<your-project>.supabase.co` |
   | `SUPABASE_KEY` | `<your-supabase-anon-or-service-key>` |
   | `DATABASE_URL` | `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres` |
   | `GEMINI_API_KEY` | `<your-google-gemini-api-key>` |
   | `JWT_SECRET` | `<any-random-32-character-secret>` |
   | `ENVIRONMENT` | `production` |

4. **Deploy**:
   - Click **Create Web Service**.
   - Render will build and deploy the backend. Once ready, copy your backend URL:
     `https://agrinova-ai-backend.onrender.com`

---

## 3. Frontend Deployment on Vercel

1. **Sign Up / Log in to Vercel**:
   - Go to [vercel.com](https://vercel.com).

2. **Import Repository**:
   - Click **Add New...** -> **Project**.
   - Select `IT24101739/AgriNova_AI`.

3. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables in Vercel**:
   In the **Environment Variables** section, add:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://agrinova-ai-backend.onrender.com` | Your deployed backend URL (no trailing slash) |
   | `VITE_API_URL` | `https://agrinova-ai-backend.onrender.com` | Redundant fallback for API services |

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will install dependencies, run the Vite build, and deploy your live frontend.
   - Your frontend will be live at `https://agrinova-ai.vercel.app`!
