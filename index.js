import assert from 'assert';

const _ = {
    log: console.log,
    write: w => process.stdout.write(w),
    tests: [],
    ok: 0, err: 0, tot: 0, skip: 0,
    mark: { ok: '✓', err: '✕', skip: '-', res: '=', async: '>', space: ' ', tab: '   →' }
};

const ansi = (() => {
    const map = { reset: 0, italic: 3, black: 30, red: 31, blue: 34, blue_: 44, green: 32, magenta: 35, cyan: 36, white: 37 };
    const encode = code => `\u001b[${code}m`;
    return (msg, [c1, c2]) => `${encode(map[c1] + (c2 ? `;${map[c2]}` : ''))}${msg}${encode(0)}`;
})();

const log = {
    ok: (w, info) => {
        ++_.tot && ++_.ok && _.log(_.mark.ok, ansi(w, ['green']), info ? ansi(info, ['blue', 'italic']) : '');
    },
    skip: (w, info) => {
        ++_.tot && ++_.skip && _.log(_.mark.skip, ansi(w, ['white']), info ? ansi(info, ['blue', 'italic']) : '');
    },
    err: (w, { expected, actual }) => {
        ++_.err;
        _.log(_.mark.err, ansi(w, ['red']));
        _.log(_.mark.tab, ansi(`exp ${expected}`, ['cyan', 'italic']));
        _.log(_.mark.tab, ansi(`got ${actual}`, ['magenta', 'italic']));
    },
    res: () => {
        _.err
            ? _.log('\n' + _.mark.res, ansi(`${(100 - 100 * _.err/_.tot).toFixed(1)}% (${_.tot - _.err}/${_.tot})\n`, ['red']))
            : _.log('\n' + _.mark.res, ansi(`100% (${_.ok}/${_.ok})${_.skip ? ansi(` – skipped ${_.skip}`, ['blue']) : ''}\n`, ['cyan']));
    },
    line: () => {
        _.log(_.mark.space, ansi('-'.repeat(process.stdout.columns - 2), ['blue']));
    },
    label: w => {
        _.log('\n' + _.mark.space, ansi(w, ['reset']));
    },
    group: w => {
        _.log('\n' + _.mark.space, ansi(w, ['black', 'blue_']));
    }
};

function run (message, ...args) {
    try {
        if (typeof this === 'function') return this();
        assert[this || 'strictEqual'](...args.slice(0, 2), message);
        log[this === 'ok' ? 'skip' : 'ok'](message, args[2]);
    } catch(error) {
        error.code === 'ERR_ASSERTION' ? log.err(message, error) : console.error(error);
    }
};

const prepare = async () => {
    console.clear() || log.line();

    for (const args of _.tests) {
        const promise = args[1] instanceof Promise;
        const func = typeof args[1] === 'function';
        const assertFunc = /reject|throw/i.test(args.scope || '');

        if (!assertFunc && (promise || func)) {
            _.write(_.mark.async + ' ' + ansi(args[0], ['cyan', 'italic']));
            args[1] = promise ? await args[1] : await args[1]();
            _.write('\r');
        }

        run.call(args.scope, ...args);
    }

    log.res();
    process.exit(_.err ? 1 : 0);
};

const test = function() {
    if (typeof this) arguments.scope = this;
    _.tests.push(arguments);
    _.timeout = clearTimeout(_.timeout) || setTimeout(prepare, 10);
};

Object.entries(assert).forEach(([ key, value ]) => {
    typeof value === 'function' && (test[key] = function() {
        test.call(key, ...arguments);
    });
});

test.skip = function() {
    test.call('ok', ...arguments);
};

['group', 'label'].forEach(prop => test[prop] = w => test.call(() => log[prop](w)));

export default test;