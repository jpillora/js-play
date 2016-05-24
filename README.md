# js-play

A JavaScript playground/sandbox for learning, testing and prototyping

https://js.jpillora.com

### Features

* Simple – No HTML and CSS
* Inline syntax errors
* Uses web workers
    * Secure – code can't escape the worker sandbox
    * Timeouts – scripts have a 30 second timeout to solve the halting problem
* Share semi-realtime updatable scripts
* External scripts with `importScripts("https://<url>")`
* Add a `debugger` statement to pause execution in Dev Tools
* CoffeeScript mode (Yes I know, this is a very old project)

### Todo

* Convert source to plain JavaScript, HTML, CSS
* Pre-defined list of custom scripts
* Login to Github and create/update gists
* Share could be more realtime using operational transforms
* Get a more memorable domain name (Email me your domain transfer code and I'll swap it out :smile:)

### Notes

* Requires browser support for `Worker` and `Blob`.
* Global scope is [DedicatedWorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope), not `window`.

#### MIT License

Copyright © 2016 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
