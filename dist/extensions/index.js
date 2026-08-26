var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension3) => {
        let configurations = extensions[extension3];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension3].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes: randomBytes2, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes2(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension3 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension3.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension3.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// extensions/index.ts
import { fileURLToPath } from "node:url";

// extensions/storage/agents/handler.ts
import "node:sqlite";
var AgentHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(agent) {
    this.database.prepare(
      `INSERT INTO agents (
          id, parent_id, request_id, role, name, status, pid, task_preview,
          started_at, exited_at, exit_code, result_text, coordinator_id,
          domain_id, queue_item_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      agent.id,
      agent.parent_id ?? null,
      agent.request_id,
      agent.role,
      agent.name,
      agent.status,
      agent.pid ?? null,
      agent.task_preview ?? null,
      agent.started_at,
      agent.exited_at ?? null,
      agent.exit_code ?? null,
      agent.result_text ?? null,
      agent.coordinator_id ?? null,
      agent.domain_id ?? null,
      agent.queue_item_id ?? null
    );
  }
  async update(agent) {
    const result = this.database.prepare(
      `UPDATE agents SET
          parent_id = ?, request_id = ?, role = ?, name = ?, status = ?, pid = ?,
          task_preview = ?, started_at = ?, exited_at = ?, exit_code = ?,
          result_text = ?, coordinator_id = ?, domain_id = ?, queue_item_id = ?
        WHERE id = ?`
    ).run(
      agent.parent_id ?? null,
      agent.request_id,
      agent.role,
      agent.name,
      agent.status,
      agent.pid ?? null,
      agent.task_preview ?? null,
      agent.started_at,
      agent.exited_at ?? null,
      agent.exit_code ?? null,
      agent.result_text ?? null,
      agent.coordinator_id ?? null,
      agent.domain_id ?? null,
      agent.queue_item_id ?? null,
      agent.id
    );
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM agents WHERE id = ?").get(identifier);
    return row ? toAgent(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM agents ORDER BY started_at DESC").all();
    return rows.map(toAgent);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM agents WHERE id = ?").run(identifier);
    return result.changes > 0;
  }
  async listByRequest(requestId) {
    const rows = this.database.prepare("SELECT * FROM agents WHERE request_id = ? ORDER BY started_at DESC").all(requestId);
    return rows.map(toAgent);
  }
  async listByParent(parentId) {
    const rows = this.database.prepare("SELECT * FROM agents WHERE parent_id = ? ORDER BY started_at DESC").all(parentId);
    return rows.map(toAgent);
  }
};
function toAgent(row) {
  return {
    id: String(row.id),
    parent_id: row.parent_id ? String(row.parent_id) : void 0,
    request_id: String(row.request_id),
    role: String(row.role),
    name: String(row.name),
    status: String(row.status),
    pid: row.pid ? Number(row.pid) : void 0,
    task_preview: row.task_preview ? String(row.task_preview) : void 0,
    started_at: Number(row.started_at),
    exited_at: row.exited_at ? Number(row.exited_at) : void 0,
    exit_code: row.exit_code !== null && row.exit_code !== void 0 ? Number(row.exit_code) : void 0,
    result_text: row.result_text ? String(row.result_text) : void 0,
    coordinator_id: row.coordinator_id ? String(row.coordinator_id) : void 0,
    domain_id: row.domain_id ? String(row.domain_id) : void 0,
    queue_item_id: row.queue_item_id ? String(row.queue_item_id) : void 0
  };
}

// extensions/storage/domains/handler.ts
import "node:sqlite";

// extensions/utils/events.ts
var TRELLIS_AGENT_SPAWNED = "trellis:agent_spawned";
var TRELLIS_AGENT_CLOSED = "trellis:agent_closed";
var TRELLIS_AGENT_SETTLED = "trellis:agent_settled";
var TRELLIS_QUEUE_ITEM_COMPLETED = "trellis:queue_item_completed";
var TRELLIS_COORDINATOR_STARTED = "trellis:coordinator_started";
var TRELLIS_COORDINATOR_UPDATED = "trellis:coordinator_updated";
var TRELLIS_NOTE_SENT = "trellis:note";
var TRELLIS_EVENT_TOPICS = [
  TRELLIS_AGENT_SPAWNED,
  TRELLIS_AGENT_CLOSED,
  TRELLIS_AGENT_SETTLED,
  TRELLIS_QUEUE_ITEM_COMPLETED,
  TRELLIS_COORDINATOR_STARTED,
  TRELLIS_COORDINATOR_UPDATED,
  TRELLIS_NOTE_SENT
];
var KNOWN_TRELLIS_EVENT_TOPICS = new Set(TRELLIS_EVENT_TOPICS);

// extensions/utils/json.ts
function json(value) {
  return JSON.stringify(value);
}
function parseJson(value) {
  if (value == null) return void 0;
  return JSON.parse(value);
}

// extensions/utils/tool.ts
function textBlock(text) {
  return { type: "text", text };
}
function formatToolResult(text, details) {
  return {
    content: [textBlock(text)],
    details
  };
}

// extensions/utils/tui.ts
import { matchesKey } from "@earendil-works/pi-tui";
function mapInputs(data, handlers) {
  for (const [key, handler] of Object.entries(handlers)) {
    if (!handler) {
      continue;
    }
    if (matchesKey(data, key)) {
      handler();
      return true;
    }
  }
  return false;
}
function renderLines(...items) {
  return items.flat(2).filter((item) => typeof item === "string");
}

// extensions/storage/domains/handler.ts
var DomainHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(domain) {
    this.database.prepare(
      `INSERT INTO domains (
          id, name, description, remit, exclusions
        ) VALUES (?, ?, ?, ?, ?)`
    ).run(
      domain.id,
      domain.name,
      domain.description,
      domain.remit,
      json(domain.exclusions)
    );
  }
  async update(domain) {
    const result = this.database.prepare(
      `UPDATE domains SET
          name = ?, description = ?, remit = ?, exclusions = ?
        WHERE id = ?`
    ).run(
      domain.name,
      domain.description,
      domain.remit,
      json(domain.exclusions),
      domain.id
    );
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM domains WHERE id = ?").get(identifier);
    return row ? toDomain(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM domains ORDER BY name").all();
    return rows.map(toDomain);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM domains WHERE id = ?").run(identifier);
    return result.changes > 0;
  }
};
function toDomain(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    remit: row.remit,
    exclusions: parseJson(row.exclusions)
  };
}

// extensions/storage/migrations/handler.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import "node:sqlite";
var MigrationHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  /**
   * Apply pending schema files for the given table names.
   *
   * Each entry in `tables` is expected to resolve to a sibling subfolder
   * containing a `schema.sql` file (e.g. `../domains/schema.sql`).
   */
  async apply(tables) {
    const basePath = join(import.meta.dirname ?? "", "..");
    const createMigrationsTableSql = readFileSync(
      join(basePath, "migrations", "schema.sql"),
      "utf-8"
    );
    this.database.exec(createMigrationsTableSql);
    const row = this.database.prepare("SELECT MAX(version) as version FROM migrations").get();
    const currentVersion = row?.version ?? 0;
    for (let index = 0; index < tables.length; index++) {
      const version = index + 1;
      if (version <= currentVersion) continue;
      const table = tables[index];
      const schemaPath = join(basePath, table, "schema.sql");
      const sql = readFileSync(schemaPath, "utf-8");
      this.database.exec(sql);
      this.database.prepare(
        "INSERT INTO migrations (version, applied_at) VALUES (?, ?)"
      ).run(version, Date.now());
    }
  }
  async create(migration) {
    this.database.prepare(
      "INSERT INTO migrations (version, applied_at) VALUES (?, ?)"
    ).run(migration.version, migration.appliedAt);
  }
  async update() {
    return false;
  }
  async get(version) {
    const row = this.database.prepare("SELECT * FROM migrations WHERE version = ?").get(version);
    return row ? toMigration(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM migrations ORDER BY version").all();
    return rows.map(toMigration);
  }
  async delete() {
    return false;
  }
};
function toMigration(row) {
  return {
    version: row.version,
    appliedAt: row.appliedAt
  };
}

// extensions/storage/notes/handler.ts
import "node:sqlite";
var NoteHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(note) {
    this.database.prepare(
      `INSERT INTO notes (
          id, request_id, from_agent_id, to_agent_id, payload, in_reply_to, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      note.id,
      note.request_id,
      note.from_agent_id,
      note.to_agent_id,
      note.payload,
      note.in_reply_to ?? null,
      note.created_at
    );
  }
  async update(note) {
    const result = this.database.prepare(
      `UPDATE notes SET
          request_id = ?, from_agent_id = ?, to_agent_id = ?, payload = ?,
          in_reply_to = ?, created_at = ?
        WHERE id = ?`
    ).run(
      note.request_id,
      note.from_agent_id,
      note.to_agent_id,
      note.payload,
      note.in_reply_to ?? null,
      note.created_at,
      note.id
    );
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM notes WHERE id = ?").get(identifier);
    return row ? toNote(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM notes ORDER BY created_at").all();
    return rows.map(toNote);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM notes WHERE id = ?").run(identifier);
    return result.changes > 0;
  }
  async listByRecipient(requestId, toAgentId, limit = 100) {
    const rows = this.database.prepare(
      `SELECT * FROM notes
         WHERE request_id = ? AND to_agent_id = ?
         ORDER BY created_at ASC
         LIMIT ?`
    ).all(requestId, toAgentId, limit);
    return rows.map(toNote);
  }
  async countByRecipient(requestId, toAgentId) {
    const row = this.database.prepare(
      `SELECT COUNT(*) as count FROM notes
         WHERE request_id = ? AND to_agent_id = ?`
    ).get(requestId, toAgentId);
    return row ? Number(row.count) : 0;
  }
};
function toNote(row) {
  return {
    id: String(row.id),
    request_id: String(row.request_id),
    from_agent_id: String(row.from_agent_id),
    to_agent_id: String(row.to_agent_id),
    payload: String(row.payload),
    in_reply_to: row.in_reply_to ? String(row.in_reply_to) : void 0,
    created_at: Number(row.created_at)
  };
}

// extensions/storage/queue/handler.ts
import "node:sqlite";
var QueueHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(item) {
    this.database.prepare(
      `INSERT INTO queue_items (
          id, domain_id, requirement_id, enqueued_by_coordinator_id,
          status, domain_agent_id, result_payload, priority, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      item.id,
      item.domain_id,
      item.requirement_id,
      item.enqueued_by_coordinator_id,
      item.status,
      item.domain_agent_id ?? null,
      item.result_payload ?? null,
      item.priority,
      item.created_at
    );
  }
  async update(item) {
    const result = this.database.prepare(
      `UPDATE queue_items SET
          domain_id = ?, requirement_id = ?, enqueued_by_coordinator_id = ?,
          status = ?, domain_agent_id = ?, result_payload = ?, priority = ?, created_at = ?
        WHERE id = ?`
    ).run(
      item.domain_id,
      item.requirement_id,
      item.enqueued_by_coordinator_id,
      item.status,
      item.domain_agent_id ?? null,
      item.result_payload ?? null,
      item.priority,
      item.created_at,
      item.id
    );
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM queue_items WHERE id = ?").get(identifier);
    return row ? toQueueItem(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM queue_items ORDER BY created_at").all();
    return rows.map(toQueueItem);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM queue_items WHERE id = ?").run(identifier);
    return result.changes > 0;
  }
  async peekNextByDomain(domainId, status) {
    const row = this.database.prepare(
      `SELECT * FROM queue_items
         WHERE domain_id = ? AND status = ?
         ORDER BY priority DESC, created_at ASC
         LIMIT 1`
    ).get(domainId, status);
    return row ? toQueueItem(row) : void 0;
  }
  async listByDomain(domainId) {
    const rows = this.database.prepare("SELECT * FROM queue_items WHERE domain_id = ? ORDER BY created_at").all(domainId);
    return rows.map(toQueueItem);
  }
  async listByRequirement(requirementId) {
    const rows = this.database.prepare("SELECT * FROM queue_items WHERE requirement_id = ? ORDER BY created_at").all(requirementId);
    return rows.map(toQueueItem);
  }
};
function toQueueItem(row) {
  return {
    id: String(row.id),
    domain_id: String(row.domain_id),
    requirement_id: String(row.requirement_id),
    enqueued_by_coordinator_id: String(row.enqueued_by_coordinator_id),
    status: row.status,
    domain_agent_id: row.domain_agent_id ? String(row.domain_agent_id) : void 0,
    result_payload: row.result_payload ? String(row.result_payload) : void 0,
    priority: Number(row.priority),
    created_at: Number(row.created_at)
  };
}

// extensions/storage/requirements/handler.ts
import "node:sqlite";
var RequirementHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(requirement) {
    this.database.prepare(
      `INSERT INTO requirements (
          id, request_id, description, domain_id, parent_requirement_id,
          status, owned_scope, contracts, child_requirement_ids,
          reassignment_count, escalation_reason, resolution_payload, created_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      requirement.id,
      requirement.request_id,
      requirement.description,
      requirement.domain_id,
      requirement.parent_requirement_id ?? null,
      requirement.status,
      requirement.owned_scope ?? null,
      json(requirement.contracts),
      json(requirement.child_requirement_ids),
      requirement.reassignment_count,
      requirement.escalation_reason ?? null,
      requirement.resolution_payload ?? null,
      requirement.created_at,
      requirement.resolved_at ?? null
    );
  }
  async update(requirement) {
    const result = this.database.prepare(
      `UPDATE requirements SET
          request_id = ?, description = ?, domain_id = ?, parent_requirement_id = ?,
          status = ?, owned_scope = ?, contracts = ?, child_requirement_ids = ?,
          reassignment_count = ?, escalation_reason = ?, resolution_payload = ?, created_at = ?, resolved_at = ?
        WHERE id = ?`
    ).run(
      requirement.request_id,
      requirement.description,
      requirement.domain_id,
      requirement.parent_requirement_id ?? null,
      requirement.status,
      requirement.owned_scope ?? null,
      json(requirement.contracts),
      json(requirement.child_requirement_ids),
      requirement.reassignment_count,
      requirement.escalation_reason ?? null,
      requirement.resolution_payload ?? null,
      requirement.created_at,
      requirement.resolved_at ?? null,
      requirement.id
    );
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM requirements WHERE id = ?").get(identifier);
    return row ? toRequirement(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM requirements ORDER BY created_at").all();
    return rows.map(toRequirement);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM requirements WHERE id = ?").run(identifier);
    return result.changes > 0;
  }
  async listByRequest(requestId) {
    const rows = this.database.prepare("SELECT * FROM requirements WHERE request_id = ? ORDER BY created_at").all(requestId);
    return rows.map(toRequirement);
  }
  async listByDomain(domainId) {
    const rows = this.database.prepare("SELECT * FROM requirements WHERE domain_id = ? ORDER BY created_at").all(domainId);
    return rows.map(toRequirement);
  }
};
function toRequirement(row) {
  return {
    id: String(row.id),
    request_id: String(row.request_id),
    description: String(row.description),
    domain_id: String(row.domain_id),
    parent_requirement_id: row.parent_requirement_id ? String(row.parent_requirement_id) : void 0,
    status: row.status,
    owned_scope: row.owned_scope ? String(row.owned_scope) : void 0,
    contracts: parseJson(row.contracts),
    child_requirement_ids: parseJson(row.child_requirement_ids),
    reassignment_count: Number(row.reassignment_count),
    escalation_reason: row.escalation_reason ? String(row.escalation_reason) : void 0,
    resolution_payload: row.resolution_payload ? String(row.resolution_payload) : void 0,
    created_at: Number(row.created_at),
    resolved_at: row.resolved_at ? Number(row.resolved_at) : void 0
  };
}

// extensions/storage/requests/handler.ts
import "node:sqlite";
var RequestHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(request) {
    this.database.prepare(
      `INSERT INTO requests (
          request_id, description, status, coordinator_id
        ) VALUES (?, ?, ?, ?)`
    ).run(request.request_id, request.description, request.status, request.coordinator_id);
  }
  async update(request) {
    const result = this.database.prepare(
      `UPDATE requests SET
          description = ?, status = ?, coordinator_id = ?
        WHERE request_id = ?`
    ).run(request.description, request.status, request.coordinator_id, request.request_id);
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM requests WHERE request_id = ?").get(identifier);
    return row ? toRequest(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM requests ORDER BY request_id").all();
    return rows.map(toRequest);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM requests WHERE request_id = ?").run(identifier);
    return result.changes > 0;
  }
};
function toRequest(row) {
  return {
    request_id: String(row.request_id),
    description: String(row.description),
    status: row.status,
    coordinator_id: String(row.coordinator_id)
  };
}

// extensions/storage/sqlite.ts
import { mkdirSync, readFileSync as readFileSync2 } from "node:fs";
import { dirname, join as join2 } from "node:path";
import { DatabaseSync as DatabaseSync8 } from "node:sqlite";
var SQLiteStorageAdapter = class {
  database;
  agents;
  domains;
  requests;
  requirements;
  queue;
  notes;
  migrations;
  constructor(options = {}) {
    const databasePath = options.databasePath ?? ".pi/trellis/store.db";
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }
    this.database = new DatabaseSync8(databasePath);
    this.agents = new AgentHandler({ database: this.database });
    this.domains = new DomainHandler({ database: this.database });
    this.requests = new RequestHandler({ database: this.database });
    this.requirements = new RequirementHandler({ database: this.database });
    this.queue = new QueueHandler({ database: this.database });
    this.notes = new NoteHandler({ database: this.database });
    this.migrations = new MigrationHandler({ database: this.database });
  }
  async init() {
  }
  async migrate() {
    const hasLogPath = this.database.prepare(
      "SELECT name FROM pragma_table_info('agents') WHERE name = 'log_path'"
    ).get();
    if (hasLogPath) {
      this.database.exec("DROP TABLE IF EXISTS agents;");
      const agentsSchema = readAgentsSchema();
      this.database.exec(agentsSchema);
    }
    await this.migrations.apply([
      "domains",
      "requests",
      "requirements",
      "queue",
      "notes",
      "agents"
    ]);
  }
  async close() {
    this.database.close();
  }
};
function readAgentsSchema() {
  const candidates = [
    join2(import.meta.dirname ?? "", "agents", "schema.sql"),
    join2(import.meta.dirname ?? "", "..", "agents", "schema.sql")
  ];
  for (const candidate of candidates) {
    try {
      return readFileSync2(candidate, "utf-8");
    } catch (error) {
      const code = error.code;
      if (code !== "ENOENT") throw error;
    }
  }
  throw new Error(
    `Could not locate agents/schema.sql (tried ${candidates.join(", ")})`
  );
}

// extensions/components/domain-manager.ts
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  Container,
  HStack,
  Spacer
} from "@earendil-works/pi-tui";

// extensions/components/domain-details.ts
import { truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
var DomainDetailsComponent = class {
  constructor(getDomain, theme) {
    this.getDomain = getDomain;
    this.theme = theme;
  }
  getDomain;
  theme;
  invalidate() {
  }
  render(width) {
    const domain = this.getDomain();
    return renderLines(
      !domain && truncateToWidth(this.theme.fg("dim", "No domain selected."), width),
      domain && [
        truncateToWidth(this.theme.fg("accent", this.theme.bold(domain.name)), width),
        truncateToWidth(this.theme.fg("muted", `id: ${domain.id}`), width),
        "",
        truncateToWidth(this.theme.fg("muted", "Description"), width),
        ...wrapTextWithAnsi(domain.description, width),
        "",
        truncateToWidth(this.theme.fg("muted", "Remit"), width),
        ...wrapTextWithAnsi(domain.remit, width),
        "",
        truncateToWidth(this.theme.fg("muted", "Exclusions"), width),
        domain.exclusions.length === 0 ? truncateToWidth(this.theme.fg("dim", "None"), width) : domain.exclusions.map((exclusion) => truncateToWidth(`\u2022 ${exclusion}`, width))
      ]
    );
  }
};

// extensions/components/domain-list.ts
import { truncateToWidth as truncateToWidth2 } from "@earendil-works/pi-tui";
var DomainListComponent = class {
  constructor(domains, initialSelectedIndex, theme, requestRender) {
    this.domains = domains;
    this.theme = theme;
    this.requestRender = requestRender;
    this.selectedIndex = Math.max(
      0,
      Math.min(initialSelectedIndex, domains.length - 1)
    );
  }
  domains;
  theme;
  requestRender;
  selectedIndex;
  getSelectedDomain() {
    return this.domains[this.selectedIndex];
  }
  handleInput(data) {
    const handlePrevious = () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.requestRender();
    };
    const handleNext = () => {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1
      );
      this.requestRender();
    };
    mapInputs(data, {
      up: handlePrevious,
      k: handlePrevious,
      down: handleNext,
      j: handleNext
    });
  }
  invalidate() {
  }
  render(width) {
    return renderLines(
      this.domains.length === 0 && truncateToWidth2(this.theme.fg("dim", "No domains"), width),
      this.domains.length > 0 && this.domains.map((item, index) => {
        const isSelected = index === this.selectedIndex;
        const marker = isSelected ? this.theme.fg("accent", "\u203A ") : "  ";
        const label = isSelected ? this.theme.fg("accent", this.theme.bold(item.name)) : this.theme.fg("text", item.name);
        return truncateToWidth2(`${marker}${label}`, width);
      })
    );
  }
};

