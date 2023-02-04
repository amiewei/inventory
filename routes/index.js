var express = require('express');
var router = express.Router();

const collectionController = require("../controllers/collectionController");
const snowboardController = require("../controllers/snowboardController");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('../views/main', { title: 'Everyday is a Powder Day <p>❄️</p>' });
});


router.get('/collection', collectionController.collection_list);

router.get('/collection/add', collectionController.collection_create_get);

router.post('/collection/add', collectionController.collection_create_post);

router.get("/collection/:id", collectionController.collection_detail);

router.get("/allitems", collectionController.all_items);

router.get('/snowboard', snowboardController.snowboard_list);

router.get('/snowboard/add', snowboardController.snowboard_create_get);

router.post('/snowboard/add', snowboardController.snowboard_create_post);

router.get("/snowboard/:id", snowboardController.snowboard_detail);

module.exports = router;
