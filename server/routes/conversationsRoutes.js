const router = require('express').Router();
const ctrl = require('../controllers/conversationsController');

router.post("/", ctrl.createConversations);

router.get("/:userId", ctrl.getConversations);

router.get("/messages/:conversationId", ctrl.getMessages);
router.delete('/:conversationId', ctrl.deleteConversation);

module.exports = router;