// extensions/components/help-line.ts
import { truncateToWidth as truncateToWidth3 } from "@earendil-works/pi-tui";
var HelpLineComponent = class {
  constructor(theme, content) {
    this.theme = theme;
    this.content = content;
  }
  theme;
  content;
  invalidate() {
  }
  render(width) {
    return [truncateToWidth3(this.theme.fg("dim", this.content), width)];
  }
};

// extensions/components/title.ts
import { truncateToWidth as truncateToWidth4 } from "@earendil-works/pi-tui";
var TitleComponent = class {
  constructor(theme, title) {
    this.theme = theme;
    this.title = title;
  }
  theme;
  title;
  invalidate() {
  }
  render(width) {
    return [
      truncateToWidth4(
        this.theme.fg("accent", this.theme.bold(this.title)),
        width
      )
    ];
  }
};

// extensions/components/domain-manager.ts
var DomainManagerComponent = class extends Container {
  done;
  list;
  constructor(options) {
    super();
    this.done = options.done;
    this.list = new DomainListComponent(
      options.domains,
      options.initialSelectedIndex ?? 0,
      options.theme,
      options.requestRender
    );
    const details = new DomainDetailsComponent(
      () => this.list.getSelectedDomain(),
      options.theme
    );
    this.addChild(new Spacer(1));
    this.addChild(
      new DynamicBorder((s) => options.theme.fg("accent", s))
    );
    this.addChild(
      new TitleComponent(options.theme, "Managing domains")
    );
    this.addChild(new Spacer(1));
    this.addChild(
      new HStack(
        [
          {
            component: this.list,
            minSize: 28,
            maxSize: 40,
            grow: 0,
            shrink: 1
          },
          {
            component: details,
            minSize: 20,
            grow: 1,
            shrink: 1
          }
        ],
        { gap: 1, align: "stretch" }
      )
    );
    this.addChild(new Spacer(1));
    this.addChild(
      new HelpLineComponent(
        options.theme,
        "\u2191/\u2193 or j/k navigate \xB7 e edit remit \xB7 d delete \xB7 q close"
      )
    );
    this.addChild(
      new DynamicBorder((s) => options.theme.fg("accent", s))
    );
  }
  handleInput(data) {
    const domain = this.list.getSelectedDomain();
    const handleClose = () => this.done({ kind: "close" });
    const handleDelete = () => {
      if (domain) {
        this.done({ kind: "delete", domain });
      }
    };
    const handleEdit = () => {
      if (domain) {
        this.done({ kind: "edit", domain });
      }
    };
    if (mapInputs(data, {
      d: handleDelete,
      e: handleEdit,
      escape: handleClose,
      q: handleClose
    })) {
      return;
    }
    this.list.handleInput(data);
  }
};

