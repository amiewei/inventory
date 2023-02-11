const express = require('express');
const router = express.Router();

const mainItemsController = require("../controllers/mainItemsController");
const collectionController = require("../controllers/collectionController");
const snowboardController = require("../controllers/snowboardController");
const bootsController = require("../controllers/bootsController");
const bindingsController = require("../controllers/bindingsController");
const patternController = require("../controllers/patternController");

const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })

router.use(function(req, res, next) {
  console.log('check delete middlewhere')

  if ( req.originalUrl.includes("delete") && !req.originalUrl.includes("confirm-delete") && !req.originalUrl.includes("verified") ) {
    req.url = req.url + '/confirm-delete'
    res.redirect(req.url)

  } else if ( req.originalUrl.includes("delete/verified")) {

    console.log('verified - to change req method to delete')
    const lastIndex = req.url.lastIndexOf('/verified');
    const before = req.url.slice(0, lastIndex);
    
    // change the original METHOD into the DELETE method
    req.method = 'DELETE';
    req.url = before;
  }
  next(); 
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/allitems');
});

router.get('/allitems', mainItemsController.all_items);


router.get('/collection', collectionController.collection_list);

router.get('/collection/add', collectionController.collection_create_get);

router.post('/collection/add', collectionController.collection_create_post);

router.get("/collection/:id", collectionController.collection_detail);

router.get('/collection/:id/update', collectionController.collection_update_get);

router.post('/collection/:id/update', collectionController.collection_update_post);

router.delete('/collection/:id/delete', collectionController.collection_delete);



router.get('/snowboard', snowboardController.snowboard_list);

router.get('/snowboard/add', snowboardController.snowboard_create_get);

router.post('/snowboard/add', upload.single('image'), snowboardController.snowboard_create_post);

router.get("/snowboard/:id", snowboardController.snowboard_detail);

router.get('/snowboard/:id/update', snowboardController.snowboard_update_get);

//need to do upload here before the text. Cannot move upload into the controller even in the first middleware.
router.post('/snowboard/:id/update', upload.single('image'), snowboardController.snowboard_update_post);

router.delete('/snowboard/:id/delete', snowboardController.snowboard_delete);



router.get('/boots', bootsController.boots_list);

router.get('/boots/add', bootsController.boots_create_get);

router.post('/boots/add', bootsController.boots_create_post);

router.get("/boots/:id", bootsController.boots_detail);

router.get('/boots/:id/update', bootsController.boots_update_get);

router.post('/boots/:id/update', bootsController.boots_update_post);

router.delete('/boots/:id/delete', bootsController.boots_delete);



router.get('/bindings', bindingsController.bindings_list);

router.get('/bindings/add', bindingsController.bindings_create_get);

router.post('/bindings/add', bindingsController.bindings_create_post);

router.get("/bindings/:id", bindingsController.bindings_detail);

router.get('/bindings/:id/update', bindingsController.bindings_update_get);

router.post('/bindings/:id/update', bindingsController.bindings_update_post);

router.delete('/bindings/:id/delete', bindingsController.bindings_delete);



router.get('/pattern', patternController.pattern_list);

router.get('/pattern/add', patternController.pattern_create_get);

router.post('/pattern/add', patternController.pattern_create_post);

router.get("/pattern/:id", patternController.pattern_detail);

router.get('/pattern/:id/update', patternController.pattern_update_get);

router.post('/pattern/:id/update', patternController.pattern_update_post);

router.delete('/pattern/:id/delete', patternController.pattern_delete);


/* To confirm deletion - via passcode. */
router.get('*/confirm-delete', mainItemsController.del_confirmation_get);

router.post('*/confirm-delete', mainItemsController.del_confirmation_post);


module.exports = router;
