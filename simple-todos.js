Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // This code only runs on the client
 
  Meteor.subscribe("tasks");

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

  // 11.5  Define helper to check ownership
  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    // 11.7  Add event handler to call the setPrivate method
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
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
    var task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
      // make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
      // make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
  },

  // 11.6  Define method to set tasks to private
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
  
    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
  
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }

});

if (Meteor.isServer) {
  // This code only runs on the server

  // Only publish tasks that are public or belong to the current user
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}
