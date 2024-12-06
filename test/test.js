
import User from '../src/user.js'; 
import Calendar from '../src/calendar.js';
import Event from '../src/event.js';


QUnit.module('User Tests', function() {

    // tests modularity
    QUnit.test('User is a function', function(assert) {
        assert.ok(typeof User === 'function', 'User should be a constructor function (class)');
    });

    QUnit.test('User instance is an object', function(assert) {
        var user = new User();
        assert.ok(typeof user === 'object', 'User should be an object');
    });

    // tests accessing attributes directly
    QUnit.test('User instance has a valid first name', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometest.com");
        assert.strictEqual(user.firstName, "Johnny", 'User should have the correct first name');
    });

    QUnit.test('User instance has a valid last name', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometest.com");
        assert.strictEqual(user.lastName, "Test", 'User should have the correct last name');
    });

    QUnit.test('User instance has a valid email', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometest.com");
        assert.strictEqual(user.email, "JohnnyTest@sometest.com", 'User should have the correct email');
    });

    // tests validation
    QUnit.test('User instance has a valid first name', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometest.com");
        assert.ok(user.validateFirst() === true, 'User should have a valid first name');
    });
    
    QUnit.test('User instance has a valid last name', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometest.com");
        assert.ok(user.validateLast() === true, 'User should have a valid last name');
    });
    
    QUnit.test('User instance has a valid email', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometest.com");
        assert.ok(user.validateEmail() === true, 'User should have a valid email');
    });

    QUnit.test('User instance has an invalid first name', function(assert) {
        var user = new User("Johnny"*31, "Test", "JohnnyTest@sometest.com");
        assert.ok(user.validateFirst() === false, 'User should have an invalid first name');
    });
    
    QUnit.test('User instance has an invalid last name', function(assert) {
        var user = new User("Johnny", "Test"*31, "JohnnyTest@sometest.com");
        assert.ok(user.validateLast() === false, 'User should have an invalid last name');
    });
    
    QUnit.test('User instance has an invalid email', function(assert) {
        var user = new User("Johnny", "Test", "Johnny@Test@sometest.com");
        assert.ok(user.validateEmail() === false, 'User should have an invalid email');
    });

    QUnit.test('User instance has an invalid email', function(assert) {
        var user = new User("Johnny", "Test", ".JohnnyTest@sometest.com");
        assert.ok(user.validateEmail() === false, 'User should have an invalid email');
    });

    QUnit.test('User instance has an invalid email', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometestcom.");
        assert.ok(user.validateEmail() === false, 'User should have an invalid email');
    });

    QUnit.test('User instance has an invalid email', function(assert) {
        var user = new User("Johnny", "Test", "JohnnyTest@sometestcom");
        assert.ok(user.validateEmail() === false, 'User should have an invalid email');
    });
});


QUnit.module('Event Tests', function() {
    // tests modularity
    QUnit.test('Event is a function', function(assert) {
        assert.ok(typeof Event === 'function', 'Event should be a constructor function (class)');
    });

    QUnit.test('User instance is an object', function(assert) {
        var event = new Event();
        assert.ok(typeof event === 'object', 'Event should be an object');
    });
});

QUnit.module('Calendar Tests', function() {
    // tests modularity
    QUnit.test('Calendar is a function', function(assert) {
        assert.ok(typeof Calendar === 'function', 'Calendar should be a constructor function (class)');
    });

    QUnit.test('Calendar instance is an object', function(assert) {
        var calendar = new Calendar();
        assert.ok(typeof calendar === 'object', 'Calendar should be an object');
    });
});
