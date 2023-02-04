const Collection = require("../models/collection");
const Snowboard = require("../models/snowboard");
const { body, validationResult } = require("express-validator");

const async = require("async");


exports.snowboard_list = (req, res, next) => {
  console.log('display snowboard list')
  Snowboard.find({})
  .populate('collections')
  .exec(function (err, results) {
    if (err) {
      console.log('error found')
      return next(err);
    }
    const list_snowboard = results.map(result => {
      console.log(result)
      return { 
        name: result.name, 
        terrain: result.terrain, 
        riding_level: result.riding_level, 
        collection_name: results.collections ? result.collections[0].name : "",  //can only parse here, not in html
        stock: result.stock,
        price: result.price,
        url:result.url
      }
    });
  //   console.log(list_snowboard)
    console.log(list_snowboard[0].url)
      //passes data into index.pug to display data into html
      res.render("snowboard_list", {
          title: 'Current Snowboard!',
          error: err,
          snowboard_list: list_snowboard,
      });
    });
}

exports.snowboard_create_get =  (req, res, next) => {

  async.parallel(
    {
      collection(callback) {
        Collection.find(callback);
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

      console.log(list_collection)

      res.render("snowboard_form", {
        title: "Create Snowboard",
        collection_list: list_collection,
      });
    }
  );
}

exports.snowboard_create_post = [
  
  body("name", "Snowboard name required")
  .trim()
  .isLength({ min: 1 })
  .escape(),
  // body("terrain.*")
  // .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    console.log(req.body)

    // Create a genre object with escaped and trimmed data.
    const snowboard = new Snowboard({ 
      name: req.body.name,
      terrain: req.body.terrain,
      riding_level: req.body.riding_level,
      collections: req.body.collections,
      stock: req.body.stock,
      price: req.body.price,
    });

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
            console.log(snowboard.url)
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

  Snowboard.find({ _id: req.params.id })
    .populate("collections")
    .exec(
      function (err, results) {
        if (err) {
          // Error in API usage.
          return next(err);
        }
        console.log(results)
        let snowboard = results.map(result => {
          return { 
            name: result.name, 
            terrain: result.terrain, 
            riding_level: result.riding_level, 
            stock: result.stock,
            price: result.price,
            url:result.url
          }
        })
        // let collection = results.map(result => {
        //   return { 
        //     name: result.name, 
        //     terrain: result.terrain, 
        //     riding_level: result.riding_level, 
        //     stock: result.stock,
        //     price: result.price,
        //     url:result.url
        //   }
        // })


        if (snowboard == null) {
          // No results.
          const err = new Error("Snowboard not found");
          err.status = 404;
          return next(err);
        }
        console.log(snowboard)
        // Successful, so render.
        res.render("snowboard_detail", {
          title: "Snowboard Detail",
          snowboard: snowboard[0],
        });
    })
}