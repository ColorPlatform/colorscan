(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var _ = Package.underscore._;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var enableDebugLogging, publishComposite;

var require = meteorInstall({"node_modules":{"meteor":{"reywood:publish-composite":{"lib":{"publish_composite.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/publish_composite.js                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  enableDebugLogging: () => enableDebugLogging,
  publishComposite: () => publishComposite
});

let _;

module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Publication;
module.link("./publication", {
  default(v) {
    Publication = v;
  }

}, 2);
let Subscription;
module.link("./subscription", {
  default(v) {
    Subscription = v;
  }

}, 3);
let debugLog, enableDebugLogging;
module.link("./logging", {
  debugLog(v) {
    debugLog = v;
  },

  enableDebugLogging(v) {
    enableDebugLogging = v;
  }

}, 4);

function publishComposite(name, options) {
  return Meteor.publish(name, function publish(...args) {
    const subscription = new Subscription(this);
    const instanceOptions = prepareOptions.call(this, options, args);
    const publications = [];
    instanceOptions.forEach(opt => {
      const pub = new Publication(subscription, opt);
      publications.push(pub);
    });
    Meteor.defer(() => {
      publications.forEach(pub => {
        pub.publish();
      });
      debugLog('Meteor.publish', 'ready');
      this.ready();
    });
    this.onStop(() => {
      publications.forEach(pub => pub.unpublish());
    });
  });
} // For backwards compatibility


Meteor.publishComposite = publishComposite;

function prepareOptions(options, args) {
  let preparedOptions = options;

  if (typeof preparedOptions === 'function') {
    preparedOptions = preparedOptions.apply(this, args);
  }

  if (!preparedOptions) {
    return [];
  }

  if (!_.isArray(preparedOptions)) {
    preparedOptions = [preparedOptions];
  }

  return preparedOptions;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"doc_ref_counter.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/doc_ref_counter.js                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
class DocumentRefCounter {
  constructor(observer) {
    this.heap = {};
    this.observer = observer;
  }

  increment(collectionName, docId) {
    const key = `${collectionName}:${docId.valueOf()}`;

    if (!this.heap[key]) {
      this.heap[key] = 0;
    }

    this.heap[key] += 1;
  }

  decrement(collectionName, docId) {
    const key = `${collectionName}:${docId.valueOf()}`;

    if (this.heap[key]) {
      this.heap[key] -= 1;
      this.observer.onChange(collectionName, docId, this.heap[key]);
    }
  }

}

module.exportDefault(DocumentRefCounter);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logging.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/logging.js                                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  debugLog: () => debugLog,
  enableDebugLogging: () => enableDebugLogging
});

/* eslint-disable no-console */
let debugLoggingEnabled = false;

function debugLog(source, message) {
  if (!debugLoggingEnabled) {
    return;
  }

  let paddedSource = source;

  while (paddedSource.length < 35) {
    paddedSource += ' ';
  }

  console.log(`[${paddedSource}] ${message}`);
}

function enableDebugLogging() {
  debugLoggingEnabled = true;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publication.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/publication.js                                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 1);

let _;

module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }

}, 2);
let debugLog;
module.link("./logging", {
  debugLog(v) {
    debugLog = v;
  }

}, 3);
let PublishedDocumentList;
module.link("./published_document_list", {
  default(v) {
    PublishedDocumentList = v;
  }

}, 4);

class Publication {
  constructor(subscription, options, args) {
    check(options, {
      find: Function,
      children: Match.Optional(Match.OneOf([Object], Function)),
      collectionName: Match.Optional(String)
    });
    this.subscription = subscription;
    this.options = options;
    this.args = args || [];
    this.childrenOptions = options.children || [];
    this.publishedDocs = new PublishedDocumentList();
    this.collectionName = options.collectionName;
    this.unpublished = false;
  }

  publish() {
    if (this.unpublished) {
      return;
    }

    this.cursor = this._getCursor();

    if (!this.cursor) {
      return;
    }

    const collectionName = this._getCollectionName(); // Use Meteor.bindEnvironment to make sure the callbacks are run with the same
    // environmentVariables as when publishing the "parent".
    // It's only needed when publish is being recursively run.


    this.observeHandle = this.cursor.observe({
      added: Meteor.bindEnvironment(doc => {
        if (this.unpublished) {
          return;
        }

        const alreadyPublished = this.publishedDocs.has(doc._id);

        if (alreadyPublished) {
          debugLog('Publication.observeHandle.added', `${collectionName}:${doc._id} already published`);
          this.publishedDocs.unflagForRemoval(doc._id);

          this._republishChildrenOf(doc);

          this.subscription.changed(collectionName, doc._id, doc);
        } else {
          this.publishedDocs.add(collectionName, doc._id);

          this._publishChildrenOf(doc);

          this.subscription.added(collectionName, doc);
        }
      }),
      changed: Meteor.bindEnvironment(newDoc => {
        if (this.unpublished) {
          return;
        }

        debugLog('Publication.observeHandle.changed', `${collectionName}:${newDoc._id}`);

        this._republishChildrenOf(newDoc);
      }),
      removed: doc => {
        if (this.unpublished) {
          return;
        }

        debugLog('Publication.observeHandle.removed', `${collectionName}:${doc._id}`);

        this._removeDoc(collectionName, doc._id);
      }
    });
    this.observeChangesHandle = this.cursor.observeChanges({
      changed: (id, fields) => {
        if (this.unpublished) {
          return;
        }

        debugLog('Publication.observeChangesHandle.changed', `${collectionName}:${id}`);
        this.subscription.changed(collectionName, id, fields);
      }
    });
  }

  unpublish() {
    debugLog('Publication.unpublish', this._getCollectionName());
    this.unpublished = true;

    this._stopObservingCursor();

    this._unpublishAllDocuments();
  }

  _republish() {
    this._stopObservingCursor();

    this.publishedDocs.flagAllForRemoval();
    debugLog('Publication._republish', 'run .publish again');
    this.publish();
    debugLog('Publication._republish', 'unpublish docs from old cursor');

    this._removeFlaggedDocs();
  }

  _getCursor() {
    return this.options.find.apply(this.subscription.meteorSub, this.args);
  }

  _getCollectionName() {
    return this.collectionName || this.cursor && this.cursor._getCollectionName();
  }

  _publishChildrenOf(doc) {
    const children = _.isFunction(this.childrenOptions) ? this.childrenOptions(doc, ...this.args) : this.childrenOptions;

    _.each(children, function createChildPublication(options) {
      const pub = new Publication(this.subscription, options, [doc].concat(this.args));
      this.publishedDocs.addChildPub(doc._id, pub);
      pub.publish();
    }, this);
  }

  _republishChildrenOf(doc) {
    this.publishedDocs.eachChildPub(doc._id, publication => {
      publication.args[0] = doc;

      publication._republish();
    });
  }

  _unpublishAllDocuments() {
    this.publishedDocs.eachDocument(doc => {
      this._removeDoc(doc.collectionName, doc.docId);
    }, this);
  }

  _stopObservingCursor() {
    debugLog('Publication._stopObservingCursor', 'stop observing cursor');

    if (this.observeHandle) {
      this.observeHandle.stop();
      delete this.observeHandle;
    }

    if (this.observeChangesHandle) {
      this.observeChangesHandle.stop();
      delete this.observeChangesHandle;
    }
  }

  _removeFlaggedDocs() {
    this.publishedDocs.eachDocument(doc => {
      if (doc.isFlaggedForRemoval()) {
        this._removeDoc(doc.collectionName, doc.docId);
      }
    }, this);
  }

  _removeDoc(collectionName, docId) {
    this.subscription.removed(collectionName, docId);

    this._unpublishChildrenOf(docId);

    this.publishedDocs.remove(docId);
  }

  _unpublishChildrenOf(docId) {
    debugLog('Publication._unpublishChildrenOf', `unpublishing children of ${this._getCollectionName()}:${docId}`);
    this.publishedDocs.eachChildPub(docId, publication => {
      publication.unpublish();
    });
  }

}

module.exportDefault(Publication);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscription.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/subscription.js                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let _;

module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }

}, 0);
let DocumentRefCounter;
module.link("./doc_ref_counter", {
  default(v) {
    DocumentRefCounter = v;
  }

}, 1);
let debugLog;
module.link("./logging", {
  debugLog(v) {
    debugLog = v;
  }

}, 2);

