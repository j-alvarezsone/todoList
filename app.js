const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static('public'));

// URL & Options
const DB = 'todolistDB';
const password = '<your-password>';
const url = `mongodb+srv://<your-admin>:${password}@cluster0.pd5xs.mongodb.net/${DB}?retryWrites=true&w=majority`;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

// Create database
mongoose.connect(url, options);

// Schema
const itemsSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Mongoose model, collections
const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name: 'Welcome to your todolist!',
});

const item2 = new Item({
  name: 'Hit the + button to add new item.',
});

const item3 = new Item({
  name: '<-- Hit this to delete item.',
});

const defaultItems = [item1, item2, item3];

app.get('/', (req, res) => {
  // !Find the Items: {} This will find us everything that's inside our items collection.
  Item.find({}, (err, foundItems) => {
    // !Insert into the Item collection
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully saved default items to DB.');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems,
      });
    }
  });
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  // Find the lists
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save((err, result) => {
          res.redirect(`/${customListName}`);
        });
      } else {
        // Show an existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    item.save((err, result) => {
      res.redirect('/');
    });
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save((err, result) => {
        // Log the result parameter to the console to review it
        res.redirect(`/${listName}`);
      });
    });
  }
});

// Delete
app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // Delete the Items
  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log('Successfully deleted checked item.');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
