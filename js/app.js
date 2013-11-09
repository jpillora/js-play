// Github.js 0.9.0
// (c) 2013 Michael Aufreiter, Development Seed
// Github.js is freely distributable under the MIT license.
// For all details and documentation:
// http://substance.io/michael/github
(function() {

  // Initial Setup
  // -------------
  var XMLHttpRequest = window.XMLHttpRequest;

  var API_URL = 'https://api.github.com';

  var Github = function(options) {

      // HTTP Request Abstraction
      // =======
      //
      // I'm not proud of this and neither should you be if you were responsible for the XMLHttpRequest spec.
      function _request(method, path, data, cb, raw, sync) {
        function getURL() {
          var url = path.indexOf('//') >= 0 ? path : API_URL + path;
          return url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
        }

        var xhr = new XMLHttpRequest();
        if (!raw) {
          xhr.dataType = "json";
        }

        xhr.open(method, getURL(), !sync);
        if (!sync) {
          xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
              if (this.status >= 200 && this.status < 300 || this.status === 304) {
                cb(null, raw ? this.responseText : this.responseText ? JSON.parse(this.responseText) : true, this);
              } else {
                cb({
                  path: path,
                  request: this,
                  error: this.status
                });
              }
            }
          }
        };
        xhr.setRequestHeader('Accept', 'application/vnd.github.raw+json');
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        if ((options.token) || (options.username && options.password)) {
          xhr.setRequestHeader('Authorization', options.token ? 'token ' + options.token : 'Basic ' + window.btoa(options.username + ':' + options.password));
        }
        data ? xhr.send(JSON.stringify(data)) : xhr.send();
        if (sync) return xhr.response;
      }

      function _requestAllPages(path, cb) {
        var results = [];
        (function iterate() {
          _request("GET", path, null, function(err, res, xhr) {
            if (err) {
              return cb(err);
            }

            results.push.apply(results, res);

            var links = (xhr.getResponseHeader('link') || '').split(/\s*,\s*/g),
              next = _.find(links, function(link) {
                return /rel="next"/.test(link);
              });

            if (next) {
              next = (/<(.*)>/.exec(next) || [])[1];
            }

            if (!next) {
              cb(err, results);
            } else {
              path = next;
              iterate();
            }
          });
        })();
      }



      // User API
      // =======
      Github.User = function() {
        this.repos = function(cb) {
          // Github does not always honor the 1000 limit so we want to iterate over the data set.
          _requestAllPages("/user/repos?type=all&per_page=1000&sort=updated", function(err, res) {
            cb(err, res);
          });
        };

        // List user organizations
        // -------
        this.orgs = function(cb) {
          _request("GET", "/user/orgs", null, function(err, res) {
            cb(err, res);
          });
        };

        // List authenticated user's gists
        // -------
        this.gists = function(cb) {
          _request("GET", "/gists", null, function(err, res) {
            cb(err, res);
          });
        };

        // List authenticated user's unread notifications
        // -------
        this.notifications = function(cb) {
          _request("GET", "/notifications", null, function(err, res) {
            cb(err, res);
          });
        };

        // Show user information
        // -------
        this.show = function(username, cb) {
          var command = username ? "/users/" + username : "/user";

          _request("GET", command, null, function(err, res) {
            cb(err, res);
          });
        };

        // List user repositories
        // -------
        this.userRepos = function(username, cb) {
          // Github does not always honor the 1000 limit so we want to iterate over the data set.
          _requestAllPages("/users/" + username + "/repos?type=all&per_page=1000&sort=updated", function(err, res) {
            cb(err, res);
          });
        };

        // List a user's gists
        // -------
        this.userGists = function(username, cb) {
          _request("GET", "/users/" + username + "/gists", null, function(err, res) {
            cb(err, res);
          });
        };

        // List organization repositories
        // -------
        this.orgRepos = function(orgname, cb) {
          // Github does not always honor the 1000 limit so we want to iterate over the data set.
          _requestAllPages("/orgs/" + orgname + "/repos?type=all&&page_num=1000&sort=updated&direction=desc", function(err, res) {
            cb(err, res);
          });
        };

        // Follow user
        // -------
        this.follow = function(username, cb) {
          _request("PUT", "/user/following/" + username, null, function(err, res) {
            cb(err, res);
          });
        };

        // Unfollow user
        // -------
        this.unfollow = function(username, cb) {
          _request("DELETE", "/user/following/" + username, null, function(err, res) {
            cb(err, res);
          });
        };
      };


      // Repository API
      // =======
      Github.Repository = function(options) {
        var repo = options.name;
        var user = options.user;

        var that = this;
        var repoPath = "/repos/" + user + "/" + repo;

        var currentTree = {
          "branch": null,
          "sha": null
        };

        // Uses the cache if branch has not been changed
        // -------
        function updateTree(branch, cb) {
          if (branch === currentTree.branch && currentTree.sha) return cb(null, currentTree.sha);
          that.getRef("heads/" + branch, function(err, sha) {
            currentTree.branch = branch;
            currentTree.sha = sha;
            cb(err, sha);
          });
        }

        // Get a particular reference
        // -------
        this.getRef = function(ref, cb) {
          _request("GET", repoPath + "/git/refs/" + ref, null, function(err, res) {
            if (err) return cb(err);
            cb(null, res.object.sha);
          });
        };

        // Create a new reference
        // --------
        //
        // {
        //   "ref": "refs/heads/my-new-branch-name",
        //   "sha": "827efc6d56897b048c772eb4087f854f46256132"
        // }
        this.createRef = function(options, cb) {
          _request("POST", repoPath + "/git/refs", options, cb);
        };

        // Delete a reference
        // --------
        //
        // repo.deleteRef('heads/gh-pages')
        // repo.deleteRef('tags/v1.0')
        this.deleteRef = function(ref, cb) {
          _request("DELETE", repoPath + "/git/refs/" + ref, options, cb);
        };

        // Create a repo  
        // -------
        this.createRepo = function(options, cb) {
          _request("POST", "/user/repos", options, cb);
        };

        // Delete a repo  
        // --------  
        this.deleteRepo = function(cb) {
          _request("DELETE", repoPath, options, cb);
        };

        // List all tags of a repository
        // -------
        this.listTags = function(cb) {
          _request("GET", repoPath + "/tags", null, function(err, tags) {
            if (err) return cb(err);
            cb(null, tags);
          });
        };

        // List all pull requests of a respository
        // -------
        this.listPulls = function(state, cb) {
          _request("GET", repoPath + "/pulls" + (state ? '?state=' + state : ''), null, function(err, pulls) {
            if (err) return cb(err);
            cb(null, pulls);
          });
        };

        // Gets details for a specific pull request
        // -------
        this.getPull = function(number, cb) {
          _request("GET", repoPath + "/pulls/" + number, null, function(err, pull) {
            if (err) return cb(err);
            cb(null, pull);
          });
        };

        // Retrieve the changes made between base and head
        // -------
        this.compare = function(base, head, cb) {
          _request("GET", repoPath + "/compare/" + base + "..." + head, null, function(err, diff) {
            if (err) return cb(err);
            cb(null, diff);
          });
        };

        // List all branches of a repository
        // -------
        this.listBranches = function(cb) {
          _request("GET", repoPath + "/git/refs/heads", null, function(err, heads) {
            if (err) return cb(err);
            cb(null, _.map(heads, function(head) {
              return _.last(head.ref.split('/'));
            }));
          });
        };

        // Retrieve the contents of a blob
        // -------
        this.getBlob = function(sha, cb) {
          _request("GET", repoPath + "/git/blobs/" + sha, null, cb, 'raw');
        };

        // For a given file path, get the corresponding sha (blob for files, tree for dirs)
        // -------
        this.getSha = function(branch, path, cb) {
          // Just use head if path is empty
          if (path === "") return that.getRef("heads/" + branch, cb);
          that.getTree(branch + "?recursive=true", function(err, tree) {
            if (err) return cb(err);
            var file = _.select(tree, function(file) {
              return file.path === path;
            })[0];
            cb(null, file ? file.sha : null);
          });
        };

        // Retrieve the tree a commit points to
        // -------
        this.getTree = function(tree, cb) {
          _request("GET", repoPath + "/git/trees/" + tree, null, function(err, res) {
            if (err) return cb(err);
            cb(null, res.tree);
          });
        };

        // Post a new blob object, getting a blob SHA back
        // -------
        this.postBlob = function(content, cb) {
          if (typeof(content) === "string") {
            content = {
              "content": content,
              "encoding": "utf-8"
            };
          }

          _request("POST", repoPath + "/git/blobs", content, function(err, res) {
            if (err) return cb(err);
            cb(null, res.sha);
          });
        };

        // Update an existing tree adding a new blob object getting a tree SHA back
        // -------
        this.updateTree = function(baseTree, path, blob, cb) {
          var data = {
            "base_tree": baseTree,
            "tree": [{
              "path": path,
              "mode": "100644",
              "type": "blob",
              "sha": blob
            }]
          };
          _request("POST", repoPath + "/git/trees", data, function(err, res) {
            if (err) return cb(err);
            cb(null, res.sha);
          });
        };

        // Post a new tree object having a file path pointer replaced
        // with a new blob SHA getting a tree SHA back
        // -------
        this.postTree = function(tree, cb) {
          _request("POST", repoPath + "/git/trees", {
            "tree": tree
          }, function(err, res) {
            if (err) return cb(err);
            cb(null, res.sha);
          });
        };

        // Create a new commit object with the current commit SHA as the parent
        // and the new tree SHA, getting a commit SHA back
        // -------
        this.commit = function(parent, tree, message, cb) {
          var data = {
            "message": message,
            "author": {
              "name": options.username
            },
            "parents": [
            parent],
            "tree": tree
          };

          _request("POST", repoPath + "/git/commits", data, function(err, res) {
            currentTree.sha = res.sha; // update latest commit
            if (err) return cb(err);
            cb(null, res.sha);
          });
        };

        // Update the reference of your head to point to the new commit SHA
        // -------
        this.updateHead = function(head, commit, cb) {
          _request("PATCH", repoPath + "/git/refs/heads/" + head, {
            "sha": commit
          }, function(err, res) {
            cb(err);
          });
        };

        // Show repository information
        // -------
        this.show = function(cb) {
          _request("GET", repoPath, null, cb);
        };

        // Get contents
        // --------
        this.contents = function(branch, path, cb, sync) {
          return _request("GET", repoPath + "/contents?ref=" + branch + (path ? "&path=" + path : ""), null, cb, 'raw', sync);
        };

        // Fork repository
        // -------
        this.fork = function(cb) {
          _request("POST", repoPath + "/forks", null, cb);
        };

        // Branch repository  
        // --------  
        this.branch = function(oldBranch, newBranch, cb) {
          if (arguments.length === 2 && typeof arguments[1] === "function") {
            cb = newBranch;
            newBranch = oldBranch;
            oldBranch = "master";
          }
          this.getRef("heads/" + oldBranch, function(err, ref) {
            if (err && cb) return cb(err);
            that.createRef({
              ref: "refs/heads/" + newBranch,
              sha: ref
            }, cb);
          });
        }

        // Create pull request
        // --------
        this.createPullRequest = function(options, cb) {
          _request("POST", repoPath + "/pulls", options, cb);
        };

        // List hooks
        // --------
        this.listHooks = function(cb) {
          _request("GET", repoPath + "/hooks", null, cb);
        };

        // Get a hook
        // --------
        this.getHook = function(id, cb) {
          _request("GET", repoPath + "/hooks/" + id, null, cb);
        };

        // Create a hook
        // --------
        this.createHook = function(options, cb) {
          _request("POST", repoPath + "/hooks", options, cb);
        };

        // Edit a hook
        // --------
        this.editHook = function(id, options, cb) {
          _request("PATCH", repoPath + "/hooks/" + id, options, cb);
        };

        // Delete a hook
        // --------
        this.deleteHook = function(id, cb) {
          _request("DELETE", repoPath + "/hooks/" + id, null, cb);
        };

        // Read file at given path
        // -------
        this.read = function(branch, path, cb) {
          that.getSha(branch, path, function(err, sha) {
            if (!sha) return cb("not found", null);
            that.getBlob(sha, function(err, content) {
              cb(err, content, sha);
            });
          });
        };

        // Remove a file from the tree
        // -------
        this.remove = function(branch, path, cb) {
          updateTree(branch, function(err, latestCommit) {
            that.getTree(latestCommit + "?recursive=true", function(err, tree) {
              // Update Tree
              var newTree = _.reject(tree, function(ref) {
                return ref.path === path;
              });
              _.each(newTree, function(ref) {
                if (ref.type === "tree") delete ref.sha;
              });

              that.postTree(newTree, function(err, rootTree) {
                that.commit(latestCommit, rootTree, 'Deleted ' + path, function(err, commit) {
                  that.updateHead(branch, commit, function(err) {
                    cb(err);
                  });
                });
              });
            });
          });
        };

        // Move a file to a new location
        // -------
        this.move = function(branch, path, newPath, cb) {
          updateTree(branch, function(err, latestCommit) {
            that.getTree(latestCommit + "?recursive=true", function(err, tree) {
              // Update Tree
              _.each(tree, function(ref) {
                if (ref.path === path) ref.path = newPath;
                if (ref.type === "tree") delete ref.sha;
              });

              that.postTree(tree, function(err, rootTree) {
                that.commit(latestCommit, rootTree, 'Deleted ' + path, function(err, commit) {
                  that.updateHead(branch, commit, function(err) {
                    cb(err);
                  });
                });
              });
            });
          });
        };

        // Write file contents to a given branch and path
        // -------
        this.write = function(branch, path, content, message, cb) {
          updateTree(branch, function(err, latestCommit) {
            if (err) return cb(err);
            that.postBlob(content, function(err, blob) {
              if (err) return cb(err);
              that.updateTree(latestCommit, path, blob, function(err, tree) {
                if (err) return cb(err);
                that.commit(latestCommit, tree, message, function(err, commit) {
                  if (err) return cb(err);
                  that.updateHead(branch, commit, cb);
                });
              });
            });
          });
        };

        // List commits on a repository. Takes an object of optional paramaters:
        // sha: SHA or branch to start listing commits from
        // path: Only commits containing this file path will be returned
        // since: ISO 8601 date - only commits after this date will be returned
        // until: ISO 8601 date - only commits before this date will be returned
        // -------
        this.getCommits = function(options, cb) {
          options = options || {};
          var url = repoPath + "/commits";
          var params = [];
          if (options.sha) {
            params.push("sha=" + encodeURIComponent(options.sha));
          }
          if (options.path) {
            params.push("path=" + encodeURIComponent(options.path));
          }
          if (options.since) {
            var since = options.since;
            if (since.constructor === Date) {
              since = since.toISOString();
            }
            params.push("since=" + encodeURIComponent(since));
          }
          if (options.until) {
            var until = options.until;
            if (until.constructor === Date) {
              until = until.toISOString();
            }
            params.push("until=" + encodeURIComponent(until));
          }
          if (params.length > 0) {
            url += "?" + params.join("&");
          }
          _request("GET", url, null, cb);
        };
      };

      // Gists API
      // =======
      Github.Gist = function(options) {
        var id = options.id;
        var gistPath = "/gists/" + id;

        // Read the gist
        // --------
        this.read = function(cb) {
          _request("GET", gistPath, null, function(err, gist) {
            cb(err, gist);
          });
        };

        // Create the gist
        // --------
        // {
        //  "description": "the description for this gist",
        //    "public": true,
        //    "files": {
        //      "file1.txt": {
        //        "content": "String file contents"
        //      }
        //    }
        // }
        this.create = function(options, cb) {
          _request("POST", "/gists", options, cb);
        };

        // Delete the gist
        // --------
        this.delete = function(cb) {
          _request("DELETE", gistPath, null, function(err, res) {
            cb(err, res);
          });
        };

        // Fork a gist
        // --------
        this.fork = function(cb) {
          _request("POST", gistPath + "/fork", null, function(err, res) {
            cb(err, res);
          });
        };

        // Update a gist with the new stuff
        // --------
        this.update = function(options, cb) {
          _request("PATCH", gistPath, options, function(err, res) {
            cb(err, res);
          });
        };

        // Star a gist
        // --------
        this.star = function(cb) {
          _request("PUT", gistPath + "/star", null, function(err, res) {
            cb(err, res);
          });
        };

        // Untar a gist
        // --------
        this.unstar = function(cb) {
          _request("DELETE", gistPath + "/star", null, function(err, res) {
            cb(err, res);
          });
        };

        // Check if a gist is starred
        // --------
        this.isStarred = function(cb) {
          _request("GET", gistPath + "/star", null, function(err, res) {
            cb(err, res);
          });
        };
      };

      // Issues API
      // ==========
      Github.Issue = function(options) {
        var path = "/repos/" + options.user + "/" + options.repo + "/issues";

        this.list = function(options, cb) {
          _request("GET", path, options, function(err, res) {
            cb(err, res)
          });
        };
      };

      // Top Level API
      // -------
      this.getIssues = function(user, repo) {
        return new Github.Issue({
          user: user,
          repo: repo
        });
      };

      this.getRepo = function(user, repo) {
        return new Github.Repository({
          user: user,
          name: repo
        });
      };

      this.getUser = function() {
        return new Github.User();
      };

      this.getGist = function(id) {
        return new Github.Gist({
          id: id
        });
      };
    };


  if (typeof exports !== 'undefined') {
    // Github = exports;
    module.exports = Github;
  } else {
    window.Github = Github;
  }
}).call(this);
/** Notify.js - v0.3.1 - 2013/07/05
 * http://notifyjs.com/
 * Copyright (c) 2013 Jaime Pillora - MIT
 */