class Subscription {
  constructor(meteorSub) {
    this.meteorSub = meteorSub;
    this.docHash = {};
    this.refCounter = new DocumentRefCounter({
      onChange: (collectionName, docId, refCount) => {
        debugLog('Subscription.refCounter.onChange', `${collectionName}:${docId.valueOf()} ${refCount}`);

        if (refCount <= 0) {
          meteorSub.removed(collectionName, docId);

          this._removeDocHash(collectionName, docId);
        }
      }
    });
  }

  added(collectionName, doc) {
    this.refCounter.increment(collectionName, doc._id);

    if (this._hasDocChanged(collectionName, doc._id, doc)) {
      debugLog('Subscription.added', `${collectionName}:${doc._id}`);
      this.meteorSub.added(collectionName, doc._id, doc);

      this._addDocHash(collectionName, doc);
    }
  }

  changed(collectionName, id, changes) {
    if (this._shouldSendChanges(collectionName, id, changes)) {
      debugLog('Subscription.changed', `${collectionName}:${id}`);
      this.meteorSub.changed(collectionName, id, changes);

      this._updateDocHash(collectionName, id, changes);
    }
  }

  removed(collectionName, id) {
    debugLog('Subscription.removed', `${collectionName}:${id.valueOf()}`);
    this.refCounter.decrement(collectionName, id);
  }

  _addDocHash(collectionName, doc) {
    this.docHash[buildHashKey(collectionName, doc._id)] = doc;
  }

  _updateDocHash(collectionName, id, changes) {
    const key = buildHashKey(collectionName, id);
    const existingDoc = this.docHash[key] || {};
    this.docHash[key] = _.extend(existingDoc, changes);
  }

  _shouldSendChanges(collectionName, id, changes) {
    return this._isDocPublished(collectionName, id) && this._hasDocChanged(collectionName, id, changes);
  }

  _isDocPublished(collectionName, id) {
    const key = buildHashKey(collectionName, id);
    return !!this.docHash[key];
  }

  _hasDocChanged(collectionName, id, doc) {
    const existingDoc = this.docHash[buildHashKey(collectionName, id)];

    if (!existingDoc) {
      return true;
    }

    return _.any(_.keys(doc), key => !_.isEqual(doc[key], existingDoc[key]));
  }

  _removeDocHash(collectionName, id) {
    const key = buildHashKey(collectionName, id);
    delete this.docHash[key];
  }

}

function buildHashKey(collectionName, id) {
  return `${collectionName}::${id.valueOf()}`;
}

module.exportDefault(Subscription);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"published_document.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/published_document.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
class PublishedDocument {
  constructor(collectionName, docId) {
    this.collectionName = collectionName;
    this.docId = docId;
    this.childPublications = [];
    this._isFlaggedForRemoval = false;
  }

  addChildPub(childPublication) {
    this.childPublications.push(childPublication);
  }

  eachChildPub(callback) {
    this.childPublications.forEach(callback);
  }

  isFlaggedForRemoval() {
    return this._isFlaggedForRemoval;
  }

  unflagForRemoval() {
    this._isFlaggedForRemoval = false;
  }

  flagForRemoval() {
    this._isFlaggedForRemoval = true;
  }

}

module.exportDefault(PublishedDocument);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"published_document_list.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/reywood_publish-composite/lib/published_document_list.js                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let _;

module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }

}, 0);
let PublishedDocument;
module.link("./published_document", {
  default(v) {
    PublishedDocument = v;
  }

}, 1);

class PublishedDocumentList {
  constructor() {
    this.documents = {};
  }

  add(collectionName, docId) {
    const key = valueOfId(docId);

    if (!this.documents[key]) {
      this.documents[key] = new PublishedDocument(collectionName, docId);
    }
  }

  addChildPub(docId, publication) {
    if (!publication) {
      return;
    }

    const key = valueOfId(docId);
    const doc = this.documents[key];

    if (typeof doc === 'undefined') {
      throw new Error(`Doc not found in list: ${key}`);
    }

    this.documents[key].addChildPub(publication);
  }

  get(docId) {
    const key = valueOfId(docId);
    return this.documents[key];
  }

  remove(docId) {
    const key = valueOfId(docId);
    delete this.documents[key];
  }

  has(docId) {
    return !!this.get(docId);
  }

  eachDocument(callback, context) {
    _.each(this.documents, function execCallbackOnDoc(doc) {
      callback.call(this, doc);
    }, context || this);
  }

  eachChildPub(docId, callback) {
    const doc = this.get(docId);

    if (doc) {
      doc.eachChildPub(callback);
    }
  }

  getIds() {
    const docIds = [];
    this.eachDocument(doc => {
      docIds.push(doc.docId);
    });
    return docIds;
  }

  unflagForRemoval(docId) {
    const doc = this.get(docId);

    if (doc) {
      doc.unflagForRemoval();
    }
  }

  flagAllForRemoval() {
    this.eachDocument(doc => {
      doc.flagForRemoval();
    });
  }

}

function valueOfId(docId) {
  if (docId === null) {
    throw new Error('Document ID is null');
  }

  if (typeof docId === 'undefined') {
    throw new Error('Document ID is undefined');
  }

  return docId.valueOf();
}

