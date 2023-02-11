const Collection = require("../models/collection");
const Snowboard = require("../models/snowboard");
const Boots = require("../models/boots");
const Bindings = require("../models/bindings");
const snowboard_list = require("../controllers/snowboardController");

const { body, validationResult } = require("express-validator");

const async = require("async");

exports.all_items = (req, res, next) => {
    console.log('display all items')
    async.parallel(
        {
            collection_count(callback) {
                Collection.countDocuments({}, callback)
            },
            snowboard_count(callback) {
                Snowboard.countDocuments({}, callback)
            },
            boots_count(callback) {
                Boots.countDocuments({}, callback)
            },
            bindings_count(callback) {
                Bindings.countDocuments({}, callback)
            },
            snowboard_list(callback) {
                Snowboard.find()
                    .populate('collections')
                    .populate('pattern')
                    .exec(callback)

            }
        },
        
        (err, results) => {
            if (err) {
                // Error in API usage.
                return next(err);
            }

            let list_snowboard;
            if (results.snowboard_list.length > 0) {
                list_snowboard = results.snowboard_list.map(result => {
                  console.log(result)
                  console.log('patterns:')
                  //somehow need to extracted nested loop here. can't seem to extract in html handlebars
                  let patterns = result.pattern.map(result => result.name)
                  let collection = result.collections.map(result => result.name)
                  let collectionUrl = result.collections.map(result => result.url)
                  console.log(patterns)
                  // console.log(Array.isArray(result.collections))
                  return { 
                    name: result.name, 
                    terrain: result.terrain, 
                    riding_level: result.riding_level, 
                    pattern: patterns,
                    image: result.image,
                    collection,
                    collectionUrl,
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

        
            const { collection_count, snowboard_count, boots_count, bindings_count } = results
            console.log(collection_count, snowboard_count, boots_count, bindings_count)

            res.render("main", {
                title: 'Everyday is a Powder Day <p>❄️</p>',
                error: err,
                collection_count, 
                snowboard_count, 
                boots_count, 
                bindings_count,
                list_snowboard
            });
      }
    )
    
}

exports.del_confirmation_get = (req, res, next) => {
    console.log('del_confirmation_get')
    res.render("del_confirm", {
        title: "Enter Your Pass Code To Confirm Deletion",
    });
}
  
exports.del_confirmation_post = (req, res, next) => {

    console.log('del_confirmation_post')
    console.log(req.body.password)

    if (req.body.password === 'admin') {
        console.log('pw match')

        //need to complete the path 
        console.log(req.url)
        const lastIndex = req.url.lastIndexOf('/');

        const before = req.url.slice(0, lastIndex);
        console.log(before)
      
        const after = req.url.slice(lastIndex + 1);
        console.log(after)

        const newUrl = before + "/verified"

        console.log(newUrl)
        res.redirect(newUrl)
    } else {
        res.render("del_confirm", {
            title: "Enter Your Pass Code To Confirm Deletion",
            message: "Wrong Pass Code. Try Again Or Go Back"
        });
    }

}