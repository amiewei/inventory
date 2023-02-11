const Collection = require("../models/collection");
const Snowboard = require("../models/snowboard");
const Pattern = require("../models/pattern");
const { body, validationResult } = require("express-validator");

const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })

const async = require("async");

exports.snowboard_list = (req, res, next) => {

  Snowboard.find()
    .populate('collections')
    .populate('pattern')
    .exec(function (err, results) {
      if (err) {
        console.log('error found')
        return next(err);
      }

    let list_snowboard;
    if (results.length > 0) {
        list_snowboard = results.map(result => {
          console.log(result)
          console.log('patterns:')
          //somehow need to extracted nested loop here. can't seem to extract in html handlebars
          let patterns = result.pattern.map(result => result.name)
          let collections = result.collections.map(result => result.name)
          console.log(patterns)
          // console.log(Array.isArray(result.collections))
          return { 
            name: result.name, 
            terrain: result.terrain, 
            riding_level: result.riding_level, 
            pattern: patterns,
            collection: collections,
            stock: result.stock,
            price: result.price,
            url:result.url
          }
        });
        // console.log(list_snowboard[0].collection_name)
        message = 'Shop For Our Latest'
    } else {
        message = 'No Snowboards In Inventory'
    }

    console.log(list_snowboard)
    //passes data into index.pug to display data into html
    res.render("snowboard_list", {
        title: 'Current Snowboards!',
        error: err,
        message,
        snowboard_list: list_snowboard,
    });
  });
}

exports.snowboard_create_get =  (req, res, next) => {

  async.parallel(
    {
      collection(callback) {
        Collection.find().exec(callback);
      },
      pattern(callback) {
        Pattern.find().exec(callback);
      },
      
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const list_collection = results.collection.map(result => {
        console.log(result)
        return {name: result.name, id: result._id, url:result.url}
      });
      const list_pattern = results.pattern.map(result => {
        console.log(result)
        return {name: result.name, id: result._id, url:result.url}
      });

      // console.log(list_collection)

      res.render("snowboard_form", {
        title: "Create Snowboard",
        collection_list: list_collection,
        pattern_list: list_pattern,
      });
    }
  );
}

exports.snowboard_create_post = [
  
  body("name", "Snowboard name required")
  .trim()
  .isLength({ min: 1 })
  .escape(),
  body("stock", "Stock must not be empty.")
  .trim()
  .isInt({ min: 0, max: 1000 })
  .escape(),
  body("price", "Price must be numeric and above 200.")
  .trim()
  .isNumeric()
  .isFloat({ min: 200, max: 2000 })
  .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // console.log(req.body)
    console.log(req.file)
    let snowboard;
    if (req.file) {
      snowboard = new Snowboard({ 
        name: req.body.name,
        terrain: req.body.terrain,
        riding_level: req.body.riding_level,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
        pattern: req.body.pattern,
        image: req.file.filename,
      });
    } else {
      // Create a snowboard object with escaped/trimmed data and old id.
      snowboard = new Snowboard({ 
        name: req.body.name,
        terrain: req.body.terrain,
        riding_level: req.body.riding_level,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
        pattern: req.body.pattern,
      });
    }


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("snowboard_form", {
        title: "Create Snowboard",
        snowboard,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Snowboard.findOne( {name: req.body.name} )
        .exec((err, result) => {
        if (err) {
          return next(err);
        }
        console.log(result)

        if (result) {
          // Genre exists, redirect to its detail page.
          console.log('result exists. redirecting to' + result.url)
          res.redirect(result.url);
        } else {
          snowboard.save((err) => {
            if (err) {
              return next(err);
            }
            console.log('saving snowboard')
            // console.log(snowboard.url)
            // Genre saved. Redirect to genre detail page.
            res.redirect(snowboard.url);
          });
        }
      });
    }
  },
];

exports.snowboard_detail =  (req, res, next) => {
  console.log('snowboard detail'),
  console.log(req.params.id)

  Snowboard.findById(req.params.id)
  // Snowboard.find({ _id: req.params.id })
    .populate("collections")
    .populate("pattern")
    .exec(
      function (err, results) {
        if (err) {
          // Error in API usage.
          return next(err);
        }
        // console.log(results)
        let { 
          collections, pattern,
          name, terrain, riding_level, stock, price, url, image
        } = results

        let collection_list = collections.map(result => {
          return { 
            name: result.name, 
            description: result.description, 
            url:result.url,
            id: result._id
          }
        })

        let pattern_list = pattern.map(result => {
          return { 
            name: result.name, 
            description: result.description, 
            url:result.url,
            id: result._id
          }
        })

        if (name == null) {
          // No results.
          const err = new Error("Snowboard not found");
          err.status = 404;
          return next(err);
        }

        // Successful, so render.
        res.render("snowboard_detail", {
          title: "Snowboard Detail",
          collection_list: collection_list.length > 0 ? collection_list : null,
          pattern_list: pattern_list.length > 0 ? pattern_list : null,
          name,
          terrain, 
          riding_level, 
          stock, 
          price,
          image,
          url
        });
    })
}

