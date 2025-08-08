import express from "express";
import upload from "../config/multer.config.js";
import { verifyDinas } from '../middleware/Dinas.js';

import {
    createBanner,
    getAllBanner,
    getBannerById,
    updateBanner,
    deleteBanner,
    searchBanner
} from "../controllers/banner.controller.js";

const router = express.Router();

router.post("/", verifyDinas, upload.single('gambar'), createBanner);
router.get("/", getAllBanner);
router.get("/search", searchBanner);
router.get("/:id", getBannerById);
router.put("/:id", verifyDinas, upload.single('gambar'), updateBanner);
router.delete("/:id", verifyDinas, deleteBanner);

export default router;