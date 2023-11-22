const router = require("express").Router();

const {
  addOneFileForAi,
  processOneQueryFromAi,
} = require("../controllers/aiController");

router.post("/ai/create", addOneFileForAi);
router.get("/ai/ask", processOneQueryFromAi);

module.exports = router;
