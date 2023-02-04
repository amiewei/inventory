const Collection = require("../models/collection");
const Snowboard = require("../models/snowboard");
const { body, validationResult } = require("express-validator");

const async = require("async");

exports.all_items = (req, res, next) => {
    async.parallel(
        {
            collection_count(callback) {
                Collection.countDocument({}, callback)
            }
        }
    ),

    (err, results) => {
        //passes data into index.pug to display data into html
        res.render("main", {
            title: 'Main Page',
            error: err,
            data: results,
        });
      }
}

exports.collection_list = (req, res, next) => {
    Collection.find({})
    .exec(function (err, results) {
      if (err) {
        console.log('error found')
        return next(err);
      }
      const list_collection = results.map(result => {
        console.log(result)
        return {name: result.name, description: result.description, gender: result.gender, url:result.url}
      });
    //   console.log(list_collection)
      console.log(list_collection[0].url)
        //passes data into index.pug to display data into html
        res.render("collection_list", {
            title: 'Current Collection!',
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

      collection_snowboards(callback) {
        Snowboard.find({ collections: req.params.id })
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
        let collection = results.collection.map(result => {
          return {
            name: result.name, 
            description: result.description, 
            gender: result.gender, 
            url:result.url
          }
        })

        let list_snowboard = results.collection_snowboards.map(result => {
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

        if (collection == null) {
          // No results.
          const err = new Error("Collection not found");
          err.status = 404;
          return next(err);
        }
        console.log('collection detail')
        console.log(collection)
        console.log(list_snowboard)
        // Successful, so render.
        res.render("collection_detail", {
          title: "Collection Detail",
          collection: collection[0],
          snowboard_list: list_snowboard
        });
    })
}