// extensions/commands/managing-domains.ts
function registerManagingDomainsCommand(pi, storage) {
  pi.registerCommand("managing-domains", {
    description: "Open an interactive TUI for domain management",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("/managing-domains requires TUI mode", "error");
        return;
      }
      let selectedDomainId;
      let running = true;
      while (running) {
        const domains = await storage.domains.list();
        const initialSelectedIndex = selectedDomainId ? Math.max(
          0,
          domains.findIndex((domain) => domain.id === selectedDomainId)
        ) : 0;
        const action = await ctx.ui.custom(
          (tui, theme, _keybindings, done) => new DomainManagerComponent({
            domains,
            done,
            initialSelectedIndex,
            requestRender: () => tui.requestRender(),
            theme
          })
        );
        if (!action) {
          break;
        }
        const handleClose = () => {
          running = false;
        };
        const handleDelete = async (domain) => {
          selectedDomainId = domain.id;
          const confirmed = await ctx.ui.confirm(
            "Delete domain?",
            `Remove "${domain.name}" (${domain.id})? This cannot be undone.`
          );
          if (confirmed) {
            await storage.domains.delete(domain.id);
            ctx.ui.notify(`Domain "${domain.id}" deleted.`, "info");
            selectedDomainId = void 0;
          }
        };
        const handleEdit = async (domain) => {
          selectedDomainId = domain.id;
          const remit = await ctx.ui.input("Edit remit", domain.remit);
          if (remit !== void 0) {
            await storage.domains.update({ ...domain, remit });
            ctx.ui.notify(`Domain "${domain.id}" updated.`, "info");
          }
        };
        switch (action.kind) {
          case "close": {
            handleClose();
            break;
          }
          case "delete": {
            await handleDelete(action.domain);
            break;
          }
          case "edit": {
            await handleEdit(action.domain);
            break;
          }
          default: {
            running = false;
            break;
          }
        }
      }
    }
  });
}

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// extensions/managers/websocket-client-manager.ts
var WebSocketClientManager = class {
  pi;
  token;
  client;
  clientReady = false;
  url;
  pendingMessages = [];
  reconnectionTimer;
  constructor(options) {
    this.pi = options.pi;
    this.token = options.token ?? "";
  }
  /** Open a connection to the root WebSocket server. */
  async openConnection(url) {
    return new Promise((resolve, reject) => {
      this.url = url;
      const socket = new import_websocket.default(url);
      this.client = socket;
      socket.once("open", () => {
        this.clientReady = true;
        this.sendMessage({
          type: "register",
          agentId: process.env.TRELLIS_AGENT_ID ?? "trellis:unknown",
          role: process.env.TRELLIS_ROLE ?? "background",
          name: process.env.TRELLIS_AGENT_NAME ?? process.env.TRELLIS_AGENT_ID ?? "unknown",
          requestId: process.env.TRELLIS_REQUEST_ID ?? "",
          parentId: process.env.TRELLIS_PARENT_ID,
          token: this.token
        });
        resolve();
        this.sendPendingMessages();
      });
      socket.on("message", (raw) => this.handleMessage(raw));
      socket.on("close", () => this.handleClose(url));
      socket.on("error", (err) => {
        if (!this.clientReady) reject(err);
      });
    });
  }
  /** Close the server connection and cancel any pending reconnect. */
  closeConnection() {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = void 0;
    }
    this.client?.close();
  }
  /**
   * Publish a transient event to the root server.
   * The server routes the event to interested peers by target, requestId,
   * broadcast flag, or topic subscription.
   */
  publish(topic, payload, options) {
    this.sendMessage({
      type: "publish",
      topic,
      payload,
      target: options?.target,
      requestId: options?.requestId,
      broadcast: options?.broadcast
    });
  }
  /** Subscribe to an untargeted topic so the server fans it out efficiently. */
  subscribe(topic) {
    this.sendMessage({ type: "subscribe", topic });
  }
  unsubscribe(topic) {
    this.sendMessage({ type: "unsubscribe", topic });
  }
  // ─── Message handling ─────────────────────────────────────────────────────
  handleMessage(raw) {
    try {
      const message = JSON.parse(raw.toString());
      switch (message.type) {
        case "event":
          this.pi.events.emit(message.topic, message.payload);
          break;
        case "register_ack":
          break;
        case "pong":
          break;
        default:
          break;
      }
    } catch {
    }
  }
  handleClose(url) {
    this.clientReady = false;
    this.scheduleReconnect(url);
  }
  scheduleReconnect(url) {
    if (this.reconnectionTimer) return;
    this.reconnectionTimer = setTimeout(() => {
      this.reconnectionTimer = void 0;
      this.openConnection(url).catch(() => {
        this.scheduleReconnect(url);
      });
    }, 2e3);
  }
  sendMessage(message) {
    if (this.client && this.client.readyState === import_websocket.default.OPEN) {
      this.client.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push(message);
    }
  }
  sendPendingMessages() {
    while (this.client && this.client.readyState === import_websocket.default.OPEN && this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.client.send(JSON.stringify(message));
      }
    }
  }
};

