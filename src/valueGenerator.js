/**
 * Created by Irakli Zarandia on 1/5/2016.
 */
var ValueGenerator = (function () {
    function ValueGenerator() {
        /**
         *
         * @type {{}}
         * @private
         */
        this._reference = {};
        /**
         *
         * @type {number}
         * @private
         */
        this._Counter = 1;
    }
    /**
     *
     * @param pattern
     * @returns {Array<any>}
     */
    ValueGenerator.prototype.processGrouping = function (pattern) {
        var tree = [];
        var stack = [tree];
        while (pattern.length) {
            var chr = pattern.shift();
            if (chr === '\\') {
                var next = pattern.shift();
                if (next === '(' || next === ')') {
                    stack[0].push(next);
                }
                else {
                    stack[0].push(chr, next);
                }
            }
            else if (chr === '(') {
                var inner = [];
                stack[0].push(inner);
                stack.unshift(inner);
                var next = pattern.shift();
                if (next === '?') {
                    next = pattern.shift();
                    if (next !== ':') {
                        throw "Invalid group";
                    }
                }
                else if (next === '(' || next === ')') {
                    pattern.unshift(next);
                }
                else {
                    inner[this._Counter] = this._Counter++;
                    inner.push(next);
                }
            }
            else if (chr === ')') {
                stack.shift();
            }
            else {
                stack[0].push(chr);
            }
        }
        if (stack.length > 1) {
            throw "missmatch paren";
        }
        return tree;
    };
    /**
     *
     * @param tree
     * @returns {string}
     */
    ValueGenerator.prototype.processOthers = function (tree) {
        var _this = this;
        var ret = '';
        var candinates = [];
        var tree = tree.slice(0);
        /**
         *
         * @returns {*|string}
         */
        var choice = function () {
            if (typeof candinates !== 'undefined') {
                var ret = candinates[Math.floor(candinates.length * Math.random())];
                if (ret instanceof Array) {
                    ret = _this.processOthers(ret);
                }
                if (candinates[_this._Counter]) {
                    _this._reference[candinates[_this._Counter]] = ret;
                }
            }
            return ret || '';
        };
        while (tree.length) {
            var chr = tree.shift();
            switch (chr) {
                case '^':
                case '$':
                    break;
                case '*':
                    for (var i = 0, len = Math.random() * 10; i < len; i++) {
                        ret += choice();
                    }
                    candinates = [];
                    break;
                case '+':
                    for (var i = 0, len = Math.random() * 10 + 1; i < len; i++) {
                        ret += choice();
                    }
                    candinates = [];
                    break;
                case '{':
                    var brace = '';
                    while (tree.length) {
                        chr = tree.shift();
                        if (chr === '}') {
                            break;
                        }
                        else {
                            brace += chr;
                        }
                    }
                    if (chr !== '}') {
                        throw "missmatch brace: " + chr;
                    }
                    var dd = brace.split(/,/);
                    var min = +dd[0];
                    var max = (dd.length === 1) ? min : (+dd[1] || 10);
                    for (var i = 0, len = Math.floor(Math.random() * (max - min + 1)) + min; i < len; i++) {
                        ret += choice();
                    }
                    candinates = [];
                    break;
                case '?':
                    if (Math.random() < 0.5) {
                        ret += choice();
                    }
                    candinates = [];
                    break;
                case '\\':
                    ret += choice();
                    var escaped = tree.shift();
                    if (escaped.match(/^[1-9]$/)) {
                        candinates = [this._reference[escaped] || ''];
                    }
                    else {
                        if (escaped === 'b' || escaped === 'B') {
                            throw "\\b and \\B is not supported";
                        }
                        candinates = ValueGenerator.CLASSES[escaped];
                    }
                    if (!candinates) {
                        candinates = [escaped];
                    }
                    break;
                case '[':
                    ret += choice();
                    var sets = [];
                    var negative = false;
                    while (tree.length) {
                        chr = tree.shift();
                        if (chr === '\\') {
                            var next = tree.shift();
                            if (ValueGenerator.CLASSES[next]) {
                                sets = sets.concat(ValueGenerator.CLASSES[next]);
                            }
                            else {
                                sets.push(next);
                            }
                        }
                        else if (chr === ']') {
                            break;
                        }
                        else if (chr === '^') {
                            var before = sets[sets.length - 1];
                            if (!before) {
                                negative = true;
                            }
                            else {
                                sets.push(chr);
                            }
                        }
                        else if (chr === '-') {
                            var next = tree.shift();
                            if (next === ']') {
                                sets.push(chr);
                                chr = next;
                                break;
                            }
                            var before = sets[sets.length - 1];
                            if (!before) {
                                sets.push(chr);
                            }
                            else {
                                for (var i = before.charCodeAt(0) + 1, len = next.charCodeAt(0); i < len; i++) {
                                    sets.push(String.fromCharCode(i));
                                }
                            }
                        }
                        else {
                            sets.push(chr);
                        }
                    }
                    if (chr !== ']') {
                        throw "missmatch bracket: " + chr;
                    }
                    if (negative) {
                        var neg = {};
                        for (var i = 0, len = sets.length; i < len; i++) {
                            neg[sets[i]] = true;
                        }
                        candinates = [];
                        for (var i = 0, len = ValueGenerator.ALL.length; i < len; i++) {
                            if (!neg[ValueGenerator.ALL[i]])
                                candinates.push(ValueGenerator.ALL[i]);
                        }
                    }
                    else {
                        candinates = sets;
                    }
                    break;
                case '.':
                    ret += choice();
                    candinates = ValueGenerator.ALL;
                    break;
                default:
                    ret += choice();
                    candinates = chr;
            }
        }
        return ret + choice();
    };
    /**
     *
     * @param tree
     * @returns {*[]}
     */
    ValueGenerator.prototype.processSelect = function (tree) {
        var candinates = [[]];
        while (tree.length) {
            var chr = tree.shift();
            if (chr === '\\') {
                var next = tree.shift();
                if (next === '|') {
                    candinates[0].push(next);
                }
                else {
                    candinates[0].push(chr, next);
                }
            }
            else if (chr === '[') {
                candinates[0].push(chr);
                while (tree.length) {
                    chr = tree.shift();
                    candinates[0].push(chr);
                    if (chr === '\\') {
                        var next = tree.shift(); // no warnings
                        candinates[0].push(next);
                    }
                    else if (chr === ']') {
                        break;
                    }
                }
            }
            else if (chr === '|') {
                candinates.unshift([]);
            }
            else {
                candinates[0].push(chr);
            }
        }
        for (var i = 0, it; (it = candinates[i]); i++) {
            tree.push(it);
            for (var j = 0, len = it.length; j < len; j++) {
                if (it[j] instanceof Array) {
                    this.processSelect(it[j]);
                }
            }
        }
        return [tree];
    };
    /**
     *
     * @param pattern
     * @returns {string}
     */
    ValueGenerator.prototype.generateValue = function (pattern) {
        if (pattern instanceof RegExp) {
            pattern = pattern.source;
        }
        this._SetCounter(1);
        var tree;
        tree = this.processGrouping(pattern.split(''));
        tree = this.processSelect(tree);
        return this.processOthers(tree);
    };
    /**
     *
     * @param num
     * @private
     */
    ValueGenerator.prototype._SetCounter = function (num) {
        this._Counter = num;
    };
    /**
     *
     * @type {string[]}
     */
    ValueGenerator.UPPERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    /**
     *
     * @type {string[]}
     */
    ValueGenerator.LOWERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    /**
     *
     * @type {string[]}
     */
    ValueGenerator.DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    /**
     *
     * @type {string[]}
     */
    ValueGenerator.SPACES = [" ", "\n", "\t"];
    /**
     *
     * @type {string[]}
     */
    ValueGenerator.OTHERS = ["!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "`", "{", "|", "}", "~"];
    /**
     *
     * @type {Array<string>[]}
     */
    ValueGenerator.ALL = [].concat(ValueGenerator.UPPERS, ValueGenerator.LOWERS, ValueGenerator.DIGITS, " ", ValueGenerator.OTHERS, ["_"]);
    /**
     *
     * @type {{d: Array<string>, D: (T[]|Array<string>[]), w: (T[]|Array<string>[]), W: (T[]|Array<string>[]), t: string[], n: string[], v: string[], f: string[], r: string[], s: Array<string>, S: (T[]|Array<string>[]), 0: string[]}}
     */
    ValueGenerator.CLASSES = {
        'd': ValueGenerator.DIGITS,
        'D': [].concat(ValueGenerator.UPPERS, ValueGenerator.LOWERS, ValueGenerator.SPACES, ValueGenerator.OTHERS, ['_']),
        'w': [].concat(ValueGenerator.UPPERS, ValueGenerator.LOWERS, ValueGenerator.DIGITS, ['_']),
        'W': [].concat(ValueGenerator.SPACES, ValueGenerator.OTHERS),
        't': ['\t'],
        'n': ['\n'],
        'v': ['\u000B'],
        'f': ['\u000C'],
        'r': ['\r'],
        's': ValueGenerator.SPACES,
        'S': [].concat(ValueGenerator.UPPERS, ValueGenerator.LOWERS, ValueGenerator.DIGITS, ValueGenerator.OTHERS, ['_']),
        '0': ['\0']
    };
    return ValueGenerator;
})();
