import express from "express";
import { verifyDinas } from "../middleware/Dinas.js";

import {
    getAllTentang,
    getTentangById,
    createTentang,
    updateTentang,
    deleteTentang
} from "../controllers/tentang.controller.js";

const router = express.Router();

router.get("/", getAllTentang);
router.get("/:id", getTentangById);
router.post("/", verifyDinas, createTentang);
router.put("/:id", verifyDinas, updateTentang);
router.delete("/:id", verifyDinas, deleteTentang);

export default router;