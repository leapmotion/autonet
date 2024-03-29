'use strict';
// This stores the current state of the leap service. This is the "core" of the AutonetVisualizer and
// handles all of the leap buisness logic.


angular.module('autoNetApp')
.factory('LeapState', ['websocket', function LeapState(websocket) {

  //////// Object definitions ////////

  // A CoreContext
  function Context(id, ctxt){
    this.objects = {}; //name to Object
    this.name = "Unnamed";
    this.id = id;
    this.children = [];

    _.extend(this, ctxt);
  }

  // Add a member to a CoreContext
  Context.prototype.addObject = function(obj) {
    this.objects[obj.name] = obj;
  };

  Context.prototype.getLink = function(){
    return "#/context/" + this.id
  }

  // A "leap object". Inclues ContextMembers, CoreThreads, Bolts, etc...
  function LeapObject(contextID, types, objData){
    this.name = objData.name;
    this.contextID = contextID

    this.types = types;
    this.displayTypes = _.without(Object.keys(this.types), 'coreThread','bolt','eventReceiver','thread');
    this.slots = objData.slots;

    // Converts this.types.eventReceiver from list of types to map from types to fire count
    if (types.hasOwnProperty("eventReceiver")) {
      var events = {};
      var numEvents = types.eventReceiver.length;

      for (var evt=0; evt<numEvents; evt++) {
        var eventType = types.eventReceiver[evt];
        events[eventType] = 0;
      }

      this.types.eventReceiver = events;
    }
  }

  LeapObject.prototype.getLink = function() {
    return "#/object/" + this.contextID + "/" + this.name;
  }

  // Check if this LeapObject is of type "type"
  LeapObject.prototype.IsType = function(type){
    return this.types.hasOwnProperty(type);
  };

  // Check if this LeapObject is a type of on of the keys of "filterTypes"
  LeapObject.prototype.IsAnyType = function(filterTypes){
    var inBoth = _.intersection(Object.keys(this.types), Object.keys(filterTypes))
    return inBoth.length !== 0;
  };

  // Check if this LeapObject bolts onto a context
  LeapObject.prototype.isBolt = function(){
    return this.types.hasOwnProperty('bolt');
  }

  // Check if this LeapObject receives events
  LeapObject.prototype.isEventReceiver = function(){
    return this.types.hasOwnProperty('eventReceiver');
  }

  // Check if this LeapObject is a thread
  LeapObject.prototype.isThread = function(){
    return this.types.hasOwnProperty('thread');
  }

  // Try to firer event "evt" on this object
  // Does nothing if this object doesn't receive the event
  LeapObject.prototype.eventFired = function(evt){
    if (!this.isEventReceiver()) return;

    if (this.types.eventReceiver.hasOwnProperty(evt)) {
      this.types.eventReceiver[evt]++;
    }
  }

  //////////////////////////////////////////////////////
  //////////////////////////////////////////////////////

  var ContextMap = {}; //a map of context.id to contexts
  var TypeList = []; //A list of all types that are injectable
  var isSubscribed = false;

  // "allTypes": A list of all injectable types is sent with a subscription event
  websocket.on('subscribed', function(allTypes) {
    isSubscribed = true;
    TypeList = allTypes;
  });

  // reset everything when unsubscribing
  websocket.on('unsubscribed', function(){
    ContextMap = {};
    TypeList = [];
    isSubscribed = false;
  });

  // "contextID": A unique int ID for this context
  // "context": An object containing additional information
  //            {name: Context name
  //            parent: ID of a parent context}
  //
  websocket.on('newContext', function(contextID, context){
    if (!ContextMap.hasOwnProperty(contextID)) {
      var newCtxt = new Context(contextID, context);
      ContextMap[contextID] = newCtxt;

      // Add this to childen of parent context
      if (ContextMap.hasOwnProperty(newCtxt.parent)) {
        ContextMap[newCtxt.parent].children.push(contextID);
      }
    } else {
      console.log('context alreadys exists');
    }
  });

  // "contextID": int ID of the expired context
  websocket.on('expiredContext', function(contextID){
    var parent = ContextMap[ContextMap[contextID].parent];
    var index = parent.children.indexOf(contextID);
    parent.children.splice(index,1);

    delete ContextMap[contextID];
  });

  // "contextID": int ID of the context containing this object
  // "types": An object with a key for each type this object implements
  //          Additional type specific data is included as the value for each type key
  // "objData": Additional object data, including the name and Autowired slots
  websocket.on('newObject', function(contextID, types, objData) {
    var updatedContext = ContextMap[contextID];
    var object = new LeapObject(contextID, types, objData);

    updatedContext.addObject(object);
  });

  // "contextID": An int identifier for the context in which the event was fired
  // "eventHash": An object storing event data. Mainly "name"
  websocket.on('eventFired', function(contextID, eventHash){

    function fireEvent(ctxtID) {
      if (!ContextMap.hasOwnProperty(ctxtID)) return;

      var updatedContext = ContextMap[ctxtID];

      // Iterated objects in this context, signal event fired
      Object.keys(updatedContext.objects).forEach(function(name){
        var obj = updatedContext.objects[name];
        obj.eventFired(eventHash.name);
      });

      // recurse on children contexts
      for (var i = 0; i < updatedContext.children.length; i++) {
        fireEvent(updatedContext.children[i]);
      }
    }

    fireEvent(contextID);
  });

  // "contextID": Id of context containing updated object
  // "name": name of the type being updated
  // "util": the new utilization
  websocket.on('threadUtilization', function(contextID, name, kernel, user){
    var updatedContext = ContextMap[contextID];
    var updatedObject = updatedContext.objects[name];
    if (!updatedObject ||!updatedObject.isThread()) {
      console.log("Tried to updated utilization on non corethread");
      return;
    }
    updatedObject.types.thread.kernel = kernel;
    updatedObject.types.thread.user = user;
  });

  return {
    GetContexts: function(){
      return ContextMap;
    },
    isSubscribed: function(){
      return isSubscribed;
    },
    GetAllTypes: function(){
      return TypeList;
    }
  };
}]);
