import express from "express";

const router = express.Router();

router.get("/", async (_request, response) => {
    response.sendStatus(200);
});

export default router;
