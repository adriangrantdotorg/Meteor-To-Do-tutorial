Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // This code only runs on the client

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
  
      // Get value from form element
      var text = event.target.text.value;
  
      // Insert a task into the collection
      Meteor.call("addTask", text);

      // Clear form
      event.target.text.value = "";
    },
    
    // Check if Completed tasks should be hidden 
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.body.helpers({
    tasks: function () {
      //Display & Hides Filtered tasks  
        if (Session.get("hideCompleted")) {
          // If hide completed is checked, filter tasks
          return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
        } else {
          // Otherwise, return all of the tasks
          return Tasks.find({}, {sort: {createdAt: -1}});
        }
      },
      //maybe unnessary https://github.com/meteor/simple-todos/commit/3352071c6d1c414f94ee21038f28c45651d6216c#commitcomment-13403535
      hideCompleted: function () {
        return Session.get("hideCompleted");
      },

      incompleteCount: function () {
        return Tasks.find({checked: {$ne: true}}).count();
      }

  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    }
  });

  Accounts.ui.config({
     passwordSignupFields: "USERNAME_ONLY"
   });

} //End of Meteor.isClient

Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
 
    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked} });
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
