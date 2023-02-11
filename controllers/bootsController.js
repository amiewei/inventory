const Collection = require("../models/collection");
const Boots = require("../models/boots");
const { body, validationResult } = require("express-validator");

const async = require("async");


exports.boots_list = (req, res, next) => {
  console.log('display boots list')
  Boots.find({})
  .populate('collections')
  .exec(function (err, results) {
    if (err) {
      console.log('error found')
      return next(err);
    }
    console.log(results)

    let message, list_boots
    if (results.length > 0) {
        list_boots = results.map(result => {
            console.log(result)
            console.log(Array.isArray(result.collections))
            return { 
              name: result.name, 
              terrain: result.terrain, 
              collection_name: result.collections.length > 0 ? result.collections[0].name : "none",  //can only parse here, not in html
              stock: result.stock,
              price: result.price,
              url:result.url
            }
          });
        console.log(list_boots[0].collection_name)
        message = 'Shop For Our Latest'
    } else {
        message = 'No Boots In Inventory'
    }

  //   console.log(list_boots)
      //passes data into index.pug to display data into html
      res.render("boots_list", {
          title: 'Current Boots!',
          message,
          error: err,
          boots_list: list_boots,
      });
    });
}

exports.boots_create_get =  (req, res, next) => {

    async.parallel(
      {
        collection(callback) {
          Collection.find().exec(callback);
        },
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        const list_collection = results.collection.map(result => {
          console.log(result)
          return {
            name: result.name, 
            id: result._id, 
            url:result.url}
        });
  
        console.log(list_collection)
  
        res.render("boots_form", {
          title: "Create Boots",
          collection_list: list_collection,
        });
      }
    );
  }

  exports.boots_create_post = [
  
    body("name", "Boots name required")
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
    //   console.log(req.body)
  
      // Create a genre object with escaped and trimmed data.
      const boots = new Boots({ 
        name: req.body.name,
        terrain: req.body.terrain,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("boots_form", {
          title: "Create Boots",
          boots,
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Boots.findOne( {name: req.body.name} )
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
            boots.save((err) => {
              if (err) {
                return next(err);
              }
              console.log('saving boots')
              console.log(boots.url)
              // Genre saved. Redirect to genre detail page.
              res.redirect(boots.url);
            });
          }
        });
      }
    },
  ];
  
  exports.boots_detail =  (req, res, next) => {
    console.log('boots detail'),
    console.log(req.params.id)
  
    Boots.findById(req.params.id)
    // Boots.find({ _id: req.params.id })
      .populate("collections")
      .exec(
        function (err, results) {
          if (err) {
            // Error in API usage.
            return next(err);
          }
          console.log(results)
          let { 
            collections, 
            name, terrain, stock, price, url
          } = results
  
          let collection_list = collections.map(result => {
            return { 
              name: result.name, 
              description: result.description, 
              url:result.url,
              id: result._id
            }
          })
  
          if (name == null) {
            // No results.
            const err = new Error("Boots not found");
            err.status = 404;
            return next(err);
          }
  
          // Successful, so render.
          res.render("boots_detail", {
            title: "Boots Detail",
            collection_list: collection_list.length > 0 ? collection_list : null,
            name,
            terrain, 
            stock, 
            price,
            url
          });
      })
  }

exports.boots_update_get = (req, res, next) => {
    console.log('boots update get')
  
    async.parallel(
      {
        boots(callback) {
          Boots.findById(req.params.id)
          .populate('collections')
          .exec(callback);
        },
        collection(callback) {
          Collection.find().exec(callback);
        },
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        console.log(results)
        let boots = JSON.parse(JSON.stringify(results.boots));
  
        console.log(boots.collections)
        console.log(Array.isArray(boots.collections))
  
        let collection_list = results.collection.map(result => {
          return { 
            name: result.name, 
            description: result.description, 
            url:result.url,
            id: result._id
          }
        })
  
        if (results.boots.name == null) {
          // No results.
          const err = new Error("Boots not found");
          err.status = 404;
          return next(err);
        }
  
        console.log(boots.collections.length)
        console.log(boots.collections)
        // Successful, so render.
        res.render("boots_form", {
          title: "Update Boots",
          boots,
          collection_list: collection_list,
          collection_selected: boots.collections.length > 0 ? boots.collections[0] : null,
        });
      })
  }
  
  exports.boots_update_post = [
  
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
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      console.log(req.body)
  
      // Create a boots object with escaped/trimmed data and old id.
      const boots = new Boots({ 
        name: req.body.name,
        terrain: req.body.terrain,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });
  
      if (!errors.isEmpty()) {
        async.parallel(
          {
            boots(callback) {
              Boots.findById(req.params.id)
              .populate('collections')
              .exec(callback);
            },
            collection(callback) {
              Collection.find().exec(callback);
            },
          },
          (err, results) => {
            if (err) {
              return next(err);
            }
  
            console.log(results)
            let boots = JSON.parse(JSON.stringify(results.boots));
            console.log(boots.collections)

            let collection_list = results.collection.map(result => {
              return { 
                name: result.name, 
                description: result.description, 
                url:result.url
              }
            })

            res.render("boots_form", {
              title: "Update Boots",
              boots,
              collection_list: collection_list,
              collection_selected: boots.collections.length > 0 ? boots.collections[0] : null,
              errors: errors.array(),
            });
          }
        );
        return;
      }
  
      // Data from form is valid. Update the record.
      Boots.findByIdAndUpdate(req.params.id, boots, {}, (err, theboots) => {
        if (err) {
          return next(err);
        }
        // Successful: redirect to boots detail page.
        res.redirect(theboots.url);
      });
    },
  ];
  
  exports.boots_delete = (req, res) => {
    console.log('boots delete')
    console.log(req.params.id)
    async.parallel(
      {
        boots(callback) {
          Boots.findById(req.params.id).exec(callback);
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
  
        Boots.findByIdAndRemove(req.params.id, (err) => {
          if (err) {
            console.log('error found #2')
            return next(err);
          }
          // Success - go to bootss list
          console.log('redirecting to /bootss')
          res.redirect("/boots");
        });
      }
    );
  };