// Display Genre update form on GET.
exports.snowboard_update_get = (req, res, next) => {
  console.log('snowboard update get')

  async.parallel(
    {
      snowboard(callback) {
        Snowboard.findById(req.params.id)
        .populate('collections')
        .populate('pattern')
        .exec(callback);
      },
      collection(callback) {
        Collection.find().exec(callback);
      },
      all_pattern_options(callback) {
        Pattern.find().exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      console.log(results)
      let snowboard = JSON.parse(JSON.stringify(results.snowboard));
      console.log(snowboard.image)

      // console.log(snowboard.collections)
      // console.log(Array.isArray(snowboard.collections))
      if (results.snowboard.name == null) {
        // No results.
        const err = new Error("Snowboard not found");
        err.status = 404;
        return next(err);
      }

      let collection_list = results.collection.map(result => {
        return { 
          name: result.name, 
          description: result.description, 
          url:result.url,
          id: result._id
        }
      })

      let all_pattern_options = results.all_pattern_options.map(result => {
        return { 
          name: result.name, 
          description: result.description, 
          url:result.url,
          id: result._id
        }
      })

      for (const pattern of all_pattern_options) {
        // console.log(pattern.id)
        console.log(snowboard.pattern)
        for (const snowboard_pattern of snowboard.pattern) {
            if(snowboard_pattern._id === pattern.id.toString()) {
              console.log(snowboard.name + 'includes pattern')
              pattern.checked = "true";
            }
        }
      }
      // Successful, so render.
      res.render("snowboard_form", {
        title: "Update Snowboard",
        snowboard,
        collection_list,
        collection_selected: snowboard.collections.length > 0 ? snowboard.collections[0] : null,
        pattern_list: all_pattern_options,
      });
    })
}

exports.snowboard_update_post = [

  // Validate and sanitize fields.
  body("name", "name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("stock", "Stock must not be empty.")
    .trim()
    .isInt({ min: 0, max: 1000 })
    .escape(),
  body("price", "Price must be numeric and above 200.")
    .trim()
    .isNumeric()
    .isFloat({ min: 200, max: 2000 })
    .escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    console.log('snowboard_update_post #1')
    // upload.single('image')
    console.log(req.file, req.body)
    next()
  },
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log('snowboard_update_post #2')
    console.log(req.body)
    console.log('filename:' + req.file)

    let snowboard;
    if (req.file) {
      snowboard = new Snowboard({ 
        name: req.body.name,
        terrain: req.body.terrain,
        riding_level: req.body.riding_level,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
        pattern: req.body.pattern,
        image: req.file.filename,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });
    } else {
      // Create a snowboard object with escaped/trimmed data and old id.
      snowboard = new Snowboard({ 
        name: req.body.name,
        terrain: req.body.terrain,
        riding_level: req.body.riding_level,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
        pattern: req.body.pattern,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });
    }

    if (!errors.isEmpty()) {
      async.parallel(
        {
          snowboard(callback) {
            Snowboard.findById(req.params.id)
            .populate('collections')
            .populate('pattern')
            .exec(callback);
          },
          collection(callback) {
            Collection.find().exec(callback);
          },
          pattern(callback) {
            Pattern.find().exec(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          console.log(results)
          let snowboard = JSON.parse(JSON.stringify(results.snowboard));
    
          console.log(snowboard.collections)
          // console.log(Array.isArray(snowboard.collections))
    
          let collection_list = results.collection.map(result => {
            return { 
              name: result.name, 
              description: result.description, 
              url:result.url
            }
          })
          let pattern_list = results.pattern.map(result => {
            return { 
              name: result.name, 
              description: result.description, 
              url:result.url
            }
          })
          console.log(errors.array())

          res.render("snowboard_form", {
            title: "Update Snowboard",
            snowboard,
            collection_list,
            pattern_list,
            collection_selected: snowboard.collections.length > 0 ? snowboard.collections[0] : null,
            pattern_selected: snowboard.pattern.length > 0 ? snowboard.pattern[0] : null,
            errors: errors.array(),
          });
        }
      );
      return;
    }

    // Data from form is valid. Update the record.
    Snowboard.findByIdAndUpdate(req.params.id, snowboard, {}, (err, thesnowboard) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to snowboard detail page.
      res.redirect(thesnowboard.url);
    });
  },
];

exports.snowboard_delete = (req, res) => {
  console.log('snowboard delete')
  console.log(req.params.id)
  async.parallel(
    {
      snowboard(callback) {
        Snowboard.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        console.log('error found #1')
        return next(err);
      }
      // Success
      console.log('req body in POST delete')
      console.log(req.params.id)

      Snowboard.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
          console.log('error found #2')
          return next(err);
        }
        // Success - go to snowboards list
        console.log('redirecting to /snowboards')
        res.redirect("/snowboard");
      });
    }
  );
};