import test from './index.js'

test.group('retset')

test.label('essentials')
test('retset is a function', typeof test, 'function')
test('2 seconds async', () => new Promise(r => setTimeout(r, 2000)), undefined)
test.skip(`skip test.fail example`, 1, 0, 'with some commentary')

test.label('assertions')
test('strictEqual: 1 === 1', 1, 1, 'default')
test.notStrictEqual(`notStrictEqual: 1 !== '1'`, 1, '1')
test.equal(`equal: 1 == '1'`, 1, '1')
test.notEqual(`notEqual: 1 != 2`, 1, 2)

test.label('objects')
test.deepEqual('deepEqual', [[{'1':'2'}]], [[{1:2}]])
test.notDeepEqual('notDeepEqual', [[1]], [[2]])
test.deepStrictEqual('deepStrictEqual', [[{1:2}]], [[{1:2}]])
test.notDeepStrictEqual('notDeepStrictEqual', [[{1:2}]], [[{1:'2'}]])

test.label('functions')
test.throws('throws', () => { throw new Error() })
test.doesNotThrow('doesNotThrow', () => {})
test.rejects('rejects', async () => { throw new TypeError('') }, { name: 'TypeError', message: '' })
test.doesNotReject('doesNotReject', async () => Promise.resolve(), SyntaxError)

test.label('regex')
test.match('match', 'abc123', /\d{3}/)  
test.doesNotMatch('doesNotMatch', 'abc123', /\d{4}/)