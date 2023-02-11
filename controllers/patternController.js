const Snowboard = require("../models/snowboard");
const Pattern = require("../models/pattern");
const { body, validationResult } = require("express-validator");

const async = require("async");


exports.pattern_list = (req, res, next) => {
  console.log('display pattern list')
  Pattern.find()
  .exec(function (err, results) {
    if (err) {
      console.log('error found')
      return next(err);
    }
    console.log(results)

    let message, list_pattern
    if (results.length > 0) {
        list_pattern = results.map(result => {
            console.log(result)
            console.log(Array.isArray(result.snowboards))
            return { 
              name: result.name, 
              description: result.description,
              url:result.url
            }
          });
        // console.log(list_pattern[0].snowboard_name)
        message = 'Shop For Our Latest'
    } else {
        message = 'No Pattern In Inventory'
    }

//   console.log(list_pattern)
    //passes data into index.pug to display data into html
  res.render("pattern_list", {
      title: 'Current Pattern!',
      message,
      error: err,
      pattern_list: list_pattern,
    });
  });
}

exports.pattern_create_get =  (req, res, next) => {

    async.parallel(
      {
        snowboard(callback) {
          Snowboard.find().exec(callback);
        },
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        const list_snowboard = results.snowboard.map(result => {
          console.log(result)
          return {
            ...result._doc,
            url:result.url}
        });
  
        console.log(list_snowboard)
  
        res.render("pattern_form", {
          title: "Create Pattern",
          snowboard_list: list_snowboard,
        });
      }
    );
  }

  exports.pattern_create_post = [

    //selected snowboards as array
    (req, res, next) => {
        console.log('pattern create post')
        if (!Array.isArray(req.body.snowboards)) {
            req.body.snowboards =
            typeof req.body.snowboards === "undefined" ? [] : [req.body.snowboards];
        }
        next();
        },
  
    body("name", "Pattern name required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
    body("description", "Pattern description required")
    .trim()
    .isLength({ min: 1 })
    .escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      console.log(req.body)
  
      // Create a genre object with escaped and trimmed data.
      const pattern = new Pattern({ 
        name: req.body.name,
        description: req.body.description,
      });
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("pattern_form", {
          title: "Create Pattern",
          pattern,
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid.
        // Check if pattern with same name already exists.
        Pattern.findOne( {name: req.body.name} )
          .exec((err, result) => {
          if (err) {
            return next(err);
          }
          console.log(result)
  
          if (result) {
                // Pattern exists, redirect to its detail page.
                console.log('result exists. No save made. redirecting to' + result.url)
                res.redirect(result.url);
          } else {
            pattern.save((err) => {
                if (err) {
                    return next(err);
                }
                console.log('saving pattern')
                console.log(pattern._id)
            
                //loop through selected snowboards and update one by one 
                console.log(req.body.snowboards.length)
                if (req.body.snowboards.length > 0) {
                    for (let snowboardid of req.body.snowboards) {
                        console.log(snowboardid)
                        console.log(pattern._id)
                        const conditions = {
                            _id: snowboardid
                        };
                    
                        //addtoset will make sure there are no duplicates when adding
                        const update_snowboard_pattern = { $addToSet: { pattern: pattern } }
                        console.log('conditions')
                        console.log(conditions)
                        console.log('update snowboard pattern')
                        console.log(update_snowboard_pattern)
                        Snowboard.findByIdAndUpdate(conditions, update_snowboard_pattern, function (error, success) {
                            console.log('adding pattern to snowboard')
                            if (error) {
                                // console.log(error);
                                next(error)
                            } else {
                                console.log('success')
                                console.log(success);
                            }
                        })
                    }
                }

              // Genre saved. Redirect to genre detail page.
              res.redirect(pattern.url);
            });
          }
        });
      }
    },
  ];
  
  exports.pattern_detail =  (req, res, next) => {
    console.log('pattern detail'),
    console.log(req.params.id)
  
    async.parallel(
        {
            //all snowboards with this pattern
          snowboards(callback) {
            Snowboard.find({pattern: req.params.id})
            .exec(callback);
          },
        // pattern info
          pattern(callback) {
            Pattern.findById(req.params.id)
              .exec(callback)
          }
        },
        (err, results) => {
          if (err) {
            // Error in API usage.
            return next(err);
          }
          console.log(results)
          let { 
            snowboards,
            pattern
          } = results
  
          let snowboard_list = snowboards.map(result => {
            return { 
              name: result.name, 
              description: result.description,
              url:result.url,
              id: result._id
            }
          })

          let { name, description, url } = pattern

  
          if (pattern == null) {
            // No results.
            const err = new Error("Pattern not found");
            err.status = 404;
            return next(err);
          }
  
          // Successful, so render.
          res.render("pattern_detail", {
            title: "Pattern Detail",
            snowboard_list: snowboard_list.length > 0 ? snowboard_list : null,
            name,
            description,
            url,
          });
      })
  }

exports.pattern_update_get = (req, res, next) => {
    console.log('pattern update get')

    //update pattern detail as well as associate snowboards here
    async.parallel(
      {
        pattern(callback) {
          Pattern.findById(req.params.id)
          .exec(callback);
        },
        all_snowboard_options(callback) {
            Snowboard.find()
            .exec(callback);
        },
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        console.log(results)
        let pattern = JSON.parse(JSON.stringify(results.pattern));

        console.log ('results.pattern _id: ' + results.pattern._id)

  
        let all_snowboard_options = results.all_snowboard_options.map(result => {
          return { 
            ...result._doc,
            _id: result._id
          }
        })

        for (const snowboard of all_snowboard_options) {
            if (snowboard.pattern.includes(results.pattern._id)) {
                console.log(snowboard.name + 'includes pattern')
                snowboard.checked = "true";
            }
        }

        if (results.pattern.name == null) {
          // No results.
          const err = new Error("Pattern not found");
          err.status = 404;
          return next(err);
        }
  
        console.log(pattern)
        console.log(all_snowboard_options)
        // Successful, so render.
        res.render("pattern_form", {
          title: "Update Pattern",
          pattern,
          snowboard_list: all_snowboard_options,
        });
      })
  }
  
  exports.pattern_update_post = [
    // console.log('pattern update post'),

    //selected snowboards as array
    (req, res, next) => {
        console.log('checked snowboards')
        console.log(req.body.snowboards)
        if (!Array.isArray(req.body.snowboards)) {
          req.body.snowboards =
            typeof req.body.snowboards === "undefined" ? [] : [req.body.snowboards];
        }
        next();
    },
  
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
    
        console.log('creating new_pattern')
        // Create a pattern object with escaped/trimmed data and old id.
        const new_pattern = new Pattern({ 
            name: req.body.name,
            description: req.body.description,
            // snowboards: typeof req.body.snowboards === "undefined" ? [] : req.body.snowboards,
            _id: req.params.id, //This is required, or a new ID will be assigned!
        });

        //need to update every snowboard with this field.....
        //how to only update one field in snowboard (onlly the pattern field)
    
        if (!errors.isEmpty()) {
            async.parallel(
            {
                pattern(callback) {
                    Pattern.findById(req.params.id)
                    .exec(callback);
                },

                all_snowboard_options(callback) {
                    Snowboard.find()
                    .populate('pattern')
                    .exec(callback);
                },
            },
            (err, results) => {
                if (err) {
                return next(err);
                }
    
                console.log(results)
                let new_pattern = JSON.parse(JSON.stringify(results.pattern));
                console.log('new pattern')
                console.log(new_pattern)

                let all_snowboard_options = results.all_snowboard_options.map(result => {
                return { 
                    ...result._doc,
                    url:result.url
                }
                })

                for (const snowboard of all_snowboard_options) {
                    if (snowboard.pattern.includes(results.pattern._id)) {
                        console.log(snowboard.name + 'includes pattern')
                        snowboard.checked = "true";
                    }
                }

                res.render("pattern_form", {
                title: "Update Pattern",
                new_pattern,
                snowboard_list: all_snowboard_options,
                errors: errors.array(),
                });
            }
            );
            return;
        }
    
        // Data from form is valid. Update the record.
        Pattern.findByIdAndUpdate(req.params.id, new_pattern, {}, (err, thepattern) => {
            if (err) {
            return next(err);
            }

            //loop through snowboards and update one by one 
            console.log(req.body.snowboards.length)
            if (req.body.snowboards.length > 0) {
                const del_conditions = { pattern: new_pattern };
                const rm_snowboard_pattern = { $pull: { pattern: new_pattern._id }}
                async.waterfall(
                    [
                    //remove this pattern from all snowboards 
                        function (callback) {
                            console.log('DEL - rm_patterns')
                            Snowboard.updateMany(del_conditions, rm_snowboard_pattern)
                                .exec(callback)
                        },

                        function (callback) {
                            for (let snowboardid of req.body.snowboards) {
                                console.log(new_pattern)
                
                                const update_conditions = { _id: snowboardid };
                                const update_snowboard_pattern = { $addToSet: { pattern: new_pattern } }

                                console.log('update_patterns')
                                Snowboard.findByIdAndUpdate(update_conditions, update_snowboard_pattern)
                                    .exec(callback)
                                }
                            }
                    ],
                    function (err, result) {
                        if (err) {
                            return next(err);
                        }
                        console.log('------RESULT DEL + Add------')
                        console.log(result)
                        console.log(req.body.snowboards)
                    }
                )
            }
            //but this page needs to refresh before changes can be shown?
            
            res.redirect(thepattern.url); // 301 does not do anything different
        
        })  
    }
];

  exports.pattern_delete = (req, res) => {
    console.log('pattern delete')
    console.log(req.params.id)
    async.parallel(
      {
        pattern(callback) {
          Pattern.findById(req.params.id).exec(callback);
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
  
        Pattern.findByIdAndRemove(req.params.id, (err) => {
          if (err) {
            console.log('error found #2')
            return next(err);
          }
          // Success - go to patterns list
          console.log('redirecting to /patterns')
          res.redirect("/pattern");
        });
      }
    );
  };