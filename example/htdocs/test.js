/* global QUnit */
import index from '..';

QUnit.module('index', function() {
    QUnit.test('test', function( assert ) {
        assert.ok('foo' in index, 'foo founded');
    });
});
