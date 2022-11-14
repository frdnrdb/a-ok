import assert from 'assert';

const ansi = nr => `\u001b[${nr}m`;
const applyAnsi = (txt, col = 'white', bg) => `${ansi(col + (bg ? `;${bg}` : ''))}${txt}${ansi(0)}`;

const res = {
    ok: 0,
    err: 0,
    skip: 0
};

const log = (() => {
    const symbols = {
        ok: '✓',
        err: '✕',
        skip: '-',
        res: '\n=',
        info: '\n ',
        space: ' '
    };

    function log(arg, ...args) {
        const parts = args.reduce((arr, arg) => {
            typeof arg === 'string' ? arr.push([arg]) : arr[arr.length-1].push(arg);
            return arr
        }, []);
        console.log(arg, ...parts.map(arr => applyAnsi(...arr)));
    }

    return {
        ok: (text, info) => {
            log(symbols.ok, text, 32, ...(info ? [ info, 34, 3 ] : []));
            res.ok++;
        },
        skip: (text, info) => {
            log(symbols.skip, text, 37, ...(info ? [ info, 34, 3 ] : []));
            res.skip++;
        },
        err: (text, { expected, actual }) => {
            log(symbols.err, text, 31, `\n   → exp ${expected}`, 36, 3, `\n   → got ${actual}`, 35, 3);
            res.err++;
        },
        res: () => {
            if (res.err) {
                const total = res.ok + res.err;
                return log(symbols.res, `${(100 - 100 * res.err/total).toFixed(1)}% (${total - res.err}/${total})\n`, 31);
            };
            log(symbols.res, `100% (${res.ok}/${res.ok})${res.skip ? applyAnsi(` – skipped ${res.skip}`, 34) : ''}\n`, 36);
        },
        line: () => {
            log(symbols.space, '-'.repeat(process.stdout.columns - 2), 34);
        },
        label: w => {
            log(symbols.info, w, 0);
        },
        group: w => {
            log(symbols.info, w, 30, 44);
        }
    };
})();

function runTest (message, ...args) {
    if (typeof this === 'function') return this();

    try {
        assert[this || 'strictEqual'](...args.slice(0, 2), message);
        log[this === 'ok' ? 'skip' : 'ok'](message, args[2]);
    } catch(error) {
        const { code } = error;
        if (code === 'ERR_ASSERTION') {
            return log.err(message, error);
        }
        console.error(error);
    }
};

const test = (timeout => {
    console.clear();
    
    const tests = [];

    return function() {
        if (typeof this) arguments.scope = this; // assert[this] or log function this()
        tests.push(arguments);

        timeout = clearTimeout(timeout) || setTimeout(async () => {
            log.line();
            for (const args of tests) {
                const isPromise = args[1] instanceof Promise;
                const isFunction = typeof args[1] === 'function';
                const isAssertFunction = /reject|throw/i.test(args.scope || '');

                if (!isAssertFunction && (isPromise || isFunction)) {
                    process.stdout.write('> ' + applyAnsi(args[0], 36, 3));
                    args[1] = isPromise ? await args[1] : await args[1]();
                    process.stdout.write('\r');
                }

                runTest.call(args.scope, ...args);
            }
            log.res();
            process.exit(res.err ? 1 : 0);
        }, 10);
    };
})();

test.group = w => test.call(() => log.group(w));
test.label = w => test.call(() => log.label(w));

Object.entries(assert).forEach(([ key, value ]) => {
    if (typeof value !== 'function') return;
    if (/^AssertionError|ifError|strict|CallTracker$/.test(key)) return;
    test[key] = function() {
        test.call(key, ...arguments);
    };
});

test.skip = function() {
    test.call('ok', ...arguments);
};

export default test;