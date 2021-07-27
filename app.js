//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose=require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// connect to database
mongoose.connect("mongodb+srv://admin_manoj:Knapsack@120@cluster0.iz04j.mongodb.net/todolistDB", {useNewUrlParser:true});


// schema of the table
const itemsSchema={
  name:String
};

// new model

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "Hit on checkbox to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});


const List = mongoose.model("List", listSchema);



// inserting into item collections

const workItems = [];

app.get("/", function(req, res) {


  Item.find({},function(err,foundItems){  // here find is working as findAll and hence it returns an array
    if(err)
      console.log(err);

    if (foundItems.length==0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("All the items are inserted into collections Successfully.")
        }
      });
      res.redirect("/"); // redirect to render
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

// creating dynamic route

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,foundList){  // foundList is object
    if(!err){
      if(!foundList){
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        // show an existing list
        res.render("list",{listTitle:foundList.name, newListItems: foundList.items});
      }
    }
  })

});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item= new Item({
    name:itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete",function(req,res){

  const checkedItemId= req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(err)
        console.log(err);
      else {
        console.log("Successfully removed the item:")
        res.redirect("/");
      }
    });
  }else{
      List.findOneAndUpdate({name : listName},{$pull: {items: {_id: checkedItemId}}},function(err,foundList){
        if(!err){
          res.redirect("/"+listName);
        }
      });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log("Server has started successfully..");
});
