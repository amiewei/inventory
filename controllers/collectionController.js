const Collection = require("../models/collection");
const Snowboard = require("../models/snowboard");
const Boots = require("../models/boots");
const Bindings = require("../models/bindings");
const { body, validationResult } = require("express-validator");

const async = require("async");
const { json } = require("express");


exports.collection_list = (req, res, next) => {
    Collection.find({})
    .exec(function (err, results) {
      if (err) {
        console.log('error found')
        return next(err);
      }

      console.log(results.length)
      let list_collection;
      if (results.length > 0) {
          list_collection = results.map(result => {
          console.log(result)
          return {name: result.name, description: result.description, gender: result.gender, url:result.url}
        });
      //   console.log(list_collection)
        console.log(list_collection[0].url)
        message = 'Shop For Our Latest'
      } else {
        message = 'No Collections In Inventory'
      }
        //passes data into index.pug to display data into html
        res.render("collection_list", {
            title: 'Current Collections!',
            message,
            error: err,
            collection_list: list_collection,
        });
      });
}

exports.collection_create_get =  (req, res, next) => {
    res.render("collection_form", { title: "Create Collection" });
}

exports.collection_create_post = [
  
  body("name", "Collection name required")
  .trim()
  .isLength({ min: 1 })
  .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log(req.body)

    // Create a genre object with escaped and trimmed data.
    const collection = new Collection({ 
      name: req.body.name,
      description: req.body.description,
      gender: req.body.gender,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("collection_form", {
        title: "Create Collection",
        collection,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Collection.findOne( {name: req.body.name} )
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
          collection.save((err) => {
            if (err) {
              return next(err);
            }
            console.log('saving collection')
            console.log(collection.url)
            // Genre saved. Redirect to genre detail page.
            res.redirect(collection.url);
          });
        }
      });
    }
  },
];

exports.collection_detail =  (req, res, next) => {
  console.log('collection detail'),
  console.log(req.params.id)

  async.parallel(
    {
      collection(callback) {
        Collection.find({ _id: req.params.id }).exec(callback);
      },
      snowboard(callback) {
        Snowboard.find({ collections: req.params.id })
        .populate('collections')
        .exec(callback);
      },
      boots(callback) {
        Boots.find({ collections: req.params.id })
        .populate('collections')
        .exec(callback);
      },
      bindings(callback) {
        Bindings.find({ collections: req.params.id })
        .populate('collections')
        .exec(callback);
      },
    },
    (err, results) => {
        if (err) {
          // Error in API usage.
          return next(err);
        }
        console.log(results)
        // let { collection, snowboard } = JSON.parse(JSON.stringify(results));
        // console.log(collection)
        // console.log('snowboard.collections')
        // console.log(snowboard[0].collection[0].name)
        let collection = results.collection.map(result => {
          return {
            name: result.name, 
            description: result.description, 
            gender: result.gender, 
            url:result.url
          }
        })

        let list_snowboard = results.snowboard.map(result => {
          console.log(result)
          return { 
            name: result.name, 
            terrain: result.terrain, 
            riding_level: result.riding_level, 
            collection_name: result.collections[0].name,  //can only parse here, not in html
            stock: result.stock,
            price: result.price,
            url:result.url
          }
        });

        let list_boots = results.boots.map(result => {
          console.log(result)
          return { 
            ...result._doc,
            url:result.url
          }
        });

        let list_bindings = results.bindings.map(result => {
          console.log(result)
          return { 
            ...result._doc,
            url:result.url
          }
        });

        if (collection == null) {
          // No results.
          const err = new Error("Collection not found");
          err.status = 404;
          return next(err);
        }

        //evaluate if there's any gear in this collection
        let gear = true
        if (list_boots.length === 0 && list_snowboard.length === 0 && list_bindings.length === 0  ) {
          gear = false
        }

        console.log('collection detail')
        console.log(collection)
        console.log(list_bindings)
        // Successful, so render.
        res.render("collection_detail", {
          title: "Collection Detail",
          collection: collection[0],
          gear,
          snowboard_list: list_snowboard,
          boots_list: list_boots,
          bindings_list: list_bindings
        });
    })
}

