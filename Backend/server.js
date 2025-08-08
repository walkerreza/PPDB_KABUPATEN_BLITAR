import express from "express";
import cors from "cors";
import db from "./config/db.config.js";
import dotenv from 'dotenv';

// Konfigurasi dotenv
dotenv.config();

// Import model-model
import Banner from "./models/banner.model.js";
import JadwalPendaftaran from "./models/jadwal_pendaftaran.model.js";
import Tentang from "./models/tentang.model.js";
import JalurPendaftaran from "./models/jalur_pendaftaran.model.js";
import NewsTicker from "./models/news_ticker.model.js";
import Informasi from "./models/informasi.model.js";
import JenisKelamin from "./models/jenis_kelamin.model.js";
import GrupUser from "./models/grup_user.model.js";
import Provinsi from "./models/provinsi.model.js";
import KabupatenKota from "./models/kabupaten_kota.model.js";
import Kecamatan from "./models/kecamatan.model.js";
import Kelurahan from "./models/kelurahan.model.js";
import User from "./models/user.model.js";
import SessionUser from "./models/session_user.model.js";
import TipeSekolah from "./models/tipe_sekolah.model.js";
import Sekolah from "./models/sekolah.model.js";
import Pendaftaran from "./models/pendaftaran.model.js";
import DataPenduduk from "./models/data_penduduk.model.js";
import Dapodik from "./models/dapodik.model.js";

// Import routes
import bannerRoutes from "./routes/banner.route.js";
import jadwalRoutes from "./routes/jadwal_pendaftaran.route.js";
import tentangRoutes from "./routes/tentang.route.js";
import jalurPendaftaranRoutes from "./routes/jalur_pendaftaran.route.js";
import newsTickerRoutes from "./routes/news_ticker.route.js";
import informasiRoutes from "./routes/informasi.route.js";
import jenisKelaminRoutes from "./routes/jenis_kelamin.route.js";


// Import routes user
import grupUserRoutes from "./routes/grup_user.route.js";
import userRoutes from "./routes/user.route.js";
import sessionUserRoutes from "./routes/session_user.route.js";
import loginRoutes from "./routes/login.route.js";

// Import routes pendaftaran
import pendaftaranRoutes from "./routes/pendaftaran.route.js";

// Import routes sekolah
import tipeSekolahRoutes from "./routes/tipe_sekolah.route.js";
import sekolahRoutes from "./routes/sekolah.route.js";

// Import routes wilayah
import provinsiRoutes from "./routes/provinsi.route.js";
import kabupatenKotaRoutes from "./routes/kabupaten_kota.route.js";
import kecamatanRoutes from "./routes/kecamatan.route.js";
import kelurahanRoutes from "./routes/kelurahan.route.js";

import dataPendudukRoutes from "./routes/data_penduduk.route.js"
import dapodikRoutes from "./routes/dapodik.route.js";

const app = express();

// Konfigurasi CORS
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static file middleware - letakkan sebelum route API
app.use('/content', express.static('content')); // akses gambar via /content/images/...

// Route API halaman depan
app.use("/api/banner", bannerRoutes);
app.use("/api/jadwal-pendaftaran", jadwalRoutes);
app.use("/api/tentang", tentangRoutes);
app.use("/api/jalur-pendaftaran", jalurPendaftaranRoutes);
app.use("/api/news-ticker", newsTickerRoutes);
app.use("/api/informasi", informasiRoutes);
app.use("/api/jenis-kelamin", jenisKelaminRoutes);
app.use("/api/grup-user", grupUserRoutes);
app.use("/api/user", userRoutes);
app.use("/api/session-user", sessionUserRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/tipe-sekolah", tipeSekolahRoutes);
app.use("/api/sekolah", sekolahRoutes);
app.use("/api/pendaftaran", pendaftaranRoutes);

// Route API Wilayah
app.use("/api/provinsi", provinsiRoutes);
app.use("/api/kabupaten-kota", kabupatenKotaRoutes);
app.use("/api/kecamatan", kecamatanRoutes);
app.use("/api/kelurahan", kelurahanRoutes);
app.use("/api/data-penduduk", dataPendudukRoutes);
app.use("/api/dapodik", dapodikRoutes);

app.get("/", (req, res) => {
    res.send("API is working!");
});

// Sinkronisasi database dan model
db.authenticate()
    .then(() => {
        console.log("Database connected");
        return db.sync({ alter: true });
    })
    .then(() => {
        console.log("Database synchronized");
    })
    .catch((err) => console.log("Error:", err));

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server URL: ${BASE_URL}`);
});