(function(window,document,$,undefined) {
'use strict';

var Notification, addStyle, blankFieldName, coreStyle, createElem, defaults, encode, find, findFields, getAnchorElement, getStyle, globalAnchors, hAligns, incr, inherit, insertCSS, mainPositions, opposites, parsePosition, pluginClassName, pluginName, pluginOptions, positions, realign, stylePrefixes, styles, vAligns,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

pluginName = 'notify';

pluginClassName = pluginName + 'js';

blankFieldName = pluginName + "!blank";

positions = {
  t: 'top',
  m: 'middle',
  b: 'bottom',
  l: 'left',
  c: 'center',
  r: 'right'
};

hAligns = ['l', 'c', 'r'];

vAligns = ['t', 'm', 'b'];

mainPositions = ['t', 'b', 'l', 'r'];

opposites = {
  t: 'b',
  m: null,
  b: 't',
  l: 'r',
  c: null,
  r: 'l'
};

parsePosition = function(str) {
  var pos;
  pos = [];
  $.each(str.split(/\W+/), function(i, word) {
    var w;
    w = word.toLowerCase().charAt(0);
    if (positions[w]) {
      return pos.push(w);
    }
  });
  return pos;
};

styles = {};

coreStyle = {
  name: 'core',
  html: "<div class=\"" + pluginClassName + "-wrapper\">\n  <div class=\"" + pluginClassName + "-arrow\"></div>\n  <div class=\"" + pluginClassName + "-container\"></div>\n</div>",
  css: "." + pluginClassName + "-corner {\n  position: fixed;\n  margin: 5px;\n  z-index: 1050;\n}\n\n." + pluginClassName + "-corner ." + pluginClassName + "-wrapper,\n." + pluginClassName + "-corner ." + pluginClassName + "-container {\n  position: relative;\n  display: block;\n  height: inherit;\n  width: inherit;\n  margin: 3px;\n}\n\n." + pluginClassName + "-wrapper {\n  z-index: 1;\n  position: absolute;\n  display: inline-block;\n  height: 0;\n  width: 0;\n}\n\n." + pluginClassName + "-container {\n  display: none;\n  z-index: 1;\n  position: absolute;\n  cursor: pointer;\n}\n\n[data-notify-text],[data-notify-html] {\n  position: relative;\n}\n\n." + pluginClassName + "-arrow {\n  position: absolute;\n  z-index: 2;\n  width: 0;\n  height: 0;\n}"
};

stylePrefixes = {
  "border-radius": ["-webkit-", "-moz-"]
};

getStyle = function(name) {
  return styles[name];
};

addStyle = function(name, def) {
  var cssText, elem, fields, _ref;
  if (!name) {
    throw "Missing Style name";
  }
  if (!def) {
    throw "Missing Style definition";
  }
  if (!def.html) {
    throw "Missing Style HTML";
  }
  if ((_ref = styles[name]) != null ? _ref.cssElem : void 0) {
    if (window.console) {
      console.warn("" + pluginName + ": overwriting style '" + name + "'");
    }
    styles[name].cssElem.remove();
  }
  def.name = name;
  styles[name] = def;
  cssText = "";
  if (def.classes) {
    $.each(def.classes, function(className, props) {
      cssText += "." + pluginClassName + "-" + def.name + "-" + className + " {\n";
      $.each(props, function(name, val) {
        if (stylePrefixes[name]) {
          $.each(stylePrefixes[name], function(i, prefix) {
            return cssText += "  " + prefix + name + ": " + val + ";\n";
          });
        }
        return cssText += "  " + name + ": " + val + ";\n";
      });
      return cssText += "}\n";
    });
  }
  if (def.css) {
    cssText += "/* styles for " + def.name + " */\n" + def.css;
  }
  if (cssText) {
    def.cssElem = insertCSS(cssText);
    def.cssElem.attr('id', "notify-" + def.name);
  }
  fields = {};
  elem = $(def.html);
  findFields('html', elem, fields);
  findFields('text', elem, fields);
  return def.fields = fields;
};

insertCSS = function(cssText) {
  var elem;
  elem = createElem("style");
  elem.attr('type', 'text/css');
  $("head").append(elem);
  try {
    elem.html(cssText);
  } catch (e) {
    elem[0].styleSheet.cssText = cssText;
  }
  return elem;
};

findFields = function(type, elem, fields) {
  var attr;
  if (type !== 'html') {
    type = 'text';
  }
  attr = "data-notify-" + type;
  return find(elem, "[" + attr + "]").each(function() {
    var name;
    name = $(this).attr(attr);
    if (!name) {
      name = blankFieldName;
    }
    return fields[name] = type;
  });
};

find = function(elem, selector) {
  if (elem.is(selector)) {
    return elem;
  } else {
    return elem.find(selector);
  }
};

pluginOptions = {
  clickToHide: true,
  autoHide: true,
  autoHideDelay: 5000,
  arrowShow: true,
  arrowSize: 5,
  breakNewLines: true,
  elementPosition: 'bottom',
  globalPosition: 'top right',
  style: 'bootstrap',
  className: 'error',
  showAnimation: 'slideDown',
  showDuration: 400,
  hideAnimation: 'slideUp',
  hideDuration: 200,
  gap: 5
};

inherit = function(a, b) {
  var F;
  F = function() {};
  F.prototype = a;
  return $.extend(true, new F(), b);
};

defaults = function(opts) {
  return $.extend(pluginOptions, opts);
};

createElem = function(tag) {
  return $("<" + tag + "></" + tag + ">");
};

globalAnchors = {};

getAnchorElement = function(element) {
  var radios;
  if (element.is('[type=radio]')) {
    radios = element.parents('form:first').find('[type=radio]').filter(function(i, e) {
      return $(e).attr('name') === element.attr('name');
    });
    element = radios.first();
  }
  return element;
};

incr = function(obj, pos, val) {
  var opp, temp;
  if (typeof val === 'string') {
    val = parseInt(val, 10);
  } else if (typeof val !== 'number') {
    return;
  }
  if (isNaN(val)) {
    return;
  }
  opp = positions[opposites[pos.charAt(0)]];
  temp = pos;
  if (obj[opp] !== undefined) {
    pos = positions[opp.charAt(0)];
    val = -val;
  }
  if (obj[pos] === undefined) {
    obj[pos] = val;
  } else {
    obj[pos] += val;
  }
  return null;
};

realign = function(alignment, inner, outer) {
  if (alignment === 'l' || alignment === 't') {
    return 0;
  } else if (alignment === 'c' || alignment === 'm') {
    return outer / 2 - inner / 2;
  } else if (alignment === 'r' || alignment === 'b') {
    return outer - inner;
  }
  throw "Invalid alignment";
};

encode = function(text) {
  encode.e = encode.e || createElem("div");
  return encode.e.text(text).html();
};

Notification = (function() {

  function Notification(elem, data, options) {
    if (typeof options === 'string') {
      options = {
        className: options
      };
    }
    this.options = inherit(pluginOptions, $.isPlainObject(options) ? options : {});
    this.loadHTML();
    this.wrapper = $(coreStyle.html);
    this.wrapper.data(pluginClassName, this);
    this.arrow = this.wrapper.find("." + pluginClassName + "-arrow");
    this.container = this.wrapper.find("." + pluginClassName + "-container");
    this.container.append(this.userContainer);
    if (elem && elem.length) {
      this.elementType = elem.attr('type');
      this.originalElement = elem;
      this.elem = getAnchorElement(elem);
      this.elem.data(pluginClassName, this);
      this.elem.before(this.wrapper);
    }
    this.container.hide();
    this.run(data);
  }

  Notification.prototype.loadHTML = function() {
    var style;
    style = this.getStyle();
    this.userContainer = $(style.html);
    return this.userFields = style.fields;
  };

  Notification.prototype.show = function(show, userCallback) {
    var args, callback, elems, fn, hidden,
      _this = this;
    callback = function() {
      if (!show && !_this.elem) {
        _this.destroy();
      }
      if (userCallback) {
        return userCallback();
      }
    };
    hidden = this.container.parent().parents(':hidden').length > 0;
    elems = this.container.add(this.arrow);
    args = [];
    if (hidden && show) {
      fn = 'show';
    } else if (hidden && !show) {
      fn = 'hide';
    } else if (!hidden && show) {
      fn = this.options.showAnimation;
      args.push(this.options.showDuration);
    } else if (!hidden && !show) {
      fn = this.options.hideAnimation;
      args.push(this.options.hideDuration);
    } else {
      return callback();
    }
    args.push(callback);
    return elems[fn].apply(elems, args);
  };

  Notification.prototype.setGlobalPosition = function() {
    var align, anchor, css, key, main, pAlign, pMain, position;
    position = this.getPosition();
    pMain = position[0], pAlign = position[1];
    main = positions[pMain];
    align = positions[pAlign];
    key = pMain + "|" + pAlign;
    anchor = globalAnchors[key];
    if (!anchor) {
      anchor = globalAnchors[key] = createElem("div");
      css = {};
      css[main] = 0;
      if (align === 'middle') {
        css.top = '45%';
      } else if (align === 'center') {
        css.left = '45%';
      } else {
        css[align] = 0;
      }
      anchor.css(css).addClass("" + pluginClassName + "-corner");
      $("body").append(anchor);
    }
    return anchor.prepend(this.wrapper);
  };

  Notification.prototype.setElementPosition = function() {
    var arrowColor, arrowCss, arrowSize, color, contH, contW, css, elemH, elemIH, elemIW, elemPos, elemW, gap, mainFull, margin, opp, oppFull, pAlign, pArrow, pMain, pos, posFull, position, wrapPos, _i, _j, _len, _len1, _ref;
    position = this.getPosition();
    pMain = position[0], pAlign = position[1], pArrow = position[2];
    elemPos = this.elem.position();
    elemH = this.elem.outerHeight();
    elemW = this.elem.outerWidth();
    elemIH = this.elem.innerHeight();
    elemIW = this.elem.innerWidth();
    wrapPos = this.wrapper.position();
    contH = this.container.height();
    contW = this.container.width();
    mainFull = positions[pMain];
    opp = opposites[pMain];
    oppFull = positions[opp];
    css = {};
    css[oppFull] = pMain === 'b' ? elemH : pMain === 'r' ? elemW : 0;
    incr(css, 'top', elemPos.top - wrapPos.top);
    incr(css, 'left', elemPos.left - wrapPos.left);
    _ref = ['top', 'left'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pos = _ref[_i];
      margin = parseInt(this.elem.css("margin-" + pos), 10);
      if (margin) {
        incr(css, pos, margin);
      }
    }
    gap = Math.max(0, this.options.gap - (this.options.arrowShow ? arrowSize : 0));
    incr(css, oppFull, gap);
    if (!this.options.arrowShow) {
      this.arrow.hide();
    } else {
      arrowSize = this.options.arrowSize;
      arrowCss = $.extend({}, css);
      arrowColor = this.userContainer.css("border-color") || this.userContainer.css("background-color") || 'white';
      for (_j = 0, _len1 = mainPositions.length; _j < _len1; _j++) {
        pos = mainPositions[_j];
        posFull = positions[pos];
        if (pos === opp) {
          continue;
        }
        color = posFull === mainFull ? arrowColor : 'transparent';
        arrowCss["border-" + posFull] = "" + arrowSize + "px solid " + color;
      }
      incr(css, positions[opp], arrowSize);
      if (__indexOf.call(mainPositions, pAlign) >= 0) {
        incr(arrowCss, positions[pAlign], arrowSize * 2);
      }
    }
    if (__indexOf.call(vAligns, pMain) >= 0) {
      incr(css, 'left', realign(pAlign, contW, elemW));
      if (arrowCss) {
        incr(arrowCss, 'left', realign(pAlign, arrowSize, elemIW));
      }
    } else if (__indexOf.call(hAligns, pMain) >= 0) {
      incr(css, 'top', realign(pAlign, contH, elemH));
      if (arrowCss) {
        incr(arrowCss, 'top', realign(pAlign, arrowSize, elemIH));
      }
    }
    if (this.container.is(":visible")) {
      css.display = 'block';
    }
    this.container.removeAttr('style').css(css);
    if (arrowCss) {
      return this.arrow.removeAttr('style').css(arrowCss);
    }
  };

  Notification.prototype.getPosition = function() {
    var pos, text, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    text = this.options.position || (this.elem ? this.options.elementPosition : this.options.globalPosition);
    pos = parsePosition(text);
    if (pos.length === 0) {
      pos[0] = 'b';
    }
    if (_ref = pos[0], __indexOf.call(mainPositions, _ref) < 0) {
      throw "Must be one of [" + mainPositions + "]";
    }
    if (pos.length === 1 || ((_ref1 = pos[0], __indexOf.call(vAligns, _ref1) >= 0) && (_ref2 = pos[1], __indexOf.call(hAligns, _ref2) < 0)) || ((_ref3 = pos[0], __indexOf.call(hAligns, _ref3) >= 0) && (_ref4 = pos[1], __indexOf.call(vAligns, _ref4) < 0))) {
      pos[1] = (_ref5 = pos[0], __indexOf.call(hAligns, _ref5) >= 0) ? 'm' : 'l';
    }
    if (pos.length === 2) {
      pos[2] = pos[1];
    }
    return pos;
  };

  Notification.prototype.getStyle = function(name) {
    var style;
    if (!name) {
      name = this.options.style;
    }
    if (!name) {
      name = 'default';
    }
    style = styles[name];
    if (!style) {
      throw "Missing style: " + name;
    }
    return style;
  };

  Notification.prototype.updateClasses = function() {
    var classes, style;
    classes = ['base'];
    if ($.isArray(this.options.className)) {
      classes = classes.concat(this.options.className);
    } else if (this.options.className) {
      classes.push(this.options.className);
    }
    style = this.getStyle();
    classes = $.map(classes, function(n) {
      return "" + pluginClassName + "-" + style.name + "-" + n;
    }).join(' ');
    return this.userContainer.attr('class', classes);
  };

  Notification.prototype.run = function(data, options) {
    var d, datas, name, type, value,
      _this = this;
    if ($.isPlainObject(options)) {
      $.extend(this.options, options);
    } else if ($.type(options) === 'string') {
      this.options.color = options;
    }
    if (this.container && !data) {
      this.show(false);
      return;
    } else if (!this.container && !data) {
      return;
    }
    datas = {};
    if ($.isPlainObject(data)) {
      datas = data;
    } else {
      datas[blankFieldName] = data;
    }
    for (name in datas) {
      d = datas[name];
      type = this.userFields[name];
      if (!type) {
        continue;
      }
      if (type === 'text') {
        d = encode(d);
        if (this.options.breakNewLines) {
          d = d.replace(/\n/g, '<br/>');
        }
      }
      value = name === blankFieldName ? '' : '=' + name;
      find(this.userContainer, "[data-notify-" + type + value + "]").html(d);
    }
    this.updateClasses();
    if (this.elem) {
      this.setElementPosition();
    } else {
      this.setGlobalPosition();
    }
    this.show(true);
    if (this.options.autoHide) {
      clearTimeout(this.autohideTimer);
      return this.autohideTimer = setTimeout(function() {
        return _this.show(false);
      }, this.options.autoHideDelay);
    }
  };

  Notification.prototype.destroy = function() {
    return this.wrapper.remove();
  };

  return Notification;

})();

$[pluginName] = function(elem, data, options) {
  if ((elem && elem.nodeName) || elem.jquery) {
    $(elem)[pluginName](data, options);
  } else {
    options = data;
    data = elem;
    new Notification(null, data, options);
  }
  return elem;
};

$.fn[pluginName] = function(data, options) {
  $(this).each(function() {
    var inst;
    inst = getAnchorElement($(this)).data(pluginClassName);
    if (inst) {
      return inst.run(data, options);
    } else {
      return new Notification($(this), data, options);
    }
  });
  return this;
};

$.extend($[pluginName], {
  defaults: defaults,
  addStyle: addStyle,
  pluginOptions: pluginOptions,
  getStyle: getStyle,
  insertCSS: insertCSS
});

$(function() {
  insertCSS(coreStyle.css).attr('id', 'core-notify');
  return $(document).on('click notify-hide', "." + pluginClassName + "-wrapper", function(e) {
    var inst;
    inst = $(this).data(pluginClassName);
    if (inst && (inst.options.clickToHide || e.type === 'notify-hide')) {
      return inst.show(false);
    }
  });
});

}(window,document,jQuery));