// extensions/utils/agents.ts
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
function generateAgentId() {
  return `trellis:${randomUUID()}`;
}
function parseAgentSpawnCommand(args) {
  const currentScript = process.argv[1];
  const isBunVirtualScript = currentScript?.startsWith("/$bunfs/root/");
  if (currentScript && !isBunVirtualScript && fs.existsSync(currentScript)) {
    return { command: process.execPath, args: [currentScript, ...args] };
  }
  const execName = path.basename(process.execPath).toLowerCase();
  const isGenericRuntime = /^(node|bun)(\.exe)?$/.test(execName);
  if (!isGenericRuntime) {
    return { command: process.execPath, args };
  }
  return { command: "pi", args };
}
function exitStatusFromCode(code) {
  return code === 0 ? "completed" : "failed";
}
function processAgentStdoutLine(line, state) {
  if (!line.trim()) return;
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    return;
  }
  if (typeof event !== "object" || event === null) return;
  const { type, message } = event;
  if (type !== "message_end" || !message) return;
  if (message.role !== "assistant") return;
  state.usage.turns++;
  if (message.usage) {
    state.usage.input += message.usage.input || 0;
    state.usage.output += message.usage.output || 0;
    state.usage.cacheRead += message.usage.cacheRead || 0;
    state.usage.cacheWrite += message.usage.cacheWrite || 0;
    state.usage.cost += message.usage.cost?.total || 0;
    state.usage.contextTokens = message.usage.totalTokens ?? state.usage.contextTokens;
  }
  state.stopReason = message.stopReason;
  state.errorMessage = message.errorMessage;
  for (const part of message.content) {
    if (part.type === "text") {
      state.finalResultText = part.text;
    }
  }
}
function hasString(object, key) {
  return typeof object === "object" && object !== null && key in object && typeof object[key] === "string";
}
function extractAssistantText(message) {
  if (!hasString(message, "role") || message.role !== "assistant") {
    return void 0;
  }
  const content = message.content;
  if (!Array.isArray(content)) return void 0;
  let text = "";
  for (const part of content) {
    if (hasString(part, "type") && part.type === "text" && hasString(part, "text")) {
      text += part.text;
    }
  }
  return text || void 0;
}

// extensions/managers/agent-event-manager.ts
var AgentEventManager = class {
  pi;
  websocketManager;
  exit;
  agent;
  finalResultText;
  constructor(options) {
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
    this.exit = options.exit ?? ((code) => process.exit(code));
    const id = process.env.TRELLIS_AGENT_ID ?? "trellis:unknown";
    this.agent = {
      id,
      name: process.env.TRELLIS_AGENT_NAME ?? id,
      role: process.env.TRELLIS_ROLE ?? "background",
      mode: process.env.TRELLIS_AGENT_MODE ?? "json",
      requestId: process.env.TRELLIS_REQUEST_ID ?? "",
      parentId: process.env.TRELLIS_PARENT_ID ?? "trellis:root"
    };
  }
  /** Subscribe to Pi lifecycle events and announce when this agent settles. */
  mountEventListeners() {
    this.pi.on("session_start", () => {
      const payload = this.buildBasePayload();
      this.publishLifecycleEvent(TRELLIS_AGENT_SPAWNED, payload);
    });
    this.pi.on("message_end", (event) => {
      const text = extractAssistantText(event.message);
      if (text == void 0) return;
      this.finalResultText = text;
    });
    this.pi.on("agent_settled", () => {
      const payload = this.buildSettledPayload();
      this.publishLifecycleEvent(TRELLIS_AGENT_SETTLED, payload);
      if (this.agent.mode !== "rpc") {
        this.handleExit(0);
      }
    });
    process.on("SIGTERM", () => this.handleExit(0, "signal"));
    process.on("SIGINT", () => this.handleExit(0, "signal"));
  }
  publishLifecycleEvent(topic, payload) {
    const targets = /* @__PURE__ */ new Set([this.agent.parentId ?? "trellis:root"]);
    if (this.agent.parentId !== "trellis:root") targets.add("trellis:root");
    for (const target of targets) {
      this.websocketManager.publish(topic, payload, { target });
    }
  }
  handleExit(exitCode, stopReason) {
    const payload = this.buildClosedPayload(exitCode, stopReason);
    this.publishLifecycleEvent(TRELLIS_AGENT_CLOSED, payload);
    setTimeout(() => {
      this.websocketManager.closeConnection();
      this.exit(exitCode);
    }, 250);
  }
  buildBasePayload() {
    return { agent: this.agent };
  }
  buildSettledPayload() {
    return {
      ...this.buildBasePayload(),
      timestamp: Date.now(),
      resultText: this.finalResultText
    };
  }
  buildClosedPayload(exitCode, stopReason) {
    return {
      ...this.buildBasePayload(),
      exitCode,
      stopReason,
      resultText: this.finalResultText
    };
  }
};

