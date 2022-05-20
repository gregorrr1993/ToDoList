const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    list: [itemsSchema]
});

const Item = new mongoose.model("Item", itemsSchema);
const List = new mongoose.model("List", listSchema);

const item1 = new Item ({
    name: "Welcome to your todolist!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<- hit to remove an item"
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
    Item.find({}, function(err, results) {
        if((results.length === 0)) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                }
                else { 
                    console.log("Items added");
                    res.redirect("/");
                }
        });
        } else {
            res.render("list", { listTitle: date.getDay(), newListItems: results });
        }
    });
    
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/:title", function(req, res) {
    const title = _.capitalize(req.params.title);
    List.findOne({name: title}, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            if (found) {
                res.render("list", { listTitle: found.name, newListItems: found.list});
            }
            else {
                const newList = new List({
                    name: title,
                    list: defaultItems
                });
                newList.save();
                res.redirect("/" + title);
            }
        }
    });
});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const newItem = new Item({
        name: itemName
    });
    List.findOne({name: listName}, function(err, found) {
        if (err) {
            console.log(err);
        } else {
            if (found) {
                found.list.push(newItem);
                found.save();
                res.redirect("/" + listName);
            } else {             
                newItem.save();
                res.redirect("/");
            }
        }
    });   
});

app.post("/delete", async function(req, res) {
    const itemID = req.body.delete;
    const listName = req.body.list;
    List.findOne({name: listName}, async function(err, found) {
        if (err) {
            console.log(err);
        }
        else {
            if (found) {
                await found.list.id(itemID).remove();
                found.save();
                res.redirect("/" + listName);
            } else {
                await Item.deleteOne({_id: itemID});
                res.redirect("/");
            }         
        }
    });
    
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});