$.notify.addStyle("bootstrap", {
  html: "<div>\n<span data-notify-text></span>\n</div>",
  classes: {
    base: {
      "font-weight": "bold",
      "padding": "8px 15px 8px 14px",
      "text-shadow": "0 1px 0 rgba(255, 255, 255, 0.5)",
      "background-color": "#fcf8e3",
      "border": "1px solid #fbeed5",
      "border-radius": "4px",
      "white-space": "nowrap",
      "padding-left": "25px",
      "background-repeat": "no-repeat",
      "background-position": "3px 7px"
    },
    error: {
      "color": "#B94A48",
      "background-color": "#F2DEDE",
      "border-color": "#EED3D7",
      "background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtRJREFUeNqkVc1u00AQHq+dOD+0poIQfkIjalW0SEGqRMuRnHos3DjwAH0ArlyQeANOOSMeAA5VjyBxKBQhgSpVUKKQNGloFdw4cWw2jtfMOna6JOUArDTazXi/b3dm55socPqQhFka++aHBsI8GsopRJERNFlY88FCEk9Yiwf8RhgRyaHFQpPHCDmZG5oX2ui2yilkcTT1AcDsbYC1NMAyOi7zTX2Agx7A9luAl88BauiiQ/cJaZQfIpAlngDcvZZMrl8vFPK5+XktrWlx3/ehZ5r9+t6e+WVnp1pxnNIjgBe4/6dAysQc8dsmHwPcW9C0h3fW1hans1ltwJhy0GxK7XZbUlMp5Ww2eyan6+ft/f2FAqXGK4CvQk5HueFz7D6GOZtIrK+srupdx1GRBBqNBtzc2AiMr7nPplRdKhb1q6q6zjFhrklEFOUutoQ50xcX86ZlqaZpQrfbBdu2R6/G19zX6XSgh6RX5ubyHCM8nqSID6ICrGiZjGYYxojEsiw4PDwMSL5VKsC8Yf4VRYFzMzMaxwjlJSlCyAQ9l0CW44PBADzXhe7xMdi9HtTrdYjFYkDQL0cn4Xdq2/EAE+InCnvADTf2eah4Sx9vExQjkqXT6aAERICMewd/UAp/IeYANM2joxt+q5VI+ieq2i0Wg3l6DNzHwTERPgo1ko7XBXj3vdlsT2F+UuhIhYkp7u7CarkcrFOCtR3H5JiwbAIeImjT/YQKKBtGjRFCU5IUgFRe7fF4cCNVIPMYo3VKqxwjyNAXNepuopyqnld602qVsfRpEkkz+GFL1wPj6ySXBpJtWVa5xlhpcyhBNwpZHmtX8AGgfIExo0ZpzkWVTBGiXCSEaHh62/PoR0p/vHaczxXGnj4bSo+G78lELU80h1uogBwWLf5YlsPmgDEd4M236xjm+8nm4IuE/9u+/PH2JXZfbwz4zw1WbO+SQPpXfwG/BBgAhCNZiSb/pOQAAAAASUVORK5CYII=)"
    },
    success: {
      "color": "#468847",
      "background-color": "#DFF0D8",
      "border-color": "#D6E9C6",
      "background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAutJREFUeNq0lctPE0Ecx38zu/RFS1EryqtgJFA08YCiMZIAQQ4eRG8eDGdPJiYeTIwHTfwPiAcvXIwXLwoXPaDxkWgQ6islKlJLSQWLUraPLTv7Gme32zoF9KSTfLO7v53vZ3d/M7/fIth+IO6INt2jjoA7bjHCJoAlzCRw59YwHYjBnfMPqAKWQYKjGkfCJqAF0xwZjipQtA3MxeSG87VhOOYegVrUCy7UZM9S6TLIdAamySTclZdYhFhRHloGYg7mgZv1Zzztvgud7V1tbQ2twYA34LJmF4p5dXF1KTufnE+SxeJtuCZNsLDCQU0+RyKTF27Unw101l8e6hns3u0PBalORVVVkcaEKBJDgV3+cGM4tKKmI+ohlIGnygKX00rSBfszz/n2uXv81wd6+rt1orsZCHRdr1Imk2F2Kob3hutSxW8thsd8AXNaln9D7CTfA6O+0UgkMuwVvEFFUbbAcrkcTA8+AtOk8E6KiQiDmMFSDqZItAzEVQviRkdDdaFgPp8HSZKAEAL5Qh7Sq2lIJBJwv2scUqkUnKoZgNhcDKhKg5aH+1IkcouCAdFGAQsuWZYhOjwFHQ96oagWgRoUov1T9kRBEODAwxM2QtEUl+Wp+Ln9VRo6BcMw4ErHRYjH4/B26AlQoQQTRdHWwcd9AH57+UAXddvDD37DmrBBV34WfqiXPl61g+vr6xA9zsGeM9gOdsNXkgpEtTwVvwOklXLKm6+/p5ezwk4B+j6droBs2CsGa/gNs6RIxazl4Tc25mpTgw/apPR1LYlNRFAzgsOxkyXYLIM1V8NMwyAkJSctD1eGVKiq5wWjSPdjmeTkiKvVW4f2YPHWl3GAVq6ymcyCTgovM3FzyRiDe2TaKcEKsLpJvNHjZgPNqEtyi6mZIm4SRFyLMUsONSSdkPeFtY1n0mczoY3BHTLhwPRy9/lzcziCw9ACI+yql0VLzcGAZbYSM5CCSZg1/9oc/nn7+i8N9p/8An4JMADxhH+xHfuiKwAAAABJRU5ErkJggg==)"
    },
    info: {
      "color": "#3A87AD",
      "background-color": "#D9EDF7",
      "border-color": "#BCE8F1",
      "background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QYFAhkSsdes/QAAA8dJREFUOMvVlGtMW2UYx//POaWHXg6lLaW0ypAtw1UCgbniNOLcVOLmAjHZolOYlxmTGXVZdAnRfXQm+7SoU4mXaOaiZsEpC9FkiQs6Z6bdCnNYruM6KNBw6YWewzl9z+sHImEWv+vz7XmT95f/+3/+7wP814v+efDOV3/SoX3lHAA+6ODeUFfMfjOWMADgdk+eEKz0pF7aQdMAcOKLLjrcVMVX3xdWN29/GhYP7SvnP0cWfS8caSkfHZsPE9Fgnt02JNutQ0QYHB2dDz9/pKX8QjjuO9xUxd/66HdxTeCHZ3rojQObGQBcuNjfplkD3b19Y/6MrimSaKgSMmpGU5WevmE/swa6Oy73tQHA0Rdr2Mmv/6A1n9w9suQ7097Z9lM4FlTgTDrzZTu4StXVfpiI48rVcUDM5cmEksrFnHxfpTtU/3BFQzCQF/2bYVoNbH7zmItbSoMj40JSzmMyX5qDvriA7QdrIIpA+3cdsMpu0nXI8cV0MtKXCPZev+gCEM1S2NHPvWfP/hL+7FSr3+0p5RBEyhEN5JCKYr8XnASMT0xBNyzQGQeI8fjsGD39RMPk7se2bd5ZtTyoFYXftF6y37gx7NeUtJJOTFlAHDZLDuILU3j3+H5oOrD3yWbIztugaAzgnBKJuBLpGfQrS8wO4FZgV+c1IxaLgWVU0tMLEETCos4xMzEIv9cJXQcyagIwigDGwJgOAtHAwAhisQUjy0ORGERiELgG4iakkzo4MYAxcM5hAMi1WWG1yYCJIcMUaBkVRLdGeSU2995TLWzcUAzONJ7J6FBVBYIggMzmFbvdBV44Corg8vjhzC+EJEl8U1kJtgYrhCzgc/vvTwXKSib1paRFVRVORDAJAsw5FuTaJEhWM2SHB3mOAlhkNxwuLzeJsGwqWzf5TFNdKgtY5qHp6ZFf67Y/sAVadCaVY5YACDDb3Oi4NIjLnWMw2QthCBIsVhsUTU9tvXsjeq9+X1d75/KEs4LNOfcdf/+HthMnvwxOD0wmHaXr7ZItn2wuH2SnBzbZAbPJwpPx+VQuzcm7dgRCB57a1uBzUDRL4bfnI0RE0eaXd9W89mpjqHZnUI5Hh2l2dkZZUhOqpi2qSmpOmZ64Tuu9qlz/SEXo6MEHa3wOip46F1n7633eekV8ds8Wxjn37Wl63VVa+ej5oeEZ/82ZBETJjpJ1Rbij2D3Z/1trXUvLsblCK0XfOx0SX2kMsn9dX+d+7Kf6h8o4AIykuffjT8L20LU+w4AZd5VvEPY+XpWqLV327HR7DzXuDnD8r+ovkBehJ8i+y8YAAAAASUVORK5CYII=)"
    },
    warn: {
      "color": "#C09853",
      "background-color": "#FCF8E3",
      "border-color": "#FBEED5",
      "background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABJlBMVEXr6eb/2oD/wi7/xjr/0mP/ykf/tQD/vBj/3o7/uQ//vyL/twebhgD/4pzX1K3z8e349vK6tHCilCWbiQymn0jGworr6dXQza3HxcKkn1vWvV/5uRfk4dXZ1bD18+/52YebiAmyr5S9mhCzrWq5t6ufjRH54aLs0oS+qD751XqPhAybhwXsujG3sm+Zk0PTwG6Shg+PhhObhwOPgQL4zV2nlyrf27uLfgCPhRHu7OmLgAafkyiWkD3l49ibiAfTs0C+lgCniwD4sgDJxqOilzDWowWFfAH08uebig6qpFHBvH/aw26FfQTQzsvy8OyEfz20r3jAvaKbhgG9q0nc2LbZxXanoUu/u5WSggCtp1anpJKdmFz/zlX/1nGJiYmuq5Dx7+sAAADoPUZSAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfdBgUBGhh4aah5AAAAlklEQVQY02NgoBIIE8EUcwn1FkIXM1Tj5dDUQhPU502Mi7XXQxGz5uVIjGOJUUUW81HnYEyMi2HVcUOICQZzMMYmxrEyMylJwgUt5BljWRLjmJm4pI1hYp5SQLGYxDgmLnZOVxuooClIDKgXKMbN5ggV1ACLJcaBxNgcoiGCBiZwdWxOETBDrTyEFey0jYJ4eHjMGWgEAIpRFRCUt08qAAAAAElFTkSuQmCC)"
    }
  }
});