// extensions/managers/agent-manager.ts
import { spawn } from "node:child_process";
import * as fs2 from "node:fs";
import * as os from "node:os";
import * as path2 from "node:path";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";
var AgentManager = class _AgentManager {
  /** Relative directory, from the plugin entry file, that holds agent definitions. */
  static AGENT_CATALOG_SUBDIR = "agents";
  extensionPath;
  runningAgentProcesses = /* @__PURE__ */ new Map();
  agentCatalogDir;
  storage;
  constructor(options) {
    this.extensionPath = options.extensionPath;
    this.storage = options.storage;
    this.agentCatalogDir = path2.join(
      path2.dirname(this.extensionPath),
      _AgentManager.AGENT_CATALOG_SUBDIR
    );
  }
  /**
   * Crawl the bundled agent catalog directory and return all valid definitions.
   *
   * Scans for `*.md` files, parses frontmatter, and returns successfully
   * loaded definitions. Missing or unreadable directories are treated as empty
   * catalogs.
   */
  crawlAgentDefinitions() {
    const agents = [];
    if (!fs2.existsSync(this.agentCatalogDir)) return agents;
    let entries;
    try {
      entries = fs2.readdirSync(this.agentCatalogDir, { withFileTypes: true });
    } catch {
      return agents;
    }
    for (const entry of entries) {
      if (!entry.name.endsWith(".md")) continue;
      if (!entry.isFile() && !entry.isSymbolicLink()) continue;
      const filePath = path2.join(this.agentCatalogDir, entry.name);
      const agent = this.loadAgentDefinition(filePath);
      if (agent) agents.push(agent);
    }
    return agents;
  }
  /**
   * Load a single agent definition from a markdown file.
   *
   * Parses frontmatter metadata and uses the file body as the system prompt.
   * Returns `undefined` if the file cannot be read or lacks required metadata.
   */
  loadAgentDefinition(filePath) {
    let content;
    try {
      content = fs2.readFileSync(filePath, "utf-8");
    } catch {
      return void 0;
    }
    const { frontmatter, body } = parseFrontmatter(content);
    if (typeof frontmatter.name !== "string" || typeof frontmatter.description !== "string") {
      return void 0;
    }
    const tools = typeof frontmatter.tools === "string" ? frontmatter.tools.split(",") : Array.isArray(frontmatter.tools) ? frontmatter.tools : [];
    const mode = frontmatter.mode === "rpc" || frontmatter.mode === "json" ? frontmatter.mode : void 0;
    return {
      name: frontmatter.name,
      description: frontmatter.description,
      mode,
      tools: tools.filter((tool) => typeof tool === "string").map((tool) => tool.trim()).filter(Boolean),
      model: typeof frontmatter.model === "string" ? frontmatter.model : void 0,
      thinking: typeof frontmatter.thinking === "string" ? frontmatter.thinking : void 0,
      systemPrompt: body,
      filePath
    };
  }
  getAgentDefinition(name) {
    return this.crawlAgentDefinitions().find((a) => a.name === name);
  }
  /**
   * Prepare the agent prompt for launch and append the relevant CLI arguments.
   *
   * Mutates `args` in place, appending `--append-system-prompt` plus the task
   * argument. Returns the temporary prompt directory and file path so the
   * caller can clean them up after the child process exits.
   */
  async prepareAgentPrompt(agent, options, agentId, args) {
    const mode = options.mode ?? agent.mode ?? "json";
    const fullPrompt = renderLines(
      agent.systemPrompt.trim(),
      "",
      "---",
      "### Runtime context",
      `- Trellis agent id: ${agentId}`,
      `- Role: ${options.role}`,
      `- Request id: ${options.requestId}`,
      options.parentId && `- Parent agent id: ${options.parentId}`,
      options.domainId && `- Domain id: ${options.domainId}`,
      options.queueItemId && `- Queue item id: ${options.queueItemId}`,
      "",
      "Do not reveal these identifiers to the user unless asked."
    ).join("\n");
    const tmpPromptDir = await fs2.promises.mkdtemp(
      path2.join(os.tmpdir(), "trellis-agent-")
    );
    const safeName = agent.name.replace(/[^\w.-]+/g, "_");
    const tmpPromptPath = path2.join(tmpPromptDir, `prompt-${safeName}.md`);
    await withFileMutationQueue(tmpPromptPath, async () => {
      await fs2.promises.writeFile(tmpPromptPath, fullPrompt, {
        encoding: "utf-8",
        mode: 384
      });
    });
    args.push("--append-system-prompt", tmpPromptPath);
    if (mode !== "rpc") {
      args.push(options.task);
    }
    return { tmpPromptDir, tmpPromptPath };
  }
  /**
   * Build the base CLI argument list for spawning an agent.
   *
   * Adds runtime flags for model, thinking level, tools, and the extension
   * entry path. Does not include the prompt file or task argument, which are
   * appended later by `prepareAgentPrompt`.
   */
  prepareAgentFlags(agent, options, _agentId) {
    const mode = options.mode ?? agent.mode ?? "json";
    const args = ["--mode", mode, "-p", "--no-session"];
    const model = agent.model ?? options.model;
    if (model) args.push("--model", model);
    const thinkingLevel = options.thinkingLevel ?? agent.thinking;
    if (thinkingLevel) args.push("--thinking", thinkingLevel);
    if (agent.tools && agent.tools.length > 0) {
      args.push("--tools", agent.tools.join(","));
    }
    args.push("-e", this.extensionPath);
    return args;
  }
  /**
   * Build the environment object for a spawned agent.
   *
   * Carries the parent process environment plus Trellis runtime identifiers.
   */
  prepareAgentEnv(agentId, agentName, options, mode) {
    return {
      ...process.env,
      TRELLIS_AGENT_ID: agentId,
      TRELLIS_AGENT_NAME: agentName,
      TRELLIS_ROLE: options.role,
      TRELLIS_AGENT_MODE: mode,
      TRELLIS_REQUEST_ID: options.requestId,
      ...options.parentId ? { TRELLIS_PARENT_ID: options.parentId } : {},
      ...options.domainId ? { TRELLIS_DOMAIN_ID: options.domainId } : {},
      ...options.queueItemId ? { TRELLIS_QUEUE_ITEM_ID: options.queueItemId } : {},
      ...options.mailboxDir ? { TRELLIS_MAILBOX_DIR: options.mailboxDir } : {},
      ...process.env.TRELLIS_WS_URL ? { TRELLIS_WS_URL: process.env.TRELLIS_WS_URL } : {},
      ...process.env.TRELLIS_WS_TOKEN ? { TRELLIS_WS_TOKEN: process.env.TRELLIS_WS_TOKEN } : {}
    };
  }
  async prepareAgentConfig(options) {
    const agent = this.getAgentDefinition(options.agentName);
    if (!agent) {
      const available = this.crawlAgentDefinitions().map((a) => a.name).join(", ") || "none";
      throw new Error(
        `Unknown agent "${options.agentName}". Available: ${available}`
      );
    }
    const mode = options.mode ?? agent.mode ?? "json";
    const isRpc = mode === "rpc";
    const agentId = options.agentId ?? generateAgentId();
    const stdio = isRpc ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"];
    const args = this.prepareAgentFlags(agent, options, agentId);
    const env = this.prepareAgentEnv(agentId, agent.name, options, mode);
    const { tmpPromptDir, tmpPromptPath } = await this.prepareAgentPrompt(
      agent,
      options,
      agentId,
      args
    );
    const invocation = parseAgentSpawnCommand(args);
    const config = {
      agent,
      options,
      agentId,
      invocation,
      stdio,
      env,
      tmpPromptDir,
      tmpPromptPath,
      mode,
      ...isRpc ? {
        initialStdinLine: JSON.stringify({
          type: "prompt",
          message: options.task
        })
      } : {}
    };
    return config;
  }
  async startAgentProcess(_options) {
    const {
      agent,
      options,
      agentId,
      invocation,
      stdio,
      env,
      tmpPromptDir,
      tmpPromptPath,
      mode,
      initialStdinLine
    } = await this.prepareAgentConfig(_options);
    const child = spawn(invocation.command, invocation.args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      stdio,
      env
    });
    if (initialStdinLine && child.stdin) {
      child.stdin.write(initialStdinLine + "\n");
    }
    this.storage?.agents.create({
      id: agentId,
      parent_id: options.parentId,
      request_id: options.requestId,
      role: options.role,
      name: agent.name,
      status: "running",
      pid: child.pid ?? void 0,
      task_preview: options.task.slice(0, 500),
      started_at: Date.now(),
      coordinator_id: void 0,
      domain_id: options.domainId,
      queue_item_id: options.queueItemId
    }).catch(() => {
    });
    const state = {
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        contextTokens: 0,
        turns: 0
      },
      finalResultText: "",
      stopReason: void 0,
      errorMessage: void 0
    };
    const promise = new Promise((resolve) => {
      let stdout = "";
      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
        const lines = stdout.split("\n");
        stdout = lines.pop() ?? "";
        for (const line of lines) {
          processAgentStdoutLine(line, state);
        }
      });
      let stderr = "";
      child.stderr?.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
      });
      child.on("close", async (code) => {
        if (stdout.trim()) processAgentStdoutLine(stdout, state);
        const info = {
          exitCode: code ?? 0,
          stopReason: state.stopReason,
          errorMessage: state.errorMessage,
          resultText: state.finalResultText || stderr,
          usage: state.usage
        };
        try {
          await this.handleExit({
            agentId,
            info,
            tmpPromptDir,
            tmpPromptPath
          });
        } catch {
        }
        resolve(info);
      });
      child.on("error", async (error) => {
        const info = {
          exitCode: 1,
          stopReason: state.stopReason,
          errorMessage: error.message || state.errorMessage,
          resultText: stderr,
          usage: state.usage
        };
        try {
          await this.handleExit({
            agentId,
            info,
            tmpPromptDir,
            tmpPromptPath
          });
        } catch {
        }
        resolve(info);
      });
    });
    const handle = {
      agentId,
      agentName: agent.name,
      role: options.role,
      mode,
      startedAt: Date.now(),
      child,
      promise
    };
    this.runningAgentProcesses.set(agentId, handle);
    return handle;
  }
  /**
   * Terminate a running agent by id. Returns true if the agent was known and
   * a stop signal was sent. The agent's exit promise will settle normally.
   */
  stopAgentProcess(agentId, signal = "SIGTERM") {
    const handle = this.runningAgentProcesses.get(agentId);
    if (!handle) return false;
    handle.child.kill(signal);
    return true;
  }
  /**
   * Shared exit handler invoked from child `close` and `error` events.
   *
   * Cleans up the temporary prompt files, removes the agent from the local
   * process map, updates the durable registry, and emits both the local
   * `trellis:agent_closed` event and the WebSocket fan-out.
   */
  async handleExit(context) {
    const { agentId, info, tmpPromptDir, tmpPromptPath } = context;
    const status = exitStatusFromCode(info.exitCode);
    this.runningAgentProcesses.delete(agentId);
    try {
      fs2.unlinkSync(tmpPromptPath);
      fs2.rmdirSync(tmpPromptDir);
    } catch {
    }
    try {
      const existing = await this.storage?.agents.get(agentId);
      if (existing) {
        await this.storage?.agents.update({
          ...existing,
          status,
          exited_at: Date.now(),
          exit_code: info.exitCode,
          result_text: info.resultText
        });
      }
    } catch {
    }
  }
};

// extensions/managers/coordinator-manager.ts
import { randomUUID as randomUUID2 } from "node:crypto";
var CoordinatorManager = class {
  storage;
  agentManager;
  domainManager;
  pi;
  websocketManager;
  coordinators = /* @__PURE__ */ new Map();
  constructor(options) {
    this.storage = options.storage;
    this.agentManager = options.agentManager;
    this.domainManager = options.domainManager;
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
  }
  /**
   * Start a root, in-process coordinator for a new user request.
   *
   * This creates the request record, seeds an initial requirement, and enqueues
   * it on the target domain's queue. Future iterations will run the recursive
   * scoping loop, process domain-agent assessments, and detect oscillation.
   */
  async startRootCoordinator(description, targetDomainId) {
    const coordinatorId = `trellis:root:${randomUUID2()}`;
    const requestId = `trellis:req:${randomUUID2()}`;
    const request = {
      request_id: requestId,
      description,
      status: "scoping",
      coordinator_id: coordinatorId
    };
    await this.storage.requests.create(request);
    const requirement = {
      id: `trellis:req-item:${randomUUID2()}`,
      request_id: requestId,
      description,
      domain_id: targetDomainId,
      parent_requirement_id: void 0,
      status: "assigned",
      owned_scope: void 0,
      contracts: [],
      child_requirement_ids: [],
      reassignment_count: 0,
      created_at: Date.now()
    };
    await this.storage.requirements.create(requirement);
    this.coordinators.set(requestId, { requestId, coordinatorId });
    await this.domainManager.enqueue(requirement, coordinatorId);
    const eventPayload = { requestId, coordinatorId };
    this.pi.events.emit(TRELLIS_COORDINATOR_STARTED, eventPayload);
    this.websocketManager?.publish(TRELLIS_COORDINATOR_STARTED, eventPayload, { requestId });
    return request;
  }
  /**
   * Resume a request from storage. Called during session_start for any
   * in-flight request.
   */
  async rehydrateRequest(requestId) {
    const request = await this.storage.requests.get(requestId);
    if (!request) return;
    this.coordinators.set(requestId, {
      requestId,
      coordinatorId: request.coordinator_id
    });
  }
  /**
   * React when a queue item owned by one of our coordinators completes. The
   * actual result is read from storage; this handler simply routes the event.
   */
  async onQueueItemCompleted(event) {
    const state = this.coordinators.get(event.requestId);
    if (!state) return;
    if (state.coordinatorId !== event.coordinatorId) return;
    const updatedPayload = {
      requestId: event.requestId,
      queueItemId: event.queueItemId,
      failed: event.failed
    };
    this.pi.events.emit(TRELLIS_COORDINATOR_UPDATED, updatedPayload);
  }
};

