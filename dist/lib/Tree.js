'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Tree
 *
 * @description
 * This file contains the generic class definition of a tree. A tree is defined
 * as an array of JSON objects having a parent key referring to another member
 * of the array.  The only exception is the root node, which does not need to be
 * in the tree.
 */
var _ = require('lodash');
var debug = require('debug')('TreeBuilder');

/**
 * @function buildTreeFromArray
 *
 * @description
 * This function makes a tree data structure from a properly formatted array.
 */
function buildTreeFromArray(nodes, parentId, parentKey) {
  debug('#builtTreeFromArray() called with (Array(' + nodes.length + '), ' + parentId + ', ' + parentKey + '.');

  // recursion base-case:  return nothing if empty array
  if (nodes.length === 0) {
    return null;
  }

  // find nodes which are the children of parentId
  var children = nodes.filter(function (node) {
    return node[parentKey] === parentId;
  });

  // recurse - for each child node, compute their child-trees using the same
  // buildTreeFromArray() command
  children.forEach(function (node) {
    node.children = buildTreeFromArray(nodes, node.id, parentKey);
  });

  // return the list of children
  return children;
}

/**
 * @function flatten
 *
 * @description
 * Operates on constructed trees which have "children" attributes holding all
 * child nodes.  It computes the depth of the node and affixes it to the child
 * node.  This function is recursive.
 *
 * @param {Array} tree - tree structure created by the tree constructor
 * @param {Number} depth - depth attribute
 * @param {Boolen} pruneChildren - instructs the function to remove children
 */
function flatten(tree, depth) {
  var pruneChildren = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var currentDepth = Number.isNaN(depth) || _.isUndefined(depth) ? -1 : depth;
  currentDepth += 1;

  return tree.reduce(function (array, node) {
    node.depth = currentDepth;
    var items = [node].concat(node.children ? flatten(node.children, currentDepth, pruneChildren) : []);

    if (pruneChildren) {
      delete node.children;
    }

    return array.concat(items);
  }, []);
}

/**
 * @function sumOnProperty
 *
 * @description
 * Computes the value of all parent nodes in the tree as the sum of the values
 * of their children for a given property.
 */
function _sumOnProperty(node, prop) {
  if (hasChildren(node)) {
    // recursively compute the value of node[prop] by summing all child[prop]s
    node[prop] = node.children.reduce(function (value, child) {
      return value + _sumOnProperty(child, prop);
    }, 0);
  }

  return node[prop];
}

function hasChildren(node) {
  return node.children.length > 0;
}

function markNodeToPrune(node, fn) {
  if (hasChildren(node)) {
    node.children.forEach(function (child) {
      return markNodeToPrune(child, fn);
    });
  }

  if (fn(node)) {
    node._toPrune = true;
  }
}

var Tree = function () {
  function Tree() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      parentKey: 'parent',
      rootId: 0
    };

    _classCallCheck(this, Tree);

    this._data = data;

    this._parentKey = options.parentKey;
    this._rootId = options.rootId;

    // build the tree with the provided root id and parentKey
    this._tree = buildTreeFromArray(_.cloneDeep(data), this._rootId, this._parentKey);

    debug('#constructor() built tree with ' + this._data.length + ' nodes.');
  }

  _createClass(Tree, [{
    key: 'prune',
    value: function prune(fn) {
      debug('#prune() called on tree strucure.');
      // walk down the tree, marking nodes to be pruned.
      this._tree.forEach(function (node) {
        return markNodeToPrune(node, fn);
      });

      var prev = this.toArray();
      var pruned = prev.filter(function (node) {
        return !node._toPrune;
      });

      debug('#prune() removed ' + (prev.length - pruned.length) + ' nodes from the tree');

      // return an array missing the pruned values
      return pruned;
    }
  }, {
    key: 'toArray',
    value: function toArray() {
      return flatten(this._tree);
    }
  }, {
    key: 'sumOnProperty',
    value: function sumOnProperty(prop) {
      this._tree.forEach(function (node) {
        _sumOnProperty(node, prop);
      });
    }
  }, {
    key: 'filterByLeaf',
    value: function filterByLeaf(prop, value) {
      var _this = this;

      // set the property of the child to the parent up to the top
      this._tree.forEach(function (node) {
        _this.interate(node, prop, value, _this._tree);
      });
      // let filter tree now
      var data = this.toArray().filter(function (row) {
        return row[prop] === value;
      });
      this._data = data;
      this._tree = buildTreeFromArray(_.cloneDeep(data), this._rootId, this._parentKey);
    }

    // set the child's property to parent recursively up to the top

  }, {
    key: 'setPropertyToParent',
    value: function setPropertyToParent(node, prop, value) {
      node[prop] = value;
      if (node.parentNode) {
        this.setPropertyToParent(node.parentNode, prop, value);
      }
    }

    // walk arround the tree
    // search the node by property's value

  }, {
    key: 'interate',
    value: function interate(node, prop, value, parent) {
      var _this2 = this;

      node.parentNode = parent;

      if (node[prop] === value && !parent[prop]) {
        this.setPropertyToParent(parent, prop, value);
      }

      if (node.children) {
        node.children.forEach(function (child) {
          _this2.interate(child, prop, value, node);
        });
      }
      delete node.parentNode;
    }
  }]);

  return Tree;
}();

module.exports = Tree;