(function() {
  var isNode = typeof module !== 'undefined' && module.exports;
  var setImmediate = setImmediate ||
  function(cb) {
    setTimeout(cb, 0);
  };
  var Worker = isNode ? require(__dirname + '/Worker.js') : self.Worker;
  var URL = typeof self !== 'undefined' ? (self.URL ? self.URL : self.webkitURL) : null;
  var _supports = isNode || self.Worker; // node always supports parallel
  function extend(from, to) {
    if (!to) to = {};
    for (var i in from) {
      if (to[i] === undefined) to[i] = from[i];
    }
    return to;
  }

  function Operation() {
    this._callbacks = [];
    this._errCallbacks = [];

    this._resolved = 0;
    this._result = null;
  }

  Operation.prototype.resolve = function(err, res) {
    if (!err) {
      this._resolved = 1;
      this._result = res;

      for (var i = 0; i < this._callbacks.length; ++i) {
        this._callbacks[i](res);
      }
    } else {
      this._resolved = 2;
      this._result = err;

      for (var iE = 0; iE < this._errCallbacks.length; ++iE) {
        this._errCallbacks[iE](res);
      }
    }

    this._callbacks = [];
    this._errCallbacks = [];
  };

  Operation.prototype.then = function(cb, errCb) {
    if (this._resolved === 1) { // result
      if (cb) {
        cb(this._result);
      }

      return;
    } else if (this._resolved === 2) { // error
      if (errCb) {
        errCb(this._result);
      }
      return;
    }

    if (cb) {
      this._callbacks[this._callbacks.length] = cb;
    }

    if (errCb) {
      this._errCallbacks[this._errCallbacks.length] = errCb;
    }
    return this;
  };

  var defaults = {
    evalPath: isNode ? __dirname + '/eval.js' : null,
    maxWorkers: isNode ? require('os').cpus().length : 4,
    synchronous: true
  };

  function Parallel(data, options) {
    this.data = data;
    this.options = extend(defaults, options);
    this.operation = new Operation();
    this.operation.resolve(null, this.data);
    this.requiredScripts = [];
    this.requiredFunctions = [];
  }

  // static method
  Parallel.isSupported = function() {
    return _supports;
  }

  Parallel.prototype.getWorkerSource = function(cb) {
    var preStr = '';
    var i = 0;
    if (!isNode && this.requiredScripts.length !== 0) {
      preStr += 'importScripts("' + this.requiredScripts.join('","') + '");\r\n';
    }

    for (i = 0; i < this.requiredFunctions.length; ++i) {
      if (this.requiredFunctions[i].name) {
        preStr += 'var ' + this.requiredFunctions[i].name + ' = ' + this.requiredFunctions[i].fn.toString() + ';';
      } else {
        preStr += this.requiredFunctions[i].fn.toString();
      }
    }

    if (isNode) {
      return preStr + 'process.on("message", function(e) {process.send(JSON.stringify((' + cb.toString() + ')(JSON.parse(e).data)))})';
    } else {
      return preStr + 'self.onmessage = function(e) {self.postMessage((' + cb.toString() + ')(e.data))}';
    }
  };

  Parallel.prototype.require = function() {
    var args = Array.prototype.slice.call(arguments, 0),
      func;

    for (var i = 0; i < args.length; i++) {
      func = args[i];

      if (typeof func === 'string') {
        this.requiredScripts.push(func);
      } else if (typeof func === 'function') {
        this.requiredFunctions.push({
          fn: func
        });
      } else if (typeof func === 'object') {
        this.requiredFunctions.push(func);
      }
    }

    return this;
  };

  Parallel.prototype._spawnWorker = function(cb) {
    var wrk;
    var src = this.getWorkerSource(cb);
    if (isNode) {
      wrk = new Worker(this.options.evalPath);
      wrk.postMessage(src);
    } else {
      if (Worker === undefined) {
        return undefined;
      }

      try {
        if (this.requiredScripts.length !== 0) {
          if (this.options.evalPath !== null) {
            wrk = new Worker(this.options.evalPath);
            wrk.postMessage(src);
          } else {
            throw new Error('Can\'t use required scripts without eval.js!');
          }
        } else if (!URL) {
          throw new Error('Can\'t create a blob URL in this browser!');
        } else {
          var blob = new Blob([src], {
            type: 'text/javascript'
          });
          var url = URL.createObjectURL(blob);

          wrk = new Worker(url);
        }
      } catch (e) {
        if (this.options.evalPath !== null) { // blob/url unsupported, cross-origin error
          wrk = new Worker(this.options.evalPath);
          wrk.postMessage(src);
        } else {
          throw e;
        }
      }
    }

    return wrk;
  };

  Parallel.prototype.spawn = function(cb) {
    var that = this;
    var newOp = new Operation();
    this.operation.then(function() {
      var wrk = that._spawnWorker(cb);
      if (wrk !== undefined) {
        wrk.onmessage = function(msg) {
          wrk.terminate();
          that.data = msg.data;
          newOp.resolve(null, that.data);
        };
        wrk.postMessage(that.data);
      } else if (that.options.synchronous) {
        setImmediate(function() {
          that.data = cb(that.data);
          newOp.resolve(null, that.data);
        });
      } else {
        throw new Error('Workers do not exist and synchronous operation not allowed!');
      }
    });
    this.operation = newOp;
    return this;
  };

  Parallel.prototype._spawnMapWorker = function(i, cb, done) {
    var that = this;
    var wrk = that._spawnWorker(cb);
    if (wrk !== undefined) {
      wrk.onmessage = function(msg) {
        wrk.terminate();
        that.data[i] = msg.data;
        done();
      };
      wrk.postMessage(that.data[i]);
    } else if (that.options.synchronous) {
      setImmediate(function() {
        that.data[i] = cb(that.data[i]);
        done();
      });
    } else {
      throw new Error('Workers do not exist and synchronous operation not allowed!');
    }
  };

  Parallel.prototype.map = function(cb) {
    if (!this.data.length) {
      return this.spawn(cb);
    }

    var that = this;
    var startedOps = 0;
    var doneOps = 0;

    function done() {
      if (++doneOps === that.data.length) {
        newOp.resolve(null, that.data);
      } else if (startedOps < that.data.length) {
        that._spawnMapWorker(startedOps++, cb, done);
      }
    }

    var newOp = new Operation();
    this.operation.then(function() {
      for (; startedOps - doneOps < that.options.maxWorkers && startedOps < that.data.length; ++startedOps) {
        that._spawnMapWorker(startedOps, cb, done);
      }
    });
    this.operation = newOp;
    return this;
  };

  Parallel.prototype._spawnReduceWorker = function(data, cb, done) {
    var that = this;
    var wrk = that._spawnWorker(cb);
    if (wrk !== undefined) {
      wrk.onmessage = function(msg) {
        wrk.terminate();
        that.data[that.data.length] = msg.data;
        done();
      };
      wrk.postMessage(data);
    } else if (that.options.synchronous) {
      setImmediate(function() {
        that.data[that.data.length] = cb(data);
        done();
      });
    } else {
      throw new Error('Workers do not exist and synchronous operation not allowed!');
    }
  };

  Parallel.prototype.reduce = function(cb) {
    if (!this.data.length) {
      throw new Error('Can\'t reduce non-array data');
    }

    var runningWorkers = 0;
    var that = this;

    function done(data) {
      --runningWorkers;
      if (that.data.length === 1 && runningWorkers === 0) {
        that.data = that.data[0];
        newOp.resolve(null, that.data);
      } else if (that.data.length > 1) {
        ++runningWorkers;
        that._spawnReduceWorker([that.data[0], that.data[1]], cb, done);
        that.data.splice(0, 2);
      }
    }

    var newOp = new Operation();
    this.operation.then(function() {
      if (that.data.length === 1) {
        newOp.resolve(null, that.data[0]);
      } else {
        for (var i = 0; i < that.options.maxWorkers && i < Math.floor(that.data.length / 2); ++i) {
          ++runningWorkers;
          that._spawnReduceWorker([that.data[i * 2], that.data[i * 2 + 1]], cb, done);
        }

        that.data.splice(0, i * 2);
      }
    });
    this.operation = newOp;
    return this;
  };

  Parallel.prototype.then = function(cb, errCb) {
    var that = this;
    var newOp = new Operation();
    this.operation.then(function() {
      var retData = cb(that.data);
      if (retData !== undefined) {
        that.data = retData;
      }
      newOp.resolve(null, that.data);
    }, errCb);
    this.operation = newOp;
    return this;
  };

  if (isNode) {
    module.exports = Parallel;
  } else {
    self.Parallel = Parallel;
  }
})();
(function() {
  var App;

  $.notify.defaults({
    position: 'bottom left'
  });

  //@ sourceURL=app-bundle.js;

  App = angular.module('playground', []);

  App.controller('Controls', function($scope, ace, gh, runner) {
    var scope;
    scope = window.ctrl = $scope;
    scope.mode = 'javascript';
    gh.$on('authenticated', function() {
      console.log('github ready!');
      return window.gh = gh;
    });
    scope.login = function() {
      return gh.login();
    };
    ace.handler('key', function(key, e) {
      if (key === 'return' && e.shiftKey) {
        run();
        e.preventDefault();
      }
    });
    return scope.run = function() {
      var code, err;
      code = ace.get();
      if (scope.mode === 'coffeescript') {
        try {
          code = CoffeeScript.compile(code);
        } catch (_error) {
          err = _error;
          if (err.location) {
            ace.select();
          }
          $.notify(err.toString());
          return;
        }
      }
      return runner.run(code);
    };
  });

  App.controller('Output', function($rootScope) {
    return $rootScope.output = '';
  });

  App.factory('ace', function($rootScope) {
    var editor, handlers, scope, session;
    scope = $rootScope.$new(true);
    editor = ace.edit("ace");
    session = editor.getSession();
    handlers = {};
    scope.handler = function(key, fn) {
      return (handlers[key] != null ? handlers[key] : handlers[key] = []).push(fn);
    };
    editor.setKeyboardHandler({
      handleKeyboard: function(data, hashId, keyString, keyCode, e) {
        var fn, _i, _len, _ref;
        _ref = handlers['key'] || [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          fn = _ref[_i];
          fn(keyString, e);
        }
      }
    });
    editor.getSession().setUseWorker(false);
    scope.config = function(c) {
      if (c.theme) {
        editor.setTheme(c.theme);
      }
      if (c.mode) {
        session.setMode(c.mode);
      }
      if ('tabSize' in c) {
        session.setTabSize(c.tabSize);
      }
      if ('softTabs' in c) {
        session.setUseSoftTabs(c.softTabs);
      }
      if ('printMargin' in c) {
        return editor.setShowPrintMargin(c.printMargin);
      }
    };
    scope.set = function(val) {
      return session.setValue(val);
    };
    scope.get = function() {
      return session.getValue();
    };
    scope.select = function() {
      return session.addMarker(new Range(1, 0, 15, 0), "ace_active_line", "background");
    };
    scope.config({
      theme: "ace/theme/monokai",
      mode: "ace/mode/javascript",
      tabSize: 2,
      softTabs: true,
      printMargin: false
    });
    scope.set("console.log('hello world!');");
    return scope;
  });

  App.factory('gh', function($http, $rootScope) {
    var getToken, gh, initGithub;
    gh = $rootScope.$new(true);
    gh.login = function() {
      var check, recieveCode, recieved, win;
      win = window.open('https://github.com/login/oauth/authorize?' + 'client_id=222d95176d7d50c1b8a3', 'gh-login', 'top=100,left=100');
      recieved = false;
      recieveCode = function(e) {
        recieved = true;
        window.removeEventListener(recieveCode);
        return getToken(e.data);
      };
      check = function() {
        if (recieved) {
          return;
        }
        win.postMessage("!", "*");
        return setTimeout(check, 100);
      };
      window.addEventListener("message", recieveCode);
      return check();
    };
    getToken = function(code) {
      console.log("code", code);
      return $http.get('http://js-playground-gatekeeper.herokuapp.com/authenticate/' + code).success(initGithub);
    };
    initGithub = function(obj) {
      if (obj.error) {
        console.error(obj.error);
        return;
      }
      gh.github = new Github({
        token: obj.token
      });
      return gh.$broadcast('authenticated');
    };
    return gh;
  });

  App.factory('log', function() {});

  App.factory('runner', function($rootScope) {
    var workerFn;
    workerFn = function(code) {
      var context, err, output;
      output = "";
      context = (function() {
        return this.console = {
          log: function(s) {
            return output += s;
          }
        };
      })();
      try {
        eval.call(context, code);
        return output;
      } catch (_error) {
        err = _error;
        return "!!!" + err.toString();
      }
    };
    return {
      run: function(code, context) {
        return new Parallel(code).spawn(workerFn).then(function(str) {
          if (str.substr(0, 3) === "!!!") {
            $.notify(str.substr(3));
            return;
          }
          $rootScope.output = str;
          return $rootScope.$apply();
        }, function(err) {
          return console.error("Parallel Worker Failed: ", err);
        });
      }
    };
  });

  App.factory('store', function() {});

  App.run(function($rootScope, gh) {
    return console.log('playground init');
  });

}).call(this);