exports.collection_update_get = (req, res, next) => {
  console.log('collection update get')

      Collection.findById(req.params.id)
        .exec((err, results) => {
        if (err) {
          return next(err);
        }
        console.log(results)
        let collection = JSON.parse(JSON.stringify(results));

        console.log(collection)

        if (results == null) {
          // No results.
          const err = new Error("Collection not found");
          err.status = 404;
          return next(err);
        }
        res.render("collection_form", {
          title: "Update Collection",
          collection,
        });
      })
}

exports.collection_update_post = [

  // Validate and sanitize fields.
  body("name", "name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("description", "description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log(req.body)

    // Create a collection object with escaped/trimmed data and old id.
    const collection = new Collection({ 
      name: req.body.name,
      description: req.body.description,
      gender: req.body.gender,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
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

          console.log(results)
          let collection = JSON.parse(JSON.stringify(results.collection));
    
          console.log(collection.collections)
          // console.log(Array.isArray(collection.collections))
    
          console.log(errors.array())

          res.render("collection_form", {
            title: "Create Collection",
            collection,
            errors: errors.array(),
          });
        }
      );
      return;
    }

    // Data from form is valid. Update the record.
    Collection.findByIdAndUpdate(req.params.id, collection, {}, (err, thecollection) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to collection detail page.
      res.redirect(thecollection.url);
    });
  },
];

exports.collection_delete = (req, res, next) => {
  console.log('collection delete')
  console.log(req.params.id)
  async.parallel(
    {
      collection(callback) {
        Collection.findById(req.params.id).exec(callback);
      },
      snowboard(callback) {
        Snowboard.find({collections: req.params.id})
        .populate('collections')
        .exec(callback)
      },
      boots(callback) {
        Boots.find({ collections: req.params.id })
        .populate('collections')
        .exec(callback);
      },
      bindings(callback) {
        Bindings.find({ collections: req.params.id })
        .populate('collections')
        .exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        console.log('error found #1')
        return next(err);
      }

      console.log(results)
      let { collection } = JSON.parse(JSON.stringify(results));

      //json.stringify cannot return the virtual url, so need to map it
      let list_snowboard = results.snowboard.map(result => {
        // console.log(result)
        return { 
          ...result._doc,
          url:result.url
        }
      });

      let list_boots = results.boots.map(result => {
        console.log(result)
        return { 
          ...result._doc,
          url:result.url
        }
      });

      let list_bindings = results.bindings.map(result => {
        console.log(result)
        return { 
          ...result._doc,
          url:result.url
        }
      });

      if (collection == null) {
        // No results.
        const err = new Error("Collection not found");
        err.status = 404;
        return next(err);
      }

      console.log(collection)
      console.log(list_snowboard)
      console.log(list_boots)
      console.log(list_boots.length === 0 )
      console.log(list_snowboard.length === 0 )
      console.log('snowboard.collections')

      //evaluate if there's any gear in this collection
      
      let gear = true;
      if (list_boots.length > 0 || list_snowboard.length > 0) {
        console.log('cannot delete collection - still has snowboards')
        // collection has snowboards. need to delete them firstRender in same way as for GET route.
        // res.redirect("/collection/" + req.params.id);
        // res.redirect('/')
        res.render("collection_detail", {
          title: "Collection Detail",
          message: "Cannot Delete Collection: You Must Delete All Items in Collection First",
          collection,
          gear,
          boots_list: list_boots,
          snowboard_list: list_snowboard,
          bindings_list: list_bindings
        });
        return;
      }
      // Success
      console.log('req body in POST delete')
      console.log(req.params.id)

      Collection.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
          console.log('error found #2')
          return next(err);
        }
        // Success - go to collections list
        console.log('redirecting to /collections')
        res.redirect("/collection");
      });
    }
  );
};