module.exportDefault(PublishedDocumentList);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/reywood:publish-composite/lib/publish_composite.js");
require("/node_modules/meteor/reywood:publish-composite/lib/doc_ref_counter.js");
require("/node_modules/meteor/reywood:publish-composite/lib/logging.js");
require("/node_modules/meteor/reywood:publish-composite/lib/publication.js");
require("/node_modules/meteor/reywood:publish-composite/lib/subscription.js");

/* Exports */
Package._define("reywood:publish-composite", exports, {
  enableDebugLogging: enableDebugLogging,
  publishComposite: publishComposite
});

})();

//# sourceURL=meteor://💻app/packages/reywood_publish-composite.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmV5d29vZDpwdWJsaXNoLWNvbXBvc2l0ZS9saWIvcHVibGlzaF9jb21wb3NpdGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JleXdvb2Q6cHVibGlzaC1jb21wb3NpdGUvbGliL2RvY19yZWZfY291bnRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmV5d29vZDpwdWJsaXNoLWNvbXBvc2l0ZS9saWIvbG9nZ2luZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmV5d29vZDpwdWJsaXNoLWNvbXBvc2l0ZS9saWIvcHVibGljYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JleXdvb2Q6cHVibGlzaC1jb21wb3NpdGUvbGliL3N1YnNjcmlwdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmV5d29vZDpwdWJsaXNoLWNvbXBvc2l0ZS9saWIvcHVibGlzaGVkX2RvY3VtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yZXl3b29kOnB1Ymxpc2gtY29tcG9zaXRlL2xpYi9wdWJsaXNoZWRfZG9jdW1lbnRfbGlzdC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJlbmFibGVEZWJ1Z0xvZ2dpbmciLCJwdWJsaXNoQ29tcG9zaXRlIiwiXyIsImxpbmsiLCJ2IiwiTWV0ZW9yIiwiUHVibGljYXRpb24iLCJkZWZhdWx0IiwiU3Vic2NyaXB0aW9uIiwiZGVidWdMb2ciLCJuYW1lIiwib3B0aW9ucyIsInB1Ymxpc2giLCJhcmdzIiwic3Vic2NyaXB0aW9uIiwiaW5zdGFuY2VPcHRpb25zIiwicHJlcGFyZU9wdGlvbnMiLCJjYWxsIiwicHVibGljYXRpb25zIiwiZm9yRWFjaCIsIm9wdCIsInB1YiIsInB1c2giLCJkZWZlciIsInJlYWR5Iiwib25TdG9wIiwidW5wdWJsaXNoIiwicHJlcGFyZWRPcHRpb25zIiwiYXBwbHkiLCJpc0FycmF5IiwiRG9jdW1lbnRSZWZDb3VudGVyIiwiY29uc3RydWN0b3IiLCJvYnNlcnZlciIsImhlYXAiLCJpbmNyZW1lbnQiLCJjb2xsZWN0aW9uTmFtZSIsImRvY0lkIiwia2V5IiwidmFsdWVPZiIsImRlY3JlbWVudCIsIm9uQ2hhbmdlIiwiZXhwb3J0RGVmYXVsdCIsImRlYnVnTG9nZ2luZ0VuYWJsZWQiLCJzb3VyY2UiLCJtZXNzYWdlIiwicGFkZGVkU291cmNlIiwibGVuZ3RoIiwiY29uc29sZSIsImxvZyIsIk1hdGNoIiwiY2hlY2siLCJQdWJsaXNoZWREb2N1bWVudExpc3QiLCJmaW5kIiwiRnVuY3Rpb24iLCJjaGlsZHJlbiIsIk9wdGlvbmFsIiwiT25lT2YiLCJPYmplY3QiLCJTdHJpbmciLCJjaGlsZHJlbk9wdGlvbnMiLCJwdWJsaXNoZWREb2NzIiwidW5wdWJsaXNoZWQiLCJjdXJzb3IiLCJfZ2V0Q3Vyc29yIiwiX2dldENvbGxlY3Rpb25OYW1lIiwib2JzZXJ2ZUhhbmRsZSIsIm9ic2VydmUiLCJhZGRlZCIsImJpbmRFbnZpcm9ubWVudCIsImRvYyIsImFscmVhZHlQdWJsaXNoZWQiLCJoYXMiLCJfaWQiLCJ1bmZsYWdGb3JSZW1vdmFsIiwiX3JlcHVibGlzaENoaWxkcmVuT2YiLCJjaGFuZ2VkIiwiYWRkIiwiX3B1Ymxpc2hDaGlsZHJlbk9mIiwibmV3RG9jIiwicmVtb3ZlZCIsIl9yZW1vdmVEb2MiLCJvYnNlcnZlQ2hhbmdlc0hhbmRsZSIsIm9ic2VydmVDaGFuZ2VzIiwiaWQiLCJmaWVsZHMiLCJfc3RvcE9ic2VydmluZ0N1cnNvciIsIl91bnB1Ymxpc2hBbGxEb2N1bWVudHMiLCJfcmVwdWJsaXNoIiwiZmxhZ0FsbEZvclJlbW92YWwiLCJfcmVtb3ZlRmxhZ2dlZERvY3MiLCJtZXRlb3JTdWIiLCJpc0Z1bmN0aW9uIiwiZWFjaCIsImNyZWF0ZUNoaWxkUHVibGljYXRpb24iLCJjb25jYXQiLCJhZGRDaGlsZFB1YiIsImVhY2hDaGlsZFB1YiIsInB1YmxpY2F0aW9uIiwiZWFjaERvY3VtZW50Iiwic3RvcCIsImlzRmxhZ2dlZEZvclJlbW92YWwiLCJfdW5wdWJsaXNoQ2hpbGRyZW5PZiIsInJlbW92ZSIsImRvY0hhc2giLCJyZWZDb3VudGVyIiwicmVmQ291bnQiLCJfcmVtb3ZlRG9jSGFzaCIsIl9oYXNEb2NDaGFuZ2VkIiwiX2FkZERvY0hhc2giLCJjaGFuZ2VzIiwiX3Nob3VsZFNlbmRDaGFuZ2VzIiwiX3VwZGF0ZURvY0hhc2giLCJidWlsZEhhc2hLZXkiLCJleGlzdGluZ0RvYyIsImV4dGVuZCIsIl9pc0RvY1B1Ymxpc2hlZCIsImFueSIsImtleXMiLCJpc0VxdWFsIiwiUHVibGlzaGVkRG9jdW1lbnQiLCJjaGlsZFB1YmxpY2F0aW9ucyIsIl9pc0ZsYWdnZWRGb3JSZW1vdmFsIiwiY2hpbGRQdWJsaWNhdGlvbiIsImNhbGxiYWNrIiwiZmxhZ0ZvclJlbW92YWwiLCJkb2N1bWVudHMiLCJ2YWx1ZU9mSWQiLCJFcnJvciIsImdldCIsImNvbnRleHQiLCJleGVjQ2FsbGJhY2tPbkRvYyIsImdldElkcyIsImRvY0lkcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUFDQyxvQkFBa0IsRUFBQyxNQUFJQSxrQkFBeEI7QUFBMkNDLGtCQUFnQixFQUFDLE1BQUlBO0FBQWhFLENBQWQ7O0FBQWlHLElBQUlDLENBQUo7O0FBQU1KLE1BQU0sQ0FBQ0ssSUFBUCxDQUFZLG1CQUFaLEVBQWdDO0FBQUNELEdBQUMsQ0FBQ0UsQ0FBRCxFQUFHO0FBQUNGLEtBQUMsR0FBQ0UsQ0FBRjtBQUFJOztBQUFWLENBQWhDLEVBQTRDLENBQTVDO0FBQStDLElBQUlDLE1BQUo7QUFBV1AsTUFBTSxDQUFDSyxJQUFQLENBQVksZUFBWixFQUE0QjtBQUFDRSxRQUFNLENBQUNELENBQUQsRUFBRztBQUFDQyxVQUFNLEdBQUNELENBQVA7QUFBUzs7QUFBcEIsQ0FBNUIsRUFBa0QsQ0FBbEQ7QUFBcUQsSUFBSUUsV0FBSjtB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QUMyQixZQUFKLENBQWlCMkIsUUFBakI7QUFDSDtBQUNKOztBQUVEUSxRQUFNLEdBQUc7QUFDTCxVQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUVBLFNBQUtsQyxZQUFMLENBQW1CN0IsR0FBRCxJQUFTO0FBQ3ZCK0QsWUFBTSxDQUFDOUcsSUFBUCxDQUFZK0MsR0FBRyxDQUFDakMsS0FBaEI7QUFDSCxLQUZEO0FBSUEsV0FBT2dHLE1BQVA7QUFDSDs7QUFFRDNELGtCQUFnQixDQUFDckMsS0FBRCxFQUFRO0FBQ3BCLFVBQU1pQyxHQUFHLEdBQUcsS0FBSzJELEdBQUwsQ0FBUzVGLEtBQVQsQ0FBWjs7QUFFQSxRQUFJaUMsR0FBSixFQUFTO0FBQ0xBLFNBQUcsQ0FBQ0ksZ0JBQUo7QUFDSDtBQUNKOztBQUVEZSxtQkFBaUIsR0FBRztBQUNoQixTQUFLVSxZQUFMLENBQW1CN0IsR0FBRCxJQUFTO0FBQ3ZCQSxTQUFHLENBQUN1RCxjQUFKO0FBQ0gsS0FGRDtBQUdIOztBQTVFdUI7O0FBK0U1QixTQUFTRSxTQUFULENBQW1CMUYsS0FBbkIsRUFBMEI7QUFDdEIsTUFBSUEsS0FBSyxLQUFLLElBQWQsRUFBb0I7QUFDaEIsVUFBTSxJQUFJMkYsS0FBSixDQUFVLHFCQUFWLENBQU47QUFDSDs7QUFDRCxNQUFJLE9BQU8zRixLQUFQLEtBQWlCLFdBQXJCLEVBQWtDO0FBQzlCLFVBQU0sSUFBSTJGLEtBQUosQ0FBVSwwQkFBVixDQUFOO0FBQ0g7O0FBQ0QsU0FBTzNGLEtBQUssQ0FBQ0UsT0FBTixFQUFQO0FBQ0g7O0FBNUZEeEMsTUFBTSxDQUFDMkMsYUFBUCxDQThGZVUscUJBOUZmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JleXdvb2RfcHVibGlzaC1jb21wb3NpdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmltcG9ydCBQdWJsaWNhdGlvbiBmcm9tICcuL3B1YmxpY2F0aW9uJztcbmltcG9ydCBTdWJzY3JpcHRpb24gZnJvbSAnLi9zdWJzY3JpcHRpb24nO1xuaW1wb3J0IHsgZGVidWdMb2csIGVuYWJsZURlYnVnTG9nZ2luZyB9IGZyb20gJy4vbG9nZ2luZyc7XG5cblxuZnVuY3Rpb24gcHVibGlzaENvbXBvc2l0ZShuYW1lLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIE1ldGVvci5wdWJsaXNoKG5hbWUsIGZ1bmN0aW9uIHB1Ymxpc2goLi4uYXJncykge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKHRoaXMpO1xuICAgICAgICBjb25zdCBpbnN0YW5jZU9wdGlvbnMgPSBwcmVwYXJlT3B0aW9ucy5jYWxsKHRoaXMsIG9wdGlvbnMsIGFyZ3MpO1xuICAgICAgICBjb25zdCBwdWJsaWNhdGlvbnMgPSBbXTtcblxuICAgICAgICBpbnN0YW5jZU9wdGlvbnMuZm9yRWFjaCgob3B0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwdWIgPSBuZXcgUHVibGljYXRpb24oc3Vic2NyaXB0aW9uLCBvcHQpO1xuICAgICAgICAgICAgcHVibGljYXRpb25zLnB1c2gocHViKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgTWV0ZW9yLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICAgIHB1YmxpY2F0aW9ucy5mb3JFYWNoKChwdWIpID0+IHtcbiAgICAgICAgICAgICAgICBwdWIucHVibGlzaCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkZWJ1Z0xvZygnTWV0ZW9yLnB1Ymxpc2gnLCAncmVhZHknKTtcbiAgICAgICAgICAgIHRoaXMucmVhZHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5vblN0b3AoKCkgPT4ge1xuICAgICAgICAgICAgcHVibGljYXRpb25zLmZvckVhY2gocHViID0+IHB1Yi51bnB1Ymxpc2goKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbk1ldGVvci5wdWJsaXNoQ29tcG9zaXRlID0gcHVibGlzaENvbXBvc2l0ZTtcblxuZnVuY3Rpb24gcHJlcGFyZU9wdGlvbnMob3B0aW9ucywgYXJncykge1xuICAgIGxldCBwcmVwYXJlZE9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgaWYgKHR5cGVvZiBwcmVwYXJlZE9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcHJlcGFyZWRPcHRpb25zID0gcHJlcGFyZWRPcHRpb25zLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIGlmICghcHJlcGFyZWRPcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBpZiAoIV8uaXNBcnJheShwcmVwYXJlZE9wdGlvbnMpKSB7XG4gICAgICAgIHByZXBhcmVkT3B0aW9ucyA9IFtwcmVwYXJlZE9wdGlvbnNdO1xuICAgIH1cblxuICAgIHJldHVybiBwcmVwYXJlZE9wdGlvbnM7XG59XG5cblxuZXhwb3J0IHtcbiAgICBlbmFibGVEZWJ1Z0xvZ2dpbmcsXG4gICAgcHVibGlzaENvbXBvc2l0ZSxcbn07XG4iLCJjbGFzcyBEb2N1bWVudFJlZkNvdW50ZXIge1xuICAgIGNvbnN0cnVjdG9yKG9ic2VydmVyKSB7XG4gICAgICAgIHRoaXMuaGVhcCA9IHt9O1xuICAgICAgICB0aGlzLm9ic2VydmVyID0gb2JzZXJ2ZXI7XG4gICAgfVxuXG4gICAgaW5jcmVtZW50KGNvbGxlY3Rpb25OYW1lLCBkb2NJZCkge1xuICAgICAgICBjb25zdCBrZXkgPSBgJHtjb2xsZWN0aW9uTmFtZX06JHtkb2NJZC52YWx1ZU9mKCl9YDtcbiAgICAgICAgaWYgKCF0aGlzLmhlYXBba2V5XSkge1xuICAgICAgICAgICAgdGhpcy5oZWFwW2tleV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGVhcFtrZXldICs9IDE7XG4gICAgfVxuXG4gICAgZGVjcmVtZW50KGNvbGxlY3Rpb25OYW1lLCBkb2NJZCkge1xuICAgICAgICBjb25zdCBrZXkgPSBgJHtjb2xsZWN0aW9uTmFtZX06JHtkb2NJZC52YWx1ZU9mKCl9YDtcbiAgICAgICAgaWYgKHRoaXMuaGVhcFtrZXldKSB7XG4gICAgICAgICAgICB0aGlzLmhlYXBba2V5XSAtPSAxO1xuXG4gICAgICAgICAgICB0aGlzLm9ic2VydmVyLm9uQ2hhbmdlKGNvbGxlY3Rpb25OYW1lLCBkb2NJZCwgdGhpcy5oZWFwW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBEb2N1bWVudFJlZkNvdW50ZXI7XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5cbmxldCBkZWJ1Z0xvZ2dpbmdFbmFibGVkID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRlYnVnTG9nKHNvdXJjZSwgbWVzc2FnZSkge1xuICAgIGlmICghZGVidWdMb2dnaW5nRW5hYmxlZCkgeyByZXR1cm47IH1cbiAgICBsZXQgcGFkZGVkU291cmNlID0gc291cmNlO1xuICAgIHdoaWxlIChwYWRkZWRTb3VyY2UubGVuZ3RoIDwgMzUpIHsgcGFkZGVkU291cmNlICs9ICcgJzsgfVxuICAgIGNvbnNvbGUubG9nKGBbJHtwYWRkZWRTb3VyY2V9XSAke21lc3NhZ2V9YCk7XG59XG5cbmZ1bmN0aW9uIGVuYWJsZURlYnVnTG9nZ2luZygpIHtcbiAgICBkZWJ1Z0xvZ2dpbmdFbmFibGVkID0gdHJ1ZTtcbn1cblxuZXhwb3J0IHtcbiAgICBkZWJ1Z0xvZyxcbiAgICBlbmFibGVEZWJ1Z0xvZ2dpbmcsXG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBNYXRjaCwgY2hlY2sgfSBmcm9tICdtZXRlb3IvY2hlY2snO1xuaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcblxuaW1wb3J0IHsgZGVidWdMb2cgfSBmcm9tICcuL2xvZ2dpbmcnO1xuaW1wb3J0IFB1Ymxpc2hlZERvY3VtZW50TGlzdCBmcm9tICcuL3B1Ymxpc2hlZF9kb2N1bWVudF9saXN0JztcblxuXG5jbGFzcyBQdWJsaWNhdGlvbiB7XG4gICAgY29uc3RydWN0b3Ioc3Vic2NyaXB0aW9uLCBvcHRpb25zLCBhcmdzKSB7XG4gICAgICAgIGNoZWNrKG9wdGlvbnMsIHtcbiAgICAgICAgICAgIGZpbmQ6IEZ1bmN0aW9uLFxuICAgICAgICAgICAgY2hpbGRyZW46IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKFtPYmplY3RdLCBGdW5jdGlvbikpLFxuICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzIHx8IFtdO1xuICAgICAgICB0aGlzLmNoaWxkcmVuT3B0aW9ucyA9IG9wdGlvbnMuY2hpbGRyZW4gfHwgW107XG4gICAgICAgIHRoaXMucHVibGlzaGVkRG9jcyA9IG5ldyBQdWJsaXNoZWREb2N1bWVudExpc3QoKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uTmFtZSA9IG9wdGlvbnMuY29sbGVjdGlvbk5hbWU7XG4gICAgICAgIHRoaXMudW5wdWJsaXNoZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBwdWJsaXNoKCkge1xuICAgICAgICBpZiAodGhpcy51bnB1Ymxpc2hlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJzb3IgPSB0aGlzLl9nZXRDdXJzb3IoKTtcbiAgICAgICAgaWYgKCF0aGlzLmN1cnNvcikgeyByZXR1cm47IH1cblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IHRoaXMuX2dldENvbGxlY3Rpb25OYW1lKCk7XG5cbiAgICAgICAgLy8gVXNlIE1ldGVvci5iaW5kRW52aXJvbm1lbnQgdG8gbWFrZSBzdXJlIHRoZSBjYWxsYmFja3MgYXJlIHJ1biB3aXRoIHRoZSBzYW1lXG4gICAgICAgIC8vIGVudmlyb25tZW50VmFyaWFibGVzIGFzIHdoZW4gcHVibGlzaGluZyB0aGUgXCJwYXJlbnRcIi5cbiAgICAgICAgLy8gSXQncyBvbmx5IG5lZWRlZCB3aGVuIHB1Ymxpc2ggaXMgYmVpbmcgcmVjdXJzaXZlbHkgcnVuLlxuICAgICAgICB0aGlzLm9ic2VydmVIYW5kbGUgPSB0aGlzLmN1cnNvci5vYnNlcnZlKHtcbiAgICAgICAgICAgIGFkZGVkOiBNZXRlb3IuYmluZEVudmlyb25tZW50KChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy51bnB1Ymxpc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYWxyZWFkeVB1Ymxpc2hlZCA9IHRoaXMucHVibGlzaGVkRG9jcy5oYXMoZG9jLl9pZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYWxyZWFkeVB1Ymxpc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZygnUHVibGljYXRpb24ub2JzZXJ2ZUhhbmRsZS5hZGRlZCcsIGAke2NvbGxlY3Rpb25OYW1lfToke2RvYy5faWR9IGFscmVhZHkgcHVibGlzaGVkYCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaGVkRG9jcy51bmZsYWdGb3JSZW1vdmFsKGRvYy5faWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXB1Ymxpc2hDaGlsZHJlbk9mKGRvYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmNoYW5nZWQoY29sbGVjdGlvbk5hbWUsIGRvYy5faWQsIGRvYyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoZWREb2NzLmFkZChjb2xsZWN0aW9uTmFtZSwgZG9jLl9pZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3B1Ymxpc2hDaGlsZHJlbk9mKGRvYyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZGVkKGNvbGxlY3Rpb25OYW1lLCBkb2MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY2hhbmdlZDogTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgobmV3RG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudW5wdWJsaXNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZygnUHVibGljYXRpb24ub2JzZXJ2ZUhhbmRsZS5jaGFuZ2VkJywgYCR7Y29sbGVjdGlvbk5hbWV9OiR7bmV3RG9jLl9pZH1gKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXB1Ymxpc2hDaGlsZHJlbk9mKG5ld0RvYyk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHJlbW92ZWQ6IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy51bnB1Ymxpc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlYnVnTG9nKCdQdWJsaWNhdGlvbi5vYnNlcnZlSGFuZGxlLnJlbW92ZWQnLCBgJHtjb2xsZWN0aW9uTmFtZX06JHtkb2MuX2lkfWApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZURvYyhjb2xsZWN0aW9uTmFtZSwgZG9jLl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm9ic2VydmVDaGFuZ2VzSGFuZGxlID0gdGhpcy5jdXJzb3Iub2JzZXJ2ZUNoYW5nZXMoe1xuICAgICAgICAgICAgY2hhbmdlZDogKGlkLCBmaWVsZHMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy51bnB1Ymxpc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlYnVnTG9nKCdQdWJsaWNhdGlvbi5vYnNlcnZlQ2hhbmdlc0hhbmRsZS5jaGFuZ2VkJywgYCR7Y29sbGVjdGlvbk5hbWV9OiR7aWR9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24uY2hhbmdlZChjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1bnB1Ymxpc2goKSB7XG4gICAgICAgIGRlYnVnTG9nKCdQdWJsaWNhdGlvbi51bnB1Ymxpc2gnLCB0aGlzLl9nZXRDb2xsZWN0aW9uTmFtZSgpKTtcbiAgICAgICAgdGhpcy51bnB1Ymxpc2hlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3N0b3BPYnNlcnZpbmdDdXJzb3IoKTtcbiAgICAgICAgdGhpcy5fdW5wdWJsaXNoQWxsRG9jdW1lbnRzKCk7XG4gICAgfVxuXG4gICAgX3JlcHVibGlzaCgpIHtcbiAgICAgICAgdGhpcy5fc3RvcE9ic2VydmluZ0N1cnNvcigpO1xuXG4gICAgICAgIHRoaXMucHVibGlzaGVkRG9jcy5mbGFnQWxsRm9yUmVtb3ZhbCgpO1xuXG4gICAgICAgIGRlYnVnTG9nKCdQdWJsaWNhdGlvbi5fcmVwdWJsaXNoJywgJ3J1biAucHVibGlzaCBhZ2FpbicpO1xuICAgICAgICB0aGlzLnB1Ymxpc2goKTtcblxuICAgICAgICBkZWJ1Z0xvZygnUHVibGljYXRpb24uX3JlcHVibGlzaCcsICd1bnB1Ymxpc2ggZG9jcyBmcm9tIG9sZCBjdXJzb3InKTtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRmxhZ2dlZERvY3MoKTtcbiAgICB9XG5cbiAgICBfZ2V0Q3Vyc29yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmZpbmQuYXBwbHkodGhpcy5zdWJzY3JpcHRpb24ubWV0ZW9yU3ViLCB0aGlzLmFyZ3MpO1xuICAgIH1cblxuICAgIF9nZXRDb2xsZWN0aW9uTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sbGVjdGlvbk5hbWUgfHwgKHRoaXMuY3Vyc29yICYmIHRoaXMuY3Vyc29yLl9nZXRDb2xsZWN0aW9uTmFtZSgpKTtcbiAgICB9XG5cbiAgICBfcHVibGlzaENoaWxkcmVuT2YoZG9jKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gXy5pc0Z1bmN0aW9uKHRoaXMuY2hpbGRyZW5PcHRpb25zKSA/XG4gICAgICAgIHRoaXMuY2hpbGRyZW5PcHRpb25zKGRvYywgLi4udGhpcy5hcmdzKSA6IHRoaXMuY2hpbGRyZW5PcHRpb25zO1xuICAgICAgICBfLmVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uIGNyZWF0ZUNoaWxkUHVibGljYXRpb24ob3B0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgcHViID0gbmV3IFB1YmxpY2F0aW9uKHRoaXMuc3Vic2NyaXB0aW9uLCBvcHRpb25zLCBbZG9jXS5jb25jYXQodGhpcy5hcmdzKSk7XG4gICAgICAgICAgICB0aGlzLnB1Ymxpc2hlZERvY3MuYWRkQ2hpbGRQdWIoZG9jLl9pZCwgcHViKTtcbiAgICAgICAgICAgIHB1Yi5wdWJsaXNoKCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIF9yZXB1Ymxpc2hDaGlsZHJlbk9mKGRvYykge1xuICAgICAgICB0aGlzLnB1Ymxpc2hlZERvY3MuZWFjaENoaWxkUHViKGRvYy5faWQsIChwdWJsaWNhdGlvbikgPT4ge1xuICAgICAgICAgICAgcHVibGljYXRpb24uYXJnc1swXSA9IGRvYztcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uLl9yZXB1Ymxpc2goKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX3VucHVibGlzaEFsbERvY3VtZW50cygpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoZWREb2NzLmVhY2hEb2N1bWVudCgoZG9jKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVEb2MoZG9jLmNvbGxlY3Rpb25OYW1lLCBkb2MuZG9jSWQpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBfc3RvcE9ic2VydmluZ0N1cnNvcigpIHtcbiAgICAgICAgZGVidWdMb2coJ1B1YmxpY2F0aW9uLl9zdG9wT2JzZXJ2aW5nQ3Vyc29yJywgJ3N0b3Agb2JzZXJ2aW5nIGN1cnNvcicpO1xuXG4gICAgICAgIGlmICh0aGlzLm9ic2VydmVIYW5kbGUpIHtcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZUhhbmRsZS5zdG9wKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5vYnNlcnZlSGFuZGxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub2JzZXJ2ZUNoYW5nZXNIYW5kbGUpIHtcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZUNoYW5nZXNIYW5kbGUuc3RvcCgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMub2JzZXJ2ZUNoYW5nZXNIYW5kbGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVtb3ZlRmxhZ2dlZERvY3MoKSB7XG4gICAgICAgIHRoaXMucHVibGlzaGVkRG9jcy5lYWNoRG9jdW1lbnQoKGRvYykgPT4ge1xuICAgICAgICAgICAgaWYgKGRvYy5pc0ZsYWdnZWRGb3JSZW1vdmFsKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVEb2MoZG9jLmNvbGxlY3Rpb25OYW1lLCBkb2MuZG9jSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRG9jKGNvbGxlY3Rpb25OYW1lLCBkb2NJZCkge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbi5yZW1vdmVkKGNvbGxlY3Rpb25OYW1lLCBkb2NJZCk7XG4gICAgICAgIHRoaXMuX3VucHVibGlzaENoaWxkcmVuT2YoZG9jSWQpO1xuICAgICAgICB0aGlzLnB1Ymxpc2hlZERvY3MucmVtb3ZlKGRvY0lkKTtcbiAgICB9XG5cbiAgICBfdW5wdWJsaXNoQ2hpbGRyZW5PZihkb2NJZCkge1xuICAgICAgICBkZWJ1Z0xvZygnUHVibGljYXRpb24uX3VucHVibGlzaENoaWxkcmVuT2YnLCBgdW5wdWJsaXNoaW5nIGNoaWxkcmVuIG9mICR7dGhpcy5fZ2V0Q29sbGVjdGlvbk5hbWUoKX06JHtkb2NJZH1gKTtcblxuICAgICAgICB0aGlzLnB1Ymxpc2hlZERvY3MuZWFjaENoaWxkUHViKGRvY0lkLCAocHVibGljYXRpb24pID0+IHtcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uLnVucHVibGlzaCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFB1YmxpY2F0aW9uO1xuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcblxuaW1wb3J0IERvY3VtZW50UmVmQ291bnRlciBmcm9tICcuL2RvY19yZWZfY291bnRlcic7XG5pbXBvcnQgeyBkZWJ1Z0xvZyB9IGZyb20gJy4vbG9nZ2luZyc7XG5cblxuY2xhc3MgU3Vic2NyaXB0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihtZXRlb3JTdWIpIHtcbiAgICAgICAgdGhpcy5tZXRlb3JTdWIgPSBtZXRlb3JTdWI7XG4gICAgICAgIHRoaXMuZG9jSGFzaCA9IHt9O1xuICAgICAgICB0aGlzLnJlZkNvdW50ZXIgPSBuZXcgRG9jdW1lbnRSZWZDb3VudGVyKHtcbiAgICAgICAgICAgIG9uQ2hhbmdlOiAoY29sbGVjdGlvbk5hbWUsIGRvY0lkLCByZWZDb3VudCkgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnTG9nKCdTdWJzY3JpcHRpb24ucmVmQ291bnRlci5vbkNoYW5nZScsIGAke2NvbGxlY3Rpb25OYW1lfToke2RvY0lkLnZhbHVlT2YoKX0gJHtyZWZDb3VudH1gKTtcbiAgICAgICAgICAgICAgICBpZiAocmVmQ291bnQgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICBtZXRlb3JTdWIucmVtb3ZlZChjb2xsZWN0aW9uTmFtZSwgZG9jSWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVEb2NIYXNoKGNvbGxlY3Rpb25OYW1lLCBkb2NJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWRkZWQoY29sbGVjdGlvbk5hbWUsIGRvYykge1xuICAgICAgICB0aGlzLnJlZkNvdW50ZXIuaW5jcmVtZW50KGNvbGxlY3Rpb25OYW1lLCBkb2MuX2lkKTtcblxuICAgICAgICBpZiAodGhpcy5faGFzRG9jQ2hhbmdlZChjb2xsZWN0aW9uTmFtZSwgZG9jLl9pZCwgZG9jKSkge1xuICAgICAgICAgICAgZGVidWdMb2coJ1N1YnNjcmlwdGlvbi5hZGRlZCcsIGAke2NvbGxlY3Rpb25OYW1lfToke2RvYy5faWR9YCk7XG4gICAgICAgICAgICB0aGlzLm1ldGVvclN1Yi5hZGRlZChjb2xsZWN0aW9uTmFtZSwgZG9jLl9pZCwgZG9jKTtcbiAgICAgICAgICAgIHRoaXMuX2FkZERvY0hhc2goY29sbGVjdGlvbk5hbWUsIGRvYyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGFuZ2VkKGNvbGxlY3Rpb25OYW1lLCBpZCwgY2hhbmdlcykge1xuICAgICAgICBpZiAodGhpcy5fc2hvdWxkU2VuZENoYW5nZXMoY29sbGVjdGlvbk5hbWUsIGlkLCBjaGFuZ2VzKSkge1xuICAgICAgICAgICAgZGVidWdMb2coJ1N1YnNjcmlwdGlvbi5jaGFuZ2VkJywgYCR7Y29sbGVjdGlvbk5hbWV9OiR7aWR9YCk7XG4gICAgICAgICAgICB0aGlzLm1ldGVvclN1Yi5jaGFuZ2VkKGNvbGxlY3Rpb25OYW1lLCBpZCwgY2hhbmdlcyk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVEb2NIYXNoKGNvbGxlY3Rpb25OYW1lLCBpZCwgY2hhbmdlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVkKGNvbGxlY3Rpb25OYW1lLCBpZCkge1xuICAgICAgICBkZWJ1Z0xvZygnU3Vic2NyaXB0aW9uLnJlbW92ZWQnLCBgJHtjb2xsZWN0aW9uTmFtZX06JHtpZC52YWx1ZU9mKCl9YCk7XG4gICAgICAgIHRoaXMucmVmQ291bnRlci5kZWNyZW1lbnQoY29sbGVjdGlvbk5hbWUsIGlkKTtcbiAgICB9XG5cbiAgICBfYWRkRG9jSGFzaChjb2xsZWN0aW9uTmFtZSwgZG9jKSB7XG4gICAgICAgIHRoaXMuZG9jSGFzaFtidWlsZEhhc2hLZXkoY29sbGVjdGlvbk5hbWUsIGRvYy5faWQpXSA9IGRvYztcbiAgICB9XG5cbiAgICBfdXBkYXRlRG9jSGFzaChjb2xsZWN0aW9uTmFtZSwgaWQsIGNoYW5nZXMpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYnVpbGRIYXNoS2V5KGNvbGxlY3Rpb25OYW1lLCBpZCk7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRG9jID0gdGhpcy5kb2NIYXNoW2tleV0gfHwge307XG4gICAgICAgIHRoaXMuZG9jSGFzaFtrZXldID0gXy5leHRlbmQoZXhpc3RpbmdEb2MsIGNoYW5nZXMpO1xuICAgIH1cblxuICAgIF9zaG91bGRTZW5kQ2hhbmdlcyhjb2xsZWN0aW9uTmFtZSwgaWQsIGNoYW5nZXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzRG9jUHVibGlzaGVkKGNvbGxlY3Rpb25OYW1lLCBpZCkgJiZcbiAgICAgICAgICAgIHRoaXMuX2hhc0RvY0NoYW5nZWQoY29sbGVjdGlvbk5hbWUsIGlkLCBjaGFuZ2VzKTtcbiAgICB9XG5cbiAgICBfaXNEb2NQdWJsaXNoZWQoY29sbGVjdGlvbk5hbWUsIGlkKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGJ1aWxkSGFzaEtleShjb2xsZWN0aW9uTmFtZSwgaWQpO1xuICAgICAgICByZXR1cm4gISF0aGlzLmRvY0hhc2hba2V5XTtcbiAgICB9XG5cbiAgICBfaGFzRG9jQ2hhbmdlZChjb2xsZWN0aW9uTmFtZSwgaWQsIGRvYykge1xuICAgICAgICBjb25zdCBleGlzdGluZ0RvYyA9IHRoaXMuZG9jSGFzaFtidWlsZEhhc2hLZXkoY29sbGVjdGlvbk5hbWUsIGlkKV07XG5cbiAgICAgICAgaWYgKCFleGlzdGluZ0RvYykgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gICAgICAgIHJldHVybiBfLmFueShfLmtleXMoZG9jKSwga2V5ID0+ICFfLmlzRXF1YWwoZG9jW2tleV0sIGV4aXN0aW5nRG9jW2tleV0pKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRG9jSGFzaChjb2xsZWN0aW9uTmFtZSwgaWQpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYnVpbGRIYXNoS2V5KGNvbGxlY3Rpb25OYW1lLCBpZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmRvY0hhc2hba2V5XTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkSGFzaEtleShjb2xsZWN0aW9uTmFtZSwgaWQpIHtcbiAgICByZXR1cm4gYCR7Y29sbGVjdGlvbk5hbWV9Ojoke2lkLnZhbHVlT2YoKX1gO1xufVxuXG5leHBvcnQgZGVmYXVsdCBTdWJzY3JpcHRpb247XG4iLCJjbGFzcyBQdWJsaXNoZWREb2N1bWVudCB7XG4gICAgY29uc3RydWN0b3IoY29sbGVjdGlvbk5hbWUsIGRvY0lkKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uTmFtZTtcbiAgICAgICAgdGhpcy5kb2NJZCA9IGRvY0lkO1xuICAgICAgICB0aGlzLmNoaWxkUHVibGljYXRpb25zID0gW107XG4gICAgICAgIHRoaXMuX2lzRmxhZ2dlZEZvclJlbW92YWwgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZFB1YihjaGlsZFB1YmxpY2F0aW9uKSB7XG4gICAgICAgIHRoaXMuY2hpbGRQdWJsaWNhdGlvbnMucHVzaChjaGlsZFB1YmxpY2F0aW9uKTtcbiAgICB9XG5cbiAgICBlYWNoQ2hpbGRQdWIoY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5jaGlsZFB1YmxpY2F0aW9ucy5mb3JFYWNoKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBpc0ZsYWdnZWRGb3JSZW1vdmFsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNGbGFnZ2VkRm9yUmVtb3ZhbDtcbiAgICB9XG5cbiAgICB1bmZsYWdGb3JSZW1vdmFsKCkge1xuICAgICAgICB0aGlzLl9pc0ZsYWdnZWRGb3JSZW1vdmFsID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZmxhZ0ZvclJlbW92YWwoKSB7XG4gICAgICAgIHRoaXMuX2lzRmxhZ2dlZEZvclJlbW92YWwgPSB0cnVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUHVibGlzaGVkRG9jdW1lbnQ7XG4iLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuXG5pbXBvcnQgUHVibGlzaGVkRG9jdW1lbnQgZnJvbSAnLi9wdWJsaXNoZWRfZG9jdW1lbnQnO1xuXG5cbmNsYXNzIFB1Ymxpc2hlZERvY3VtZW50TGlzdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRzID0ge307XG4gICAgfVxuXG4gICAgYWRkKGNvbGxlY3Rpb25OYW1lLCBkb2NJZCkge1xuICAgICAgICBjb25zdCBrZXkgPSB2YWx1ZU9mSWQoZG9jSWQpO1xuXG4gICAgICAgIGlmICghdGhpcy5kb2N1bWVudHNba2V5XSkge1xuICAgICAgICAgICAgdGhpcy5kb2N1bWVudHNba2V5XSA9IG5ldyBQdWJsaXNoZWREb2N1bWVudChjb2xsZWN0aW9uTmFtZSwgZG9jSWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkQ2hpbGRQdWIoZG9jSWQsIHB1YmxpY2F0aW9uKSB7XG4gICAgICAgIGlmICghcHVibGljYXRpb24pIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgY29uc3Qga2V5ID0gdmFsdWVPZklkKGRvY0lkKTtcbiAgICAgICAgY29uc3QgZG9jID0gdGhpcy5kb2N1bWVudHNba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIGRvYyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jIG5vdCBmb3VuZCBpbiBsaXN0OiAke2tleX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZG9jdW1lbnRzW2tleV0uYWRkQ2hpbGRQdWIocHVibGljYXRpb24pO1xuICAgIH1cblxuICAgIGdldChkb2NJZCkge1xuICAgICAgICBjb25zdCBrZXkgPSB2YWx1ZU9mSWQoZG9jSWQpO1xuICAgICAgICByZXR1cm4gdGhpcy5kb2N1bWVudHNba2V5XTtcbiAgICB9XG5cbiAgICByZW1vdmUoZG9jSWQpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gdmFsdWVPZklkKGRvY0lkKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZG9jdW1lbnRzW2tleV07XG4gICAgfVxuXG4gICAgaGFzKGRvY0lkKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuZ2V0KGRvY0lkKTtcbiAgICB9XG5cbiAgICBlYWNoRG9jdW1lbnQoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgICAgXy5lYWNoKHRoaXMuZG9jdW1lbnRzLCBmdW5jdGlvbiBleGVjQ2FsbGJhY2tPbkRvYyhkb2MpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgZG9jKTtcbiAgICAgICAgfSwgY29udGV4dCB8fCB0aGlzKTtcbiAgICB9XG5cbiAgICBlYWNoQ2hpbGRQdWIoZG9jSWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuZ2V0KGRvY0lkKTtcblxuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICBkb2MuZWFjaENoaWxkUHViKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldElkcygpIHtcbiAgICAgICAgY29uc3QgZG9jSWRzID0gW107XG5cbiAgICAgICAgdGhpcy5lYWNoRG9jdW1lbnQoKGRvYykgPT4ge1xuICAgICAgICAgICAgZG9jSWRzLnB1c2goZG9jLmRvY0lkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRvY0lkcztcbiAgICB9XG5cbiAgICB1bmZsYWdGb3JSZW1vdmFsKGRvY0lkKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuZ2V0KGRvY0lkKTtcblxuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICBkb2MudW5mbGFnRm9yUmVtb3ZhbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmxhZ0FsbEZvclJlbW92YWwoKSB7XG4gICAgICAgIHRoaXMuZWFjaERvY3VtZW50KChkb2MpID0+IHtcbiAgICAgICAgICAgIGRvYy5mbGFnRm9yUmVtb3ZhbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHZhbHVlT2ZJZChkb2NJZCkge1xuICAgIGlmIChkb2NJZCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IElEIGlzIG51bGwnKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkb2NJZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb2N1bWVudCBJRCBpcyB1bmRlZmluZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvY0lkLnZhbHVlT2YoKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgUHVibGlzaGVkRG9jdW1lbnRMaXN0O1xuIl19