// extensions/managers/domain-manager.ts
var DomainManager = class {
  storage;
  agentManager;
  pi;
  websocketManager;
  domainAgentName;
  // domain_id -> running marker
  running = /* @__PURE__ */ new Map();
  constructor(options) {
    this.storage = options.storage;
    this.agentManager = options.agentManager;
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
    this.domainAgentName = options.domainAgentName ?? "domain-agent";
  }
  /**
   * Create a queue item for a requirement and begin processing if the domain is
   * idle. This is the single entry point for enqueueing work from coordinators.
   */
  async enqueue(requirement, coordinatorId, priority = 0) {
    const item = {
      id: `trellis:qi:${crypto.randomUUID()}`,
      domain_id: requirement.domain_id,
      requirement_id: requirement.id,
      enqueued_by_coordinator_id: coordinatorId,
      status: "queued",
      priority,
      created_at: Date.now()
    };
    await this.storage.queue.create(item);
    if (!this.running.has(requirement.domain_id)) {
      await this.startNextAgent(requirement.domain_id);
    }
    return item;
  }
  /**
   * Called after a coordinator has enqueued a new queue item. If the domain is
   * idle, immediately start the next agent; otherwise the item waits in FIFO
   * order until the running agent exits.
   */
  async onItemEnqueued(_queueItem) {
    const domainId = _queueItem.domain_id;
    if (this.running.has(domainId)) return;
    await this.startNextAgent(domainId);
  }
  /**
   * Pull the next queued item for a domain and spawn a fresh domain agent for
   * it. No-op if the queue is empty or an agent is already running.
   */
  async startNextAgent(domainId) {
    if (this.running.has(domainId)) return;
    const item = await this.storage.queue.peekNextByDomain(domainId, "queued");
    if (!item) return;
    const requirement = await this.storage.requirements.get(item.requirement_id);
    if (!requirement) {
      await this.failItem(item, "Requirement not found");
      await this.startNextAgent(domainId);
      return;
    }
    const agentId = `trellis:${crypto.randomUUID()}`;
    item.status = "running";
    item.domain_agent_id = agentId;
    await this.storage.queue.update(item);
    this.running.set(domainId, { agentId, queueItemId: item.id });
    const task = [
      `Assess the following scope requirement for domain "${domainId}":`,
      "",
      requirement.description,
      "",
      "Return a structured assessment with these fields:",
      "- owned_scope: the part of the requirement this domain owns",
      "- contracts: array of { target_domain_id, description } for other domains",
      "- child_requirements: array of narrower requirement descriptions if needed",
      "- absorption_note: explain if this requirement is fully absorbed by an existing item",
      "- escalation_request: explain only if the requirement bounces between domains"
    ].join("\n");
    try {
      const handle = await this.agentManager.startAgentProcess({
        agentName: this.domainAgentName,
        role: "domain",
        task,
        requestId: item.requirement_id,
        agentId,
        domainId,
        queueItemId: item.id
      });
      handle.promise.then(async (exitInfo) => {
        await this.onDomainAgentExit(domainId, handle.agentId, exitInfo);
      }).catch(async () => {
        await this.onDomainAgentExit(domainId, handle.agentId, {
          exitCode: 1,
          errorMessage: "Unhandled agent process error"
        });
      });
    } catch (error) {
      await this.onDomainAgentExit(domainId, agentId, {
        exitCode: 1,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }
  }
  async onDomainAgentExit(domainId, agentId, exitInfo) {
    const marker = this.running.get(domainId);
    if (!marker || marker.agentId !== agentId) {
      return;
    }
    const item = await this.storage.queue.get(marker.queueItemId);
    this.running.delete(domainId);
    if (!item) return;
    const failed = exitInfo.exitCode !== 0;
    item.status = failed ? "failed" : "done";
    item.result_payload = json({
      exitCode: exitInfo.exitCode,
      errorMessage: exitInfo.errorMessage,
      resultText: exitInfo.resultText,
      usage: exitInfo.usage
    });
    await this.storage.queue.update(item);
    await this.notifyQueueItemComplete(item, failed);
    await this.startNextAgent(domainId);
  }
  async failItem(item, reason) {
    item.status = "failed";
    item.result_payload = json({ error: reason });
    await this.storage.queue.update(item);
    await this.notifyQueueItemComplete(item, true);
  }
  async notifyQueueItemComplete(item, failed) {
    const requirement = await this.storage.requirements.get(item.requirement_id);
    const requestId = requirement?.request_id ?? "unknown";
    const eventPayload = {
      requestId,
      queueItemId: item.id,
      coordinatorId: item.enqueued_by_coordinator_id,
      failed
    };
    this.pi.events.emit(TRELLIS_QUEUE_ITEM_COMPLETED, eventPayload);
    this.websocketManager?.publish(TRELLIS_QUEUE_ITEM_COMPLETED, eventPayload, { requestId });
  }
};

// extensions/managers/websocket-server-manager.ts
import { randomBytes } from "node:crypto";
var WebSocketServerManager = class {
  pi;
  token;
  server;
  url;
  registeredAgents = /* @__PURE__ */ new Map();
  constructor(options) {
    this.pi = options.pi;
    this.token = options.token ?? randomBytes(16).toString("hex");
  }
  /** Start the WebSocket server. Returns the URL agents should connect to. */
  async startServer() {
    return new Promise((resolve, reject) => {
      const server = new import_websocket_server.default({ host: "127.0.0.1", port: 0 });
      this.server = server;
      server.once("error", reject);
      server.on("connection", (socket) => this.handleConnection(socket));
      server.on("listening", () => this.handleListening(server, resolve, reject));
    });
  }
  /** Stop the server and drop all connections. */
  stopServer() {
    this.server?.close();
  }
  /** Publish an event to connected clients. */
  publish(topic, payload, options) {
    const message = {
      type: "publish",
      topic,
      payload,
      target: options?.target,
      requestId: options?.requestId,
      broadcast: options?.broadcast
    };
    this.pi.events.emit(topic, payload);
    this.routeMessage(message, "trellis:root");
  }
  /** List ids of every registered agent. */
  getRegisteredAgentIds() {
    return Array.from(this.registeredAgents.values()).map((record) => record.agentId);
  }
  // ─── Server handlers ───────────────────────────────────────────────────────
  handleConnection(socket) {
    socket.on("message", (raw) => this.handleSocketMessage(socket, raw));
    socket.on("close", () => this.handleSocketClose(socket));
  }
  handleSocketMessage(socket, raw) {
    try {
      const message = JSON.parse(raw.toString());
      switch (message.type) {
        case "register":
          this.handleRegister(socket, message);
          return;
        case "publish":
        case "subscribe":
        case "unsubscribe":
        case "ping": {
          const record = this.registeredAgents.get(socket);
          if (!record) {
            socket.close(1008, "not registered");
            return;
          }
          switch (message.type) {
            case "publish":
              this.pi.events.emit(message.topic, message.payload);
              this.routeMessage(message, record.agentId);
              break;
            case "subscribe":
              record.subscriptions.add(message.topic);
              break;
            case "unsubscribe":
              record.subscriptions.delete(message.topic);
              break;
            case "ping":
              this.send(socket, { type: "pong" });
              break;
          }
          return;
        }
        default:
          return;
      }
    } catch {
    }
  }
  handleSocketClose(socket) {
    this.registeredAgents.delete(socket);
  }
  handleRegister(socket, message) {
    if (message.token !== this.token) {
      socket.close(1008, "invalid token");
      return;
    }
    for (const [existingSocket, record2] of this.registeredAgents) {
      if (record2.agentId === message.agentId && existingSocket !== socket) {
        existingSocket.close();
        this.registeredAgents.delete(existingSocket);
        break;
      }
    }
    const record = {
      agentId: message.agentId,
      role: message.role,
      name: message.name,
      requestId: message.requestId,
      parentId: message.parentId,
      socket,
      subscriptions: /* @__PURE__ */ new Set()
    };
    this.registeredAgents.set(socket, record);
    this.send(socket, { type: "register_ack", agentId: message.agentId });
  }
  handleListening(server, resolve, reject) {
    const address = server.address();
    if (typeof address === "object" && address !== null) {
      this.url = `ws://127.0.0.1:${address.port}`;
      resolve(this.url);
    } else {
      reject(new Error("Unexpected WebSocket server address"));
    }
  }
  // ─── Routing and utilities ─────────────────────────────────────────────────
  routeMessage(message, senderId) {
    if (message.broadcast) {
      for (const record of this.registeredAgents.values()) {
        if (record.agentId !== senderId) {
          this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
        }
      }
      return;
    }
    if (message.target) {
      for (const record of this.registeredAgents.values()) {
        if (record.agentId === message.target && record.agentId !== senderId) {
          this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
          break;
        }
      }
      return;
    }
    if (message.requestId) {
      for (const record of this.registeredAgents.values()) {
        if (record.requestId === message.requestId && record.agentId !== senderId) {
          this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
        }
      }
      return;
    }
    for (const record of this.registeredAgents.values()) {
      if (record.agentId !== senderId && record.subscriptions.has(message.topic)) {
        this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
      }
    }
  }
  send(socket, message) {
    if (socket.readyState === import_websocket.default.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
};

// extensions/tools/domains/create-domain.ts
import { Type } from "typebox";
var parameters = Type.Object({
  id: Type.String({ description: "Stable domain identifier" }),
  name: Type.String({ description: "Human-readable domain name" }),
  description: Type.String({
    description: "Short summary of what the domain covers"
  }),
  remit: Type.String({
    description: "Detailed responsibility statement for domain agents assessing scope"
  }),
  exclusions: Type.Array(Type.String(), {
    description: "Concerns this domain explicitly refuses to own"
  })
});
function registerCreateDomainTool(pi, storage) {
  pi.registerTool({
    name: "create-domain",
    label: "Create Domain",
    description: "Create a project domain in the Trellis taxonomy.",
    promptSnippet: "Use when the user wants to add a new domain to the project taxonomy.",
    parameters,
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (existing) {
        return formatToolResult(
          `Domain "${params.id}" already exists. Choose a different identifier or update the existing domain.`,
          { existing, domain: void 0 }
        );
      }
      const domain = { ...params };
      await storage.domains.create(domain);
      return formatToolResult(
        `Domain "${params.id}" created successfully.`,
        { existing: void 0, domain }
      );
    }
  });
}

// extensions/tools/domains/delete-domain.ts
import { Type as Type2 } from "typebox";
var parameters2 = Type2.Object({
  id: Type2.String({ description: "Stable domain identifier" })
});
function registerDeleteDomainTool(pi, storage) {
  pi.registerTool({
    name: "delete-domain",
    label: "Delete Domain",
    description: "Remove a project domain from the Trellis taxonomy.",
    promptSnippet: "Use when the user explicitly asks to remove a domain. This cannot be undone.",
    parameters: parameters2,
    async execute(_toolCallId, params) {
      const deleted = await storage.domains.delete(params.id);
      if (!deleted) {
        return formatToolResult(
          `Domain "${params.id}" was not found.`,
          { deleted: false }
        );
      }
      return formatToolResult(
        `Domain "${params.id}" deleted successfully.`,
        { deleted: true }
      );
    }
  });
}

// extensions/tools/domains/get-domain.ts
import { Type as Type3 } from "typebox";
var parameters3 = Type3.Object({
  id: Type3.String({ description: "Stable domain identifier" })
});
function registerGetDomainTool(pi, storage) {
  pi.registerTool({
    name: "get-domain",
    label: "Get Domain",
    description: "Read a single project domain by identifier.",
    promptSnippet: "Use when the user or an agent needs the full record for one domain.",
    parameters: parameters3,
    async execute(_toolCallId, params) {
      const domain = await storage.domains.get(params.id);
      if (!domain) {
        return formatToolResult(
          `Domain "${params.id}" was not found.`,
          { domain: void 0 }
        );
      }
      return formatToolResult(
        `Domain "${params.id}" found: ${domain.name} \u2014 ${domain.description}`,
        { domain }
      );
    }
  });
}

// extensions/tools/domains/list-domains.ts
import { Type as Type4 } from "typebox";
var parameters4 = Type4.Object({});
function registerListDomainsTool(pi, storage) {
  pi.registerTool({
    name: "list-domains",
    label: "List Domains",
    description: "List all defined Trellis domains.",
    promptSnippet: "Use when the user or a coordinator needs to see the current domain taxonomy.",
    parameters: parameters4,
    async execute() {
      const domains = await storage.domains.list();
      const summary = domains.map((domain) => `- ${domain.id}: ${domain.name} \u2014 ${domain.description}`).join("\n");
      return formatToolResult(
        `${domains.length} domain(s) defined.
${summary}`,
        { domains }
      );
    }
  });
}

// extensions/tools/domains/update-domain.ts
import { Type as Type5 } from "typebox";
var parameters5 = Type5.Object({
  id: Type5.String({ description: "Stable domain identifier" }),
  name: Type5.String({ description: "Human-readable domain name" }),
  description: Type5.String({
    description: "Short summary of what the domain covers"
  }),
  remit: Type5.String({
    description: "Detailed responsibility statement for domain agents assessing scope"
  }),
  exclusions: Type5.Array(Type5.String(), {
    description: "Concerns this domain explicitly refuses to own"
  })
});
function registerUpdateDomainTool(pi, storage) {
  pi.registerTool({
    name: "update-domain",
    label: "Update Domain",
    description: "Overwrite fields of an existing project domain.",
    promptSnippet: "Use when the user wants to change the description, remit, or exclusions of an existing domain.",
    parameters: parameters5,
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (!existing) {
        return formatToolResult(
          `Domain "${params.id}" does not exist. Create it first.`,
          { updated: false, domain: void 0 }
        );
      }
      const domain = { ...params };
      await storage.domains.update(domain);
      return formatToolResult(
        `Domain "${params.id}" updated successfully.`,
        { domain, updated: true }
      );
    }
  });
}

// extensions/tools/agents/stop-agent.ts
import { Type as Type6 } from "typebox";
var parameters6 = Type6.Object({
  agent_id: Type6.String({ description: "Agent id to stop" }),
  signal: Type6.Optional(Type6.String({ default: "SIGTERM", description: "Signal to send (e.g., SIGTERM, SIGKILL)" }))
});
function registerStopAgentTool(pi, agentManager) {
  pi.registerTool({
    name: "stop-agent",
    label: "Stop Agent",
    description: "Send a termination signal to a running Trellis agent.",
    parameters: parameters6,
    async execute(_toolCallId, params) {
      const signal = params.signal ?? "SIGTERM";
      const knownSignals = ["SIGTERM", "SIGKILL", "SIGINT", "SIGHUP"];
      if (!knownSignals.includes(signal)) {
        throw new Error(`Unsupported signal "${signal}".`);
      }
      const sent = agentManager.stopAgentProcess(params.agent_id, signal);
      return formatToolResult(
        sent ? `Sent ${signal} to agent "${params.agent_id}".` : `Agent "${params.agent_id}" is not running or is not managed by this extension.`,
        { agent_id: params.agent_id, signal, sent }
      );
    }
  });
}

// extensions/tools/agents/list-agents.ts
import { Type as Type7 } from "typebox";
var parameters7 = Type7.Object({
  request_id: Type7.Optional(Type7.String({ description: "Optional request id filter" }))
});
function registerListAgentsTool(pi, storage, agentManager) {
  pi.registerTool({
    name: "list-agents",
    label: "List Agents",
    description: "List Trellis agents across the whole agent tree (root, coordinators, and subagents).",
    parameters: parameters7,
    async execute(_toolCallId, params) {
      const rows = params.request_id ? await storage.agents.listByRequest(params.request_id) : await storage.agents.list();
      const agents = rows.map((row) => {
        const live = agentManager.runningAgentProcesses.get(row.id);
        return {
          agent_id: row.id,
          agent_name: row.name,
          role: row.role,
          status: live ? "running" : row.status,
          request_id: row.request_id,
          parent_id: row.parent_id,
          pid: live?.child.pid ?? row.pid,
          started_at: row.started_at,
          exited_at: row.exited_at
        };
      });
      const sorted = agents.slice().sort((a, b) => b.started_at - a.started_at);
      const running = sorted.filter((a) => a.status === "running");
      const completed = sorted.filter((a) => a.status === "completed");
      const failed = sorted.filter((a) => a.status === "failed");
      const stopped = sorted.filter((a) => a.status === "stopped");
      const lines = [];
      lines.push(`Total agents: ${sorted.length}`);
      if (running.length > 0) {
        lines.push(`Running: ${running.map((a) => `${a.agent_name} (${a.agent_id})`).join(", ")}`);
      }
      if (completed.length > 0) {
        lines.push(`Completed: ${completed.length}`);
      }
      if (failed.length > 0) {
        lines.push(`Failed: ${failed.length}`);
      }
      if (stopped.length > 0) {
        lines.push(`Stopped: ${stopped.length}`);
      }
      return formatToolResult(lines.join("\n"), { agents: sorted });
    }
  });
}

// extensions/tools/agents/leave-note.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { Type as Type8 } from "typebox";
var parameters8 = Type8.Object({
  request_id: Type8.String({ description: "Request id this note belongs to" }),
  to_agent_id: Type8.String({ description: "Recipient agent id" }),
  payload: Type8.Object({}, { additionalProperties: true, description: "JSON-serializable note payload" }),
  in_reply_to: Type8.Optional(Type8.String({ description: "Note id this replies to" }))
});
function registerLeaveNoteTool(pi, storage, eventManager) {
  pi.registerTool({
    name: "leave-note",
    label: "Leave Note",
    description: "Leave a durable one-to-one note for another agent.",
    parameters: parameters8,
    async execute(_toolCallId, params) {
      const fromAgentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
      const note = {
        id: `trellis:note:${randomUUID3()}`,
        request_id: params.request_id,
        from_agent_id: fromAgentId,
        to_agent_id: params.to_agent_id,
        payload: json(params.payload),
        in_reply_to: params.in_reply_to,
        created_at: Date.now()
      };
      await storage.notes.create(note);
      const eventPayload = {
        noteId: note.id,
        requestId: note.request_id,
        fromAgentId: note.from_agent_id,
        toAgentId: note.to_agent_id,
        payload: params.payload
      };
      pi.events.emit(TRELLIS_NOTE_SENT, eventPayload);
      eventManager?.publish(TRELLIS_NOTE_SENT, eventPayload, {
        target: note.to_agent_id,
        requestId: note.request_id
      });
      return formatToolResult(
        `Left note "${note.id}" for "${params.to_agent_id}".`,
        {
          note_id: note.id,
          request_id: params.request_id,
          to_agent_id: params.to_agent_id
        }
      );
    }
  });
}

// extensions/tools/agents/read-note.ts
import { Type as Type9 } from "typebox";
var parameters9 = Type9.Object({
  request_id: Type9.String({ description: "Request id to read notes for" })
});
function registerReadNoteTool(pi, storage) {
  pi.registerTool({
    name: "read-note",
    label: "Read Note",
    description: "Read the next durable note addressed to the current agent for a request.",
    parameters: parameters9,
    async execute(_toolCallId, params) {
      const toAgentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
      const notes = await storage.notes.listByRecipient(
        params.request_id,
        toAgentId,
        1
      );
      const note = notes[0];
      if (!note) {
        return formatToolResult(
          `No notes for "${toAgentId}" in request "${params.request_id}".`,
          {
            request_id: params.request_id,
            remaining_count: 0
          }
        );
      }
      await storage.notes.delete(note.id);
      const remainingCount = await storage.notes.countByRecipient(
        params.request_id,
        toAgentId
      );
      const parsedNote = {
        id: note.id,
        from_agent_id: note.from_agent_id,
        to_agent_id: note.to_agent_id,
        request_id: note.request_id,
        payload: parseJson(note.payload),
        in_reply_to: note.in_reply_to,
        created_at: note.created_at
      };
      const content = `Note from "${parsedNote.from_agent_id}":
${JSON.stringify(
        parsedNote.payload,
        null,
        2
      )}` + (remainingCount > 0 ? `

${remainingCount} note(s) remain in your inbox for this request. Call read-note again to read the next one.` : "");
      return formatToolResult(content, {
        request_id: params.request_id,
        note: parsedNote,
        remaining_count: remainingCount
      });
    }
  });
}

// extensions/tools/agents/start-agent.ts
import { Type as Type10 } from "typebox";
var parameters10 = Type10.Object({
  agent_name: Type10.String({ description: "Bundled agent name to start" }),
  task: Type10.String({ minLength: 1, description: "Task prompt for the new agent" }),
  role: Type10.String({ description: "Trellis role: coordinator, domain, or background" }),
  request_id: Type10.String({ description: "Request id the started agent belongs to" }),
  domain_id: Type10.Optional(Type10.String({ description: "Domain id when role is domain" })),
  model: Type10.Optional(Type10.String({ description: "Override the inherited model" })),
  thinking_level: Type10.Optional(Type10.String({ description: "Override the inherited thinking level" }))
});
function registerStartAgentTool(pi, agentManager) {
  pi.registerTool({
    name: "start-agent",
    label: "Start Agent",
    description: "Start a child coordinator or background agent from the bundled catalog.",
    parameters: parameters10,
    async execute(_toolCallId, params) {
      const parentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
      const handle = await agentManager.startAgentProcess({
        agentName: params.agent_name,
        role: params.role,
        task: params.task,
        requestId: params.request_id,
        parentId,
        domainId: params.domain_id,
        model: params.model,
        thinkingLevel: params.thinking_level
      });
      handle.promise.catch(() => {
      });
      return formatToolResult(
        `Started "${params.agent_name}" as agent "${handle.agentId}".`,
        {
          agent_id: handle.agentId,
          role: params.role,
          request_id: params.request_id
        }
      );
    }
  });
}

// extensions/tools/agents/publish-event.ts
import { Type as Type11 } from "typebox";
var parameters11 = Type11.Object({
  topic: Type11.String({ description: "Event topic" }),
  payload: Type11.Object({}, { additionalProperties: true, description: "JSON-serializable event payload" }),
  request_id: Type11.Optional(Type11.String({ description: "Send to every agent on this request id" })),
  target: Type11.Optional(Type11.String({ description: "Send only to this agent id" })),
  broadcast: Type11.Optional(Type11.Boolean({ description: "Send to every connected agent except the sender" }))
});
function registerPublishEventTool(pi, manager) {
  pi.registerTool({
    name: "publish-event",
    label: "Publish Event",
    description: "Publish a transient event to the Trellis WebSocket event bus.",
    parameters: parameters11,
    async execute(_toolCallId, params) {
      if (!manager) {
        throw new Error("WebSocket event bus is not available in this process.");
      }
      manager.publish(params.topic, params.payload, {
        requestId: params.request_id,
        target: params.target,
        broadcast: params.broadcast
      });
      return formatToolResult(
        `Published event "${params.topic}".`,
        {
          topic: params.topic,
          request_id: params.request_id,
          target: params.target,
          broadcast: params.broadcast
        }
      );
    }
  });
}

// extensions/index.ts
function getExtensionPath() {
  return fileURLToPath(import.meta.url);
}
function createStorage() {
  const databasePath = process.env.TRELLIS_DATABASE_PATH;
  return new SQLiteStorageAdapter({ databasePath });
}
function initialiseAgentMode(pi) {
  const extensionPath = getExtensionPath();
  const storage = createStorage();
  const clientManager = new WebSocketClientManager({
    pi,
    token: process.env.TRELLIS_WS_TOKEN
  });
  const agentManager = new AgentManager({
    extensionPath,
    storage
  });
  const agentEventManager = new AgentEventManager({
    pi,
    websocketManager: clientManager
  });
  agentEventManager.mountEventListeners();
  registerStartAgentTool(pi, agentManager);
  registerStopAgentTool(pi, agentManager);
  registerLeaveNoteTool(pi, storage, clientManager);
  registerReadNoteTool(pi, storage);
  registerListAgentsTool(pi, storage, agentManager);
  registerPublishEventTool(pi, clientManager);
  pi.on("session_start", async () => {
    await storage.init();
    await storage.migrate();
    const wsUrl = process.env.TRELLIS_WS_URL;
    if (wsUrl) {
      clientManager.openConnection(wsUrl).catch(() => {
      });
    }
  });
  pi.on("session_shutdown", async () => {
    clientManager.closeConnection();
    await storage.close();
  });
}
function initialiseRootMode(pi) {
  const extensionPath = getExtensionPath();
  const storage = createStorage();
  let serverManager;
  let agentManager;
  let domainManager;
  let coordinatorManager;
  pi.on("session_start", async (_event, ctx) => {
    await storage.init();
    await storage.migrate();
    serverManager = new WebSocketServerManager({ pi });
    const wsUrl = await serverManager.startServer();
    process.env.TRELLIS_WS_URL = wsUrl;
    process.env.TRELLIS_WS_TOKEN = serverManager.token;
    agentManager = new AgentManager({
      extensionPath,
      storage
    });
    const staleAgents = await storage.agents.list();
    for (const stale of staleAgents) {
      await storage.agents.delete(stale.id);
    }
    domainManager = new DomainManager({
      storage,
      pi,
      agentManager,
      websocketManager: serverManager
    });
    coordinatorManager = new CoordinatorManager({
      storage,
      pi,
      agentManager,
      domainManager,
      websocketManager: serverManager
    });
    registerCreateDomainTool(pi, storage);
    registerGetDomainTool(pi, storage);
    registerUpdateDomainTool(pi, storage);
    registerDeleteDomainTool(pi, storage);
    registerListDomainsTool(pi, storage);
    registerManagingDomainsCommand(pi, storage);
    registerStartAgentTool(pi, agentManager);
    registerStopAgentTool(pi, agentManager);
    registerLeaveNoteTool(pi, storage, serverManager);
    registerReadNoteTool(pi, storage);
    registerListAgentsTool(pi, storage, agentManager);
    registerPublishEventTool(pi, serverManager);
    ctx.ui.notify("Trellis loaded", "info");
  });
  pi.events.on(TRELLIS_QUEUE_ITEM_COMPLETED, async (eventPayload) => {
    const payload = eventPayload;
    await coordinatorManager.onQueueItemCompleted(payload);
  });
  pi.on("session_shutdown", async () => {
    serverManager?.stopServer();
    const remainingAgents = await storage.agents.list();
    for (const agent of remainingAgents) {
      await storage.agents.delete(agent.id);
    }
    await storage.close();
  });
}
function extension2(pi) {
  if (process.env.TRELLIS_AGENT_ID) {
    initialiseAgentMode(pi);
  } else {
    initialiseRootMode(pi);
  }
}
export {
  extension2 as default
};
