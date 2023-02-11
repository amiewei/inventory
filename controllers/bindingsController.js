const Collection = require("../models/collection");
const Bindings = require("../models/bindings");
const { body, validationResult } = require("express-validator");

const async = require("async");


exports.bindings_list = (req, res, next) => {
  console.log('display bindings list')
  Bindings.find()
  .populate('collections')
  .exec(function (err, results) {
    if (err) {
      console.log('error found')
      return next(err);
    }
    console.log(results)

    let message, list_bindings
    if (results.length > 0) {
        list_bindings = results.map(result => {
            console.log(result)
            console.log(Array.isArray(result.collections))
            return { 
              name: result.name, 
              size: result.size, 
              collection_name: result.collections.length > 0 ? result.collections[0].name : "none",  //can only parse here, not in html
              stock: result.stock,
              price: result.price,
              url:result.url
            }
          });
        console.log(list_bindings[0].collection_name)
        message = 'Shop For Our Latest'
    } else {
        message = 'No Bindings In Inventory'
    }

//   console.log(list_bindings)
    //passes data into index.pug to display data into html
  res.render("bindings_list", {
      title: 'Current Bindings!',
      message,
      error: err,
      bindings_list: list_bindings,
    });
  });
}

exports.bindings_create_get =  (req, res, next) => {

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
  
        res.render("bindings_form", {
          title: "Create Bindings",
          collection_list: list_collection,
        });
      }
    );
  }

  exports.bindings_create_post = [
  
    body("name", "Bindings name required")
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
      const bindings = new Bindings({ 
        name: req.body.name,
        size: req.body.size,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("bindings_form", {
          title: "Create Bindings",
          bindings,
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Bindings.findOne( {name: req.body.name} )
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
            bindings.save((err) => {
              if (err) {
                return next(err);
              }
              console.log('saving bindings')
              console.log(bindings.url)
              // Genre saved. Redirect to genre detail page.
              res.redirect(bindings.url);
            });
          }
        });
      }
    },
  ];
  
  exports.bindings_detail =  (req, res, next) => {
    console.log('bindings detail'),
    console.log(req.params.id)
  
    Bindings.findById(req.params.id)
    // Bindings.find({ _id: req.params.id })
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
            name, size, stock, price, url
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
            const err = new Error("Bindings not found");
            err.status = 404;
            return next(err);
          }
  
          // Successful, so render.
          res.render("bindings_detail", {
            title: "Bindings Detail",
            collection_list: collection_list.length > 0 ? collection_list : null,
            name,
            size, 
            stock, 
            price,
            url
          });
      })
  }

exports.bindings_update_get = (req, res, next) => {
    console.log('bindings update get')
  
    async.parallel(
      {
        bindings(callback) {
          Bindings.findById(req.params.id)
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
        let bindings = JSON.parse(JSON.stringify(results.bindings));
  
        console.log(bindings.collections)
        console.log(Array.isArray(bindings.collections))
  
        let collection_list = results.collection.map(result => {
          return { 
            name: result.name, 
            description: result.description, 
            url:result.url,
            id: result._id
          }
        })
  
        if (results.bindings.name == null) {
          // No results.
          const err = new Error("Bindings not found");
          err.status = 404;
          return next(err);
        }
  
        console.log(bindings.collections.length)
        console.log(bindings.collections)
        // Successful, so render.
        res.render("bindings_form", {
          title: "Update Bindings",
          bindings,
          collection_list: collection_list,
          collection_selected: bindings.collections.length > 0 ? bindings.collections[0] : null,
        });
      })
  }
  
  exports.bindings_update_post = [
  
    // Validate and sanitize fields.
    body("name", "Name must not be empty.")
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
  
      // Create a bindings object with escaped/trimmed data and old id.
      const bindings = new Bindings({ 
        name: req.body.name,
        size: req.body.size,
        collections: req.body.collections,
        stock: req.body.stock,
        price: req.body.price,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });
  
      if (!errors.isEmpty()) {
        async.parallel(
          {
            bindings(callback) {
              Bindings.findById(req.params.id)
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
            let bindings = JSON.parse(JSON.stringify(results.bindings));
            console.log(bindings.collections)

            let collection_list = results.collection.map(result => {
              return { 
                name: result.name, 
                description: result.description, 
                url:result.url
              }
            })

            res.render("bindings_form", {
              title: "Update Bindings",
              bindings,
              collection_list: collection_list,
              collection_selected: bindings.collections.length > 0 ? bindings.collections[0] : null,
              errors: errors.array(),
            });
          }
        );
        return;
      }
  
      // Data from form is valid. Update the record.
      Bindings.findByIdAndUpdate(req.params.id, bindings, {}, (err, thebindings) => {
        if (err) {
          return next(err);
        }
        // Successful: redirect to bindings detail page.
        res.redirect(thebindings.url);
      });
    },
  ];
  
  exports.bindings_delete = (req, res) => {
    console.log('bindings delete')
    console.log(req.params.id)
    async.parallel(
      {
        bindings(callback) {
          Bindings.findById(req.params.id).exec(callback);
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
  
        Bindings.findByIdAndRemove(req.params.id, (err) => {
          if (err) {
            console.log('error found #2')
            return next(err);
          }
          // Success - go to bindingss list
          console.log('redirecting to /bindingss')
          res.redirect("/bindings");
        });
      }
    );
  };